import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import type { AnnualShift, StationTransitionHistory, TransitionMatrixRecord } from '../types';
import { api } from '../services/api';
import { History, TrendingUp, Compass, AlertCircle, ArrowRight, Filter } from 'lucide-react';

interface TemporalAnalysisViewProps {
  annualShifts: AnnualShift[];
  stations: Array<{ station_id: string; name: string }>;
}

export const TemporalAnalysisView: React.FC<TemporalAnalysisViewProps> = ({
  annualShifts,
  stations
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(
    stations.length > 0 ? stations[0].station_id : '42182099999'
  );
  const [transitionData, setTransitionData] = useState<StationTransitionHistory | null>(null);
  const [loadingStation, setLoadingStation] = useState<boolean>(false);
  const [matrixData, setMatrixData] = useState<TransitionMatrixRecord[]>([]);
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'shifted'>('all');

  useEffect(() => {
    if (selectedStationId) {
      loadStationTransitions(selectedStationId);
    }
  }, [selectedStationId]);

  useEffect(() => {
    loadTransitionMatrix();
  }, []);

  const loadTransitionMatrix = async () => {
    try {
      const res = await api.getTransitionMatrix();
      setMatrixData(res);
    } catch (err) {
      console.error('Failed to load transition matrix:', err);
    }
  };

  const loadStationTransitions = async (id: string) => {
    try {
      setLoadingStation(true);
      const res = await api.getStationTransitions(id);
      setTransitionData(res);
    } catch (err) {
      console.error('Failed to load transitions:', err);
    } finally {
      setLoadingStation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
            <History className="w-5 h-5" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Multi-Year Temporal Intelligence (2022–2025)
          </span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Longitudinal Heat-Stress Shifting & "What Changed?" Transition Analysis
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          Tracks annual cluster distributions across consecutive pre-monsoon heat seasons (April–June)
          and detects micro-climatic profile transitions for individual monitoring stations over time.
        </p>
      </div>

      {/* Macro Cluster Shifting Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Annual Cluster Distribution Progression (2022–2025)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proportion (%) of regional weather observations assigned to each cluster profile by year
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={annualShifts} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="cluster_0_pct" name="Cluster 0" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cluster_1_pct" name="Cluster 1" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cluster_2_pct" name="Cluster 2" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cluster_3_pct" name="Cluster 3" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* "What Changed?" Station Transition Analysis Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-500" />
              "What Changed?" — Station Vulnerability Transition Inspector
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a monitoring station to inspect multi-year profile migrations and thermodynamic shifts
            </p>
          </div>

          {/* Station Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="station-transition-select" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Station:
            </label>
            <select
              id="station-transition-select"
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {stations.map((st) => (
                <option key={st.station_id} value={st.station_id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transition Results */}
        {loadingStation ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400">
            Loading station multi-year trajectory...
          </div>
        ) : transitionData ? (
          <div className="space-y-4">
            {/* Transition Alert / Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                      Multi-Year Diagnostic Trajectory:
                    </span>
                    {transitionData.transition_summary}
                  </div>
                </div>

                {transitionData.transitions && transitionData.transitions.length > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Profile Transition Detected ({transitionData.transitions.length})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Profile Stable Across Years
                  </span>
                )}
              </div>

              {transitionData.transitions && transitionData.transitions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {transitionData.transitions.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 text-[11px] font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 leading-normal italic">
                <strong>Scientific Caveat:</strong> Observed shifts between pre-monsoon heat-stress profiles reflect interannual synoptic weather variations and observational coverage differences across monitoring seasons (2022–2025), not definitive long-term secular climate trends.
              </div>
            </div>

            {/* Year-by-Year Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {transitionData.annual_history.map((yr) => (
                <div
                  key={yr.year}
                  className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between"
                  style={{ borderTop: `3px solid ${yr.color_code}` }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-base text-slate-900 dark:text-white">
                        {yr.year}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                        style={{ backgroundColor: yr.color_code }}
                      >
                        {yr.vulnerability_tier}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <p className="flex justify-between">
                        <span>Mean Temp:</span>
                        <strong className="font-mono">{yr.mean_temp_c}°C</strong>
                      </p>
                      <p className="flex justify-between">
                        <span>Peak Max Temp:</span>
                        <strong className="font-mono text-amber-600 dark:text-amber-400">{yr.peak_max_temp_c}°C</strong>
                      </p>
                      <p className="flex justify-between">
                        <span>Dew Point:</span>
                        <strong className="font-mono text-blue-500">{yr.dew_point_c}°C</strong>
                      </p>
                      <p className="flex justify-between">
                        <span>Apparent Heat Index:</span>
                        <strong className="font-mono text-orange-600 dark:text-orange-400">{yr.heat_index_c}°C</strong>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Heat Stress Index</span>
                    <span className="text-slate-900 dark:text-white font-bold">{yr.heat_stress_index} / 100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Multi-Year Vulnerability Transition Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              Multi-Year Vulnerability Transition Matrix (2022–2025)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparative station audit tracking interannual profile migrations across consecutive summer heat seasons
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setMatrixFilter('all')}
                className={`px-3 py-1 rounded-md transition ${
                  matrixFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All 46 Stations
              </button>
              <button
                onClick={() => setMatrixFilter('shifted')}
                className={`px-3 py-1 rounded-md transition ${
                  matrixFilter === 'shifted'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Profile Shifts Only ({matrixData.filter((m) => m.has_transition).length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Station Name</th>
                <th className="py-2.5 px-2.5 text-center">2022</th>
                <th className="py-2.5 px-2.5 text-center">2023</th>
                <th className="py-2.5 px-2.5 text-center">2024</th>
                <th className="py-2.5 px-2.5 text-center">2025</th>
                <th className="py-2.5 px-3">Longitudinal Shift</th>
                <th className="py-2.5 px-3">Mean HSI</th>
                <th className="py-2.5 px-3 rounded-r-lg">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {matrixData
                .filter((rec) => (matrixFilter === 'shifted' ? rec.has_transition : true))
                .map((rec) => {
                  const isSelected = selectedStationId === rec.station_id;
                  return (
                    <tr
                      key={rec.station_id}
                      className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        isSelected ? 'bg-sky-50/70 dark:bg-sky-950/30 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{rec.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">ID: {rec.station_id}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap"
                          style={{ backgroundColor: rec.y2022_color }}
                        >
                          {rec.y2022_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap"
                          style={{ backgroundColor: rec.y2023_color }}
                        >
                          {rec.y2023_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap"
                          style={{ backgroundColor: rec.y2024_color }}
                        >
                          {rec.y2024_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap"
                          style={{ backgroundColor: rec.y2025_color }}
                        >
                          {rec.y2025_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {rec.has_transition ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {rec.overall_shift}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Stable Across Years
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {rec.mean_hsi.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => setSelectedStationId(rec.station_id)}
                          className={`px-2.5 py-1 rounded text-xs transition flex items-center gap-1 ${
                            isSelected
                              ? 'bg-sky-600 text-white font-bold'
                              : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span>{isSelected ? 'Viewing' : 'Inspect'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
