import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Droplets,
  Sun,
  Wind,
  MapPin,
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
  ChevronRight,
  Building2
} from 'lucide-react';
import {
  OFFLINE_STATIONS,
  interpolateLocationFeaturesOffline
} from '../utils/offlineEngine';
import type {
  StationUsed,
  StationLiveSummaryItem,
  LanguageCode,
  LocationSourceType,
  ReverseGeocodeSource,
  DataProvenanceType,
  HourlyForecastResponse
} from '../types';
import { HourlyForecastStrip } from './HourlyForecastStrip';
import { getTranslation } from '../utils/localization';
import { api } from '../services/api';
import { initiatePhoneCall } from '../utils/phoneCall';
import { answerHeatSafetyQuery } from '../utils/universalAIEngine';
import { formatLocationConfidence } from '../utils/geolocationService';
import type { StationInfluenceItem } from './mobile/MobileIDWCard';

interface HeatShieldHubProps {
  onNavigateTab?: (tab: string) => void;
  onOpenAIAnalyst?: () => void;
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
  customLocation?: { name: string; lat: number; lon: number } | null;
  lang?: LanguageCode;
  onTriggerEmergencyMode?: () => void;
  currentLat?: number | null;
  currentLon?: number | null;
  accuracyM?: number | null;
  locationName?: string;
  locationSource?: LocationSourceType;
  reverseSource?: ReverseGeocodeSource;
  locationUnavailable?: boolean;
  locationAcquiring?: boolean;
  locationErrorReason?: string | null;
  isTracking?: boolean;
  gpsMessage?: string | null;
  onTrackMove?: () => void;
  onOpenLocationPicker?: () => void;
  tempC?: number;
  feelsLikeC?: number;
  humidity?: number;
  windKmh?: number;
  riskLevel?: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme' | string;
  weatherProvenance?: DataProvenanceType;
  weatherProvider?: string;
  observedAt?: string | null;
  weatherFallbackReason?: string | null;
  hourlyForecast?: HourlyForecastResponse | null;
  contributingStations?: StationInfluenceItem[];
}

export const HeatShieldHub: React.FC<HeatShieldHubProps> = ({
  onNavigateTab,
  onOpenAIAnalyst,
  selectedStationId,
  onSelectStation,
  customLocation,
  lang = 'en',
  onTriggerEmergencyMode,
  currentLat: propLat,
  currentLon: propLon,
  accuracyM: propAccuracyM,
  locationName: propLocationName,
  locationSource = 'unavailable',
  reverseSource = 'unavailable',
  locationUnavailable: propLocationUnavailable,
  locationAcquiring = false,
  locationErrorReason,
  isTracking: propIsTracking = false,
  gpsMessage: propGpsMessage = null,
  onTrackMove,
  onOpenLocationPicker,
  tempC: propTempC,
  feelsLikeC: propFeelsLikeC,
  humidity: propHumidity,
  windKmh: propWindKmh,
  riskLevel: propRiskLevel,
  weatherProvenance = 'offline_estimate',
  weatherProvider,
  observedAt,
  weatherFallbackReason,
  hourlyForecast,
  contributingStations: propContributingStations
}) => {
  // Live ticking clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Optional synoptic station record when viewing a specific baseline station
  const activeStation = selectedStationId
    ? OFFLINE_STATIONS.find(s => s.station_id === selectedStationId)
    : undefined;

  const hasVerifiedCoords =
    propLat !== undefined
      ? propLat != null && propLon != null && Number.isFinite(propLat) && Number.isFinite(propLon)
      : customLocation != null || activeStation != null;

  const currentLat: number | null =
    propLat !== undefined
      ? propLat ?? null
      : customLocation?.lat ?? activeStation?.latitude ?? null;
  const currentLon: number | null =
    propLon !== undefined
      ? propLon ?? null
      : customLocation?.lon ?? activeStation?.longitude ?? null;
  const accuracyM: number | null = propAccuracyM ?? null;

  const locationUnavailable =
    propLocationUnavailable !== undefined
      ? propLocationUnavailable
      : !hasVerifiedCoords && !locationAcquiring;
  const readingsPaused = locationUnavailable || !hasVerifiedCoords;

  const locationName =
    propLocationName ||
    (customLocation ? `${customLocation.name}, IN` : activeStation ? `${activeStation.station_name}, IN` : 'Location Unavailable');

  const isTracking = propIsTracking;
  const gpsMessage = propGpsMessage;

  const tempC = propTempC ?? activeStation?.temperature_c ?? 0;
  const feelsLikeC = propFeelsLikeC ?? activeStation?.heat_index_c ?? 0;
  const humidity = propHumidity ?? (activeStation ? Math.round(activeStation.relative_humidity_pct) : 0);
  const windKmh = propWindKmh ?? 0;
  const heatIndexC = feelsLikeC;
  const rawRisk = propRiskLevel || activeStation?.vulnerability_tier || 'Low';
  const riskLevel = (
    rawRisk.charAt(0).toUpperCase() + rawRisk.slice(1).toLowerCase()
  ) as 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';

  const isLiveWeather = weatherProvenance === 'live_observation';
  const formattedObservedTime = observedAt
    ? new Date(observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  // Welfare Check-in state
  const [checkinToast, setCheckinToast] = useState<string | null>(null);

  const handleWelfareCheckin = async () => {
    if (currentLat == null || currentLon == null) {
      setCheckinToast('Select location first');
      setTimeout(() => setCheckinToast(null), 4000);
      return;
    }
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

  // 4 Contributing IDW Stations (prefer unified prop, otherwise derive from valid coords)
  const computedInfluences = useMemo<StationInfluenceItem[]>(() => {
    if (propContributingStations !== undefined) return [];
    if (currentLat == null || currentLon == null) return [];
    try {
      const pred = interpolateLocationFeaturesOffline(currentLat, currentLon, accuracyM ?? undefined, 4, 2.0);
      if (pred?.data_source?.stations_used?.length) {
        const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
        return pred.data_source.stations_used.slice(0, 4).map((st: StationUsed, idx: number) => ({
          stationId: st.station_id,
          name: st.name.split(' ')[0] || st.name,
          code: st.station_id.slice(0, 5),
          distanceKm: Math.round(st.distance_km * 10) / 10,
          tempC: Math.round((st.temperature_c ?? 32.0) * 10) / 10,
          weightPct: Math.round(st.weight_pct * 10) / 10,
          color: colors[idx % colors.length]
        }));
      }
    } catch (err) {
      console.warn('IDW calculation fallback:', err);
    }
    return [];
  }, [currentLat, currentLon, accuracyM, propContributingStations]);
  const stationInfluences = propContributingStations ?? computedInfluences;

  const handleTrackMove = () => {
    if (onTrackMove) {
      onTrackMove();
    }
  };

  // Station Selection from Map or List
  const handleSelectStationInternal = (stationId: string) => {
    if (onSelectStation) {
      onSelectStation(stationId);
    }
  };

  // Handle Universal AI Queries for ANY question and ANY location
  const handleChipQuery = (query: string) => {
    setChatInput(query);
    setIsChatThinking(true);
    setChatResponse(null);

    setTimeout(() => {
      setIsChatThinking(false);
      try {
        const res = answerHeatSafetyQuery(query, {
          name: locationUnavailable ? undefined : locationName,
          lat: currentLat ?? undefined,
          lon: currentLon ?? undefined,
          tempC: locationUnavailable ? undefined : tempC,
          feelsLikeC: locationUnavailable ? undefined : feelsLikeC,
          humidity: locationUnavailable ? undefined : humidity,
          windKmh: locationUnavailable ? undefined : windKmh,
          riskTier: riskLevel
        });
        setChatResponse(res.answer);
      } catch (err) {
        console.error('Universal AI query error:', err);
        setChatResponse(
          locationUnavailable
            ? 'Location is currently unavailable. Mention a city name in your question (e.g., Jaipur, Delhi, Patna) or select your city to get local heat guidance.'
            : `Analysis for ${locationName}: Ambient ${tempC}°C, Heat Index ${feelsLikeC}°C (${riskLevel} Risk). Maintain continuous hydration and avoid direct midday solar exposure.`
        );
      }
    }, 250);
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

  // Dynamic 24-Hour Diurnal Outlook Data (uses live hourlyForecast when matching hour exists)
  const currentHour = currentTime.getHours();
  const diurnalHours = [0, 4, 8, 12, 16, 20];
  const diurnalPoints = diurnalHours.map(h => {
    const matched = hourlyForecast?.hourly?.find(item => item.hour_num === h);
    if (matched) {
      return {
        hour: h,
        label: h === 0 ? '12 AM' : (h < 12 ? `${h} AM` : (h === 12 ? '12 PM' : `${h - 12} PM`)),
        temp: Math.round(matched.temp_c * 10) / 10,
        hi: Math.round(matched.heat_index_c * 10) / 10
      };
    }
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

  const activeCoords =
    currentLat != null && currentLon != null ? projectGeoToSvg(currentLat, currentLon) : null;

  return (
    <div className="flex-1 bg-[#090F1F] text-slate-100 min-h-screen p-4 sm:p-6 space-y-5 overflow-y-auto">
      
      {/* Location Unavailable Explicit Notice (Never silently show a fake city!) */}
      {locationUnavailable && (
        <div className="bg-amber-950/60 border border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-amber-500/20 text-amber-300 rounded-xl shrink-0">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-sm font-black text-amber-200">
                Location Unavailable — Manual Selection Required
              </h4>
              <p className="text-xs text-amber-100/80 mt-0.5 leading-relaxed">
                {locationErrorReason || 'Automatic GPS and network geolocation could not determine your location.'}{' '}
                Live weather and local heat risk are paused until you pick a city/village or allow browser GPS.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenLocationPicker && (
              <button
                onClick={onOpenLocationPicker}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow"
              >
                Select City / Village
              </button>
            )}
            <button
              onClick={handleTrackMove}
              disabled={isTracking}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs rounded-xl transition"
            >
              {isTracking ? 'Locating...' : 'Retry GPS'}
            </button>
          </div>
        </div>
      )}

      {/* Persistent Heat Emergency Banner if Tier 4/5 (Heat Index >= 45°C) */}
      {!locationUnavailable && heatIndexC >= 45 && onTriggerEmergencyMode && (
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
          ROW 1: THE CORE SAFETY COMMAND HERO (Location Risk, Next Danger Window & Recommended Action)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Main Location-Specific Safety Command Banner */}
        <div className={`col-span-12 lg:col-span-8 rounded-2xl p-5 sm:p-6 border shadow-xl relative overflow-hidden flex flex-col justify-between transition-all ${
          riskLevel === 'Extreme'
            ? 'bg-gradient-to-r from-red-950/90 via-[#1C162E] to-[#121B35] border-red-500/80 shadow-red-950/40'
            : riskLevel === 'Very High'
            ? 'bg-gradient-to-r from-orange-950/90 via-[#1D1B2E] to-[#121B35] border-orange-500/70 shadow-orange-950/30'
            : riskLevel === 'High'
            ? 'bg-gradient-to-r from-amber-950/70 via-[#19223D] to-[#121B35] border-amber-500/60 shadow-amber-950/20'
            : 'bg-gradient-to-r from-[#111C38] via-[#162447] to-[#132A3E] border-slate-700/80'
        }`}>
          <div className="relative z-10 space-y-3">
            {/* Top Bar: Live Risk Tier Badge & Next Danger Window */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
                  locationUnavailable
                    ? 'bg-slate-700 text-slate-200'
                    : riskLevel === 'Extreme'
                    ? 'bg-red-600 text-white animate-pulse'
                    : riskLevel === 'Very High'
                    ? 'bg-orange-500 text-white'
                    : riskLevel === 'High'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-emerald-500 text-slate-950'
                }`}>
                  <Flame className="w-3.5 h-3.5" />
                  <span>
                    {locationUnavailable
                      ? 'Location Required'
                      : locationAcquiring && !hasVerifiedCoords
                      ? 'Locating...'
                      : `${riskLevel} Heat Risk`}
                  </span>
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  in <strong className="text-white">{locationName}</strong>
                </span>
                {!locationUnavailable && hasVerifiedCoords && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      locationSource === 'ip_geolocation' || locationSource === 'network_cellular' || reverseSource === 'local_centroid_fallback'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                        : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    {formatLocationConfidence(locationSource, accuracyM).shortTag}
                  </span>
                )}
                {locationAcquiring && hasVerifiedCoords && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 animate-pulse">
                    Refining GPS...
                  </span>
                )}
              </div>

              {/* Next Dangerous Time Window */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-black/50 backdrop-blur border border-amber-500/40 rounded-full text-xs text-amber-300 font-bold shadow-sm">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Next Danger Window: <strong className="text-white">11:30 AM – 4:00 PM</strong></span>
              </div>
            </div>

            {/* Current Thermal Metrics & Recommended Safety Action */}
            <div className="pt-1">
              {locationUnavailable ? (
                <h2 className="text-xl sm:text-2xl font-black text-slate-300 tracking-tight">
                  Live Heat Reading Paused — Select Your Location
                </h2>
              ) : !hasVerifiedCoords && locationAcquiring ? (
                <h2 className="text-xl sm:text-2xl font-black text-cyan-200 tracking-tight">
                  Acquiring Live GPS / IP Location &amp; Weather...
                </h2>
              ) : (
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex flex-wrap items-baseline gap-2">
                  <span>Feels Like {feelsLikeC}°C</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-300 font-mono">
                    (Ambient: {tempC}°C • Relative Humidity: {humidity}%)
                  </span>
                </h2>
              )}

              {/* Recommended Safety Action Box */}
              <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm leading-relaxed text-slate-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold block mb-0.5">Recommended Safety Action:</strong>
                  <span>
                    {locationUnavailable
                      ? 'Choose your city/village or enable GPS access so HeatShield AI can fetch verified live weather and compute local heat risk.'
                      : riskLevel === 'Extreme' || heatIndexC >= 45
                      ? 'Halt all outdoor exertion immediately. Stay in deep shade or air-cooled rooms. Drink 500 ml water/electrolytes every 45 minutes. Watch for confusion or lack of sweat.'
                      : riskLevel === 'Very High' || heatIndexC >= 40
                      ? 'Postpone non-essential outdoor labor until after 5:00 PM. Drink water proactively every 30 minutes even without thirst. Keep heads covered.'
                      : riskLevel === 'High' || heatIndexC >= 36
                      ? 'Limit direct sunlight exposure during midday hours (11:30 AM – 3:30 PM). Maintain 250 ml hydration every 45 minutes and wear loose light-colored cotton.'
                      : 'Conditions are within standard seasonal baseline. Maintain regular 2–3L daily hydration and wear sunglasses/hat during peak sun hours.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instant Action CTA Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2 relative z-20">
              {onTriggerEmergencyMode && (
                <button
                  onClick={onTriggerEmergencyMode}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 active:scale-95"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Emergency Protocol (SOS)</span>
                </button>
              )}
              <button
                type="button"
                onClick={(e) => initiatePhoneCall('108', e)}
                className="px-3.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📞 Call 108</span>
              </button>
              <button
                onClick={handleWelfareCheckin}
                title="Record welfare check-in"
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 active:scale-95"
              >
                <Heart className="w-3.5 h-3.5 text-emerald-200" />
                <span>{checkinToast || getTranslation(lang, 'im_safe_today', "I'm Safe Check-in")}</span>
              </button>
              <button
                onClick={handleTrackMove}
                disabled={isTracking}
                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              >
                <Radio className={`w-3.5 h-3.5 text-cyan-400 ${isTracking ? 'animate-ping' : ''}`} />
                <span>{isTracking ? 'Locating...' : 'Track Live GPS'}</span>
              </button>
              {onOpenLocationPicker && (
                <button
                  onClick={onOpenLocationPicker}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold text-xs rounded-xl border border-blue-500/40 transition flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Change Location</span>
                </button>
              )}
              <button
                onClick={() => onNavigateTab && onNavigateTab('villages')}
                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>All India Villages</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actionable Temperature & Biometeorology Card */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-[#131E3A] border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  {locationUnavailable
                    ? 'Location Required'
                    : readingsPaused
                    ? 'Acquiring Location...'
                    : isLiveWeather
                    ? `Live • ${weatherProvider || 'Open-Meteo'}${formattedObservedTime ? ` • ${formattedObservedTime}` : ''}`
                    : 'Offline IDW Estimate • NOAA Baseline'}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    {readingsPaused ? '--°C' : `${tempC}°C`}
                  </span>
                  <span className="text-xs font-bold text-amber-300/90 font-mono">
                    HI: {readingsPaused ? '--°C' : `${feelsLikeC}°C`}
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Sun className="w-7 h-7 animate-pulse" />
              </div>
            </div>

            {/* Clear Risk Status Badge */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                readingsPaused
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : riskLevel === 'Extreme'
                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                  : riskLevel === 'Very High'
                  ? 'bg-orange-950/60 text-orange-300 border-orange-500/40'
                  : riskLevel === 'High'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
              }`}>
                <Shield className="w-3 h-3" />
                <span>
                  {locationUnavailable
                    ? 'Awaiting Location'
                    : readingsPaused
                    ? 'Locating Coordinates...'
                    : `Status: ${riskLevel} Thermal Load`}
                </span>
              </span>
            </div>

            {/* Actionable Directive on Card */}
            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              💡 <strong className="text-white font-semibold">Action:</strong>{' '}
              {locationUnavailable
                ? 'Select a location to enable local weather and heat safety guidance.'
                : readingsPaused
                ? 'Determining GPS / IP coordinates to fetch real-time thermal risk...'
                : feelsLikeC >= 42
                ? 'High danger of cutaneous sweat evaporation failure. Drink water immediately and rest in shade.'
                : feelsLikeC >= 36
                ? 'Limit direct radiant heat exposure. Sip fluids regularly every 30–45 mins.'
                : 'Favorable thermal balance. Safe for regular outdoor routines with basic hydration.'}
            </p>
          </div>

          {/* Environmental Telemetry & Provenance Footer */}
          <div className="grid grid-cols-4 gap-1.5 pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-300 text-center">
            <div className="bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Humidity</span>
              <span className="font-bold text-cyan-400 flex items-center justify-center gap-1">
                <Droplets className="w-3 h-3" /> {readingsPaused ? '--' : `${humidity}%`}
              </span>
            </div>
            <div className="bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Wind Flow</span>
              <span className="font-bold text-slate-200 flex items-center justify-center gap-1">
                <Wind className="w-3 h-3" /> {readingsPaused ? '--' : `${windKmh} km/h`}
              </span>
            </div>
            <div className="bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Feed</span>
              <span
                className={`font-bold flex items-center justify-center gap-1 ${
                  readingsPaused ? 'text-slate-400' : isLiveWeather ? 'text-emerald-400' : 'text-amber-400'
                }`}
                title={weatherFallbackReason || undefined}
              >
                {locationUnavailable ? 'Paused' : readingsPaused ? 'Syncing' : isLiveWeather ? 'Live' : 'Offline'}
              </span>
            </div>
            <div className="bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Fix</span>
              <span className="font-bold text-cyan-300 flex items-center justify-center gap-1 truncate">
                {locationUnavailable
                  ? 'None'
                  : readingsPaused
                  ? 'GPS...'
                  : accuracyM != null
                  ? `±${Math.round(accuracyM)}m`
                  : locationSource === 'manual'
                  ? 'Manual'
                  : 'Station'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: STRUCTURED 3-TIER METRIC CARDS (Consistent Visual Hierarchy)
          Tier 1: Critical Biomarkers (Heat Risk & Heat Index)
          Tier 2: Meteorological Drivers (Temperature & Humidity)
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span className="uppercase tracking-wider text-[10px] font-bold">Biometeorological Telemetry Hierarchy</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {isLiveWeather && formattedObservedTime
              ? `Observed: ${formattedObservedTime} (${weatherProvider || 'Open-Meteo'})`
              : `NOAA Baseline (IDW): ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* TIER 1: Heat Risk Level (Critical) */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#1A2035] to-[#131E3A] border-2 border-amber-500/40 rounded-2xl p-4 shadow-md flex items-center gap-3 relative overflow-hidden">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Tier 1 • Primary Hazard</span>
                <span
                  className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                    readingsPaused
                      ? 'bg-slate-700 text-slate-300'
                      : isLiveWeather
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {locationUnavailable ? 'Paused' : readingsPaused ? 'Locating' : isLiveWeather ? 'Live' : 'Offline IDW'}
                </span>
              </div>
              <div className="text-xl font-black text-white mt-0.5 truncate">
                {locationUnavailable ? 'Unavailable' : readingsPaused ? 'Acquiring...' : `${riskLevel} Risk`}
              </div>
              <p className="text-xs text-slate-300 truncate">
                {readingsPaused ? 'Waiting for live coordinates' : 'Rothfusz & NOAA Baseline Assessment'}
              </p>
            </div>
          </div>

          {/* TIER 1: Heat Index (HI - Physiological Stress) */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#1A2035] to-[#131E3A] border-2 border-rose-500/40 rounded-2xl p-4 shadow-md flex items-center gap-3 relative overflow-hidden">
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">Tier 1 • Heat Index</span>
                <span className="text-[10px] font-semibold text-emerald-400">
                  {readingsPaused ? 'Pending' : isLiveWeather ? 'Observed' : 'Estimated'}
                </span>
              </div>
              <div className="text-xl font-black text-white mt-0.5 font-mono">
                {readingsPaused ? '--°C' : `${heatIndexC}°C HI`}
              </div>
              <p className="text-xs text-slate-300 truncate">Rothfusz Biometeorological Model</p>
            </div>
          </div>

          {/* TIER 2 & 3: Ambient Temperature & Humidity */}
          <div className="sm:col-span-1 lg:col-span-1 bg-[#131E3A] border border-slate-800 rounded-2xl p-3.5 shadow flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Dry-Bulb</span>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="my-1">
              <span className="text-lg font-black text-white">{readingsPaused ? '--°C' : `${tempC}°C`}</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate">
              {readingsPaused ? 'Locating...' : `Daily Peak: ~${Math.round((tempC + 2) * 10) / 10}°C`}
            </span>
          </div>

          <div className="sm:col-span-1 lg:col-span-1 bg-[#131E3A] border border-slate-800 rounded-2xl p-3.5 shadow flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Humidity</span>
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="my-1">
              <span className="text-lg font-black text-white">{readingsPaused ? '--%' : `${humidity}%`}</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate">
              {readingsPaused ? 'Locating...' : humidity >= 60 ? 'Moisture Trap' : 'Normal Vapor'}
            </span>
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
        externalForecast={hourlyForecast}
        onPeakRiskDetected={(peakHi) => {
          if (peakHi >= 45 && onTriggerEmergencyMode && riskLevel === 'Extreme') {
            // Peak risk telemetry hook
          }
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          ROW 3: MIDDLE 3-COLUMN SECTION (Central Prominent Live Map)
          1. Live Location & Station Influence (4 Stations IDW - 3 cols)
          2. Central Interactive Heat Risk Map (India & Villages - 6 cols)
          3. AI Safety Assistant & Contextual Recommendations (3 cols)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Column 1: Live Location & Station Influence (4 IDW Stations) */}
        <div className="col-span-12 xl:col-span-3 bg-[#131E3A] border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Live Location &amp; Synoptic Calibration</h3>
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
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-mono font-bold text-white">
                  {currentLat != null && currentLon != null
                    ? `${currentLat.toFixed(4)}° N, ${currentLon.toFixed(4)}° E`
                    : locationAcquiring
                    ? 'Acquiring coordinates...'
                    : 'Coordinates unavailable'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  {currentLat != null && currentLon != null
                    ? formatLocationConfidence(locationSource, accuracyM).shortTag
                    : locationAcquiring
                    ? 'Locating...'
                    : 'Unavailable'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {currentLat != null && currentLon != null
                  ? `NOAA GSOD Baseline (IDW k=4) • Place lookup: ${reverseSource}${
                      locationAcquiring ? ' • Refining GPS...' : ''
                    }`
                  : locationAcquiring
                  ? 'Polling GPS sensors and network IP geolocation...'
                  : 'Select a location or retry GPS tracking'}
              </p>
              {gpsMessage && (
                <div className="mt-2 text-[10px] text-emerald-400 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-800/60 flex items-center gap-1.5">
                  <Radio className="w-3 h-3" /> {gpsMessage}
                </div>
              )}
            </div>

            {/* Station Influence Breakdown Rows */}
            <div className="mt-4 space-y-3">
              {stationInfluences.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                  Select a city or retry GPS to compute IDW baseline distances.
                </div>
              ) : stationInfluences.map((st, idx) => (
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
            <span>Spatial Model: IDW (k=4, p=2.0)</span>
            <span className="text-emerald-400 font-medium">Sub-ms Latency</span>
          </div>
        </div>

        {/* Column 2: Central Interactive Heat Risk Map (India) */}
        <div className="col-span-12 xl:col-span-6 bg-[#131E3A] border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-md relative">
          <div>
            {/* Header with Layer Switchers */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Central Heat Risk Map (India &amp; Synoptic Network)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab && onNavigateTab('map')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-blue-600/25 text-blue-300 border border-blue-500/40 rounded-lg hover:bg-blue-600/45 transition flex items-center gap-1"
                >
                  <span>Live Map</span>
                </button>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('villages')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg hover:bg-emerald-600/50 transition flex items-center gap-1"
                >
                  <Building2 className="w-3 h-3" />
                  <span>Village Explorer</span>
                </button>
                <button
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="p-1 text-slate-400 hover:text-white rounded transition"
                  title="Expand Map"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Subtabs: Standard, Heat Risk, Clusters, Anomalies */}
            <div className="flex items-center gap-1.5 mt-3 text-[11px] font-medium overflow-x-auto pb-1">
              {[
                { id: 'standard', label: 'Standard Surface' },
                { id: 'heat_risk', label: 'Heat Risk Contours' },
                { id: 'clusters', label: 'Discovered Regimes' },
                { id: 'anomalies', label: 'Thermal Anomalies' },
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

            {/* SVG India Map Simulation with All 46 Stations Placed (Expanded Height) */}
            <div
              className={`mt-3 relative w-full ${
                isMapExpanded ? 'h-[440px]' : 'h-72 sm:h-80'
              } bg-[#0B132B]/80 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center select-none transition-all duration-300`}
            >
              
              <svg
                viewBox={getViewBox()}
                className="w-full h-full max-h-80 object-contain transition-all duration-300"
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

                {/* Active Station / Verified User Pin Tooltip Badge (omitted when unavailable) */}
                {activeCoords && !locationUnavailable && (() => {
                  const tipOnLeft = activeCoords.x > 220;
                  const rectX = tipOnLeft ? -144 : 8;
                  const textX = tipOnLeft ? -136 : 16;
                  return (
                    <g transform={`translate(${activeCoords.x}, ${activeCoords.y})`}>
                      <circle cx="0" cy="0" r="10" fill="#3B82F6" opacity="0.35" className="animate-pulse" />
                      <circle cx="0" cy="0" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                      <rect x={rectX} y="-18" width="136" height="30" rx="6" fill="#0B132B" stroke="#3B82F6" strokeWidth="1" />
                      <text x={textX} y="-3" fill="#FFFFFF" fontSize="9.5" fontWeight="bold">
                        {locationName.split(',')[0].slice(0, 18)}
                      </text>
                      <text x={textX} y="8" fill="#FBBF24" fontSize="9" fontWeight="medium">
                        {riskLevel} ({tempC}°C)
                      </text>
                    </g>
                  );
                })()}
              </svg>

              {!activeCoords && locationAcquiring && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0B132B]/90 border border-cyan-500/40 text-[11px] font-semibold text-cyan-200 flex items-center gap-1.5 shadow z-20">
                  <Radio className="w-3 h-3 text-cyan-400 animate-ping" />
                  <span>Acquiring live pin...</span>
                </div>
              )}

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

            {/* Quick Explore All India Villages Banner */}
            <div className="mt-3 p-2.5 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 rounded-xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-200 truncate">
                  Explore continuous IDW heat risk for <strong>787 Districts</strong> &amp; <strong>~650,000 Villages</strong>
                </span>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('villages')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow transition shrink-0 flex items-center gap-1"
              >
                <span>Browse</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
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

        {/* Column 3: AI Safety Assistant & Localized Recommendations */}
        <div className="col-span-12 xl:col-span-3 space-y-4 flex flex-col justify-between">
          
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
                placeholder="Ask any question for any city, village, or state..."
                className="w-full bg-[#0B132B] border border-slate-700/80 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-inner"
              />
              <button
                type="submit"
                aria-label="Submit query to AI Safety Assistant"
                className="absolute right-1.5 p-1 text-blue-400 hover:text-white rounded-lg transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Dynamic Quick Prompt Chips (Demonstrates Universal Scope & Locations) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
              {[
                'How hot is Jaipur today?',
                'Can I play cricket at 2 PM?',
                'Baby stroller precautions',
                'Worker rest schedule',
                'Traditional cooling drinks',
                'Compare Delhi vs Mumbai',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipQuery(chip)}
                  className="p-1.5 text-left bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 rounded-lg transition border border-slate-700/60 leading-tight truncate hover:text-white"
                  title={chip}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Inline AI Response Bubble */}
            {isChatThinking && (
              <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-300 flex items-center gap-2 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Resolving location & analyzing biometeorology...</span>
              </div>
            )}
            {chatResponse && !isChatThinking && (
              <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-800/70 text-xs text-slate-200 leading-relaxed space-y-2 max-h-72 overflow-y-auto shadow-inner">
                <div className="flex items-center justify-between text-cyan-400 text-[10px] font-semibold border-b border-blue-900/60 pb-1">
                  <span className="flex items-center gap-1 font-bold">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    HeatShield Universal Advisory
                  </span>
                  <button
                    onClick={() => setChatResponse(null)}
                    className="text-slate-400 hover:text-slate-200 text-[9px] uppercase tracking-wider font-semibold"
                  >
                    Clear
                  </button>
                </div>
                <div className="whitespace-pre-line text-xs leading-relaxed text-slate-200">
                  {chatResponse}
                </div>
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
            <span className="text-[10px] font-semibold text-slate-400">
              {hourlyForecast?.is_live ? 'Open-Meteo + Diurnal' : 'Offline Diurnal Model'}
            </span>
          </div>

          {/* Dynamic SVG Line Chart with "Now" marker */}
          {locationUnavailable ? (
            <div className="h-36 flex items-center justify-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800 px-4 text-center">
              Select a location or grant GPS access to view the 24-hour thermal curve.
            </div>
          ) : (
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
          )}
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
                  {locationUnavailable
                    ? 'Select a location or grant GPS access for local thermal advisory.'
                    : `Ambient ${tempC}°C (Feels like ${feelsLikeC}°C) in ${locationName}.`}
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
                  {locationUnavailable
                    ? 'Maintain hydration! Humidity updates once a location is set.'
                    : `Drink water, stay cool! Current humidity is ${humidity}%.`}
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
          <span className={`w-2 h-2 rounded-full ${isLiveWeather ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>
            {isLiveWeather && formattedObservedTime
              ? `Live observation: ${formattedObservedTime} | NOAA Baseline Ready | v2.0.0`
              : `Offline IDW Baseline | Synced: ${currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} | v2.0.0`}
          </span>
        </div>
      </footer>

    </div>
  );
};
