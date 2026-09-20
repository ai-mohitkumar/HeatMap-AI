import React, { useState } from 'react';
import { MapPin, Radio, ChevronRight } from 'lucide-react';

export interface StationInfluenceItem {
  stationId: string;
  name: string;
  code: string;
  distanceKm: number;
  tempC: number;
  weightPct: number;
  color: string;
}

interface MobileIDWCardProps {
  currentLat: number;
  currentLon: number;
  accuracyM?: number;
  contributingStations: StationInfluenceItem[];
  onTrackMove: () => void;
  isTracking?: boolean;
  gpsStatusMessage?: string | null;
  onSelectStation: (stationId: string) => void;
}

export const MobileIDWCard: React.FC<MobileIDWCardProps> = ({
  currentLat,
  currentLon,
  accuracyM = 50,
  contributingStations,
  onTrackMove,
  isTracking = false,
  gpsStatusMessage,
  onSelectStation
}) => {
  const [selectedStation, setSelectedStation] = useState<StationInfluenceItem | null>(null);

  return (
    <div className="rounded-2xl bg-[#0F172E] border border-slate-800 p-4 shadow-lg space-y-3.5">
      {/* Location Header & GPS Accuracy */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>Your Exact Coordinates</span>
          </div>
          <div className="text-sm font-mono font-bold text-white mt-1">
            {currentLat.toFixed(4)}° N, {currentLon.toFixed(4)}° E
          </div>
          <span className="inline-block mt-0.5 text-[10px] text-slate-400 font-medium">
            Accuracy: ±{accuracyM} m • Continuous IDW (k=4, p=2.0)
          </span>
        </div>

        <button
          onClick={onTrackMove}
          disabled={isTracking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold transition disabled:opacity-50"
        >
          <Radio className={`w-3.5 h-3.5 ${isTracking ? 'animate-ping' : ''}`} />
          <span>{isTracking ? 'Locating...' : 'Track Move'}</span>
        </button>
      </div>

      {gpsStatusMessage && (
        <div className="px-3 py-2 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
          <span className="font-medium">{gpsStatusMessage}</span>
        </div>
      )}

      {/* 4-Station IDW Influence Breakdown */}
      <div className="space-y-2 border-t border-slate-800/80 pt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          <span>4 Contributing NOAA Stations</span>
          <span>Influence %</span>
        </div>

        <div className="space-y-2">
          {contributingStations.map((st) => {
            const isHighlighted = selectedStation?.stationId === st.stationId;

            return (
              <div
                key={st.stationId}
                onClick={() => {
                  setSelectedStation(isHighlighted ? null : st);
                }}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isHighlighted
                    ? 'bg-blue-950/40 border-blue-500'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                    <span className="font-bold text-white">{st.name}</span>
                    <span className="text-[10px] text-slate-400">({st.distanceKm} km)</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-slate-200">{st.tempC}°C</span>
                    <span className="text-xs font-mono font-bold text-blue-300 w-10 text-right">
                      {st.weightPct}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(st.weightPct, 100)}%`,
                      backgroundColor: st.color
                    }}
                  />
                </div>

                {/* Expanded Station Inspector on Tap */}
                {isHighlighted && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Station ID: <code className="text-amber-300">{st.stationId}</code>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStation(st.stationId);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition flex items-center gap-1"
                    >
                      <span>Focus Station</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
