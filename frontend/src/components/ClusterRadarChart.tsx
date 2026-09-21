import React, { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import type { RadarCentroidsResponse, ClusterProfile } from '../types';
import { Compass, Info, Eye } from 'lucide-react';
import { OFFLINE_RESEARCH_DATA } from '../utils/offlineResearchData';

interface ClusterRadarChartProps {
  radarData: RadarCentroidsResponse | null;
  profiles?: ClusterProfile[];
  activeK?: number;
}

const CLUSTER_COLORS: Record<number, { stroke: string; fill: string; name: string }> = {
  0: { stroke: '#10B981', fill: '#10B981', name: 'Profile A — Lower Heat Stress' },
  1: { stroke: '#F59E0B', fill: '#F59E0B', name: 'Profile B — Emerging Heat Stress' },
  2: { stroke: '#EF4444', fill: '#EF4444', name: 'Profile C — High Thermal Stress' },
  3: { stroke: '#7C3AED', fill: '#7C3AED', name: 'Profile D — Extreme Heat & Moisture' }
};

export const ClusterRadarChart: React.FC<ClusterRadarChartProps> = ({ radarData, profiles }) => {
  const [activeProfiles, setActiveProfiles] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true
  });

  const effectiveData: RadarCentroidsResponse =
    radarData && radarData.radar_data && radarData.radar_data.length > 0
      ? radarData
      : (OFFLINE_RESEARCH_DATA.radar_centroids as unknown as RadarCentroidsResponse);

  const clusterList = effectiveData.clusters && effectiveData.clusters.length > 0
    ? effectiveData.clusters
    : [0, 1, 2, 3];

  const toggleProfile = (clusterId: number) => {
    setActiveProfiles((prev) => ({ ...prev, [clusterId]: !prev[clusterId] }));
  };

  const getProfileTitle = (cId: number) => {
    const prof = profiles?.find((p) => p.cluster_id === cId);
    if (prof) return prof.title;
    return CLUSTER_COLORS[cId]?.name || `Cluster ${cId}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-500" />
            Biometeorological Cluster Radar / Spider Comparison
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-dimensional centroid comparison across 6 normalized thermodynamic indicators (0–100 scale)
          </p>
        </div>

        {/* Profile Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1 flex items-center gap-1">
            <Eye className="w-3 h-3" /> Toggle:
          </span>
          {clusterList.map((cId) => {
            const isVisible = activeProfiles[cId] ?? true;
            const color = CLUSTER_COLORS[cId]?.stroke || '#3B82F6';
            return (
              <button
                key={cId}
                onClick={() => toggleProfile(cId)}
                className={`px-2 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                  isVisible
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    : 'opacity-40 line-through bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }}></span>
                Cluster {cId}
              </button>
            );
          })}
        </div>
      </div>

      {/* Radar Chart Area */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={effectiveData.radar_data}>
            <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" opacity={0.5} />
            <PolarAngleAxis
              dataKey="indicator"
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 space-y-1">
                      <span className="font-extrabold text-amber-400 block mb-1">
                        {data.indicator}
                      </span>
                      {clusterList.map((cId) => {
                        const val = data[`Cluster_${cId}`];
                        const raw = data[`Cluster_${cId}_raw`];
                        const color = CLUSTER_COLORS[cId]?.stroke || '#fff';
                        return (
                          <div key={cId} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5" style={{ color }}>
                              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }}></span>
                              {getProfileTitle(cId)}:
                            </span>
                            <span className="font-mono font-bold">
                              {raw} ({val}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              formatter={(value) => {
                const clusterNum = parseInt(value.replace('Cluster ', ''), 10);
                return (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {getProfileTitle(clusterNum)}
                  </span>
                );
              }}
            />
            {clusterList.map((cId) => {
              if (!activeProfiles[cId]) return null;
              const color = CLUSTER_COLORS[cId]?.stroke || '#3B82F6';
              return (
                <Radar
                  key={cId}
                  name={`Cluster ${cId}`}
                  dataKey={`Cluster_${cId}`}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              );
            })}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Scientific Radar Interpretation Callout */}
      <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5 leading-relaxed">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 dark:text-white">Scientific Radar Interpretation:</strong>
          {' '}The radar chart visually demonstrates why clustering cannot rely on temperature alone. While 
          <strong className="text-red-500"> Profile C (Continental Dry)</strong> dominates in sensible daytime peak temperature, 
          <strong className="text-purple-500"> Profile D (Compound Wet-Bulb)</strong> simultaneously spikes in atmospheric moisture 
          (Dew Point and Relative Humidity) combined with wind stagnation, triggering the most hazardous physiological wet-bulb heat strain.
        </div>
      </div>
    </div>
  );
};
