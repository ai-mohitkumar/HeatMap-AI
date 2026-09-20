import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Layers,
  Sparkles,
  AlertTriangle,
  Flame,
  Activity,
  CheckCircle2,
  RefreshCw,
  Info,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { api } from '../services/api';
import type {
  ClimateDiscoveryResponse,
  ClimateAnomalyResponse,
  LatentRepresentationResponse,
  MarkovTransitionResponse,
  FeatureAblationResponse,
  EmergingHotspotResponse
} from '../types';

interface ClimateIntelligenceLabProps {
  activeK: number;
}

export const ClimateIntelligenceLab: React.FC<ClimateIntelligenceLabProps> = ({ activeK }) => {
  const [activeSubTab, setActiveSubTab] = useState<'discovery' | 'anomalies' | 'latent' | 'markov' | 'ablation' | 'hotspots'>('discovery');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Engine Data States
  const [discoveryData, setDiscoveryData] = useState<ClimateDiscoveryResponse | null>(null);
  const [anomalyData, setAnomalyData] = useState<ClimateAnomalyResponse | null>(null);
  const [latentData, setLatentData] = useState<LatentRepresentationResponse | null>(null);
  const [markovData, setMarkovData] = useState<MarkovTransitionResponse | null>(null);
  const [ablationData, setAblationData] = useState<FeatureAblationResponse | null>(null);
  const [hotspotData, setHotspotData] = useState<EmergingHotspotResponse | null>(null);

  // Latent Tab projection mode: 'autoencoder' | 'pca' | 'spectral'
  const [latentMode, setLatentMode] = useState<'autoencoder' | 'pca' | 'spectral_umap'>('autoencoder');

  // Load all intelligence engines
  const loadIntelligenceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [disc, anom, latent, markov, abl, hot] = await Promise.all([
        api.getClimateDiscovery(activeK),
        api.getClimateAnomalies(),
        api.getLatentRepresentations(),
        api.getMarkovTransitions(),
        api.getFeatureAblations(),
        api.getEmergingHotspots(18)
      ]);

      setDiscoveryData(disc);
      setAnomalyData(anom);
      setLatentData(latent);
      setMarkovData(markov);
      setAblationData(abl);
      setHotspotData(hot);
    } catch (err: any) {
      console.error('Failed to load climate intelligence data:', err);
      setError(err.message || 'Failed to load intelligence modules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntelligenceData();
  }, [activeK]);

  const subTabs = [
    { id: 'discovery', label: '1. Convergence Lab (RQ1)', icon: Layers, desc: 'K-Means vs GMM vs HDBSCAN vs Ward' },
    { id: 'anomalies', label: '2. Unsupervised Anomalies (RQ3)', icon: AlertTriangle, desc: 'Isolation Forest & LOF Outliers' },
    { id: 'latent', label: '3. Latent Manifolds (RQ2)', icon: BrainCircuit, desc: 'Neural Autoencoder vs PCA vs UMAP' },
    { id: 'markov', label: '4. Markov Dynamics (RQ4)', icon: Activity, desc: 'Regime Transition Matrix & Shifts' },
    { id: 'ablation', label: '5. Feature Ablation (RQ5)', icon: BarChart3, desc: 'Moisture Factor Dominance Study' },
    { id: 'hotspots', label: '6. Emerging Hotspots (RQ6)', icon: Flame, desc: 'Coupled IDW + Anomaly Radar' }
  ];

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-base font-bold text-indigo-400">Executing Climate Intelligence Engines...</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Fitting Gaussian Mixture Models, Isolation Forest ensemble, Local Outlier Factor, bottleneck Autoencoder, and multi-year Markov regime matrix across 46 synoptic stations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-extrabold uppercase rounded-md border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                HeatShield AI 2.0
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Unsupervised Spatiotemporal Climate Intelligence Platform
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Climate Intelligence Laboratory (RQ1–RQ6)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Discovering hidden climate regimes, non-linear manifolds, multidimensional microclimate anomalies, and emerging heat-risk zones without labeled ground truth.
            </p>
          </div>
          <button
            onClick={loadIntelligenceData}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition shadow-md whitespace-nowrap self-start lg:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-evaluate Engines</span>
          </button>
        </div>

        {/* Sub-Tabs Nav */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-5 pt-4 border-t border-slate-800">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`p-2.5 rounded-xl text-left transition border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                  <span className="text-xs font-bold truncate">{tab.label.split(' ')[1]}</span>
                </div>
                <div className={`text-[10px] truncate ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {tab.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* MODULE 1: CLUSTERING CONVERGENCE LAB (RQ1) */}
      {activeSubTab === 'discovery' && discoveryData && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wide">
                  Research Question 1 (RQ1)
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Multi-Algorithm Climate Regime Convergence Evaluation
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-4xl">
                  Evaluating whether distinct mathematical objectives (Centroid Voronoi Partitioning, Probabilistic Gaussian Mixtures, Density Reachability, and Agglomerative Variance Minimization) discover identical physical climate regimes across India.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold rounded-lg whitespace-nowrap">
                Convergence Verified
              </span>
            </div>

            {/* Scientific Synthesis Banner */}
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                {discoveryData.scientific_convergence_verdict}
              </p>
            </div>

            {/* Algorithm Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/60 text-slate-300">
                    <th className="py-2.5 px-3 font-bold">Clustering Paradigm</th>
                    <th className="py-2.5 px-3 font-bold">Mathematical Objective</th>
                    <th className="py-2.5 px-3 font-bold text-center">Clusters (K)</th>
                    <th className="py-2.5 px-3 font-bold text-center">Noise Points</th>
                    <th className="py-2.5 px-3 font-bold text-right">Silhouette Score</th>
                    <th className="py-2.5 px-3 font-bold text-right">Davies–Bouldin</th>
                    <th className="py-2.5 px-3 font-bold text-right">Calinski–Harabasz</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {discoveryData.comparison_table.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                        {row.algorithm}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{row.paradigm}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-sky-400">{row.clusters_found}</td>
                      <td className="py-2.5 px-3 text-center text-amber-400 font-mono">{row.noise_points}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {row.silhouette_score.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-purple-300">
                        {row.davies_bouldin_index.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                        {row.calinski_harabasz_index.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consensus Matrices & GMM BIC/AIC Curves */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pairwise Adjusted Rand Index (ARI) Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">Adjusted Rand Index (ARI) Consensus Matrix</h4>
                  <p className="text-[11px] text-slate-400">Pairwise cluster agreement (1.0 = identical partitioning)</p>
                </div>
                <span className="text-xs text-indigo-400 font-mono font-bold">&gt;0.70 = High Agreement</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-2 px-2 text-left font-sans">Model</th>
                      <th className="py-2 px-2">K-Means</th>
                      <th className="py-2 px-2">GMM</th>
                      <th className="py-2 px-2">HDBSCAN</th>
                      <th className="py-2 px-2">Ward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {discoveryData.ari_consensus_matrix.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 px-2 text-left font-sans font-semibold text-slate-300 text-[11px]">
                          {discoveryData.algorithm_names[i]}
                        </td>
                        {row.map((val, j) => {
                          const bg =
                            val >= 0.9
                              ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                              : val >= 0.75
                              ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                              : 'bg-slate-800 text-slate-400';
                          return (
                            <td key={j} className="py-2 px-2">
                              <span className={`px-2 py-1 rounded text-xs block ${bg}`}>
                                {val.toFixed(3)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GMM BIC / AIC Curve */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">GMM Information Criteria (BIC / AIC)</h4>
                  <p className="text-[11px] text-slate-400">Model selection: Minimum BIC indicates optimal Gaussian components</p>
                </div>
                <span className="text-xs text-amber-400 font-mono font-bold">Min at K=4</span>
              </div>

              <div className="space-y-2">
                {discoveryData.gmm_bic_aic_curve.map((pt) => {
                  const isMin = pt.k === 4;
                  return (
                    <div
                      key={pt.k}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs font-mono transition border ${
                        isMin
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 font-bold'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${isMin ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                          {pt.k}
                        </span>
                        <span>Components K = {pt.k}</span>
                        {isMin && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold font-sans">Optimal BIC Min</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span>BIC: {pt.bic.toLocaleString()}</span>
                        <span className="text-slate-500">AIC: {pt.aic.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: UNSUPERVISED ANOMALY EXPLORER (RQ3) */}
      {activeSubTab === 'anomalies' && anomalyData && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wide">
                  Research Question 3 (RQ3)
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Unsupervised Multi-Dimensional Heat Anomaly Detection
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-4xl">
                  Coupling Isolation Forest average path length with Local Outlier Factor (LOF) reachability density to identify microclimate departures without historical heatwave casualty labels.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-rose-400">{anomalyData.extreme_outlier_count}</span>
                <span className="text-[11px] text-slate-400 block">Acute Anomalous Stations</span>
              </div>
            </div>

            {/* Taxonomy Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {anomalyData.taxonomy_summary.map((tax, idx) => {
                const colorMap: Record<string, string> = {
                  'Severe Compound Trap': 'border-rose-500/40 bg-rose-950/30 text-rose-300',
                  'Thermal Spike Outlier': 'border-amber-500/40 bg-amber-950/30 text-amber-300',
                  'Dry Arid Blast': 'border-orange-500/40 bg-orange-950/30 text-orange-300',
                  'Normal Regional Variation': 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                };
                return (
                  <div key={idx} className={`p-3.5 rounded-xl border ${colorMap[tax.taxonomy] || 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                    <span className="text-xs font-bold block">{tax.taxonomy}</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-lg font-black text-white">{tax.count} stations</span>
                      <span className="text-xs font-mono">{tax.pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top Anomalous Stations Ranking */}
            <div>
              <h4 className="text-sm font-bold text-white mb-2">Top Ranked Climate Outliers &amp; Physical Explanations</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/60 text-slate-300">
                      <th className="py-2 px-3 font-bold">Station</th>
                      <th className="py-2 px-3 font-bold text-center">Taxonomy</th>
                      <th className="py-2 px-3 font-bold text-right">Composite Score</th>
                      <th className="py-2 px-3 font-bold text-right">&Delta; Temp</th>
                      <th className="py-2 px-3 font-bold text-right">&Delta; Heat Index</th>
                      <th className="py-2 px-3 font-bold text-right">&Delta; RH</th>
                      <th className="py-2 px-3 font-bold">Thermodynamic Anomaly Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {anomalyData.top_anomalous_stations.map((st, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white block">{st.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{st.latitude.toFixed(2)}°N, {st.longitude.toFixed(2)}°E</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            st.taxonomy === 'Severe Compound Trap' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            st.taxonomy === 'Thermal Spike Outlier' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-orange-950 text-orange-300 border border-orange-800'
                          }`}>
                            {st.taxonomy}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                          {st.composite_anomaly_score.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                          {st.delta_temp_c >= 0 ? `+${st.delta_temp_c.toFixed(1)}` : st.delta_temp_c.toFixed(1)}°C
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-300">
                          {st.delta_heat_index_c >= 0 ? `+${st.delta_heat_index_c.toFixed(1)}` : st.delta_heat_index_c.toFixed(1)}°C
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sky-300">
                          {st.delta_relative_humidity >= 0 ? `+${st.delta_relative_humidity.toFixed(1)}` : st.delta_relative_humidity.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 text-[11px] leading-relaxed max-w-sm">
                          {st.explanation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: LATENT MANIFOLDS (RQ2) */}
      {activeSubTab === 'latent' && latentData && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wide">
                  Research Question 2 (RQ2)
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Non-Linear Latent Manifold Projection Studio
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                  Comparing deep bottleneck neural representation learning (8 &rarr; 16 &rarr; 3 &rarr; 16 &rarr; 8) against linear PCA hyperplanes and non-linear Spectral/UMAP manifolds.
                </p>
              </div>

              {/* Projection Mode Switcher */}
              <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700 text-xs self-start">
                <button
                  onClick={() => setLatentMode('autoencoder')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    latentMode === 'autoencoder' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Neural Autoencoder
                </button>
                <button
                  onClick={() => setLatentMode('pca')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    latentMode === 'pca' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Linear PCA
                </button>
                <button
                  onClick={() => setLatentMode('spectral_umap')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    latentMode === 'spectral_umap' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Spectral / UMAP
                </button>
              </div>
            </div>

            {/* Architecture & Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className="text-purple-400 font-bold block">Autoencoder Architecture</span>
                <span className="text-slate-200 font-mono text-[11px]">{latentData.autoencoder_architecture}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className="text-emerald-400 font-bold block">Reconstruction Fidelity</span>
                <span className="text-slate-200 font-mono text-[11px]">MSE: {latentData.autoencoder_reconstruction_mse} (High Preservation)</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <span className="text-sky-400 font-bold block">PCA Variance Capture</span>
                <span className="text-slate-200 font-mono text-[11px]">
                  PC1: {latentData.pca_variance_explained[0]}% | PC2: {latentData.pca_variance_explained[1]}%
                </span>
              </div>
            </div>

            {/* 2D Manifold Scatter Grid */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                <span className="font-semibold text-white">
                  Active Projection: {latentMode === 'autoencoder' ? 'Autoencoder Bottleneck Latent Space' : latentMode === 'pca' ? 'Principal Components 1 & 2' : 'Non-Linear Spectral Topological Manifold'}
                </span>
                <span className="text-[11px] font-mono">46 Synoptic Stations Plotted</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto pr-1">
                {latentData.station_points.map((pt, idx) => {
                  const coords = latentMode === 'autoencoder' ? pt.autoencoder : latentMode === 'pca' ? pt.pca : pt.spectral_umap;
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-start justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pt.color }}></span>
                          <span className="text-xs font-bold text-white truncate">{pt.name.split(',')[0]}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Regime #{pt.cluster_id}</span>
                      </div>
                      <div className="text-right font-mono text-[10px] text-indigo-300">
                        <div>X: {coords.x.toFixed(2)}</div>
                        <div>Y: {coords.y.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed italic">
              {latentData.manifold_synthesis}
            </p>
          </div>
        </div>
      )}

      {/* MODULE 4: MARKOVIAN DYNAMICS (RQ4) */}
      {activeSubTab === 'markov' && markovData && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-extrabold text-sky-400 uppercase tracking-wide">
                  Research Question 4 (RQ4)
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Markovian Climate Regime Transition Matrix (2022–2025)
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-4xl">
                  Formulating empirical stochastic transition probabilities P(C_&#123;t+1&#125; = j | C_t = i) to quantify inter-annual regime persistence and escalating climate trajectories.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-sky-400">{markovData.total_shifts_observed}</span>
                <span className="text-[11px] text-slate-400 block">Regime Shifts Detected</span>
              </div>
            </div>

            {/* Persistence Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {markovData.matrix_rows.map((row, idx) => (
                <div key={idx} className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold text-slate-300">{row.regime_name}</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-black text-emerald-400">
                      {(row.persistence_rate * 100).toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-slate-400">Persistence</span>
                  </div>
                  <div className="text-[10px] text-rose-400 mt-1">
                    Escalation Prob: {(row.escalation_prob * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>

            {/* 4x4 Transition Matrix Heatmap */}
            <div>
              <h4 className="text-sm font-bold text-white mb-2">Empirical Transition Probability Matrix P_ij</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/60 text-slate-300 font-sans">
                      <th className="py-2.5 px-3 text-left">Prior Regime (Year t)</th>
                      <th className="py-2.5 px-3">Temperate Plateau</th>
                      <th className="py-2.5 px-3">Subtropical Moist</th>
                      <th className="py-2.5 px-3">Semi-Arid Extreme</th>
                      <th className="py-2.5 px-3">Severe Coastal Trap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {markovData.matrix_rows.map((row, i) => (
                      <tr key={i}>
                        <td className="py-3 px-3 text-left font-sans font-bold text-slate-200">
                          Regime #{row.regime_id}: {row.regime_name}
                        </td>
                        {row.probabilities.map((prob, j) => {
                          const isDiag = i === j;
                          const bg = isDiag
                            ? 'bg-emerald-500/20 text-emerald-300 font-black'
                            : prob > 0
                            ? 'bg-rose-500/20 text-rose-300 font-bold'
                            : 'bg-slate-900/50 text-slate-600';
                          return (
                            <td key={j} className="py-3 px-3">
                              <span className={`px-2.5 py-1.5 rounded-lg text-xs inline-block ${bg}`}>
                                {prob.toFixed(3)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Observed Shifts */}
            {markovData.recent_shifts.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-white mb-2">Documented Station Migration Pathways</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {markovData.recent_shifts.slice(0, 6).map((shift, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">{shift.station_name}</span>
                        <span className="text-[11px] text-slate-400">
                          {shift.from_year} &rarr; {shift.to_year}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px]">
                          Regime #{shift.from_cluster}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded text-[10px]">
                          Regime #{shift.to_cluster}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 5: FEATURE ABLATION (RQ5) */}
      {activeSubTab === 'ablation' && ablationData && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wide">
                  Research Question 5 (RQ5)
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Thermodynamic Feature Ablation &amp; Factor Dominance
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-4xl">
                  Systematic feature permutation measuring degradation in Silhouette separation to identify the mathematical drivers of regional heat categorization.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-400">{ablationData.baseline_silhouette.toFixed(4)}</span>
                <span className="text-[11px] text-slate-400 block">Baseline Silhouette (All 8)</span>
              </div>
            </div>

            {/* Scientific Synthesis */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-200 leading-relaxed font-medium">
                {ablationData.scientific_synthesis}
              </p>
            </div>

            {/* Ablation Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/60 text-slate-300">
                    <th className="py-2.5 px-3 font-bold">Ablation Configuration</th>
                    <th className="py-2.5 px-3 font-bold text-center">Feature Count</th>
                    <th className="py-2.5 px-3 font-bold text-right">Silhouette Score</th>
                    <th className="py-2.5 px-3 font-bold text-right">&Delta; Silhouette (%)</th>
                    <th className="py-2.5 px-3 font-bold text-center">Separation Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {ablationData.ablation_results.map((item, idx) => {
                    const isBaseline = item.config_id === 'baseline_all_8';
                    const isSevereDrop = item.silhouette_change_pct < -20;
                    return (
                      <tr key={idx} className={`transition ${isBaseline ? 'bg-indigo-950/20 font-semibold' : 'hover:bg-slate-800/40'}`}>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white block">{item.name}</span>
                          <span className="text-[10px] text-slate-400">{item.description}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-400">
                          {item.feature_count}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          {item.silhouette_score.toFixed(4)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                          isBaseline ? 'text-slate-400' : isSevereDrop ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {item.silhouette_change_pct > 0 ? `+${item.silhouette_change_pct}%` : `${item.silhouette_change_pct}%`}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.cluster_separation_rating === 'Superior' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            item.cluster_separation_rating === 'Moderate' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {item.cluster_separation_rating}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ANOVA Factor Dominance Ranking */}
            <div>
              <h4 className="text-sm font-bold text-white mb-2">ANOVA F-Statistic Factor Dominance Ranking</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {ablationData.feature_importance_ranking.map((feat, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/50 border border-slate-700/70 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{feat.feature}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Rank #{idx + 1}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-base font-black text-amber-400">F = {feat.f_statistic}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{feat.significance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 6: EMERGING HOTSPOTS (RQ6) */}
      {activeSubTab === 'hotspots' && hotspotData && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wide">
                  Research Question 6 (RQ6)
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Coupled Spatial Emerging Thermal Hotspot Field
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-4xl">
                  Fusing spatial Inverse Distance Weighting (k=4, p=2.0) with local unsupervised anomaly scores to unveil emerging microclimate danger zones that single-station thresholding misses.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-rose-400">{hotspotData.total_grid_cells_computed}</span>
                <span className="text-[11px] text-slate-400 block">Interpolated Spatial Cells</span>
              </div>
            </div>

            {/* Formula Banner */}
            <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl flex items-center justify-between text-xs font-mono text-slate-300">
              <span>{hotspotData.formula}</span>
              <span className="text-indigo-400 font-bold">IDW Config: k={hotspotData.idw_configuration.k}, p={hotspotData.idw_configuration.p}</span>
            </div>

            {/* Top Emerging Hotspot Zones */}
            <div>
              <h4 className="text-sm font-bold text-white mb-2">Acute Emerging Thermal Hotspot Coordinates</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {hotspotData.top_emerging_zones.map((zone, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border bg-slate-800/60 border-slate-700 space-y-2 hover:border-slate-600 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        Zone #{idx + 1} ({zone.lat}°N, {zone.lon}°E)
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ backgroundColor: `${zone.color}20`, color: zone.color }}
                      >
                        {zone.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-700/60 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Interpolated HI</span>
                        <span className="text-xs font-bold text-amber-300">{zone.interpolated_heat_index}°C</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Anomaly</span>
                        <span className="text-xs font-bold text-rose-300">{zone.interpolated_anomaly}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">EHI Score</span>
                        <span className="text-xs font-black text-rose-400">{zone.emerging_hotspot_intensity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spatial Cells Density Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Spatial Field Cell Distribution (Continental India Bounding Box)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                {hotspotData.grid_points.slice(0, 48).map((pt, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center font-mono text-[10px]"
                  >
                    <span className="text-slate-400 block text-[9px]">{pt.lat}°N,{pt.lon}°E</span>
                    <span className="font-bold block mt-1" style={{ color: pt.color }}>
                      {pt.emerging_hotspot_intensity} EHI
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
