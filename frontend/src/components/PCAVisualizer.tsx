import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import type { PCAAnalysis, UMAPAnalysis } from '../types';
import { Compass, PieChart, Info, ArrowUpRight, Network } from 'lucide-react';

interface PCAVisualizerProps {
  pcaData: PCAAnalysis | null;
  umapData: UMAPAnalysis | null;
  activeK: number;
}

const CLUSTER_COLORS = [
  '#10B981', // Profile A - Green
  '#F59E0B', // Profile B - Amber
  '#EF4444', // Profile C - Red
  '#7C3AED', // Profile D - Purple
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316'  // Orange
];

export const PCAVisualizer: React.FC<PCAVisualizerProps> = ({ pcaData, umapData }) => {
  const [viewMode, setViewMode] = useState<'pca' | 'umap'>('pca');

  const chartPoints = useMemo(() => {
    if (viewMode === 'pca' && pcaData) {
      const pts = pcaData.points;
      if (pts.length > 500) {
        const step = Math.ceil(pts.length / 500);
        return pts.filter((_, idx) => idx % step === 0);
      }
      return pts;
    } else if (viewMode === 'umap' && umapData) {
      const pts = umapData.points;
      if (pts.length > 500) {
        const step = Math.ceil(pts.length / 500);
        return pts.filter((_, idx) => idx % step === 0);
      }
      return pts;
    }
    return [];
  }, [viewMode, pcaData, umapData]);

  if (!pcaData) {
    return <div className="h-96 flex items-center justify-center text-slate-400">Loading dimensionality reduction models...</div>;
  }

  const pc1Exp = (pcaData.explained_variance_ratio[0] * 100).toFixed(1);
  const pc2Exp = (pcaData.explained_variance_ratio[1] * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Projection Mode Toggle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-sky-500" />
            Dimensionality Reduction: PCA Biplot & UMAP Manifold
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare linear variance-maximizing PCA projection with non-linear neighborhood manifold embedding
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setViewMode('pca')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              viewMode === 'pca'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            PCA 2D Biplot (Required)
          </button>
          <button
            onClick={() => setViewMode('umap')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              viewMode === 'umap'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            UMAP Manifold (Advanced)
          </button>
        </div>
      </div>

      {/* Variance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Principal Component 1</span>
            <Compass className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {pc1Exp}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Primary Axis: Thermal Load & Max Temperature
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Principal Component 2</span>
            <Compass className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {pc2Exp}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Secondary Axis: Dew Point & Moisture Trapping
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total 2D Variance Captured</span>
            <PieChart className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {pcaData.total_variance_explained_2d.toFixed(1)}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Orthogonal variance preserved
          </p>
        </div>
      </div>

      {/* Main 2D Projection Chart & Feature Loadings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scatter Plot */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {viewMode === 'pca' ? 'PCA 2D Cluster Space' : 'UMAP Non-Linear Manifold Space'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {viewMode === 'pca'
                ? 'Orthogonal projection of station observations colored by assigned heat-stress cluster'
                : 'Preserves local neighborhood topological structures, illustrating non-linear cluster separation'}
            </p>
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={viewMode === 'pca' ? 'PC1' : 'UMAP 1'}
                  stroke="#94a3b8"
                  fontSize={11}
                  label={{
                    value: viewMode === 'pca' ? `PC1 (${pc1Exp}% Variance)` : 'UMAP Dimension 1',
                    position: 'insideBottom',
                    offset: -10,
                    fill: '#94a3b8'
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name={viewMode === 'pca' ? 'PC2' : 'UMAP 2'}
                  stroke="#94a3b8"
                  fontSize={11}
                  label={{
                    value: viewMode === 'pca' ? `PC2 (${pc2Exp}% Variance)` : 'UMAP Dimension 2',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8'
                  }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs text-white shadow-lg">
                        <p className="font-bold text-sky-400">{data.station_name}</p>
                        <p className="text-slate-400">Station ID: {data.station_id}</p>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800 space-y-0.5">
                          <p>Cluster: <span className="font-semibold text-white">{data.cluster}</span></p>
                          {data.heat_index_c && (
                            <p>Apparent Heat Index: <span className="font-semibold text-amber-400">{data.heat_index_c}°C</span></p>
                          )}
                          {data.heat_stress_index && (
                            <p>Heat Stress Index: <span className="font-semibold text-purple-400">{data.heat_stress_index}/100</span></p>
                          )}
                          <p className="text-slate-400">Coordinates: ({data.x.toFixed(2)}, {data.y.toFixed(2)})</p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter name="Stations" data={chartPoints}>
                  {chartPoints.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length]}
                      fillOpacity={0.8}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-sky-500" />
              Showing {chartPoints.length} representative observations in projected space
            </span>
          </div>
        </div>

        {/* Feature Loading Biplot Table */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Biplot Feature Loadings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Eigenvector directions indicating feature alignment with PC1 and PC2
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Feature</th>
                    <th className="py-2.5 px-2">PC1</th>
                    <th className="py-2.5 px-2">PC2</th>
                    <th className="py-2.5 px-2 rounded-r-lg">Magnitude</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {pcaData.feature_loadings.map((load, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {load.feature}
                      </td>
                      <td className="py-2 px-2 font-mono text-sky-600 dark:text-sky-400">
                        {load.pc1_loading > 0 ? `+${load.pc1_loading.toFixed(2)}` : load.pc1_loading.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 font-mono text-emerald-600 dark:text-emerald-400">
                        {load.pc2_loading > 0 ? `+${load.pc2_loading.toFixed(2)}` : load.pc2_loading.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {load.magnitude.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
              Biplot Interpretation:
            </div>
            Features with high positive PC1 loadings (e.g. Heat Index, Max Temp) drive extreme cluster placement along the horizontal axis, while Dew Point and Humidity drive vertical divergence.
          </div>
        </div>

      </div>
    </div>
  );
};
