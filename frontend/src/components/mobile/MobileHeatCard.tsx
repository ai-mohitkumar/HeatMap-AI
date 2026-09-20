import React from 'react';
import { Sun, Droplets, Wind, MapPin, ChevronRight } from 'lucide-react';

interface MobileHeatCardProps {
  locationName: string;
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windKmh: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme' | string;
  onOpenLocationPicker: () => void;
  onOpenRiskDetails?: () => void;
}

export const MobileHeatCard: React.FC<MobileHeatCardProps> = ({
  locationName,
  tempC,
  feelsLikeC,
  humidityPct,
  windKmh,
  riskLevel,
  onOpenLocationPicker,
  onOpenRiskDetails
}) => {
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

      {/* Top Location Bar */}
      <button
        onClick={onOpenLocationPicker}
        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition group"
      >
        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span className="font-bold truncate max-w-[240px]">{locationName}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
      </button>

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

      {/* High-Contrast Risk Tier Badge */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onOpenRiskDetails}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black tracking-wide uppercase transition ${riskStyle.badge}`}
        >
          <span className={`w-2 h-2 rounded-full ${riskStyle.dot} animate-ping`} />
          <span>{riskStyle.label}</span>
        </button>

        <span className="text-[11px] text-slate-400 font-medium">
          Continuous IDW Live
        </span>
      </div>
    </div>
  );
};
