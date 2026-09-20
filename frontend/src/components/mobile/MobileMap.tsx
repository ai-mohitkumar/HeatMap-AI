import React, { useState } from 'react';
import { Shield, Maximize2, MapPin, X, ChevronRight } from 'lucide-react';
import { OFFLINE_STATIONS } from '../../utils/offlineEngine';

interface MobileMapProps {
  currentLat: number;
  currentLon: number;
  locationName: string;
  heatIndexC: number;
  riskLevel: string;
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const MobileMap: React.FC<MobileMapProps> = ({
  currentLat,
  currentLon,
  locationName,
  heatIndexC,
  riskLevel,
  selectedStationId,
  onSelectStation,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const [mapLayer, setMapLayer] = useState<'heat_risk' | 'clusters' | 'anomalies' | 'stations'>('heat_risk');
  const [inspectedStation, setInspectedStation] = useState<any | null>(null);
  const [inspectUserLocation, setInspectUserLocation] = useState<boolean>(false);

  // Project (lat, lon) to SVG (x, y) coordinates
  const project = (lat: number, lon: number) => {
    const x = ((lon - 68.0) / (97.0 - 68.0)) * 340 + 30;
    const y = ((37.0 - lat) / (37.0 - 8.0)) * 360 + 20;
    return { x, y };
  };

  const userPt = project(currentLat, currentLon);

  return (
    <div className={`rounded-2xl bg-[#0F172E] border border-slate-800 p-4 shadow-lg space-y-3.5 relative ${isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-[#090F1F] p-4 overflow-y-auto' : ''}`}>
      {/* Map Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            Interactive Heat Risk Map
          </h3>
        </div>

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            aria-label="Toggle fullscreen map"
          >
            {isFullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Layer Switcher Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
        {[
          { id: 'heat_risk', label: 'Heat Risk' },
          { id: 'clusters', label: 'Clusters' },
          { id: 'anomalies', label: 'Anomalies' },
          { id: 'stations', label: '46 Stations' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMapLayer(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
              mapLayer === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactive SVG India Canvas */}
      <div className={`relative w-full ${isFullscreen ? 'h-[62vh]' : 'h-64'} bg-[#080D1D] rounded-2xl border border-slate-800/90 overflow-hidden flex items-center justify-center select-none`}>
        <svg viewBox="0 0 400 420" className="w-full h-full max-h-96 object-contain">
          <defs>
            <linearGradient id="mobileHeatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#F97316" stopOpacity="0.8" />
              <stop offset="65%" stopColor="#EAB308" stopOpacity="0.75" />
              <stop offset="90%" stopColor="#10B981" stopOpacity="0.7" />
            </linearGradient>
            <filter id="thermalGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* India Boundary Contour */}
          <path
            d="M170 30 L200 45 L220 70 L210 100 L240 120 L270 140 L310 160 L310 200 L280 210 L250 230 L240 260 L220 290 L200 330 L190 380 L180 340 L160 290 L140 260 L130 220 L110 190 L120 150 L150 110 L160 70 Z"
            fill="url(#mobileHeatGradient)"
            filter="url(#thermalGlow)"
            stroke="#38BDF8"
            strokeWidth="1.2"
            opacity="0.9"
          />

          {/* Hotspot Blobs */}
          <circle cx="140" cy="140" r="38" fill="#EF4444" opacity="0.6" filter="url(#thermalGlow)" />
          <circle cx="165" cy="165" r="28" fill="#F97316" opacity="0.7" filter="url(#thermalGlow)" />
          <circle cx="230" cy="170" r="24" fill="#EAB308" opacity="0.5" filter="url(#thermalGlow)" />

          {/* 46 Synoptic Station Dots */}
          {OFFLINE_STATIONS.map((st) => {
            const pt = project(st.latitude, st.longitude);
            const isSelected = st.station_id === selectedStationId;

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
                className="cursor-pointer"
                onClick={() => {
                  setInspectUserLocation(false);
                  setInspectedStation(st);
                }}
              >
                {isSelected && (
                  <circle cx="0" cy="0" r="7" fill="#3B82F6" className="animate-ping" opacity="0.75" />
                )}
                <circle
                  cx="0" cy="0"
                  r={isSelected ? 5.5 : 3.5}
                  fill={dotColor}
                  stroke="#0B132B"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* User Location Marker (Tappable) */}
          <g
            transform={`translate(${userPt.x}, ${userPt.y})`}
            className="cursor-pointer"
            onClick={() => {
              setInspectedStation(null);
              setInspectUserLocation(true);
            }}
          >
            <circle cx="0" cy="0" r="10" fill="#3B82F6" opacity="0.3" className="animate-pulse" />
            <circle cx="0" cy="0" r="6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        </svg>

        {/* Legend Overlay at bottom left */}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 text-[9px] text-slate-300 flex items-center gap-2">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> You</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Stations</span>
        </div>
      </div>

      {/* Pop-up Inspector: Tapped User Location */}
      {inspectUserLocation && (
        <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-500/60 shadow-xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-white">Your Location ({locationName})</span>
            </div>
            <button
              onClick={() => setInspectUserLocation(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-900/80">
              <span className="text-[10px] text-slate-400 block">Heat Index</span>
              <span className="text-sm font-bold text-amber-400">{heatIndexC.toFixed(1)}°C</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80">
              <span className="text-[10px] text-slate-400 block">Thermal Risk</span>
              <span className="text-sm font-bold text-rose-400">{riskLevel}</span>
            </div>
          </div>
          <span className="text-[10px] text-blue-300 block">
            Synthesized from 4 nearest NOAA synoptic stations using Inverse Distance Weighting.
          </span>
        </div>
      )}

      {/* Pop-up Inspector: Tapped Station */}
      {inspectedStation && (
        <div className="p-3.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: inspectedStation.color }} />
              <div>
                <h4 className="text-xs font-black text-white">{inspectedStation.station_name}</h4>
                <span className="text-[10px] text-slate-400">ID: {inspectedStation.station_id}</span>
              </div>
            </div>
            <button
              onClick={() => setInspectedStation(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Temperature</span>
              <span className="text-sm font-bold text-white">{inspectedStation.temperature_c}°C</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Vulnerability</span>
              <span className="text-xs font-bold" style={{ color: inspectedStation.color }}>
                {inspectedStation.vulnerability_tier}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              onSelectStation(inspectedStation.station_id);
              setInspectedStation(null);
            }}
            className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1"
          >
            <span>Set As Active Station</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
