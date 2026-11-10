import React from 'react';
import { Sun, Droplets, Wind, MapPin, ChevronRight, AlertTriangle, Compass } from 'lucide-react';
import { formatLocationConfidence } from '../../utils/geolocationService';
import type { DataProvenanceType, LocationSourceType } from '../../types';

interface MobileHeatCardProps {
  locationName: string;
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windKmh: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme' | string;
  onOpenLocationPicker: () => void;
  onOpenRiskDetails?: () => void;
  onTrackMove?: () => void;
  locationUnavailable?: boolean;
  locationAcquiring?: boolean;
  locationErrorReason?: string | null;
  locationSource?: LocationSourceType;
  accuracyM?: number | null;
  weatherProvenance?: DataProvenanceType;
  weatherProvider?: string;
  observedAt?: string | null;
  weatherFallbackReason?: string | null;
}

function formatObservedTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const MobileHeatCard: React.FC<MobileHeatCardProps> = ({
  locationName,
  tempC,
  feelsLikeC,
  humidityPct,
  windKmh,
  riskLevel,
  onOpenLocationPicker,
  onOpenRiskDetails,
  onTrackMove,
  locationUnavailable = false,
  locationAcquiring = false,
  locationErrorReason,
  locationSource = 'hardware_gps',
  accuracyM,
  weatherProvenance = 'offline_estimate',
  weatherProvider = 'NOAA GSOD 2022–2025 IDW',
  observedAt,
  weatherFallbackReason
}) => {
  const confidence = formatLocationConfidence(locationSource, accuracyM);
  const obsTimeText = formatObservedTime(observedAt);

  if (locationAcquiring && locationSource === 'unavailable') {
    return (
      <div className="rounded-3xl bg-gradient-to-b from-[#131E3A] to-[#0D152D] border border-slate-700/80 p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
          <Compass className="w-4 h-4 animate-spin text-blue-400" />
          <span>Acquiring verified location &amp; weather...</span>
        </div>
        <div className="h-14 w-40 bg-slate-800/70 rounded-2xl animate-pulse" />
        <p className="text-xs text-slate-400">
          Checking device GPS sensors before querying weather observations. You can also select a city manually at any time.
        </p>
        <button
          type="button"
          onClick={onOpenLocationPicker}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition"
        >
          Select Location Manually
        </button>
      </div>
    );
  }

  if (locationUnavailable) {
    return (
      <div className="rounded-3xl bg-gradient-to-b from-amber-950/40 via-[#181A2E] to-[#0D152D] border border-amber-500/50 p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-sm font-black uppercase tracking-wide">Location Unavailable</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {locationErrorReason ||
            'GPS and network IP detection could not determine your current position. HeatShield never assumes a default city.'}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenLocationPicker}
            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
          >
            Select City / Village
          </button>
          {onTrackMove && (
            <button
              type="button"
              onClick={onTrackMove}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition"
            >
              Retry GPS
            </button>
          )}
        </div>
      </div>
    );
  }

  const normRisk = (riskLevel || 'Moderate').toLowerCase();

  const getRiskStyles = () => {
    switch (normRisk) {
      case 'extreme':
        return {
          bg: 'from-rose-950/80 via-[#1A1224] to-[#0D152D]',
          border: 'border-rose-500/50',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-500',
          textColor: 'text-rose-400',
          label: 'EXTREME HEAT RISK'
        };
      case 'high':
        return {
          bg: 'from-orange-950/80 via-[#1A1524] to-[#0D152D]',
          border: 'border-orange-500/50',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          dot: 'bg-orange-500',
          textColor: 'text-orange-400',
          label: 'HIGH HEAT RISK'
        };
      case 'moderate':
        return {
          bg: 'from-amber-950/60 via-[#181829] to-[#0D152D]',
          border: 'border-amber-500/40',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-500',
          textColor: 'text-amber-400',
          label: 'MODERATE RISK'
        };
      default:
        return {
          bg: 'from-emerald-950/60 via-[#101D2D] to-[#0D152D]',
          border: 'border-emerald-500/40',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-500',
          textColor: 'text-emerald-400',
          label: 'LOW HEAT RISK'
        };
    }
  };

  const riskStyle = getRiskStyles();

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-b ${riskStyle.bg} border ${riskStyle.border} p-6 shadow-2xl`}
    >
      {/* Subtle Radial Glow Behind Sun */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Top Location Bar & Accuracy Confidence Badge */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onOpenLocationPicker}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition group min-w-0"
        >
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="font-bold truncate max-w-[190px]">{locationName}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition shrink-0" />
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {locationAcquiring && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 animate-pulse">
              Refining GPS
            </span>
          )}
          <span
            title={confidence.detail}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
              confidence.isApproximate
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {confidence.shortTag}
          </span>
        </div>
      </div>

      {/* Center Main Stage: Weather Icon & Huge Temperature */}
      <div className="my-5 flex items-center justify-between">
        <div>
          {/* HUGE Temperature */}
          <div className="text-6xl sm:text-7xl font-black text-white tracking-tighter font-sans leading-none flex items-baseline">
            <span>{tempC.toFixed(1)}</span>
            <span className="text-3xl font-extrabold text-amber-400 ml-1">°C</span>
          </div>

          <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-2 flex items-center gap-2">
            <span>Feels like</span>
            <span className="font-bold text-amber-300 text-sm">{feelsLikeC.toFixed(1)}°C</span>
          </div>
        </div>

        {/* Ambient Animated Sun Icon */}
        <div className="relative p-4 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 shadow-inner">
          <Sun className="w-12 h-12 text-amber-400 animate-[spin_24s_linear_infinite]" />
        </div>
      </div>

      {/* 2-Column Mini Metrics: Humidity & Wind */}
      <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/80">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Humidity</span>
            <span className="text-sm font-bold text-white">{humidityPct}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <Wind className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Wind</span>
            <span className="text-sm font-bold text-white">{windKmh} km/h</span>
          </div>
        </div>
      </div>

      {/* High-Contrast Risk Tier Badge & Weather Provenance */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onOpenRiskDetails}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black tracking-wide uppercase transition ${riskStyle.badge}`}
        >
          <span className={`w-2 h-2 rounded-full ${riskStyle.dot} animate-ping`} />
          <span>{riskStyle.label}</span>
        </button>

        <span
          title={weatherFallbackReason || undefined}
          className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
            weatherProvenance === 'live_observation'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/35'
          }`}
        >
          {weatherProvenance === 'live_observation'
            ? `Live • ${weatherProvider}${obsTimeText ? ` • ${obsTimeText}` : ''}`
            : 'Offline IDW Estimate • NOAA Baseline'}
        </span>
      </div>
    </div>
  );
};
