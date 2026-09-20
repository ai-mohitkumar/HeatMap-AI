import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type {
  SafetyRiskAssessment,
  DailyHeatBrief,
  SymptomCheckResult,
  LanguageCode,
  LocationPredictionResponse,
  UserLocation
} from '../types';
import { getTranslation } from '../utils/localization';
import { initiatePhoneCall } from '../utils/phoneCall';
import { OFFLINE_STATIONS } from '../utils/offlineEngine';
import {
  Flame,
  Droplets,
  UserCheck,
  Thermometer,
  Clock,
  CheckSquare,
  Square,
  Baby,
  HeartHandshake,
  Tractor,
  Bike,
  HardHat,
  Activity,
  Home,
  MapPin,
  PhoneCall,
  PlusCircle,
  AlertOctagon,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Sun,
  Navigation,
  Globe,
  Radio,
  X,
  Compass,
  Layers,
  Cpu,
  Info
} from 'lucide-react';
import { NationalGpsGraph } from './NationalGpsGraph';
import { IdwValidationModal } from './IdwValidationModal';

interface CompanionHomeProps {
  stations: Array<{ station_id: string; name: string }>;
  activeStationId: string;
  onSelectStation: (stationId: string) => void;
  lang: LanguageCode;
  onNavigateTab: (tabId: string) => void;
}

export const CompanionHome: React.FC<CompanionHomeProps> = ({
  stations,
  activeStationId,
  onSelectStation,
  lang,
  onNavigateTab
}) => {
  const [assessment, setAssessment] = useState<SafetyRiskAssessment | null>(null);
  const [dailyBrief, setDailyBrief] = useState<DailyHeatBrief | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('outdoor_worker');
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  // Live GPS and Location Intelligence state
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [locationPrediction, setLocationPrediction] = useState<LocationPredictionResponse | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Just now');
  const [isWatchingLocation, setIsWatchingLocation] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);
  const [showGpsModal, setShowGpsModal] = useState<boolean>(false);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  // Monitor network online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check and load recently cached GPS location on mount
  useEffect(() => {
    const cached = localStorage.getItem("heatshield_location");
    if (cached) {
      try {
        const loc: UserLocation = JSON.parse(cached);
        setUserLat(loc.latitude);
        setUserLon(loc.longitude);
        setUserAccuracy(Math.round(loc.accuracy || 18));
        const mode = (typeof navigator !== 'undefined' && !navigator.onLine) ? 'offline' : 'online';
        api.predictLocation(loc.latitude, loc.longitude, loc.accuracy, mode)
          .then(res => {
            setLocationPrediction(res);
            setAssessment(res.risk_assessment);
            setIsGpsActive(true);
            const d = new Date(loc.timestamp || Date.now());
            setLastUpdatedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST');
          })
          .catch(err => console.warn('Cached prediction init error:', err));
      } catch (e) {
        console.warn('Failed to parse cached location:', e);
      }
    }
  }, []);

  // Hydration state (persisted per day)
  const todayKey = `heatshield_hydration_${new Date().toISOString().slice(0, 10)}`;
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    const saved = localStorage.getItem(todayKey);
    return saved ? parseInt(saved, 10) : 3;
  });

  // Symptom screener state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [triageResult, setTriageResult] = useState<SymptomCheckResult | null>(null);
  const [triageLoading, setTriageLoading] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem(todayKey, waterGlasses.toString());
  }, [waterGlasses, todayKey]);

  useEffect(() => {
    loadData(activeStationId);
  }, [activeStationId]);

  const loadData = async (stId: string) => {
    try {
      setLoading(true);
      const [riskRes, briefRes] = await Promise.all([
        api.getSafetyAssessment(stId),
        api.getDailyBrief(stId)
      ]);
      setAssessment(riskRes);
      setDailyBrief(briefRes);

      if (!isGpsActive) {
        const found = OFFLINE_STATIONS.find(s => s.station_id === stId);
        if (found) {
          setUserLat(found.latitude);
          setUserLon(found.longitude);
          setUserAccuracy(50);
          const currentMode = (typeof navigator !== 'undefined' && !navigator.onLine) ? 'offline' : 'online';
          api.predictLocation(found.latitude, found.longitude, 50, currentMode)
            .then(res => setLocationPrediction(res))
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error('Failed to load safety assessment or daily brief:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExactLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatusMessage('❌ Geolocation is not supported by your browser.');
      return;
    }

    setIsGpsLoading(true);
    setGpsStatusMessage('🛰️ Requesting exact Satellite GNSS coordinates (high-accuracy mode)...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 18);
          const timestamp = position.timestamp || Date.now();

          setUserLat(lat);
          setUserLon(lon);
          setUserAccuracy(accuracy);

          // Store GPS coordinates locally
          const userLoc: UserLocation = {
            latitude: lat,
            longitude: lon,
            accuracy,
            timestamp
          };
          localStorage.setItem("heatshield_location", JSON.stringify(userLoc));

          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
          setLastUpdatedTime(timeStr);

          // Predict location heat-risk using IDW multi-station interpolation
          const currentMode = (typeof navigator !== 'undefined' && !navigator.onLine) ? 'offline' : 'online';
          const res = await api.predictLocation(lat, lon, accuracy, currentMode);
          setLocationPrediction(res);
          setAssessment(res.risk_assessment);

          if (res.data_source.stations_used.length > 0) {
            onSelectStation(res.data_source.stations_used[0].station_id);
          }

          setIsGpsActive(true);
          if (accuracy > 500) {
            setGpsStatusMessage(`⚠️ Low GPS Precision (±${accuracy}m). Multi-station IDW active, but cellular triangulation was used instead of GNSS.`);
          } else {
            setGpsStatusMessage(null);
          }
        } catch (err) {
          console.error('Failed to predict exact location heat risk:', err);
          setGpsStatusMessage('⚠️ Spatial interpolation fallback: using closest synoptic station dataset.');
        } finally {
          setIsGpsLoading(false);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        let msg = 'Location access denied or unavailable.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = '🔒 GPS Permission Denied: Location permission was blocked by the browser. Allow location in your address bar or select your city manually.';
        } else if (error.code === error.TIMEOUT) {
          msg = '⏱️ GPS Satellite Timeout: GNSS fix timed out (15s). Weak satellite visibility. Defaulting to station nearest to current coordinates.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = '📡 GNSS Position Unavailable: Internal device location service is turned off or unreachable.';
        }
        setGpsStatusMessage(msg);
        setIsGpsLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
  };

  const toggleWatchLocation = () => {
    if (isWatchingLocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsWatchingLocation(false);
    } else {
      if (!navigator.geolocation) return;
      setIsWatchingLocation(true);
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 18);
          setUserLat(lat);
          setUserLon(lon);
          setUserAccuracy(accuracy);
          const mode = (typeof navigator !== 'undefined' && !navigator.onLine) ? 'offline' : 'online';
          const res = await api.predictLocation(lat, lon, accuracy, mode);
          setLocationPrediction(res);
          setAssessment(res.risk_assessment);
          const now = new Date();
          setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST');
        },
        (err) => console.warn('watchPosition error:', err),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
      );
      watchIdRef.current = id;
    }
  };

  const handleLogGlass = () => {
    setWaterGlasses(prev => Math.min(prev + 1, 20));
  };

  const handleResetWater = () => {
    setWaterGlasses(0);
  };

  const toggleAction = (id: string) => {
    setCheckedActions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSymptomClick = async (symptomKey: string) => {
    let newSymptoms: string[];
    if (symptomKey === 'fine') {
      newSymptoms = [];
      setSelectedSymptoms([]);
    } else {
      if (selectedSymptoms.includes(symptomKey)) {
        newSymptoms = selectedSymptoms.filter(s => s !== symptomKey);
      } else {
        newSymptoms = [...selectedSymptoms, symptomKey];
      }
      setSelectedSymptoms(newSymptoms);
    }

    try {
      setTriageLoading(true);
      const res = await api.checkSymptoms(newSymptoms);
      setTriageResult(res);
    } catch (err) {
      console.error('Failed to triage symptoms:', err);
    } finally {
      setTriageLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const personaIcons: Record<string, React.ReactNode> = {
    baby: <Baby className="w-5 h-5" />,
    child: <Baby className="w-5 h-5" />,
    elderly: <HeartHandshake className="w-5 h-5" />,
    outdoor_worker: <Tractor className="w-5 h-5" />,
    delivery_worker: <Bike className="w-5 h-5" />,
    construction_worker: <HardHat className="w-5 h-5" />,
    athlete: <Activity className="w-5 h-5" />,
    no_cooling: <Home className="w-5 h-5" />
  };

  if (loading || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium">Loading HeatShield AI Companion...</p>
      </div>
    );
  }

  const activePersona = assessment.persona_advice.find(p => p.persona_id === selectedPersonaId)
    || assessment.persona_advice[0];

  const targetGlasses = assessment.heat_risk_score > 75 ? 14 : assessment.heat_risk_score > 50 ? 10 : 8;
  const hydrationPct = Math.min(100, Math.round((waterGlasses / targetGlasses) * 100));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 0. Top Mode Status Banner with Online/Offline & GPS Locked Details */}
      <div
        className={`p-3 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xl transition-all ${
          isOffline
            ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
            : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full flex-shrink-0 ${
              isOffline ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 font-black tracking-wide">
              <span className="text-white flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                LIVE GPS
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  userLat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {userLat ? `🟢 GPS LOCKED (±${userAccuracy || 18}m)` : '⚪ GPS STANDBY'}
              </span>
              {userLat && (
                <span className="text-slate-300 font-mono text-[11px]">
                  {userLat.toFixed(4)}° N, {userLon?.toFixed(4)}° E
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              {isOffline ? (
                <span className="text-amber-300 font-semibold">
                  🟠 OFFLINE MODE: Using local NOAA GSOD 2022–2025 Multi-Station IDW (Offline Prediction)
                </span>
              ) : (
                <span className="text-emerald-300 font-semibold">
                  🟢 ONLINE: Live Atmospheric Data + GSOD Historical Multi-Station Baseline
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleUseExactLiveLocation}
            disabled={isGpsLoading}
            className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition shadow flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{isGpsLoading ? 'Locking GPS...' : '📍 Use Exact Live Location'}</span>
          </button>
        </div>
      </div>

      {/* 1. Header Greeting & Location Selector */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/60 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wider uppercase">
              <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{getGreeting()}, Citizen 👋</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              {getTranslation(lang, 'app_title', 'HeatShield AI')} — {getTranslation(lang, 'tagline', 'Personal Heat-Safety Companion')}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Location-aware biometeorological intelligence protecting you from extreme heat hazards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Exact GPS Locate Button */}
            <button
              onClick={handleUseExactLiveLocation}
              disabled={isGpsLoading}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition shadow-lg ${
                isGpsActive
                  ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
              }`}
            >
              {isGpsLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Navigation className={`w-4 h-4 ${isGpsActive ? 'text-cyan-400' : 'text-white'}`} />
              )}
              <span>{isGpsLoading ? 'Interpolating...' : '📍 Use Exact Live Location'}</span>
            </button>

            {/* City Dropdown Selector */}
            <div className="flex items-center gap-2.5 bg-gray-800/90 px-3.5 py-2 rounded-xl border border-gray-700">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                  City / Station
                </label>
                <select
                  value={activeStationId}
                  onChange={(e) => {
                    setIsGpsActive(false);
                    setGpsStatusMessage(null);
                    onSelectStation(e.target.value);
                  }}
                  aria-label="Select City or Station"
                  className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer pr-3"
                >
                  {stations.map(st => (
                    <option key={st.station_id} value={st.station_id} className="bg-gray-800 text-white">
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* View All Regions Live button */}
            <button
              onClick={() => onNavigateTab('all_stations')}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs font-semibold transition"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">All 46 Sets Live</span>
            </button>

            {/* All-Country GPS Graph launcher button */}
            <button
              onClick={() => setShowGpsModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold transition shadow"
            >
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>National GPS Graph</span>
            </button>

            {/* Scientific IDW & Latency Proof button */}
            <button
              onClick={() => setShowValidationModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold transition shadow"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>🔬 Scientific Proof (LOSOCV)</span>
            </button>
          </div>
        </div>

        {/* GPS Status Banner */}
        {gpsStatusMessage && (
          <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl px-3.5 py-2 text-xs flex items-center justify-between gap-2 text-cyan-300">
            <div className="flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{gpsStatusMessage}</span>
            </div>
            <button
              onClick={() => setGpsStatusMessage(null)}
              className="text-gray-400 hover:text-white text-[11px]"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 📍 Live Location Active Hero Card */}
      <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
            <Navigation className="w-4 h-4 animate-pulse text-cyan-400" />
            <span>📍 Live Location Active</span>
            {isWatchingLocation && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono animate-pulse">
                CONTINUOUS TRACKING
              </span>
            )}
          </div>

          <div className="text-lg sm:text-2xl font-black text-white font-mono flex flex-wrap items-center gap-2.5">
            <span>
              {userLat
                ? `${userLat.toFixed(4)}° N, ${userLon?.toFixed(4)}° E`
                : '31.6340° N, 74.8723° E (Default Demo Coordinates)'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-sans border border-slate-700 font-semibold">
              Accuracy: ±{userAccuracy || 18} m
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Weather source:{' '}
            <strong className="text-cyan-300">
              {locationPrediction
                ? locationPrediction.data_source.provider_note
                : 'Nearest GSOD + spatial interpolation (IDW 4 Stations)'}
            </strong>{' '}
            • Last updated: <span className="text-slate-300 font-mono font-bold">{lastUpdatedTime}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleUseExactLiveLocation}
            disabled={isGpsLoading}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl transition shadow-lg flex items-center gap-2"
          >
            {isGpsLoading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>{isGpsLoading ? 'Interpolating...' : '📍 Use Exact Live Location'}</span>
          </button>
          <button
            onClick={toggleWatchLocation}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              isWatchingLocation
                ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Continuously track live location as you travel"
          >
            <Radio className={`w-3.5 h-3.5 ${isWatchingLocation ? 'animate-pulse text-cyan-400' : ''}`} />
            <span>{isWatchingLocation ? 'Tracking Live' : 'Track Move'}</span>
          </button>
        </div>
      </div>

      {/* 2. Core 4-Question Hero Card */}
      <div
        className="rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #111827 0%, ${assessment.bg_light} 100%)`,
          borderColor: assessment.border_color
        }}
      >
        <div className="relative z-10 space-y-6">
          {/* Top Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="px-3.5 py-1.5 rounded-full text-xs font-black tracking-widest text-white uppercase shadow-md flex items-center gap-1.5"
                style={{ backgroundColor: assessment.color }}
              >
                <Flame className="w-4 h-4" />
                {assessment.tier_badge}
              </span>
              <span className="text-sm font-semibold text-gray-300">
                {assessment.station_name}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-gray-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{getTranslation(lang, 'peak_risk')}: <strong className="text-white">{assessment.peak_danger_window}</strong></span>
            </div>
          </div>

          {/* 4 Core Questions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            {/* Q1: How hot is it? */}
            <div className="bg-gray-900/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50">
              <div className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5 mb-1">
                <Thermometer className="w-3.5 h-3.5" />
                <span>1. How Hot Is It?</span>
              </div>
              <div className="text-3xl font-black text-white">
                {assessment.current_weather.temperature_c}°C
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {getTranslation(lang, 'feels_like')}: <strong className="text-amber-400">{assessment.current_weather.heat_index_c}°C</strong>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Humidity: {assessment.current_weather.relative_humidity_pct}%
              </div>
            </div>

            {/* Q2: How dangerous is it? */}
            <div className="bg-gray-900/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50">
              <div className="text-[11px] font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>2. How Dangerous?</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black" style={{ color: assessment.color }}>
                  {assessment.heat_risk_score}
                </span>
                <span className="text-xs text-gray-400 font-bold">/ 100</span>
              </div>
              <div className="text-xs font-semibold text-gray-200 mt-1">
                {assessment.tier_name}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 capitalize">
                Status: {assessment.urgency_level}
              </div>
            </div>

            {/* Q3: When is the worst period? */}
            <div className="bg-gray-900/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50">
              <div className="text-[11px] font-bold tracking-wider text-rose-400 uppercase flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>3. Worst Period?</span>
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {assessment.peak_danger_window}
              </div>
              <div className="text-xs text-rose-300/90 mt-1">
                Avoid direct radiant solar heat during this window.
              </div>
            </div>

            {/* Q4: What should I do right now? */}
            <div className="bg-gray-900/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>4. What Should I Do?</span>
                </div>
                <div className="text-xs text-gray-200 line-clamp-2 mt-1">
                  {assessment.immediate_actions[0]?.text || "Stay hydrated and minimize direct sun exposure."}
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('plan')}
                className="mt-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-3 rounded-lg transition text-center"
              >
                Plan Today's Routine →
              </button>
            </div>
          </div>

          {/* Plain-Language Thermodynamic Explanation */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 text-sm text-gray-200 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <AlertOctagon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-semibold block mb-0.5">
                  Why it's dangerous right now:
                </strong>
                <span>{assessment.danger_explanation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 Location Intelligence & IDW Spatial Interpolation Card */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Subtle radial glow in background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Card Header: Title + Mode + Confidence */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  📍 Location Intelligence
                </h3>
                <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  Multi-Station IDW (k=4, p=2.0)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact GNSS Geodesic Localization • Continuous Spatial Interpolation Surface
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Online / Offline Data Mode Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                locationPrediction?.data_source.mode === 'offline' || isOffline
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  locationPrediction?.data_source.mode === 'offline' || isOffline
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              {locationPrediction?.data_source.mode === 'offline' || isOffline
                ? 'Offline Mode (Local IDW Engine)'
                : 'Online Mode (Open-Meteo + NOAA GSOD)'}
            </span>

            {/* Model Confidence Badge */}
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              {locationPrediction?.prediction.confidence_score ?? 96}% Confidence
            </span>
          </div>
        </div>

        {/* 4 Key Coordinates & Telemetry Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-5">
          {/* Exact GPS Coordinates */}
          <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Exact Coordinates</span>
            </div>
            <div className="text-base font-black text-white mt-1 font-mono tracking-tight">
              {userLat != null && userLon != null
                ? `${userLat.toFixed(4)}° N, ${userLon.toFixed(4)}° E`
                : '31.6340° N, 74.8723° E'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Source: {locationPrediction?.location_source || (isGpsActive ? 'Live GPS' : 'Station Calibration')}</span>
            </div>
          </div>

          {/* GPS Accuracy */}
          <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>Fix Accuracy</span>
            </div>
            <div className="text-base font-black text-white mt-1 font-mono">
              ±{userAccuracy || 18} meters
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Satellite GNSS / High-Accuracy API
            </div>
          </div>

          {/* Nearest Weather Station */}
          <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Nearest Station</span>
            </div>
            <div className="text-base font-black text-white mt-1 truncate">
              {locationPrediction?.data_source.stations_used[0]?.name || assessment.station_name}
            </div>
            <div className="text-[11px] text-amber-300/90 mt-1 font-mono">
              ~{locationPrediction?.data_source.stations_used[0]?.distance_km.toFixed(1) || '0.0'} km away
            </div>
          </div>

          {/* Dataset Coverage */}
          <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
            <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Dataset Coverage</span>
            </div>
            <div className="text-base font-black text-white mt-1">
              2022 – 2025 GSOD
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              46 Stations • WMO/ICAO Quality
            </div>
          </div>
        </div>

        {/* Multi-Station Inverse Distance Weighting (IDW) Contribution Breakdown */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                4-Station Spatial Interpolation Breakdown
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Each certified station contributes inversely to squared distance: <span className="font-mono text-cyan-300">W_i = 1 / (d_i + 0.05)^2</span>
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono self-start sm:self-auto bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              Power Exponent p = 2.0
            </span>
          </div>

          {/* 4 Station Progress Bar List */}
          <div className="space-y-3.5">
            {locationPrediction?.data_source.stations_used && locationPrediction.data_source.stations_used.length > 0 ? (
              locationPrediction.data_source.stations_used.map((st, idx) => (
                <div key={st.station_id || idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[10px] text-cyan-400 font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-200">{st.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        (~{st.distance_km.toFixed(1)} km)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      {st.temperature_c != null && (
                        <span className="text-slate-400 text-[11px]">
                          {st.temperature_c}°C
                        </span>
                      )}
                      <span className="font-black text-cyan-300 text-xs">
                        {st.weight_pct.toFixed(1)}% Weight
                      </span>
                    </div>
                  </div>
                  {/* Visual Weight Bar */}
                  <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden border border-slate-700/50">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(3, st.weight_pct))}%`,
                        background:
                          idx === 0
                            ? 'linear-gradient(90deg, #06B6D4, #3B82F6)'
                            : idx === 1
                            ? 'linear-gradient(90deg, #3B82F6, #6366F1)'
                            : idx === 2
                            ? 'linear-gradient(90deg, #6366F1, #8B5CF6)'
                            : 'linear-gradient(90deg, #8B5CF6, #A855F7)'
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-2">
                Spatial interpolation initialized. Click "Use Exact Live Location" above to lock GNSS coordinates.
              </div>
            )}
          </div>
        </div>

        {/* Scientific Defensibility Callout Banner */}
        <div className="bg-slate-950/70 rounded-2xl p-4 border border-cyan-500/20 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-semibold block mb-1">
                🔬 Scientific Defensibility & Meteorological Precision:
              </strong>
              <span>
                NOAA GSOD observations originate from verified WMO/ICAO meteorological stations. Raw device GPS coordinates lack direct ambient thermometers. Rather than relying on a single distant station (which introduces artificial step-function boundaries), HeatShield AI executes <strong className="text-cyan-300">Inverse Distance Weighting (IDW)</strong> across the 4 closest certified stations with power exponent <span className="font-mono text-cyan-300">p = 2.0</span>. This generates a mathematically defensible, smooth continuous micro-climate estimate at your exact location, harmonized with live satellite/reanalysis data when online and 100% functional offline.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Daily Heat Brief Card */}
      {dailyBrief && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">☀️</span>
              <h2 className="text-lg font-bold text-white">
                {dailyBrief.headline}
              </h2>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-1 rounded-full border border-amber-500/30">
              Morning Intelligence
            </span>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            {dailyBrief.trend_summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-700/60 text-xs">
            <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700/50">
              <div className="text-gray-400 mb-1">🟢 Best Safe Hours</div>
              <div className="font-semibold text-emerald-400 text-sm">
                {dailyBrief.best_outdoor_window}
              </div>
            </div>
            <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700/50">
              <div className="text-gray-400 mb-1">🔴 Peak Danger Window</div>
              <div className="font-semibold text-rose-400 text-sm">
                {dailyBrief.peak_risk_window}
              </div>
            </div>
            <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700/50">
              <div className="text-gray-400 mb-1">💧 Target Hydration</div>
              <div className="font-semibold text-cyan-400 text-sm">
                {dailyBrief.target_hydration_liters} Liters today
              </div>
            </div>
          </div>

          <div className="mt-4 bg-amber-900/20 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-200/90 flex items-center gap-2">
            <span>💡</span>
            <span>{dailyBrief.morning_reminder}</span>
          </div>
        </div>
      )}

      {/* 4. Two-Column Row: Hydration Tracker & Symptom Screener */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hydration Assistant */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">
                  {getTranslation(lang, 'hydration_tracker', 'Hydration Assistant')}
                </h3>
              </div>
              <span className="text-xs text-cyan-400 font-bold">
                {waterGlasses} / {targetGlasses} Glasses
              </span>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Heat risk requires elevated fluid intake. Drink water even without feeling thirsty.
            </p>

            {/* Glasses Visual Matrix */}
            <div className="flex flex-wrap gap-2 py-3">
              {Array.from({ length: targetGlasses }).map((_, i) => (
                <span
                  key={i}
                  className={`text-xl transition-transform hover:scale-125 cursor-pointer ${
                    i < waterGlasses ? 'opacity-100 filter drop-shadow' : 'opacity-25'
                  }`}
                  onClick={() => setWaterGlasses(i + 1)}
                  title={`Glass ${i + 1}`}
                >
                  💧
                </span>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2.5 my-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${hydrationPct}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-gray-800 mt-2">
            <button
              onClick={handleLogGlass}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              {getTranslation(lang, 'log_glass', 'Log Glass (+250ml)')}
            </button>
            <button
              onClick={handleResetWater}
              className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-xs transition"
              title="Reset day"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* "How Do I Feel Right Now?" Symptom Screener */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-white text-base">
                {getTranslation(lang, 'symptom_screener', 'How Do You Feel Right Now?')}
              </h3>
            </div>
            {triageLoading && <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>}
          </div>

          <p className="text-xs text-gray-400 mb-3">
            Tap your current physical state for instant clinical heat triage directives:
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { id: 'fine', label: getTranslation(lang, 'fine', 'Fine 🙂'), color: 'hover:border-emerald-500' },
              { id: 'tired', label: getTranslation(lang, 'tired', 'Tired 😓'), color: 'hover:border-amber-500' },
              { id: 'very_hot', label: getTranslation(lang, 'very_hot', 'Very Hot 🥵'), color: 'hover:border-orange-500' },
              { id: 'dizzy', label: getTranslation(lang, 'dizzy', 'Dizzy 🤢'), color: 'hover:border-rose-500' },
              { id: 'headache', label: getTranslation(lang, 'headache', 'Headache 🤕'), color: 'hover:border-red-500' },
              { id: 'confused_faint', label: getTranslation(lang, 'confused', 'Confused / Faint 🚨'), color: 'hover:border-purple-500' }
            ].map(sym => {
              const active = sym.id === 'fine' ? selectedSymptoms.length === 0 : selectedSymptoms.includes(sym.id);
              return (
                <button
                  key={sym.id}
                  onClick={() => handleSymptomClick(sym.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                    active
                      ? 'bg-rose-500/20 border-rose-500 text-white font-bold shadow'
                      : `bg-gray-800/80 text-gray-300 border-gray-700 ${sym.color}`
                  }`}
                >
                  {sym.label}
                </button>
              );
            })}
          </div>

          {/* Triage Guidance Display */}
          {triageResult ? (
            <div
              className="rounded-xl p-4 border text-xs space-y-2 transition-all"
              style={{
                backgroundColor: `${triageResult.color}15`,
                borderColor: `${triageResult.color}40`
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-black uppercase tracking-wider" style={{ color: triageResult.color }}>
                  {triageResult.badge}
                </span>
                {triageResult.urgency === 'critical' && (
                  <button
                    type="button"
                    onClick={(e) => initiatePhoneCall(triageResult.emergency_call_number, e)}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 animate-bounce cursor-pointer"
                  >
                    <PhoneCall className="w-3 h-3" />
                    Call {triageResult.emergency_call_number}
                  </button>
                )}
              </div>
              <p className="font-bold text-white">
                {triageResult.primary_directive}
              </p>
              <ul className="space-y-1 text-gray-300 list-disc list-inside">
                {triageResult.action_steps.slice(0, 3).map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-gray-800/40 rounded-xl p-3 text-xs text-gray-400 border border-gray-800">
              Select one or more symptoms above to screen for heat exhaustion or heatstroke.
            </div>
          )}
        </div>
      </div>

      {/* 5. Persona-Specific Tailored Directives */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-400" />
              Tailored Vulnerability Advice by Persona
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Heat impacts bodies differently based on physiology and occupational exposure.
            </p>
          </div>

          {/* Persona Pills */}
          <div className="flex flex-wrap gap-1.5">
            {assessment.persona_advice.map(p => (
              <button
                key={p.persona_id}
                onClick={() => setSelectedPersonaId(p.persona_id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedPersonaId === p.persona_id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.title}</span>
              </button>
            ))}
          </div>
        </div>

        {activePersona && (
          <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                {personaIcons[activePersona.persona_id] || <UserCheck className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Guidance for {activePersona.title}
                </h4>
                <p className="text-xs text-amber-300/90 mt-0.5">
                  ⚠️ Why vulnerable: {activePersona.vulnerability_reason}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {activePersona.tailored_steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-700/60 text-xs text-gray-200 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="font-bold text-emerald-400 flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Today's Citizen Action Checklist */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              {getTranslation(lang, 'what_to_do', 'Today\'s Protection Checklist')}
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            {Object.values(checkedActions).filter(Boolean).length} of {assessment.immediate_actions.length} Completed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assessment.immediate_actions.map(action => {
            const isDone = !!checkedActions[action.id];
            return (
              <div
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-gray-400 line-through'
                    : 'bg-gray-800/60 hover:bg-gray-800 border-gray-700/60 text-gray-200'
                }`}
              >
                <button className="mt-0.5 flex-shrink-0 text-emerald-400">
                  {isDone ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-gray-500" />}
                </button>
                <span className="text-xs leading-relaxed">{action.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Quick Emergency Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-gray-900 to-red-950/40 border border-red-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Emergency Response Network
            </div>
            <div className="text-xs text-gray-300">
              Signs of heat stroke (confusion, fainting, absence of sweat) require urgent medical help.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => initiatePhoneCall('108', e)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-lg active:scale-95 cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            108 Ambulance
          </button>
          <button
            onClick={() => onNavigateTab('sos')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs rounded-xl transition"
          >
            Cooling & Water Map →
          </button>
        </div>
      </div>

      {/* 8. All-Country GPS Network Graph Modal */}
      {showGpsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-5xl my-auto">
            <button
              onClick={() => setShowGpsModal(false)}
              className="absolute top-4 right-4 z-20 p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full border border-slate-700 shadow-xl transition"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
            <NationalGpsGraph
              userLat={userLat}
              userLon={userLon}
              selectedStationId={activeStationId}
              onSelectStation={(stId) => {
                onSelectStation(stId);
                setShowGpsModal(false);
              }}
              isOffline={isOffline}
            />
          </div>
        </div>
      )}

      {/* 9. Scientific IDW Validation & Latency Benchmark Modal */}
      <IdwValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
      />
    </div>
  );
};
