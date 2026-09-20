import React from 'react';
import { AlertTriangle, ShieldCheck, ChevronRight, Clock, Droplet, SunMedium } from 'lucide-react';

interface MobilePeakRiskCardProps {
  peakWindow?: string;
  riskLevel: string;
  onViewSafetyPlan: () => void;
}

export const MobilePeakRiskCard: React.FC<MobilePeakRiskCardProps> = ({
  peakWindow = '12:30 PM – 3:30 PM',
  riskLevel,
  onViewSafetyPlan
}) => {
  const isElevated = riskLevel.toLowerCase() === 'high' || riskLevel.toLowerCase() === 'extreme';

  return (
    <div
      className={`rounded-2xl border p-4 shadow-lg transition ${
        isElevated
          ? 'bg-gradient-to-r from-rose-950/70 via-[#201326] to-[#121A33] border-rose-500/40'
          : 'bg-gradient-to-r from-amber-950/50 via-[#1C182A] to-[#121A33] border-amber-500/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl ${
              isElevated ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                ⚠️ Peak Thermal Risk Window
              </span>
            </div>
            <div className="text-base font-extrabold text-amber-400 font-mono flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{peakWindow}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-300 space-y-1.5 border-t border-slate-800/80 pt-2.5">
        <div className="flex items-center gap-2 text-slate-200">
          <Droplet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Stay hydrated — drink 250ml electrolyte water every 25 min</span>
        </div>
        <div className="flex items-center gap-2 text-slate-200">
          <SunMedium className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Avoid direct unshaded sunlight during peak radiant flux</span>
        </div>
      </div>

      <button
        onClick={onViewSafetyPlan}
        className="mt-3.5 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-300" />
        <span>View Personalized Safety Plan</span>
        <ChevronRight className="w-4 h-4 ml-0.5" />
      </button>
    </div>
  );
};
