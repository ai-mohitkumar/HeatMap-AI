import React, { useState, useEffect, useMemo } from 'react';
import type { StationLiveSummaryItem, AllStationsLiveResponse } from '../types';
import { api } from '../services/api';
import { OFFLINE_STATIONS, haversineDistanceKm, findNearestStationOffline } from '../utils/offlineEngine';

interface NationalGpsGraphProps {
  userLat?: number | null;
  userLon?: number | null;
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
  isOffline?: boolean;
}

export const NationalGpsGraph: React.FC<NationalGpsGraphProps> = ({
  userLat,
  userLon,
  selectedStationId,
  onSelectStation,
  isOffline: propIsOffline
}) => {
  const [stations, setStations] = useState<StationLiveSummaryItem[]>(OFFLINE_STATIONS);
  const [, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [activeStationId, setActiveStationId] = useState<string>(selectedStationId || '42182099999');
  const [viewMode, setViewMode] = useState<'network' | 'gradient'>('network');
  const [isOffline, setIsOffline] = useState<boolean>(
    propIsOffline ?? (typeof navigator !== 'undefined' ? !navigator.onLine : false)
  );

  // Monitor online/offline events
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

  // Fetch station live data from API with offline fallback
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res: AllStationsLiveResponse = await api.getAllStationsLive();
        if (isMounted && res && res.stations) {
          setStations(res.stations);
        }
      } catch {
        if (isMounted) {
          setStations(OFFLINE_STATIONS);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update active station if selectedStationId changes
  useEffect(() => {
    if (selectedStationId) {
      setActiveStationId(selectedStationId);
    }
  }, [selectedStationId]);

  // Find nearest station from userLat / userLon
  const nearestStationInfo = useMemo(() => {
    if (userLat != null && userLon != null) {
      return findNearestStationOffline(userLat, userLon);
    }
    return null;
  }, [userLat, userLon]);

  // If user GPS is available and activeStationId isn't explicitly chosen, default to nearest
  useEffect(() => {
    if (nearestStationInfo && !selectedStationId) {
      setActiveStationId(nearestStationInfo.nearest_station_id);
    }
  }, [nearestStationInfo, selectedStationId]);

  // Coordinate projection helper: India bounding box (approx 7.5°N - 37.5°N, 67.5°E - 97.5°E)
  const SVG_WIDTH = 840;
  const SVG_HEIGHT = 920;
  const PAD_X = 60;
  const PAD_Y = 55;
  const MIN_LON = 67.5;
  const MAX_LON = 97.5;
  const MIN_LAT = 7.5;
  const MAX_LAT = 37.5;

  const projectLon = (lon: number) => PAD_X + ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * (SVG_WIDTH - 2 * PAD_X);
  const projectLat = (lat: number) => SVG_HEIGHT - PAD_Y - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * (SVG_HEIGHT - 2 * PAD_Y);

  // Filtered stations list
  const filteredStations = useMemo(() => {
    return stations.filter(st => {
      const matchesSearch =
        st.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = selectedTier === 'ALL' || st.tier_badge.toUpperCase() === selectedTier.toUpperCase();
      return matchesSearch && matchesTier;
    });
  }, [stations, searchQuery, selectedTier]);

  // Active station data object
  const activeStation = useMemo(() => {
    return stations.find(s => s.station_id === activeStationId) || stations[0];
  }, [stations, activeStationId]);

  // Sorted stations by heat index for thermal gradient view
  const sortedByHeat = useMemo(() => {
    return [...stations].sort((a, b) => b.heat_index_c - a.heat_index_c);
  }, [stations]);

  // Distance from user to active station
  const userDistanceToActive = useMemo(() => {
    if (userLat != null && userLon != null && activeStation) {
      return haversineDistanceKm(userLat, userLon, activeStation.latitude, activeStation.longitude);
    }
    return null;
  }, [userLat, userLon, activeStation]);

  // Nearest station coordinates projected
  const nearestStationNode = useMemo(() => {
    if (!nearestStationInfo) return null;
    const target = stations.find(s => s.station_id === nearestStationInfo.nearest_station_id);
    if (!target) return null;
    return {
      station: target,
      x: projectLon(target.longitude),
      y: projectLat(target.latitude),
      distanceKm: nearestStationInfo.distance_km
    };
  }, [nearestStationInfo, stations]);

  // User coordinates projected
  const userNode = useMemo(() => {
    if (userLat == null || userLon == null) return null;
    // Clamp within visible map
    const cLon = Math.max(MIN_LON, Math.min(MAX_LON, userLon));
    const cLat = Math.max(MIN_LAT, Math.min(MAX_LAT, userLat));
    return {
      x: projectLon(cLon),
      y: projectLat(cLat),
      rawLat: userLat,
      rawLon: userLon
    };
  }, [userLat, userLon]);

  // 4-Station IDW Spatial Interpolation Mesh
  const idwMesh = useMemo(() => {
    if (userLat == null || userLon == null || !stations.length || !userNode) return null;
    const withDist = stations.map(s => ({
      station: s,
      dist: haversineDistanceKm(userLat, userLon, s.latitude, s.longitude)
    }));
    withDist.sort((a, b) => a.dist - b.dist);
    const top4 = withDist.slice(0, 4);
    const p = 2.0;
    const eps = 0.05;
    const rawWeights = top4.map(item => 1.0 / Math.pow(item.dist + eps, p));
    const sumW = rawWeights.reduce((a, b) => a + b, 0);

    const stationsWithWeights = top4.map((item, idx) => {
      const weightFraction = rawWeights[idx] / sumW;
      return {
        station: item.station,
        distanceKm: item.dist,
        weightFraction,
        weightPct: Math.round(weightFraction * 1000) / 10,
        x: projectLon(item.station.longitude),
        y: projectLat(item.station.latitude)
      };
    });

    // Sort vertices angularly around centroid to form a convex mesh polygon
    const centroidX = stationsWithWeights.reduce((acc, s) => acc + s.x, 0) / stationsWithWeights.length;
    const centroidY = stationsWithWeights.reduce((acc, s) => acc + s.y, 0) / stationsWithWeights.length;
    const sortedVertices = [...stationsWithWeights].sort((a, b) => {
      const angleA = Math.atan2(a.y - centroidY, a.x - centroidX);
      const angleB = Math.atan2(b.y - centroidY, b.x - centroidX);
      return angleA - angleB;
    });

    const polygonPoints = sortedVertices.map(v => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ');

    return {
      stations: stationsWithWeights,
      polygonPoints
    };
  }, [userLat, userLon, stations, userNode]);

  // Schematic regional network links between geographically close stations (for network topology)
  const networkEdges = useMemo(() => {
    const edges: Array<{ from: StationLiveSummaryItem; to: StationLiveSummaryItem; dist: number }> = [];
    // Connect each station to its 2 nearest geographic neighbors
    for (let i = 0; i < stations.length; i++) {
      const distances = stations
        .map((other, idx) => ({
          station: other,
          idx,
          dist: idx !== i ? haversineDistanceKm(stations[i].latitude, stations[i].longitude, other.latitude, other.longitude) : Infinity
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2);

      distances.forEach(d => {
        if (d.dist < 550) { // Limit max link distance to 550km
          edges.push({ from: stations[i], to: d.station, dist: d.dist });
        }
      });
    }
    return edges;
  }, [stations]);

  // National stats summary
  const nationalStats = useMemo(() => {
    if (!stations.length) return { meanTemp: 0, meanHeatIndex: 0, maxStation: '', maxHI: 0 };
    const meanTemp = Math.round((stations.reduce((acc, s) => acc + s.temperature_c, 0) / stations.length) * 10) / 10;
    const meanHeatIndex = Math.round((stations.reduce((acc, s) => acc + s.heat_index_c, 0) / stations.length) * 10) / 10;
    const hottest = [...stations].sort((a, b) => b.heat_index_c - a.heat_index_c)[0];
    return {
      meanTemp,
      meanHeatIndex,
      maxStation: hottest ? hottest.station_name : 'N/A',
      maxHI: hottest ? hottest.heat_index_c : 0
    };
  }, [stations]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 text-xl">
              🛰️
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                All-Country GPS Network Graph
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  46 Stations
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Real-Time Geodesic Vector Mesh • Satellite GNSS Localization • 100% Offline Capable
              </p>
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Offline / Online Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              isOffline
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOffline ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            {isOffline ? '100% Offline (Local Satellite DB)' : 'Connected Live Sync'}
          </div>

          {/* User GPS Status */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              userNode
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${userNode ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
            {userNode
              ? `GPS: ${userLat?.toFixed(2)}°N, ${userLon?.toFixed(2)}°E`
              : 'GPS: Simulated / Pending'}
          </div>

          {/* Mode switch button */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('network')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'network'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🗺️ Network Grid
            </button>
            <button
              onClick={() => setViewMode('gradient')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'gradient'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 Thermal Gradient
            </button>
          </div>
        </div>
      </div>

      {/* Quick National Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stations Active</p>
          <p className="text-xl font-extrabold text-white mt-1">{stations.length} / 46</p>
          <p className="text-[10px] text-cyan-400 mt-0.5">Coverage: All Major Zones</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mean Heat Index</p>
          <p className="text-xl font-extrabold text-amber-400 mt-1">{nationalStats.meanHeatIndex}°C</p>
          <p className="text-[10px] text-slate-400 mt-0.5">National Ambient Avg: {nationalStats.meanTemp}°C</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Peak Thermal Hotspot</p>
          <p className="text-xl font-extrabold text-rose-400 mt-1">{nationalStats.maxStation}</p>
          <p className="text-[10px] text-rose-400 mt-0.5">Heat Index: {nationalStats.maxHI}°C</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nearest to You</p>
          <p className="text-xl font-extrabold text-emerald-400 mt-1">
            {nearestStationInfo ? nearestStationInfo.nearest_station_name : 'Detecting...'}
          </p>
          <p className="text-[10px] text-emerald-400 mt-0.5">
            {nearestStationInfo ? `~${nearestStationInfo.distance_km} km Geodesic Vector` : 'Awaiting GPS lock'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search city across India (e.g., Delhi, Amritsar, Madurai, Patna)..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tier filtering pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'EXTREME', 'HIGH', 'MODERATE', 'LOW'] as const).map(tier => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-colors whitespace-nowrap ${
                selectedTier === tier
                  ? tier === 'EXTREME'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : tier === 'HIGH'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : tier === 'MODERATE'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : tier === 'LOW'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Main View: Network Grid or Thermal Gradient */}
      {viewMode === 'network' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive SVG Network Map (8 Cols on desktop) */}
          <div className="lg:col-span-8 bg-slate-950/70 border border-slate-800 rounded-2xl p-2 sm:p-4 relative overflow-hidden flex flex-col items-center">
            {/* Overlay Map Controls */}
            <div className="w-full flex items-center justify-between px-2 py-1 text-[11px] text-slate-400 border-b border-slate-800/80 mb-2">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Geodesic Projection: India (8°N–36°N, 68°E–96°E)
              </span>
              <span className="text-slate-500">Click any station node to inspect</span>
            </div>

            {/* SVG Visual Canvas */}
            <div className="w-full aspect-[840/920] max-h-[640px] relative">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="w-full h-full select-none"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }}
              >
                <defs>
                  {/* Grid background pattern */}
                  <pattern id="gpsGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" strokeOpacity="0.4" />
                  </pattern>

                  {/* Gradient for vector link */}
                  <linearGradient id="vectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
                  </linearGradient>

                  {/* Glow filter for selected/extreme nodes */}
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Subtle Background Grid */}
                <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#gpsGrid)" rx="16" />

                {/* Geographic Meridian & Parallel reference lines */}
                {[10, 15, 20, 25, 30, 35].map(lat => {
                  const y = projectLat(lat);
                  return (
                    <g key={`lat-${lat}`}>
                      <line x1={PAD_X} y1={y} x2={SVG_WIDTH - PAD_X} y2={y} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 4" strokeOpacity="0.5" />
                      <text x={PAD_X - 10} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                        {lat}°N
                      </text>
                    </g>
                  );
                })}

                {[70, 75, 80, 85, 90, 95].map(lon => {
                  const x = projectLon(lon);
                  return (
                    <g key={`lon-${lon}`}>
                      <line x1={x} y1={PAD_Y} x2={x} y2={SVG_HEIGHT - PAD_Y} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 4" strokeOpacity="0.5" />
                      <text x={x} y={SVG_HEIGHT - PAD_Y + 16} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                        {lon}°E
                      </text>
                    </g>
                  );
                })}

                {/* National Network Graph Edges */}
                <g className="network-edges" opacity="0.35">
                  {networkEdges.map((edge, idx) => {
                    const x1 = projectLon(edge.from.longitude);
                    const y1 = projectLat(edge.from.latitude);
                    const x2 = projectLon(edge.to.longitude);
                    const y2 = projectLat(edge.to.latitude);
                    return (
                      <line
                        key={`edge-${idx}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#475569"
                        strokeWidth="1.2"
                        strokeDasharray="2 3"
                      />
                    );
                  })}
                </g>

                {/* 4-Station IDW Spatial Mesh & Weighted Geodesic Vectors */}
                {userNode && idwMesh && (
                  <g className="user-idw-spatial-mesh">
                    {/* Continuous Spatial Interpolation Surface Polygon */}
                    <polygon
                      points={idwMesh.polygonPoints}
                      fill="#06B6D4"
                      fillOpacity="0.08"
                      stroke="#06B6D4"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                    />

                    {/* 4 Weighted Vector Lines connecting User GPS to the 4 IDW Stations */}
                    {idwMesh.stations.map((item, idx) => {
                      const strokeW = Math.max(1.5, item.weightFraction * 7.5);
                      const midX = (userNode.x + item.x) / 2;
                      const midY = (userNode.y + item.y) / 2;

                      return (
                        <g key={`idw-vector-${item.station.station_id}`}>
                          {/* Weighted connection line */}
                          <line
                            x1={userNode.x}
                            y1={userNode.y}
                            x2={item.x}
                            y2={item.y}
                            stroke={idx === 0 ? "#06B6D4" : "#38BDF8"}
                            strokeWidth={strokeW}
                            strokeDasharray={idx === 0 ? undefined : "4 3"}
                            strokeOpacity={0.45 + item.weightFraction * 0.55}
                            filter="url(#glow)"
                          />

                          {/* Midpoint Pill showing Weight % & Distance */}
                          <g transform={`translate(${midX}, ${midY})`}>
                            <rect
                              x="-46"
                              y="-10"
                              width="92"
                              height="20"
                              rx="10"
                              fill="#091322"
                              stroke={idx === 0 ? "#06B6D4" : "#38BDF8"}
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="3.5"
                              textAnchor="middle"
                              fill={idx === 0 ? "#22D3EE" : "#BAE6FD"}
                              fontSize="8.5"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {item.weightPct}% • {item.distanceKm}km
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Fallback to single nearest vector line if idwMesh not computed */}
                {userNode && !idwMesh && nearestStationNode && (
                  <g className="user-geodesic-vector">
                    <line
                      x1={userNode.x}
                      y1={userNode.y}
                      x2={nearestStationNode.x}
                      y2={nearestStationNode.y}
                      stroke="#06B6D4"
                      strokeWidth="2.5"
                      strokeDasharray="5 4"
                      filter="url(#glow)"
                    />
                    {(() => {
                      const midX = (userNode.x + nearestStationNode.x) / 2;
                      const midY = (userNode.y + nearestStationNode.y) / 2;
                      return (
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x="-52"
                            y="-12"
                            width="104"
                            height="24"
                            rx="12"
                            fill="#0f172a"
                            stroke="#06B6D4"
                            strokeWidth="1.5"
                          />
                          <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fill="#38BDF8"
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            ⚡ {nearestStationNode.distanceKm} km
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* Station Nodes */}
                {filteredStations.map(st => {
                  const x = projectLon(st.longitude);
                  const y = projectLat(st.latitude);
                  const isActive = st.station_id === activeStationId;
                  const isNearest = nearestStationInfo?.nearest_station_id === st.station_id;
                  const idwStationMatch = idwMesh?.stations.find(item => item.station.station_id === st.station_id);

                  // Node color mapping
                  const nodeColor =
                    st.heat_risk_score >= 80
                      ? '#DC2626'
                      : st.heat_risk_score >= 70
                      ? '#F97316'
                      : st.heat_risk_score >= 50
                      ? '#EAB308'
                      : '#10B981';

                  return (
                    <g
                      key={st.station_id}
                      className="cursor-pointer transition-transform group"
                      onClick={() => {
                        setActiveStationId(st.station_id);
                        if (onSelectStation) onSelectStation(st.station_id);
                      }}
                    >
                      {/* IDW Station cyan highlight ring */}
                      {idwStationMatch && (
                        <circle
                          cx={x}
                          cy={y}
                          r="17"
                          fill="none"
                          stroke="#06B6D4"
                          strokeWidth="1.5"
                          strokeDasharray="3 2"
                          opacity="0.8"
                        />
                      )}

                      {/* Outer pulse for active or nearest station */}
                      {(isActive || isNearest) && (
                        <circle
                          cx={x}
                          cy={y}
                          r={isActive ? 22 : 16}
                          fill="none"
                          stroke={isActive ? '#38BDF8' : nodeColor}
                          strokeWidth="2"
                          opacity="0.8"
                          className="animate-ping"
                          style={{ transformOrigin: `${x}px ${y}px` }}
                        />
                      )}

                      {/* Halo ring for high-risk stations */}
                      {st.heat_risk_score >= 80 && (
                        <circle
                          cx={x}
                          cy={y}
                          r="14"
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                          opacity="0.6"
                        />
                      )}

                      {/* Solid node circle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isActive ? 9 : isNearest ? 8 : 6.5}
                        fill={nodeColor}
                        stroke={isActive ? '#FFFFFF' : '#0F172A'}
                        strokeWidth={isActive ? 2.5 : 1.5}
                        filter={isActive ? 'url(#glow)' : undefined}
                      />

                      {/* City Name Label */}
                      <text
                        x={x}
                        y={y - (isActive ? 14 : 10)}
                        fill={isActive ? '#38BDF8' : '#F8FAFC'}
                        fontSize={isActive ? '12' : '9.5'}
                        fontWeight={isActive ? 'bold' : 'normal'}
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow-md"
                      >
                        {st.station_name}
                      </text>

                      {/* IDW weight badge below node if interpolated station */}
                      {idwStationMatch && !isActive && (
                        <text
                          x={x}
                          y={y + 18}
                          fill="#38BDF8"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          IDW: {idwStationMatch.weightPct}%
                        </text>
                      )}

                      {/* Small temperature tag on active/hover */}
                      {isActive && (
                        <text
                          x={x}
                          y={y + 20}
                          fill="#F59E0B"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          HI: {st.heat_index_c}°C
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* User GPS Live Radar Node */}
                {userNode && (
                  <g className="user-gps-node">
                    {/* Large radar ripple */}
                    <circle
                      cx={userNode.x}
                      cy={userNode.y}
                      r="28"
                      fill="#06B6D4"
                      fillOpacity="0.12"
                      stroke="#06B6D4"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{ transformOrigin: `${userNode.x}px ${userNode.y}px` }}
                    />
                    <circle
                      cx={userNode.x}
                      cy={userNode.y}
                      r="18"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="2"
                      className="animate-ping"
                      style={{ transformOrigin: `${userNode.x}px ${userNode.y}px` }}
                    />

                    {/* Central radar crosshair & bullseye */}
                    <circle
                      cx={userNode.x}
                      cy={userNode.y}
                      r="7.5"
                      fill="#0284C7"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      filter="url(#glow)"
                    />
                    <circle cx={userNode.x} cy={userNode.y} r="2.5" fill="#FFFFFF" />

                    {/* User GPS Label Badge */}
                    <g transform={`translate(${userNode.x}, ${userNode.y + 28})`}>
                      <rect
                        x="-60"
                        y="-10"
                        width="120"
                        height="20"
                        rx="10"
                        fill="#0369A1"
                        stroke="#7DD3FC"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="9.5"
                        fontWeight="bold"
                      >
                        📍 YOU ARE HERE
                      </text>
                    </g>
                  </g>
                )}
              </svg>
            </div>

            {/* Map Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 py-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                Extreme Risk (Score ≥80)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                High Risk (70-79)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Moderate Risk (50-69)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Low Risk (&lt;50)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                Live Satellite GPS Beacon
              </span>
            </div>
          </div>

          {/* Detailed Station Card & Geodesic Telemetry (4 Cols on desktop) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Selected Station Telemetry Card */}
            <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none"
                style={{ backgroundColor: activeStation.color, opacity: 0.15 }}
              />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 font-mono">
                    ID: {activeStation.station_id}
                  </span>
                  <span
                    className="text-xs font-extrabold px-3 py-1 rounded-lg text-white"
                    style={{ backgroundColor: activeStation.color }}
                  >
                    {activeStation.tier_badge} RISK
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white mt-3">{activeStation.station_name}</h3>
                <p className="text-xs text-slate-400">{activeStation.full_name}</p>

                {/* Coordinates & Geodesic Distance */}
                <div className="mt-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Coordinates:</span>
                    <span className="text-slate-200">
                      {activeStation.latitude.toFixed(3)}°N, {activeStation.longitude.toFixed(3)}°E
                    </span>
                  </div>
                  {userDistanceToActive != null && (
                    <div className="flex justify-between text-cyan-400 font-bold border-t border-slate-800 pt-1">
                      <span>Geodesic Distance:</span>
                      <span>⚡ ~{userDistanceToActive} km away</span>
                    </div>
                  )}
                  {nearestStationInfo?.nearest_station_id === activeStation.station_id && (
                    <div className="text-[11px] text-emerald-400 font-bold">
                      ⭐ Closest active station to your device!
                    </div>
                  )}
                </div>

                {/* Thermal Metric Gauges */}
                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-medium">Feels Like (HI)</span>
                    <p className="text-xl font-black text-amber-400 mt-0.5">{activeStation.heat_index_c}°C</p>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-medium">Ambient Temp</span>
                    <p className="text-xl font-black text-slate-200 mt-0.5">{activeStation.temperature_c}°C</p>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-medium">Relative Humidity</span>
                    <p className="text-xl font-black text-cyan-400 mt-0.5">{activeStation.relative_humidity_pct}%</p>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-medium">Heat Risk Score</span>
                    <p className="text-xl font-black text-rose-400 mt-0.5">{activeStation.heat_risk_score}/100</p>
                  </div>
                </div>

                {/* Danger Window & Profile */}
                <div className="mt-4 p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl text-xs">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <span>⚠️ Peak Danger Window:</span>
                    <span>{activeStation.peak_danger_window}</span>
                  </div>
                  <div className="text-slate-400 mt-1">
                    Profile: <span className="text-slate-200 font-medium">{activeStation.profile_title}</span>
                  </div>
                </div>
              </div>

              {/* Action Button to focus companion on this city */}
              <div className="mt-5">
                <button
                  onClick={() => {
                    if (onSelectStation) {
                      onSelectStation(activeStation.station_id);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>🛡️ Monitor This Station in Safety Companion</span>
                </button>
              </div>
            </div>

            {/* 4-Station IDW Spatial Interpolation Telemetry Card */}
            {idwMesh && (
              <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 text-xs space-y-3 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="text-cyan-400">📍</span>
                    <span>4-Station IDW Interpolation</span>
                  </div>
                  <span className="text-[10px] font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 text-cyan-300 font-bold">
                    p = 2.0 • k = 4
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Surrounding certified GSOD stations contributing to continuous micro-climate estimate at your coordinates:
                </p>
                <div className="space-y-2">
                  {idwMesh.stations.map((item, idx) => (
                    <div
                      key={item.station.station_id}
                      onClick={() => {
                        setActiveStationId(item.station.station_id);
                        if (onSelectStation) onSelectStation(item.station.station_id);
                      }}
                      className="p-2.5 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-700 group-hover:bg-cyan-500 group-hover:text-slate-950 font-mono text-[10px] flex items-center justify-center font-bold text-cyan-300 transition">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white block group-hover:text-cyan-300 transition">
                            {item.station.station_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ~{item.distanceKm} km Geodesic
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-cyan-400 font-bold text-xs block">
                          {item.weightPct}% Weight
                        </span>
                        <span className="text-[10px] text-amber-300">
                          HI: {item.station.heat_index_c}°C
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Satellite GPS Technology Explanation Card */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <span>🛰️ How Zero-Network GPS Works</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Smartphones contain direct satellite GNSS (GPS/GLONASS/NavIC) receivers that operate even with cellular
                data, Wi-Fi, and SIM disconnected.
              </p>
              <p className="text-[11px] leading-relaxed text-slate-400">
                HeatShield AI runs pure client-side Haversine geodesic spherical trigonometry across our embedded
                46-station matrix in <strong className="text-cyan-300">&lt;1ms</strong> with 0 internet packets needed.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Thermal Gradient Curve / Elevation Ranking View */
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📊 National Thermal Gradient & Heat Index Ranking</span>
              <span className="text-xs font-mono text-slate-400">All 46 Stations Sorted Hottest to Coolest</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Interactive distribution ranking comparing ambient temperature, moisture-amplified Heat Index, and
              vulnerability tier.
            </p>
          </div>

          {/* Thermal Distribution Bars */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-2">
            {sortedByHeat.map((st, idx) => {
              const isSelected = st.station_id === activeStationId;
              const isNearest = nearestStationInfo?.nearest_station_id === st.station_id;
              const maxHI = sortedByHeat[0]?.heat_index_c || 50;
              const barWidth = Math.max(15, Math.min(100, (st.heat_index_c / maxHI) * 100));

              return (
                <div
                  key={st.station_id}
                  onClick={() => {
                    setActiveStationId(st.station_id);
                    if (onSelectStation) onSelectStation(st.station_id);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500/80 shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:w-1/3">
                    <span className="text-xs font-mono font-bold text-slate-500 w-6">#{idx + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{st.station_name}</span>
                        {isNearest && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{st.full_name}</span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: st.color
                        }}
                      />
                    </div>
                    <span className="font-mono font-bold text-xs text-amber-400 w-16 text-right">
                      {st.heat_index_c}°C HI
                    </span>
                  </div>

                  {/* Tier Pill & Ambient Temp */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-1/4">
                    <span className="text-xs text-slate-400 font-mono">{st.temperature_c}°C Amb</span>
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: st.color }}
                    >
                      {st.tier_badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
