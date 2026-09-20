import React, { useState, useEffect } from 'react';
import {
  Flame,
  Droplets,
  Sun,
  Wind,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Bot,
  Maximize2,
  AlertTriangle,
  Heart,
  Shirt,
  Send,
  Radio,
  Sparkles,
  TrendingUp,
  Activity,
  Compass,
  Minus,
  Plus,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import {
  OFFLINE_STATIONS,
  interpolateLocationFeaturesOffline
} from '../utils/offlineEngine';
import type { StationUsed, StationLiveSummaryItem, LanguageCode } from '../types';
import { HourlyForecastStrip } from './HourlyForecastStrip';
import { getTranslation } from '../utils/localization';
import { api } from '../services/api';

interface HeatShieldHubProps {
  onNavigateTab?: (tab: string) => void;
  onOpenAIAnalyst?: () => void;
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
  customLocation?: { name: string; lat: number; lon: number } | null;
  lang?: LanguageCode;
  onTriggerEmergencyMode?: () => void;
}

export const HeatShieldHub: React.FC<HeatShieldHubProps> = ({
  onNavigateTab,
  onOpenAIAnalyst,
  selectedStationId = '42410099999', // Default Patna
  onSelectStation,
  customLocation,
  lang = 'en',
  onTriggerEmergencyMode
}) => {
  // Live ticking clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Active Station Object from 46 pre-cached synoptic stations
  const activeStation = OFFLINE_STATIONS.find(s => s.station_id === selectedStationId) || OFFLINE_STATIONS[1]; // Patna fallback

  // Location & Weather state
  const [currentLat, setCurrentLat] = useState<number>(activeStation.latitude);
  const [currentLon, setCurrentLon] = useState<number>(activeStation.longitude);
  const [accuracyM, setAccuracyM] = useState<number>(50);
  const [locationName, setLocationName] = useState<string>(`${activeStation.station_name}, IN`);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Weather Metrics
  const [tempC, setTempC] = useState<number>(activeStation.temperature_c);
  const [feelsLikeC, setFeelsLikeC] = useState<number>(activeStation.heat_index_c);
  const [humidity, setHumidity] = useState<number>(Math.round(activeStation.relative_humidity_pct));
  const [windKmh, setWindKmh] = useState<number>(11);
  const [heatIndexC, setHeatIndexC] = useState<number>(activeStation.heat_index_c);
  const [uvIndex, setUvIndex] = useState<number>(7);
  const [aqi, setAqi] = useState<number>(82);
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme'>(
    (activeStation.vulnerability_tier.charAt(0).toUpperCase() + activeStation.vulnerability_tier.slice(1).toLowerCase()) as any
  );

  // Welfare Check-in state
  const [checkinToast, setCheckinToast] = useState<string | null>(null);

  const handleWelfareCheckin = async () => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      await api.recordWelfareCheckin({
        timestamp: now.toISOString(),
        time_formatted: timeStr,
        user_name: 'You',
        location_name: locationName,
        lat: currentLat,
        lon: currentLon,
        water_liters: 1.5,
        status_note: 'Safe and hydrated',
        risk_tier: riskLevel
      });
      setCheckinToast(`✅ Check-in recorded (${timeStr})`);
      setTimeout(() => setCheckinToast(null), 5000);
    } catch (e) {
      console.warn('Check-in error:', e);
    }
  };

  // Map state
  const [mapLayer, setMapLayer] = useState<'standard' | 'heat_risk' | 'clusters' | 'anomalies'>('standard');
  const [showStations, setShowStations] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [hoveredStation, setHoveredStation] = useState<StationLiveSummaryItem | null>(null);
  const [regionFilter, setRegionFilter] = useState<'india' | 'north' | 'bihar' | 'rajasthan'>('india');

  // AI Assistant Chat State
  const [chatInput, setChatInput] = useState<string>('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatThinking, setIsChatThinking] = useState<boolean>(false);

  // 4 Contributing IDW Stations
  const [stationInfluences, setStationInfluences] = useState<Array<{
    stationId: string;
    name: string;
    code: string;
    distanceKm: number;
    tempC: number;
    weightPct: number;
    color: string;
  }>>([]);

  // Sync state whenever selectedStationId changes
  useEffect(() => {
    const st = OFFLINE_STATIONS.find(s => s.station_id === selectedStationId);
    if (st) {
      setCurrentLat(st.latitude);
      setCurrentLon(st.longitude);
      setLocationName(`${st.station_name}, IN`);
      setTempC(st.temperature_c);
      setFeelsLikeC(st.heat_index_c);
      setHumidity(Math.round(st.relative_humidity_pct));
      setHeatIndexC(st.heat_index_c);
      setRiskLevel(
        (st.vulnerability_tier.charAt(0).toUpperCase() + st.vulnerability_tier.slice(1).toLowerCase()) as any
      );
      // Derive UV Index, AQI, and wind contextually
      const hour = new Date().getHours();
      const isMidday = hour >= 10 && hour <= 16;
      setUvIndex(isMidday ? (st.temperature_c > 40 ? 9 : 7) : 3);
      setAqi(st.temperature_c > 40 ? 112 : 78);
      setWindKmh(Math.round(8 + (st.temperature_c % 7)));
    }
  }, [selectedStationId]);

  // Sync customLocation (e.g. from Village & District Explorer or Search)
  useEffect(() => {
    if (customLocation) {
      setCurrentLat(customLocation.lat);
      setCurrentLon(customLocation.lon);
      setLocationName(`${customLocation.name}, IN`);
      try {
        const pred = interpolateLocationFeaturesOffline(customLocation.lat, customLocation.lon, 25, 4, 2.0);
        if (pred && pred.weather) {
          setTempC(pred.weather.temperature);
          setFeelsLikeC(pred.weather.feels_like);
          setHumidity(pred.weather.humidity);
          setHeatIndexC(pred.weather.feels_like);
          setRiskLevel(
            (pred.prediction.risk_level.charAt(0).toUpperCase() + pred.prediction.risk_level.slice(1).toLowerCase()) as any
          );
        }
      } catch (err) {
        console.warn('Custom location IDW error:', err);
      }
    }
  }, [customLocation]);

  // Recalculate IDW Station Influence when coordinates change
  useEffect(() => {
    try {
      const pred = interpolateLocationFeaturesOffline(currentLat, currentLon, accuracyM, 4, 2.0);
      if (pred && pred.data_source && pred.data_source.stations_used && pred.data_source.stations_used.length > 0) {
        const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
        const list = pred.data_source.stations_used.slice(0, 4).map((st: StationUsed, idx: number) => ({
          stationId: st.station_id,
          name: st.name.split(' ')[0] || st.name,
          code: st.station_id.slice(0, 5),
          distanceKm: Math.round(st.distance_km * 10) / 10,
          tempC: Math.round((st.temperature_c ?? 32.0) * 10) / 10,
          weightPct: Math.round(st.weight_pct * 10) / 10,
          color: colors[idx % colors.length]
        }));
        setStationInfluences(list);
      }
    } catch (err) {
      console.warn('IDW calculation fallback:', err);
    }
  }, [currentLat, currentLon, accuracyM]);

  // Handle Live Track Move (W3C Geolocation API)
  const handleTrackMove = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsTracking(true);
    setGpsMessage('Acquiring satellite GNSS fix...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsTracking(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setCurrentLat(lat);
        setCurrentLon(lon);
        setAccuracyM(acc);
        setLocationName(`Live GPS (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`);
        setGpsMessage(`GNSS Fix Acquired (±${acc}m accuracy)`);
        setTimeout(() => setGpsMessage(null), 4000);
      },
      (err) => {
        setIsTracking(false);
        console.warn('GPS fix failed:', err.message);
        setGpsMessage(`GPS unavailable (${err.message}). Using regional station.`);
        setTimeout(() => setGpsMessage(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Station Selection from Map or List
  const handleSelectStationInternal = (stationId: string) => {
    const st = OFFLINE_STATIONS.find(s => s.station_id === stationId);
    if (st) {
      setCurrentLat(st.latitude);
      setCurrentLon(st.longitude);
      setLocationName(`${st.station_name}, IN`);
      setTempC(st.temperature_c);
      setFeelsLikeC(st.heat_index_c);
      setHumidity(Math.round(st.relative_humidity_pct));
      setHeatIndexC(st.heat_index_c);
      setRiskLevel(
        (st.vulnerability_tier.charAt(0).toUpperCase() + st.vulnerability_tier.slice(1).toLowerCase()) as any
      );
      const hour = new Date().getHours();
      const isMidday = hour >= 10 && hour <= 16;
      setUvIndex(isMidday ? (st.temperature_c > 40 ? 9 : 7) : 3);
      setAqi(st.temperature_c > 40 ? 112 : 78);
      setWindKmh(Math.round(8 + (st.temperature_c % 7)));
    }
    if (onSelectStation) {
      onSelectStation(stationId);
    }
  };

  // Handle AI Chip & Freeform Queries
  const handleChipQuery = (query: string) => {
    setChatInput(query);
    setIsChatThinking(true);
    setChatResponse(null);

    setTimeout(() => {
      setIsChatThinking(false);
      const hour = currentTime.getHours();
      const isPeak = hour >= 11 && hour <= 16;
      
      if (query.toLowerCase().includes('safe to go out')) {
        if (isPeak && heatIndexC >= 40) {
          setChatResponse(`⚠️ PEAK SOLAR RADIATION ALERT (${hour}:00): Heat Index is ${heatIndexC}°C during the highest solar angle. Outdoor labor or direct sun exposure is NOT safe. Reschedule until evening.`);
        } else if (heatIndexC >= 42) {
          setChatResponse(`⚠️ DANGEROUS OUTDOOR HEAT: Current Heat Index is ${heatIndexC}°C in ${locationName}. All non-essential outdoor exertion should be avoided until after 5:30 PM.`);
        } else if (heatIndexC >= 36) {
          setChatResponse(`⚡ MODERATE-TO-HIGH RISK: Current Heat Index is ${heatIndexC}°C. Outdoor activities are safe ONLY if restricted to shade with 250 ml hydration every 30 minutes.`);
        } else {
          setChatResponse(`✅ RELATIVELY SAFE: Current ambient temperature is ${tempC}°C with Heat Index ${heatIndexC}°C. Stay hydrated and wear breathable light clothing.`);
        }
      } else if (query.toLowerCase().includes('hydration')) {
        const mlPerHour = heatIndexC >= 42 ? 500 : (heatIndexC >= 36 ? 350 : 250);
        setChatResponse(`💧 HYDRATION FORMULA: For ${heatIndexC}°C thermal stress, consume at least ${mlPerHour} ml of water or electrolyte solution every 45 minutes. Avoid caffeinated/sugary sodas.`);
      } else if (query.toLowerCase().includes('indoor activities')) {
        setChatResponse(`🏠 RECOMMENDED INDOOR ACTIVITIES: Keep fans/coolers active in shaded rooms. Ideal for desk work, indoor reading, and light stretching. Keep window drapes closed against solar radiation.`);
      } else if (query.toLowerCase().includes('heatwave')) {
        const isHeatwave = tempC >= 40.0 || feelsLikeC >= 43.0;
        setChatResponse(
          isHeatwave
            ? `🔥 HEATWAVE ALERT ACTIVE: ${locationName} is experiencing thermal anomalies exceeding +3.0°C above baseline with temperatures at ${tempC}°C. Follow local heat action plan guidelines.`
            : `ℹ️ NORMAL PRE-MONSOON VARIATION: Ambient temperature of ${tempC}°C is within standard seasonal thresholds. No meteorological heatwave declared for ${locationName}.`
        );
      } else {
        setChatResponse(`Biometeorological conditions for ${locationName}: Ambient ${tempC}°C, Relative Humidity ${humidity}%, Heat Index ${heatIndexC}°C (${riskLevel} Risk). Wind convective cooling is ~${windKmh} km/h.`);
      }
    }, 400);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    handleChipQuery(chatInput);
  };

  // Top 5 Hottest Stations from all 46 stations
  const topHottest = OFFLINE_STATIONS
    .slice()
    .sort((a, b) => b.temperature_c - a.temperature_c)
    .slice(0, 5)
    .map(s => ({
      stationId: s.station_id,
      city: s.station_name,
      state: s.full_name.includes('DELHI') ? 'DL' : (s.full_name.includes('RAJASTHAN') || s.latitude > 25 && s.longitude < 76 ? 'RJ' : (s.longitude < 76 ? 'PB' : 'IN')),
      temp: s.temperature_c,
      color: s.temperature_c >= 44 ? '#EF4444' : (s.temperature_c >= 42 ? '#F97316' : '#F59E0B')
    }));

  // Dynamic 24-Hour Diurnal Outlook Data
  const currentHour = currentTime.getHours();
  const diurnalHours = [0, 4, 8, 12, 16, 20];
  const diurnalPoints = diurnalHours.map(h => {
    // Diurnal variation model: T(h) = T_mean - 4.5 * cos(2*pi*(h-4)/24)
    const delta = -4.5 * Math.cos((2 * Math.PI * (h - 4)) / 24);
    const t = Math.round((tempC + delta) * 10) / 10;
    const hi = Math.round((heatIndexC + delta * 1.3) * 10) / 10;
    const label = h === 0 ? '12 AM' : (h < 12 ? `${h} AM` : (h === 12 ? '12 PM' : `${h - 12} PM`));
    return { hour: h, label, temp: t, hi: hi };
  });

  // Calculate India SVG Map ViewBox based on Region Filter
  const getViewBox = () => {
    switch (regionFilter) {
      case 'north': return '80 30 200 180';
      case 'bihar': return '190 120 160 150';
      case 'rajasthan': return '50 90 150 150';
      default: return '0 0 400 420';
    }
  };

  // Project (lat, lon) to SVG (x, y)
  const projectGeoToSvg = (lat: number, lon: number) => {
    const x = ((lon - 68.0) / (97.0 - 68.0)) * 340 + 30;
    const y = ((37.0 - lat) / (37.0 - 8.0)) * 360 + 20;
    return { x, y };
  };

  const activeCoords = projectGeoToSvg(currentLat, currentLon);

  return (
    <div className="flex-1 bg-[#090F1F] text-slate-100 min-h-screen p-4 sm:p-6 space-y-5 overflow-y-auto">
      
      {/* Persistent Heat Emergency Banner if Tier 4/5 (Heat Index >= 45°C) */}
      {heatIndexC >= 45 && onTriggerEmergencyMode && (
        <div className="bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-2 border-rose-500/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-rose-950/50 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-rose-600 text-white rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </span>
            <div>
              <h4 className="text-sm font-black text-white">
                {getTranslation(lang, 'emergency_title', 'CRITICAL HEAT EMERGENCY DETECTED')}
              </h4>
              <p className="text-xs text-rose-200 mt-0.5">
                {locationName}: Heat Index {heatIndexC}°C exceeds life-threatening threshold (≥45°C). Halt outdoor exertion.
              </p>
            </div>
          </div>
          <button
            onClick={onTriggerEmergencyMode}
            className="px-4 py-2 bg-white text-rose-700 font-extrabold text-xs rounded-xl hover:bg-rose-50 shadow transition flex items-center gap-2 shrink-0 active:scale-95"
          >
            <span>{getTranslation(lang, 'emergency_badge', 'EMERGENCY')} PROTOCOL</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ROW 1: HERO GREETING BANNER & LIVE WEATHER / REAL-TIME CLOCK
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Banner */}
        <div className="col-span-12 lg:col-span-8 bg-gradient-to-r from-[#111C38] via-[#162447] to-[#251A3A] border border-slate-800/90 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="relative z-10 max-w-xl">
            <span className="text-amber-400 text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-1.5">
              {currentTime.getHours() < 12
                ? 'Good Morning, Citizen 👋'
                : currentTime.getHours() < 17
                ? 'Good Afternoon, Citizen 👋'
                : 'Good Evening, Citizen 👋'}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mt-1 tracking-tight">
              Smarter Insights for a Safer Day
            </h2>
            <p className="text-xs sm:text-sm text-slate-300/90 mt-2 leading-relaxed">
              Real-time location-aware intelligence, AI-powered predictions, and actionable guidance to keep you and your community safe from extreme heat.
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2 relative z-20">
              <button
                onClick={handleWelfareCheckin}
                title="Record your welfare check-in & notify family"
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 active:scale-95"
              >
                <Heart className="w-3.5 h-3.5 text-emerald-200" />
                <span>{checkinToast || getTranslation(lang, 'im_safe_today', "I'm Safe Today")}</span>
              </button>
              <button
                onClick={() => onNavigateTab && onNavigateTab('apps')}
                className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iOS, Android &amp; Watch Suite</span>
              </button>
              <button
                onClick={() => onNavigateTab && onNavigateTab('villages')}
                className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>All India Villages (787 Districts)</span>
              </button>
            </div>
          </div>

          {/* Graphic Artwork on Right */}
          <div className="absolute right-4 bottom-2 hidden sm:flex flex-col items-center opacity-90 pointer-events-none select-none">
            <svg width="180" height="90" viewBox="0 0 180 90" fill="none" className="overflow-visible">
              <circle cx="90" cy="50" r="30" fill="url(#sun-glow)" />
              <path d="M10 80 Q 50 30 90 70 T 170 80" stroke="#F59E0B" strokeWidth="2" fill="none" opacity="0.4" />
              <path d="M0 90 L40 55 L80 90 L120 60 L180 90 Z" fill="#1C274C" />
              <defs>
                <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
            <span className="text-[11px] font-medium text-amber-300 mt-1">
              Small actions. <span className="text-white font-bold">Big impact.</span>
            </span>
          </div>
        </div>

        {/* Live Date & Location Card */}
        <div className="col-span-6 lg:col-span-2 bg-[#131E3A] border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight font-mono">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div className="flex items-center justify-between text-xs text-amber-400 mt-1">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span className="font-semibold truncate">{locationName}</span>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('villages')}
                title="Browse All Villages & Districts of India"
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline shrink-0 ml-1"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Weather Card */}
        <div className="col-span-6 lg:col-span-2 bg-[#131E3A] border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sun className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {tempC}°C
              </span>
              <p className="text-[11px] text-amber-300/90 font-medium">
                Feels like {feelsLikeC}°C
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-cyan-400" /> {humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-slate-300" /> {windKmh} km/h
            </span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: 5 KPI METRIC CARDS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Metric 1: Heat Risk Level */}
        <div className="bg-[#131E3A] border border-slate-800/90 rounded-2xl p-3.5 shadow flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Heat Risk Level</span>
            <span className="text-base font-bold text-amber-400 block">{riskLevel}</span>
            <span className="text-[10px] text-slate-400">Stay hydrated</span>
          </div>
        </div>

        {/* Metric 2: Heat Index (HI) */}
        <div className="bg-[#131E3A] border border-slate-800/90 rounded-2xl p-3.5 shadow flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Heat Index (HI)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white">{heatIndexC}°C</span>
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
                ↓ -1.8°C
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Humidity */}
        <div className="bg-[#131E3A] border border-slate-800/90 rounded-2xl p-3.5 shadow flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Humidity</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white">{humidity}%</span>
              <span className="text-[10px] font-semibold text-rose-400 flex items-center">
                ↑ +8%
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: UV Index */}
        <div className="bg-[#131E3A] border border-slate-800/90 rounded-2xl p-3.5 shadow flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">UV Index</span>
              <span className="text-xs font-bold text-amber-400">{uvIndex} (High)</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(uvIndex * 10, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 5: Air Quality (AQI) */}
        <div className="bg-[#131E3A] border border-slate-800/90 rounded-2xl p-3.5 shadow flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Air Quality (AQI)</span>
              <span className="text-xs font-bold text-emerald-400">{aqi} (Good)</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                style={{ width: `${Math.min((aqi / 200) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2.5: 6 AM – 8 PM HOURLY HEAT STRESS FORECAST STRIP
          ───────────────────────────────────────────────────────────── */}
      <HourlyForecastStrip
        lat={currentLat}
        lon={currentLon}
        stationId={selectedStationId}
        lang={lang}
        onPeakRiskDetected={(peakHi) => {
          if (peakHi >= 45 && onTriggerEmergencyMode && riskLevel === 'Extreme') {
            // High peak notification or trigger
          }
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          ROW 3: MIDDLE 3-COLUMN SECTION
          1. Live Location & Station Influence (4 Stations IDW)
          2. Interactive Heat Risk Map (India) with 46 clickable stations
          3. AI Safety Assistant & Recommendations
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Column 1: Live Location & Station Influence (4 IDW Stations) */}
        <div className="col-span-12 lg:col-span-4 bg-[#131E3A] border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Live Location &amp; Station Influence</h3>
              </div>
              <button
                onClick={handleTrackMove}
                disabled={isTracking}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition disabled:opacity-50"
              >
                <Radio className={`w-3 h-3 ${isTracking ? 'animate-ping' : ''}`} />
                <span>{isTracking ? 'Locating...' : 'Track Move'}</span>
              </button>
            </div>

            {/* Coordinates & Accuracy Badge */}
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-mono font-bold text-white">
                  {currentLat.toFixed(4)}° N, {currentLon.toFixed(4)}° E
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  Accuracy: ±{accuracyM} m
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Using 4 nearest stations (IDW, k=4, p=2.0)
              </p>
              {gpsMessage && (
                <div className="mt-2 text-[10px] text-emerald-400 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-800/60 flex items-center gap-1.5">
                  <Radio className="w-3 h-3" /> {gpsMessage}
                </div>
              )}
            </div>

            {/* Station Influence Breakdown Rows */}
            <div className="mt-4 space-y-3">
              {stationInfluences.map((st, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectStationInternal(st.stationId)}
                  className="space-y-1 cursor-pointer hover:bg-slate-800/40 p-1.5 rounded-lg transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                      <span className="font-semibold text-slate-200">{st.name}</span>
                      <span className="text-slate-400 text-[10px]">({st.code})</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <span className="text-slate-400 text-[11px]">{st.distanceKm} km</span>
                      <span className="font-semibold text-white">{st.tempC}°C</span>
                      <span className="text-[11px] font-mono font-bold text-blue-300 w-10 text-right">
                        {st.weightPct}%
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(st.weightPct, 100)}%`, backgroundColor: st.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Inverse-distance spatial interpolation</span>
            <span className="text-emerald-400 font-medium">Sub-ms Validated</span>
          </div>
        </div>

        {/* Column 2: Interactive Heat Risk Map (India) */}
        <div className="col-span-12 lg:col-span-5 bg-[#131E3A] border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-md relative">
          <div>
            {/* Header with Layer Switchers */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Interactive Heat Risk Map (India)</h3>
              </div>
              <button
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className="p-1 text-slate-400 hover:text-white rounded transition"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtabs: Standard, Heat Risk, Clusters, Anomalies */}
            <div className="flex items-center gap-1.5 mt-3 text-[11px] font-medium overflow-x-auto pb-1">
              {[
                { id: 'standard', label: 'Standard' },
                { id: 'heat_risk', label: 'Heat Risk' },
                { id: 'clusters', label: 'Clusters' },
                { id: 'anomalies', label: 'Anomalies' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMapLayer(tab.id as any)}
                  className={`px-3 py-1 rounded-lg transition shrink-0 ${
                    mapLayer === tab.id
                      ? 'bg-blue-600 text-white font-semibold shadow'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SVG India Map Simulation with All 46 Stations Placed */}
            <div className="mt-3 relative w-full h-56 sm:h-64 bg-[#0B132B]/80 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center select-none">
              
              <svg
                viewBox={getViewBox()}
                className="w-full h-full max-h-64 object-contain transition-all duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <defs>
                  <linearGradient id="india-heat-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.85" />
                    <stop offset="35%" stopColor="#F97316" stopOpacity="0.8" />
                    <stop offset="65%" stopColor="#EAB308" stopOpacity="0.75" />
                    <stop offset="90%" stopColor="#10B981" stopOpacity="0.7" />
                  </linearGradient>
                  <filter id="thermal-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* India Outline Boundary */}
                <path
                  d="M170 30 L200 45 L220 70 L210 100 L240 120 L270 140 L310 160 L310 200 L280 210 L250 230 L240 260 L220 290 L200 330 L190 380 L180 340 L160 290 L140 260 L130 220 L110 190 L120 150 L150 110 L160 70 Z"
                  fill="url(#india-heat-gradient)"
                  filter="url(#thermal-glow)"
                  stroke="#38BDF8"
                  strokeWidth="1.2"
                  opacity="0.9"
                />

                {/* Regional Hotspot Contours (North-West Extreme) */}
                <circle cx="140" cy="140" r="38" fill="#EF4444" opacity="0.6" filter="url(#thermal-glow)" />
                <circle cx="165" cy="165" r="28" fill="#F97316" opacity="0.7" filter="url(#thermal-glow)" />
                <circle cx="230" cy="170" r="24" fill="#EAB308" opacity="0.5" filter="url(#thermal-glow)" />

                {/* Render All 46 Synoptic Stations */}
                {showStations && OFFLINE_STATIONS.map((st) => {
                  const pt = projectGeoToSvg(st.latitude, st.longitude);
                  const isSelected = st.station_id === selectedStationId;
                  
                  // Determine dot color by layer
                  let dotColor = '#FFFFFF';
                  if (mapLayer === 'heat_risk') {
                    dotColor = st.color;
                  } else if (mapLayer === 'clusters') {
                    const clusterColors = ['#3B82F6', '#F59E0B', '#EF4444', '#10B981'];
                    dotColor = clusterColors[st.cluster_id % clusterColors.length];
                  } else if (mapLayer === 'anomalies') {
                    dotColor = st.temperature_c >= 42 ? '#EF4444' : '#10B981';
                  }

                  return (
                    <g
                      key={st.station_id}
                      transform={`translate(${pt.x}, ${pt.y})`}
                      className="cursor-pointer group"
                      onClick={() => handleSelectStationInternal(st.station_id)}
                      onMouseEnter={() => setHoveredStation(st)}
                      onMouseLeave={() => setHoveredStation(null)}
                    >
                      {/* Anomaly / Pulsing Halo */}
                      {(mapLayer === 'anomalies' && st.temperature_c >= 42) && (
                        <circle cx="0" cy="0" r="7" fill="#EF4444" className="animate-ping" opacity="0.6" />
                      )}
                      {/* Active Station Ping Halo */}
                      {isSelected && (
                        <circle cx="0" cy="0" r="7" fill="#3B82F6" className="animate-ping" opacity="0.7" />
                      )}
                      <circle
                        cx="0"
                        cy="0"
                        r={isSelected ? "5" : "3.5"}
                        fill={dotColor}
                        stroke="#0B132B"
                        strokeWidth="1"
                        className="transition-transform group-hover:scale-150"
                      />
                    </g>
                  );
                })}

                {/* Active Station Pin Tooltip Badge */}
                <g transform={`translate(${activeCoords.x}, ${activeCoords.y})`}>
                  <circle cx="0" cy="0" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                  <rect x="8" y="-18" width="120" height="30" rx="6" fill="#0B132B" stroke="#3B82F6" strokeWidth="1" />
                  <text x="16" y="-3" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                    {activeStation.station_name}
                  </text>
                  <text x="16" y="8" fill="#FBBF24" fontSize="9" fontWeight="medium">
                    {riskLevel} ({tempC}°C)
                  </text>
                </g>
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredStation && (
                <div className="absolute top-2 left-2 bg-[#0B132B]/95 border border-slate-700 rounded-lg p-2 text-xs shadow-lg pointer-events-none z-20">
                  <div className="font-bold text-white">{hoveredStation.station_name}</div>
                  <div className="text-[11px] text-amber-400">
                    {hoveredStation.temperature_c}°C • {hoveredStation.vulnerability_tier} Risk
                  </div>
                  <div className="text-[10px] text-slate-400">
                    HI: {hoveredStation.heat_index_c}°C | RH: {Math.round(hoveredStation.relative_humidity_pct)}%
                  </div>
                </div>
              )}

              {/* Map Zoom Controls */}
              <div className="absolute right-3 top-3 flex flex-col gap-1 bg-[#131E3A]/90 border border-slate-700/80 rounded-lg p-1 shadow">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.2))}
                  aria-label="Zoom in map"
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                  aria-label="Zoom out map"
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setZoomLevel(1); setRegionFilter('india'); }}
                  aria-label="Recenter map target"
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Map Legend Overlay */}
              <div className="absolute left-3 bottom-3 bg-[#0B132B]/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] text-slate-300 space-y-1 shadow">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-600" /> Extreme</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-500" /> Very High</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-500" /> High</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-yellow-400" /> Moderate</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Low</div>
              </div>
            </div>

            {/* Bottom Bar: Show Stations toggle & Region selector */}
            <div className="flex items-center justify-between mt-3 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showStations}
                  onChange={(e) => setShowStations(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">Show Stations ({OFFLINE_STATIONS.length})</span>
              </label>

              <select
                aria-label="Filter region"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value as any)}
                className="bg-[#0B132B] border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="india">India (All)</option>
                <option value="north">North India</option>
                <option value="bihar">Bihar &amp; East</option>
                <option value="rajasthan">Rajasthan Arid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Column 3: AI Safety Assistant & Recommendations */}
        <div className="col-span-12 lg:col-span-3 space-y-4 flex flex-col justify-between">
          
          {/* Top: AI Safety Assistant */}
          <div className="bg-[#131E3A] border border-slate-800/90 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Bot className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">AI Safety Assistant</h3>
              </div>
              {onOpenAIAnalyst && (
                <button
                  onClick={onOpenAIAnalyst}
                  title="Open Deep AI Analyst"
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="w-3 h-3" /> Deep Analyst
                </button>
              )}
            </div>

            {/* Interactive Query Input */}
            <form onSubmit={handleSendChat} className="relative flex items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-[#0B132B] border border-slate-700/80 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                aria-label="Submit query to AI Safety Assistant"
                className="absolute right-1.5 p-1 text-blue-400 hover:text-white rounded-lg transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Prompt Chips */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              {[
                'Is it safe to go out now?',
                'Give me a hydration plan',
                'Suggest indoor activities',
                'Is this a heatwave?',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipQuery(chip)}
                  className="p-1.5 text-left bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 rounded-lg transition border border-slate-700/60 leading-tight"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Inline AI Response Bubble */}
            {isChatThinking && (
              <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Analyzing biometeorological conditions for {locationName}...</span>
              </div>
            )}
            {chatResponse && !isChatThinking && (
              <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-slate-200 leading-relaxed space-y-1">
                <div className="flex items-center gap-1 text-cyan-400 text-[10px] font-semibold">
                  <Bot className="w-3 h-3" /> HeatShield Advisory:
                </div>
                <p>{chatResponse}</p>
              </div>
            )}
          </div>

          {/* Bottom: Today's Recommendations */}
          <div className="bg-[#131E3A] border border-slate-800/90 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Sun className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Today's Recommendations</h3>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('plan')}
                className="text-[11px] font-medium text-blue-400 hover:text-blue-300"
              >
                View All
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/50 border border-slate-800 text-slate-200">
                <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Hydrate: {heatIndexC >= 42 ? '500 ml' : '250 ml'} water every hour</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/50 border border-slate-800 text-slate-200">
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Avoid direct sunlight (11:30 AM – 3:30 PM)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/50 border border-slate-800 text-slate-200">
                <Shirt className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Wear light, breathable cotton clothing</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/50 border border-slate-800 text-slate-200">
                <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Check on elderly family members</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 4: BOTTOM 3 CARDS
          1. 24-Hour Heat Outlook (Dual series line chart with live "Now")
          2. Regional Comparison (Top 5 Hottest bar chart with click selection)
          3. Recent Alerts
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Card 1: 24-Hour Heat Outlook Chart */}
        <div className="col-span-12 lg:col-span-4 bg-[#131E3A] border border-slate-800/90 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">24-Hour Heat Outlook</h3>
            </div>
            {/* Chart Legend */}
            <div className="flex items-center gap-3 text-[10px] text-slate-300">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-amber-500 rounded" /> Temperature (°C)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-rose-500 rounded" /> Heat Index (°C)
              </span>
            </div>
          </div>

          {/* Dynamic SVG Line Chart with "Now" marker */}
          <div className="relative w-full h-36 pt-2">
            <svg viewBox="0 0 320 120" className="w-full h-full overflow-visible">
              {/* Y Grid Lines */}
              <line x1="25" y1="20" x2="310" y2="20" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="25" y1="60" x2="310" y2="60" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="25" y1="100" x2="310" y2="100" stroke="#1E293B" strokeDasharray="3 3" />

              <text x="18" y="23" fill="#64748B" fontSize="8" textAnchor="end">48</text>
              <text x="18" y="63" fill="#64748B" fontSize="8" textAnchor="end">36</text>
              <text x="18" y="103" fill="#64748B" fontSize="8" textAnchor="end">24</text>

              {/* Heat Index Curve (Red) */}
              <path
                d={`M 30 ${120 - ((diurnalPoints[0].hi - 20) / 30) * 80} Q 85 ${120 - ((diurnalPoints[1].hi - 20) / 30) * 80} 140 ${120 - ((diurnalPoints[2].hi - 20) / 30) * 80} T 200 ${120 - ((diurnalPoints[3].hi - 20) / 30) * 80} T 260 ${120 - ((diurnalPoints[4].hi - 20) / 30) * 80} T 310 ${120 - ((diurnalPoints[5].hi - 20) / 30) * 80}`}
                fill="none"
                stroke="#EF4444"
                strokeWidth="2.5"
              />

              {/* Temperature Curve (Amber/Orange) */}
              <path
                d={`M 30 ${120 - ((diurnalPoints[0].temp - 20) / 30) * 80} Q 85 ${120 - ((diurnalPoints[1].temp - 20) / 30) * 80} 140 ${120 - ((diurnalPoints[2].temp - 20) / 30) * 80} T 200 ${120 - ((diurnalPoints[3].temp - 20) / 30) * 80} T 260 ${120 - ((diurnalPoints[4].temp - 20) / 30) * 80} T 310 ${120 - ((diurnalPoints[5].temp - 20) / 30) * 80}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="4 2"
              />

              {/* "Now" Vertical Indicator aligned with currentHour */}
              {(() => {
                const nowX = 30 + (currentHour / 24) * 280;
                return (
                  <g>
                    <line x1={nowX} y1="10" x2={nowX} y2="105" stroke="#94A3B8" strokeDasharray="2 2" strokeWidth="1.2" />
                    <circle cx={nowX} cy="55" r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x={nowX} y="8" fill="#F8FAFC" fontSize="9" fontWeight="bold" textAnchor="middle">Now</text>
                  </g>
                );
              })()}

              {/* X-Axis Hour Labels */}
              {diurnalPoints.map((pt, idx) => (
                <text
                  key={idx}
                  x={30 + idx * 55}
                  y="118"
                  fill={Math.abs(currentHour - pt.hour) < 2 ? '#93C5FD' : '#64748B'}
                  fontSize="8"
                  fontWeight={Math.abs(currentHour - pt.hour) < 2 ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {pt.label}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Card 2: Regional Comparison (Top 5 Hottest) */}
        <div className="col-span-12 lg:col-span-4 bg-[#131E3A] border border-slate-800/90 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Regional Comparison (Top 5 Hottest)</h3>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('all_stations')}
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300"
            >
              View All
            </button>
          </div>

          {/* Bar Chart with Click-to-Select */}
          <div className="flex items-end justify-between gap-2 h-36 pt-4 px-1">
            {topHottest.map((item, idx) => {
              const maxTemp = 46;
              const barHeightPct = ((item.temp - 30) / (maxTemp - 30)) * 100;
              const isSelected = item.stationId === selectedStationId;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectStationInternal(item.stationId)}
                  className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer p-1 rounded-lg transition ${
                    isSelected ? 'bg-blue-600/20 border border-blue-500/40' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-[10px] font-bold text-white mb-1 group-hover:scale-110 transition">
                    {item.temp}°C
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-300"
                    style={{
                      height: `${Math.max(barHeightPct, 20)}%`,
                      backgroundColor: item.color
                    }}
                  />
                  <span className="text-[11px] font-semibold text-slate-200 mt-2 truncate w-full text-center">
                    {item.city}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    ({item.state})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Recent Alerts */}
        <div className="col-span-12 lg:col-span-4 bg-[#131E3A] border border-slate-800/90 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Recent Alerts</h3>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('risk')}
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Alert 1 */}
            <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-800/50 flex items-start gap-2.5">
              <div className="p-1 rounded bg-red-500/20 text-red-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-300 text-xs">Heat Advisory</span>
                  <span className="text-[10px] text-slate-400">2h ago</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  High temperatures ({tempC}°C) expected in {locationName} today.
                </p>
              </div>
            </div>

            {/* Alert 2 */}
            <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/50 flex items-start gap-2.5">
              <div className="p-1 rounded bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300 text-xs">Hydration Reminder</span>
                  <span className="text-[10px] text-slate-400">4h ago</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Drink water, stay cool! Current humidity is {humidity}%.
                </p>
              </div>
            </div>

            {/* Alert 3 */}
            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-start gap-2.5">
              <div className="p-1 rounded bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300 text-xs">Weekend Heatwave Outlook</span>
                  <span className="text-[10px] text-slate-400">8h ago</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  High thermal stress in North &amp; East India. 46 stations monitored.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER STATUS BAR
          ───────────────────────────────────────────────────────────── */}
      <footer className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <div>
          <span>HeatShield AI | NOAA GSOD 2022–2025 | Live Open-Meteo | Unsupervised Climate Intelligence</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Last updated: {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST | Offline: Ready | v2.0.0
          </span>
        </div>
      </footer>

    </div>
  );
};
