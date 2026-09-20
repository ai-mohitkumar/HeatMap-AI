import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { StationGeoRecord, StationExplanation } from '../types';
import { api } from '../services/api';
import { getOfflineStationExplanation } from '../utils/offlineEngine';
import {
  Filter,
  Search,
  Layers,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  HelpCircle,
  X,
  Sparkles,
  Gauge,
  Loader2
} from 'lucide-react';

interface PriorityMapProps {
  stations: StationGeoRecord[];
  activeK: number;
}

// Sub-component to enforce Leaflet viewport size recalculation and fly-to transitions
function MapController({ selectedStation }: { selectedStation: StationGeoRecord | null }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately and after layout rendering
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
    if (selectedStation) {
      map.flyTo([selectedStation.latitude, selectedStation.longitude], 8, {
        duration: 1.2
      });
    }
  }, [selectedStation, map]);

  return null;
}

export const PriorityMap: React.FC<PriorityMapProps> = ({ stations }) => {
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<StationExplanation | null>(null);
  const [loadingExplainer, setLoadingExplainer] = useState<boolean>(false);

  const filteredStations = useMemo(() => {
    return stations.filter((st) => {
      const matchesTier = selectedTier === 'All' || st.vulnerability_tier === selectedTier;
      const stName = st.name || '';
      const stId = String(st.station_id || '');
      const matchesSearch =
        searchQuery === '' ||
        stName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stId.includes(searchQuery);
      return matchesTier && matchesSearch;
    });
  }, [stations, selectedTier, searchQuery]);

  const tierCounts = useMemo(() => {
    const counts = { All: stations.length, Low: 0, Moderate: 0, High: 0, Extreme: 0 };
    stations.forEach((st) => {
      if (st.vulnerability_tier in counts) {
        counts[st.vulnerability_tier as keyof typeof counts]++;
      }
    });
    return counts;
  }, [stations]);

  const handleFetchExplanation = async (stationId: string) => {
    try {
      setSelectedStationId(stationId);
      setLoadingExplainer(true);
      const res = await api.explainStation(stationId);
      setExplanation(res);
    } catch (err) {
      console.error('Failed to load station explanation from API, using offline engine:', err);
      setExplanation(getOfflineStationExplanation(stationId));
    } finally {
      setLoadingExplainer(false);
    }
  };

  const defaultCenter: [number, number] = [22.5, 78.5];
  const defaultZoom = 5;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 relative">
      {/* Map Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-500" />
            Regional Heat-Stress Priority Map & Intelligence Drilldown
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any ground station pin to diagnose contributing thermodynamic indicators
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search station name/ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 w-48"
            />
          </div>

          {/* Tier Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <Filter className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
            {(['All', 'Low', 'Moderate', 'High', 'Extreme'] as const).map((tier) => {
              const count = tierCounts[tier];
              const isSelected = selectedTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tier} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map + Side Explainability Drawer Layout */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Interactive Leaflet Map */}
        <div className="h-[530px] flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-inner">
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController selectedStation={stations.find((s) => s.station_id === selectedStationId) || null} />

            {filteredStations.map((st) => (
              <CircleMarker
                key={st.station_id}
                center={[st.latitude, st.longitude]}
                radius={st.vulnerability_tier === 'Extreme' ? 10 : 8}
                pathOptions={{
                  color: selectedStationId === st.station_id ? '#ffffff' : '#f8fafc',
                  weight: selectedStationId === st.station_id ? 3 : 1.5,
                  fillColor: st.color_code,
                  fillOpacity: 0.88
                }}
                eventHandlers={{
                  click: () => handleFetchExplanation(st.station_id)
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[240px] text-slate-800 font-sans">
                    <div className="border-b pb-2 mb-2">
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{st.name}</h4>
                      <p className="text-xs text-slate-500">
                        ID: {st.station_id} • Lat: {st.latitude}° Lon: {st.longitude}°
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold text-white uppercase tracking-wider"
                        style={{ backgroundColor: st.color_code }}
                      >
                        {st.vulnerability_tier} Priority • {st.profile_code}
                      </span>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        HSI: {st.heat_stress_index}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-red-500" />
                        <span>Mean: <strong>{st.mean_temp_c}°C</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                        <span>Max: <strong>{st.peak_max_temp_c}°C</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                        <span>Heat Index: <strong>{st.peak_heat_index_c}°C</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-blue-500" />
                        <span>Dew Point: <strong>{st.dew_point_c}°C</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-sky-500" />
                        <span>Humidity: <strong>{st.relative_humidity_pct}%</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-teal-500" />
                        <span>Wind: <strong>{st.wind_speed_kmh} km/h</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFetchExplanation(st.station_id)}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      Why is this region priority?
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Floating Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
              HeatShield Profiles
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block border border-white"></span>
                <span className="text-slate-600 dark:text-slate-400">Profile A — Lower Heat Stress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block border border-white"></span>
                <span className="text-slate-600 dark:text-slate-400">Profile B — Emerging Heat Stress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block border border-white"></span>
                <span className="text-slate-600 dark:text-slate-400">Profile C — High Thermal Stress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#7C3AED] inline-block border border-white"></span>
                <span className="text-slate-600 dark:text-slate-400">Profile D — Extreme Heat & Moisture</span>
              </div>
            </div>
          </div>
        </div>

        {/* Explainability Drawer ("Why is this region high priority?") */}
        {(explanation || loadingExplainer) && (
          <div className="w-full lg:w-96 bg-slate-50 dark:bg-slate-850 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm animate-in fade-in slide-in-from-right-4 duration-200">
            {loadingExplainer ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-xs font-semibold">Diagnosing thermodynamic profile for station {selectedStationId}...</p>
              </div>
            ) : explanation ? (
              <div>
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Indicator Explainability
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight mt-0.5">
                      {explanation.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ID: {explanation.station_id} • {explanation.priority_level}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setExplanation(null);
                      setSelectedStationId(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

              {/* Continuous Score Gauge */}
              <div className="mb-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-amber-500" />
                    Heat Stress Index (HSI)
                  </span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                    {explanation.heat_stress_index} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${explanation.heat_stress_index}%`,
                      backgroundColor: explanation.color_code
                    }}
                  ></div>
                </div>
              </div>

              {/* Assignment Confidence & Borderline Detection */}
              <div className="mb-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                    Cluster Assignment Confidence
                  </span>
                  <span
                    className="font-extrabold text-[11px] px-2 py-0.5 rounded-md font-mono"
                    style={{
                      backgroundColor: explanation.assignment_confidence_color ? `${explanation.assignment_confidence_color}20` : '#10B98120',
                      color: explanation.assignment_confidence_color || '#10B981'
                    }}
                  >
                    {explanation.assignment_confidence_pct ?? 85}% ({explanation.assignment_confidence_badge ?? 'High Confidence'})
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${explanation.assignment_confidence_pct ?? 85}%`,
                      backgroundColor: explanation.assignment_confidence_color || '#10B981'
                    }}
                  ></div>
                </div>
                {explanation.is_borderline && explanation.borderline_advisory && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-[11px] text-red-700 dark:text-red-300 font-medium leading-tight">
                    ⚠️ {explanation.borderline_advisory}
                  </div>
                )}
              </div>

              {/* Contributing Indicators Horizontal Progress Bars */}
              <div className="space-y-3 mb-4">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Key Contributing Thermodynamic Indicators:
                </span>
                {explanation.key_contributing_indicators.map((ind, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {ind.name}
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {ind.value} ({ind.percentile}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${ind.importance}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Natural Language Diagnostic Explanation */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">
                  Diagnostic Rationale:
                </span>
                {explanation.explanation}
              </div>

              <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
                * Note: HeatShield HSI is a project-defined weather screening index; occupational assessment requires metabolic & PPE factors (NIOSH/WBGT).
              </p>
            </div>
          ) : null}
        </div>
      )}
      </div>
    </div>
  );
};
