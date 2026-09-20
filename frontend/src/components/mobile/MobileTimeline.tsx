import React, { useState } from 'react';
import { Clock, Droplets, Wind, ShieldCheck } from 'lucide-react';

interface TimelinePeriod {
  time: string;
  hour: number;
  tempC: number;
  heatIndexC: number;
  humidityPct: number;
  windKmh: number;
  risk: 'Comfortable' | 'Increasing' | 'Moderate' | 'High Risk' | 'Extreme Risk' | string;
  riskColor: string;
  dotColor: string;
  advice: string;
}

interface MobileTimelineProps {
  baseTempC: number;
  baseHeatIndexC: number;
  baseHumidity: number;
  baseWind: number;
}

export const MobileTimeline: React.FC<MobileTimelineProps> = ({
  baseTempC,
  baseHeatIndexC,
  baseHumidity,
  baseWind
}) => {
  // Generate realistic diurnal thermal trajectory relative to current base
  const periods: TimelinePeriod[] = [
    {
      time: '08:00 AM',
      hour: 8,
      tempC: Math.round((baseTempC - 6.0) * 10) / 10,
      heatIndexC: Math.round((baseHeatIndexC - 7.5) * 10) / 10,
      humidityPct: Math.min(baseHumidity + 18, 92),
      windKmh: Math.max(baseWind - 2, 6),
      risk: 'Comfortable',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      dotColor: 'bg-emerald-400',
      advice: 'Optimal morning window for outdoor jogging, field labor, and market errands.'
    },
    {
      time: '10:00 AM',
      hour: 10,
      tempC: Math.round((baseTempC - 2.5) * 10) / 10,
      heatIndexC: Math.round((baseHeatIndexC - 3.0) * 10) / 10,
      humidityPct: Math.min(baseHumidity + 8, 85),
      windKmh: baseWind,
      risk: 'Increasing',
      riskColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      dotColor: 'bg-amber-400',
      advice: 'Solar elevation increasing. Apply sunscreen (SPF 50+) and carry chilled water.'
    },
    {
      time: '12:00 PM',
      hour: 12,
      tempC: Math.round((baseTempC + 1.2) * 10) / 10,
      heatIndexC: Math.round((baseHeatIndexC + 2.0) * 10) / 10,
      humidityPct: Math.max(baseHumidity - 6, 38),
      windKmh: baseWind + 3,
      risk: 'Moderate',
      riskColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      dotColor: 'bg-orange-400',
      advice: 'Pre-peak radiation. Begin mandatory rest rotations for outdoor workers.'
    },
    {
      time: '01:00 PM',
      hour: 13,
      tempC: Math.round((baseTempC + 3.5) * 10) / 10,
      heatIndexC: Math.round((baseHeatIndexC + 5.0) * 10) / 10,
      humidityPct: Math.max(baseHumidity - 10, 32),
      windKmh: baseWind + 4,
      risk: 'High Risk',
      riskColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      dotColor: 'bg-rose-500',
      advice: 'PEAK RADIANT STRESS: Stay indoors under shade or fans. Avoid all direct sun transit.'
    },
    {
      time: '03:00 PM',
      hour: 15,
      tempC: Math.round((baseTempC + 3.0) * 10) / 10,
      heatIndexC: Math.round((baseHeatIndexC + 4.5) * 10) / 10,
      humidityPct: Math.max(baseHumidity - 8, 35),
      windKmh: baseWind + 2,
      risk: 'High Risk',
      riskColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      dotColor: 'bg-rose-500',
      advice: 'Sustained severe thermal envelope. Keep hydrated; check elders & infants.'
    },
    {
      time: '05:00 PM',
      hour: 17,
      tempC: Math.round((baseTempC - 0.5) * 10) / 10,
      heatIndexC: Math.round((baseHeatIndexC - 1.0) * 10) / 10,
      humidityPct: Math.min(baseHumidity + 4, 75),
      windKmh: baseWind,
      risk: 'Moderate',
      riskColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      dotColor: 'bg-orange-400',
      advice: 'Solar radiation declining, ambient temperature cooling down.'
    },
    {
      time: '08:00 PM',
      hour: 20,
      tempC: Math.round((baseTempC - 4.5) * 10) / 10,
      heatIndexC: Math.round((baseHeatIndexC - 5.5) * 10) / 10,
      humidityPct: Math.min(baseHumidity + 14, 88),
      windKmh: Math.max(baseWind - 3, 5),
      risk: 'Improving',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      dotColor: 'bg-emerald-400',
      advice: 'Evening cool recovery. Safe for leisure walks and outdoor ventilation.'
    }
  ];

  // Default selected period is midday (1:00 PM) or current nearest hour
  const currentH = new Date().getHours();
  const initialIndex = periods.findIndex((p) => p.hour >= currentH);
  const [selectedIdx, setSelectedIdx] = useState<number>(initialIndex >= 0 ? initialIndex : 3);

  const selected = periods[selectedIdx];

  return (
    <div className="rounded-2xl bg-[#0F172E] border border-slate-800 p-4 shadow-lg space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            Today's 24-Hour Timeline
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">Tap any hour</span>
      </div>

      {/* Hour Strip (Scrollable horizontally on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {periods.map((p, idx) => {
          const isSelected = selectedIdx === idx;

          return (
            <button
              key={p.time}
              onClick={() => setSelectedIdx(idx)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl min-w-[70px] border transition-all ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 shadow-md scale-105'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] font-mono text-slate-400">{p.time.split(' ')[0]}</span>
              <div className="flex items-center gap-1 my-1">
                <span className={`w-2 h-2 rounded-full ${p.dotColor}`} />
                <span className="text-xs font-black text-white">{p.tempC}°</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${p.riskColor}`}>
                {p.risk.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expanded Details Card for Selected Hour */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/60 space-y-2.5 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${selected.dotColor} animate-pulse`} />
            <span className="text-xs font-black text-white">{selected.time} Outlook</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${selected.riskColor}`}>
              {selected.risk}
            </span>
          </div>

          <div className="text-xs font-mono font-bold text-amber-400">
            {selected.tempC}°C <span className="text-slate-400 font-normal">({selected.heatIndexC}°C HI)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/60">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Humidity: <strong className="text-white">{selected.humidityPct}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/60">
            <Wind className="w-3.5 h-3.5 text-blue-400" />
            <span>Wind: <strong className="text-white">{selected.windKmh} km/h</strong></span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2 text-xs text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{selected.advice}</span>
        </div>
      </div>
    </div>
  );
};
