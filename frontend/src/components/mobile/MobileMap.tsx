import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, Circle, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  Shield,
  Maximize2,
  MapPin,
  X,
  ChevronRight,
  LocateFixed,
  Radio,
  Compass
} from 'lucide-react';
import { OFFLINE_STATIONS } from '../../utils/offlineEngine';
import { formatLocationConfidence } from '../../utils/geolocationService';
import { ResilientMapLayers, MapResizeObserver } from '../shared/ResilientMapLayers';
import { ErrorBoundary } from '../ErrorBoundary';
import type { LocationSourceType } from '../../types';

interface MobileMapProps {
  currentLat: number | null;
  currentLon: number | null;
  locationName: string;
  heatIndexC: number;
  riskLevel: string;
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  isFullscreen?: boolean;
  isTabView?: boolean;
  onToggleFullscreen?: () => void;
  locationUnavailable?: boolean;
  locationAcquiring?: boolean;
  accuracyM?: number | null;
  locationSource?: LocationSourceType;
  isTracking?: boolean;
  onTrackMove?: () => void;
  onOpenLocationPicker?: () => void;
}

// Synchronize center/zoom ONLY when coordinates, zoom, or explicit recenter nonce change
function MobileMapController({
  lat,
  lon,
  zoom,
  recenterNonce
}: {
  lat: number;
  lon: number;
  zoom: number;
  recenterNonce: number;
}) {
  const map = useMap();
  const prevTargetRef = useRef<{ lat: number; lon: number; zoom: number; nonce: number } | null>(null);

  useEffect(() => {
    const prev = prevTargetRef.current;
    if (
      !prev ||
      prev.lat !== lat ||
      prev.lon !== lon ||
      prev.zoom !== zoom ||
      prev.nonce !== recenterNonce
    ) {
      map.setView([lat, lon], zoom, { animate: prev !== null });
      prevTargetRef.current = { lat, lon, zoom, nonce: recenterNonce };
    }
  }, [lat, lon, zoom, recenterNonce, map]);

  return <MapResizeObserver />;
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
  isTabView = false,
  onToggleFullscreen,
  locationUnavailable = false,
  locationAcquiring = false,
  accuracyM = null,
  locationSource = 'unavailable',
  isTracking = false,
  onTrackMove,
  onOpenLocationPicker
}) => {
  const [viewMode, setViewMode] = useState<'leaflet' | 'radar'>('leaflet');
  const [mapLayer, setMapLayer] = useState<'heat_risk' | 'clusters' | 'anomalies' | 'stations'>('heat_risk');
  const [inspectedStation, setInspectedStation] = useState<any | null>(null);
  const [inspectUserLocation, setInspectUserLocation] = useState<boolean>(false);
  const [internalFullscreen, setInternalFullscreen] = useState<boolean>(false);
  const [recenterNonce, setRecenterNonce] = useState<number>(0);

  const effectiveFullscreen = isFullscreen || internalFullscreen;

  const hasVerifiedLocation =
    !locationUnavailable &&
    currentLat !== null &&
    currentLon !== null &&
    Number.isFinite(currentLat) &&
    Number.isFinite(currentLon) &&
    !(currentLat === 0 && currentLon === 0);

  // Use India geographic overview center ONLY for framing viewport when user location is unavailable
  const centerLat = hasVerifiedLocation ? (currentLat as number) : 22.5;
  const centerLon = hasVerifiedLocation ? (currentLon as number) : 78.5;
  const mapZoom = hasVerifiedLocation ? (accuracyM && accuracyM > 3000 ? 9 : 10) : 4;
  const confidence = formatLocationConfidence(locationSource, accuracyM);

  // Project (lat, lon) to SVG (x, y) coordinates for radar view
  const project = (lat: number, lon: number) => {
    const x = ((lon - 68.0) / (97.0 - 68.0)) * 340 + 30;
    const y = ((37.0 - lat) / (37.0 - 8.0)) * 360 + 20;
    return { x, y };
  };

  const userPt = hasVerifiedLocation
    ? project(currentLat as number, currentLon as number)
    : null;

  const containerHeightClass = effectiveFullscreen
    ? 'h-[70vh] min-h-[420px]'
    : isTabView
    ? 'h-[60vh] min-h-[380px]'
    : 'h-72 min-h-[288px]';

  const handleFullscreenClick = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      setInternalFullscreen((prev) => !prev);
    }
  };

  return (
    <div
      className={`rounded-2xl bg-[#0F172E] border border-slate-800 p-4 shadow-lg space-y-3.5 relative ${
        effectiveFullscreen ? 'fixed inset-0 z-50 rounded-none bg-[#090F1F] p-4 overflow-y-auto' : ''
      }`}
    >
      {/* Map Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-4 h-4 text-rose-400 shrink-0" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white truncate">
            Regional Heat &amp; Station Map
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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

          <button
            type="button"
            onClick={handleFullscreenClick}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            aria-label="Toggle fullscreen map"
          >
            {effectiveFullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Live Location Telemetry Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {hasVerifiedLocation ? (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 border border-white" />
            </span>
          ) : locationAcquiring ? (
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            {hasVerifiedLocation ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white truncate max-w-[160px]">
                  {locationName}
                </span>
                <span className="font-mono text-[10px] text-cyan-300">
                  ({(currentLat as number).toFixed(3)}°, {(currentLon as number).toFixed(3)}°)
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                    confidence.isApproximate
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                  }`}
                >
                  {confidence.shortTag}
                </span>
                {locationAcquiring && (
                  <span className="text-[9px] text-cyan-300 animate-pulse">Refining GPS...</span>
                )}
              </div>
            ) : locationAcquiring ? (
              <span className="text-cyan-200 font-semibold">Acquiring live GPS / IP coordinates...</span>
            ) : (
              <span className="text-amber-200 font-semibold">Live pin unavailable — tap GPS or City</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasVerifiedLocation && viewMode === 'leaflet' && (
            <button
              type="button"
              onClick={() => setRecenterNonce((n) => n + 1)}
              className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <LocateFixed className="w-3 h-3" />
              <span>Pin</span>
            </button>
          )}
          {onTrackMove && (
            <button
              type="button"
              onClick={onTrackMove}
              disabled={isTracking}
              className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <Radio className={`w-3 h-3 ${isTracking ? 'animate-ping' : ''}`} />
              <span>{isTracking ? 'Locating' : 'GPS'}</span>
            </button>
          )}
          {onOpenLocationPicker && (
            <button
              type="button"
              onClick={onOpenLocationPicker}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[10px] cursor-pointer"
            >
              City
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
        className={`relative w-full ${containerHeightClass} bg-[#070E21] rounded-2xl border border-slate-800/90 overflow-hidden select-none`}
      >
        {viewMode === 'leaflet' ? (
          <ErrorBoundary
            fallbackTitle="Interactive Map Fell Back Safely"
            fallbackMessage="Switch to Radar view or tap Reload Module to re-initialize the Leaflet canvas."
          >
            {/* Interactive Hybrid Online+Offline Leaflet Map */}
            <MapContainer
              center={[centerLat, centerLon]}
              zoom={mapZoom}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', borderRadius: '1rem', background: '#070E21' }}
            >
              <ResilientMapLayers compact={!isTabView && !effectiveFullscreen} />
              <MobileMapController
                lat={centerLat}
                lon={centerLon}
                zoom={mapZoom}
                recenterNonce={recenterNonce}
              />

              {/* 46 Station Markers rendered BEFORE User Pin so user remains on top */}
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

              {/* User Live Location Pin & Accuracy Ring (rendered AFTER stations so it stays prominent) */}
              {hasVerifiedLocation && (
                <>
                  {accuracyM != null && accuracyM >= 300 && (
                    <Circle
                      center={[currentLat as number, currentLon as number]}
                      radius={Math.min(accuracyM, 25000)}
                      pathOptions={{
                        color: '#38BDF8',
                        weight: 1.5,
                        dashArray: '5 5',
                        fillColor: '#38BDF8',
                        fillOpacity: 0.1
                      }}
                    />
                  )}
                  <CircleMarker
                    center={[currentLat as number, currentLon as number]}
                    radius={14}
                    pathOptions={{
                      color: '#38BDF8',
                      weight: 1.5,
                      fillColor: '#38BDF8',
                      fillOpacity: 0.28
                    }}
                  />
                  <CircleMarker
                    center={[currentLat as number, currentLon as number]}
                    radius={8}
                    pathOptions={{
                      color: '#ffffff',
                      weight: 2.5,
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
                      <div className="p-1 text-slate-900 font-sans text-xs min-w-[170px]">
                        <strong className="block text-blue-600 font-bold">Your Live Location</strong>
                        <span className="font-semibold text-slate-800 block">{locationName}</span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {(currentLat as number).toFixed(4)}° N, {(currentLon as number).toFixed(4)}° E
                        </span>
                        <div className="mt-1 flex items-center justify-between text-[11px] gap-2">
                          <span>Heat Index: <strong>{heatIndexC.toFixed(1)}°C</strong></span>
                          <span className="font-bold text-rose-600">{riskLevel}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {confidence.label} ({confidence.accuracyLabel})
                        </span>
                      </div>
                    </Popup>
                  </CircleMarker>
                </>
              )}
            </MapContainer>
          </ErrorBoundary>
        ) : (
          /* SVG Thermal Radar View */
          <svg viewBox="0 0 400 420" className="w-full h-full object-contain">
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

            {/* User Location Marker in SVG (only rendered when location is verified) */}
            {userPt && (
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
            )}
          </svg>
        )}

        {/* Recenter Button Overlay (Leaflet mode) */}
        {viewMode === 'leaflet' && (
          <button
            type="button"
            onClick={() => setRecenterNonce((n) => n + 1)}
            title={hasVerifiedLocation ? 'Recenter on your location' : 'Recenter India view'}
            aria-label="Recenter map"
            className="absolute bottom-10 right-2.5 z-[1000] p-2 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 shadow-lg transition cursor-pointer"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 z-[1000] px-2.5 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-800 text-[10px] text-slate-300 flex items-center gap-2.5 shadow-md">
          {hasVerifiedLocation ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-cyan-400/50 border border-white" />
              <span>You{locationAcquiring ? ' (Refining...)' : ''}</span>
            </span>
          ) : locationAcquiring ? (
            <span className="text-cyan-300 font-semibold animate-pulse">Locating you...</span>
          ) : (
            <span className="text-amber-300 font-semibold">No user pin</span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Stations
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            ({OFFLINE_STATIONS.length} NOAA baseline)
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
