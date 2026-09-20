import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type {
  AllStationsLiveResponse,
  LanguageCode
} from '../types';
import {
  Globe,
  Search,
  Flame,
  ArrowUpDown,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface AllStationsLiveViewProps {
  onSelectStation: (stationId: string) => void;
  activeStationId: string;
  lang: LanguageCode;
}

export const AllStationsLiveView: React.FC<AllStationsLiveViewProps> = ({
  onSelectStation,
  activeStationId,
  lang: _lang
}) => {
  const [data, setData] = useState<AllStationsLiveResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'temp' | 'name'>('risk');

  useEffect(() => {
    fetchLiveData();
  }, []);

  const fetchLiveData = async () => {
    try {
      setLoading(true);
      const res = await api.getAllStationsLive();
      setData(res);
    } catch (err) {
      console.error('Failed to load live all stations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium">Aggregating real-time status across all 46 monitored stations...</p>
      </div>
    );
  }

  // Filter stations
  const filtered = data.stations.filter(st => {
    const matchesSearch = st.station_name.toLowerCase().includes(searchQuery.toLowerCase())
      || st.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedTier === 'all') return true;
    if (selectedTier === 'extreme') return st.tier_badge === 'EXTREME';
    if (selectedTier === 'very_high') return st.tier_badge === 'VERY HIGH';
    if (selectedTier === 'high') return st.tier_badge === 'HIGH';
    if (selectedTier === 'moderate') return st.tier_badge === 'MODERATE';
    if (selectedTier === 'low') return st.tier_badge === 'LOW';
    return true;
  });

  // Sort stations
  filtered.sort((a, b) => {
    if (sortBy === 'risk') return b.heat_risk_score - a.heat_risk_score;
    if (sortBy === 'temp') return b.temperature_c - a.temperature_c;
    return a.station_name.localeCompare(b.station_name);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner & National Summary Cards */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>National Regional Surveillance & Prediction Matrix</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Live Heat Status & Predictions — All 46 Regions
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Real-time surface observations, continuous Heat Stress Index (HSI), and predicted cluster vulnerability tiers across India.
            </p>
          </div>

          <button
            onClick={fetchLiveData}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold border border-gray-700 transition self-start sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Refresh Real-Time Feeds</span>
          </button>
        </div>

        {/* 4 Summary Stats Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
              Monitored Stations
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              {data.total_stations}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">100% Reporting Live</div>
          </div>

          <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60">
            <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">
              National Mean Temp
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">
              {data.mean_temperature_c}°C
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Pre-monsoon average</div>
          </div>

          <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60">
            <div className="text-[11px] uppercase tracking-wider text-rose-400 font-bold">
              Severe Heat Zones
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-0.5">
              {(data.tier_counts.extreme || 0) + (data.tier_counts.very_high || 0)}
            </div>
            <div className="text-[11px] text-rose-300 mt-1">Extreme / Very High tiers</div>
          </div>

          <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60">
            <div className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">
              Hottest Monitored
            </div>
            <div className="text-lg sm:text-xl font-bold text-white truncate mt-1">
              {data.hottest_station}
            </div>
            <div className="text-[11px] text-purple-300 mt-1">Peak thermal load</div>
          </div>
        </div>
      </div>

      {/* Search, Filter Pills & Sort Controls */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station or city (e.g. Delhi, Ludhiana, Mumbai, Jaipur, Nagpur)..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-gray-500"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <label className="text-xs text-gray-400 font-semibold">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-800 text-white text-xs font-medium px-3 py-2 rounded-xl border border-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="risk">Highest Risk First</option>
              <option value="temp">Hottest Temperature First</option>
              <option value="name">City Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Tier Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-800">
          {[
            { id: 'all', label: `All Regions (${data.total_stations})`, color: 'bg-gray-800 text-gray-200' },
            { id: 'extreme', label: `🟣 Extreme (${data.tier_counts.extreme || 0})`, color: 'bg-purple-900/40 text-purple-300 border-purple-600/40' },
            { id: 'very_high', label: `🔴 Very High (${data.tier_counts.very_high || 0})`, color: 'bg-red-900/40 text-red-300 border-red-600/40' },
            { id: 'high', label: `🟠 High (${data.tier_counts.high || 0})`, color: 'bg-orange-900/40 text-orange-300 border-orange-600/40' },
            { id: 'moderate', label: `🟡 Moderate (${data.tier_counts.moderate || 0})`, color: 'bg-amber-900/40 text-amber-300 border-amber-600/40' },
            { id: 'low', label: `🟢 Low (${data.tier_counts.low || 0})`, color: 'bg-emerald-900/40 text-emerald-300 border-emerald-600/40' }
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => setSelectedTier(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                selectedTier === pill.id
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : `${pill.color} border-gray-700/60 hover:border-gray-600`
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(st => {
          const isCurrentActive = st.station_id === activeStationId;
          return (
            <div
              key={st.station_id}
              className={`bg-gray-900/90 rounded-2xl p-5 border transition-all shadow-xl flex flex-col justify-between relative overflow-hidden ${
                isCurrentActive
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              {isCurrentActive && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white font-black text-[10px] tracking-wider px-3 py-0.5 rounded-bl-xl uppercase shadow">
                  Currently Active
                </div>
              )}

              <div>
                {/* Station Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {st.station_name}
                    </h3>
                    <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{st.full_name}</span>
                    </div>
                  </div>

                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white shadow flex-shrink-0"
                    style={{ backgroundColor: st.color }}
                  >
                    {st.tier_badge}
                  </span>
                </div>

                {/* Score & Weather Metrics */}
                <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">
                        Citizen Risk Score
                      </div>
                      <div className="text-2xl font-black" style={{ color: st.color }}>
                        {st.heat_risk_score} <span className="text-xs text-gray-400">/ 100</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-gray-400">
                        Air Temp
                      </div>
                      <div className="text-2xl font-black text-white">
                        {st.temperature_c}°C
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-700/60 text-[11px]">
                    <div>
                      <span className="text-gray-400 block">Feels Like</span>
                      <strong className="text-amber-400">{st.heat_index_c}°C</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Max Day</span>
                      <strong className="text-rose-400">{st.max_temperature_c}°C</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Humidity</span>
                      <strong className="text-gray-300">{st.relative_humidity_pct}%</strong>
                    </div>
                  </div>
                </div>

                {/* Predicted Cluster Profile */}
                <div className="bg-gray-800/40 p-2.5 rounded-xl border border-gray-700/40 mb-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300 font-semibold">{st.profile_code}</span>
                  </div>
                  <span className="text-gray-400 text-[11px] truncate max-w-[150px]">{st.profile_title}</span>
                </div>

                <div className="text-[11px] text-gray-400 mb-3">
                  ⚠️ Peak Hazard: <strong className="text-gray-200">{st.peak_danger_window}</strong>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectStation(st.station_id)}
                disabled={isCurrentActive}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow ${
                  isCurrentActive
                    ? 'bg-gray-800 text-gray-400 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isCurrentActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Active in Companion</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5" />
                    <span>Select & Protect in Companion →</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
