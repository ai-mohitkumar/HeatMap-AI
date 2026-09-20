import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  Shield,
  Maximize2,
  MapPin,
  X,
  ChevronRight
} from 'lucide-react';
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

// Controller to guarantee Leaflet invalidates and centers on mobile
function MobileMapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    const t3 = setTimeout(() => map.invalidateSize(), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map]);

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
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
  const [viewMode, setViewMode] = useState<'leaflet' | 'radar'>('leaflet');
  const [mapLayer, setMapLayer] = useState<'heat_risk' | 'clusters' | 'anomalies' | 'stations'>('heat_risk');
  const [inspectedStation, setInspectedStation] = useState<any | null>(null);
  const [inspectUserLocation, setInspectUserLocation] = useState<boolean>(false);

  const centerLat = Number.isFinite(currentLat) && currentLat !== 0 ? currentLat : 22.5;
  const centerLon = Number.isFinite(currentLon) && currentLon !== 0 ? currentLon : 78.5;
  const mapCenter: [number, number] = [centerLat, centerLon];

  // Project (lat, lon) to SVG (x, y) coordinates for radar view
  const project = (lat: number, lon: number) => {
    const x = ((lon - 68.0) / (97.0 - 68.0)) * 340 + 30;
    const y = ((37.0 - lat) / (37.0 - 8.0)) * 360 + 20;
    return { x, y };
  };

  const userPt = project(centerLat, centerLon);

  return (
    <div
      className={`rounded-2xl bg-[#0F172E] border border-slate-800 p-4 shadow-lg space-y-3.5 relative ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-[#090F1F] p-4 overflow-y-auto' : ''
      }`}
    >
      {/* Map Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            Live Regional Heat Map
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setViewMode('leaflet')}
              className={`px-2 py-1 rounded font-bold transition ${
                viewMode === 'leaflet'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('radar')}
              className={`px-2 py-1 rounded font-bold transition ${
                viewMode === 'radar'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Radar
            </button>
          </div>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              aria-label="Toggle fullscreen map"
            >
              {isFullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
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
            type="button"
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

      {/* Map Display Container */}
      <div
        className={`relative w-full ${
          isFullscreen ? 'h-[68vh]' : 'h-72'
        } bg-[#080D1D] rounded-2xl border border-slate-800/90 overflow-hidden select-none`}
      >
        {viewMode === 'leaflet' ? (
          /* Live Interactive Leaflet Map */
          <MapContainer
            center={mapCenter}
            zoom={6}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MobileMapController center={mapCenter} zoom={6} />

            {/* User GPS Location Marker */}
            <CircleMarker
              center={[centerLat, centerLon]}
              radius={8}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: '#2563EB',
                fillOpacity: 1
              }}
              eventHandlers={{
                click: () => {
                  setInspectedStation(null);
                  setInspectUserLocation(true);
                }
              }}
            >
              <Popup>
                <div className="p-1 text-slate-900 font-sans text-xs">
                  <strong className="block text-blue-600 font-bold">Your Location</strong>
                  <span className="font-semibold text-slate-800">{locationName}</span>
                  <div className="mt-1 flex items-center justify-between text-[11px] gap-2">
                    <span>Heat Index: <strong>{heatIndexC.toFixed(1)}°C</strong></span>
                    <span className="font-bold text-rose-600">{riskLevel}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>

            {/* 46 Station Markers */}
            {OFFLINE_STATIONS.map((st) => {
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
                <CircleMarker
                  key={st.station_id}
                  center={[st.latitude, st.longitude]}
                  radius={isSelected ? 9 : 6}
                  pathOptions={{
                    color: isSelected ? '#3B82F6' : '#ffffff',
                    weight: isSelected ? 3 : 1.5,
                    fillColor: dotColor,
                    fillOpacity: 0.9
                  }}
                  eventHandlers={{
                    click: () => {
                      setInspectUserLocation(false);
                      setInspectedStation(st);
                    }
                  }}
                >
                  <Popup>
                    <div className="p-1 text-slate-900 font-sans text-xs min-w-[160px]">
                      <h4 className="font-bold text-slate-950 text-sm leading-tight">{st.station_name}</h4>
                      <p className="text-[10px] text-slate-500 mb-1.5">ID: {st.station_id}</p>
                      <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-50 p-1.5 rounded mb-2 border border-slate-200">
                        <div>Temp: <strong>{st.temperature_c}°C</strong></div>
                        <div>Heat Index: <strong>{st.heat_index_c}°C</strong></div>
                        <div className="col-span-2 font-bold" style={{ color: st.color }}>
                          {st.vulnerability_tier} Risk
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectStation(st.station_id);
                          setInspectedStation(null);
                        }}
                        className="w-full py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold"
                      >
                        Set As Active
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        ) : (
          /* SVG Thermal Radar View */
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

            {/* 46 Station Dots in SVG */}
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
                    cx="0"
                    cy="0"
                    r={isSelected ? 5.5 : 3.5}
                    fill={dotColor}
                    stroke="#0B132B"
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {/* User Location Marker in SVG */}
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
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 z-[1000] px-2.5 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-800 text-[10px] text-slate-300 flex items-center gap-2.5 shadow-md">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-500/30" /> You
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Stations
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            ({OFFLINE_STATIONS.length} live)
          </span>
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
              type="button"
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
              type="button"
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
            type="button"
            onClick={() => {
              onSelectStation(inspectedStation.station_id);
              setInspectedStation(null);
            }}
            className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Set As Active Station</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
