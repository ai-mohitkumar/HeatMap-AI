import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import type { ClusterEvaluation, OptimalKRecommendation, FeatureSeparation, ClusterStabilityResult } from '../types';
import { Award, CheckCircle2, TrendingDown, Sparkles, Activity, BarChart2, ShieldCheck } from 'lucide-react';

interface ModelEvaluationProps {
  evaluations: ClusterEvaluation[];
  optimalKData: OptimalKRecommendation | null;
  featureSeparation: FeatureSeparation[];
  stability?: ClusterStabilityResult | null;
  activeK: number;
  onSelectK: (k: number) => void;
}

export const ModelEvaluation: React.FC<ModelEvaluationProps> = ({
  evaluations,
  optimalKData,
  featureSeparation,
  stability,
  activeK,
  onSelectK
}) => {
  return (
    <div className="space-y-6">
      {/* Automated Recommendation Banner */}
      {optimalKData && (
        <div className="bg-gradient-to-r from-sky-900/40 via-indigo-900/40 to-slate-900 border border-sky-500/30 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  Algorithmic Decision Support Engine
                </span>
              </div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                Recommended Configuration: K = {optimalKData.optimal_k} Clusters
                {activeK === optimalKData.optimal_k && (
                  <span className="text-xs px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Currently Active
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
                {optimalKData.rationale}
              </p>
            </div>

            {activeK !== optimalKData.optimal_k && (
              <button
                onClick={() => onSelectK(optimalKData.optimal_k)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition shadow-md shrink-0 flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                Switch to K = {optimalKData.optimal_k}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cluster Stability Test Card (20 Random Seeds) */}
      {stability && (
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cluster Partition Stability Evaluation (20-Seed Bootstrap)
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold font-mono uppercase">
                    {stability.stability_tier} ({stability.stability_percentage}% Consistency)
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                  {stability.scientific_rationale}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 self-end md:self-center border-t md:border-t-0 md:border-l border-emerald-200 dark:border-emerald-900/60 pt-2 md:pt-0 md:pl-5 text-right">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Seeds Tested
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                  {stability.n_seeds_tested} Runs
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Mean Pairwise ARI
                </span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {stability.mean_pairwise_ari.toFixed(4)}
                </span>
              </div>
              {stability.mean_pairwise_nmi !== undefined && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Mean NMI Score
                  </span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {stability.mean_pairwise_nmi.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seed Agreement Grid / Visual Micro-Bar */}
          {stability.seed_agreement_curve && stability.seed_agreement_curve.length > 0 && (
            <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Initialization Invariance across Seeds 1..{stability.seed_agreement_curve.length} (vs. Seed 42 Baseline)
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Min ARI: {stability.min_pairwise_ari.toFixed(4)} | Max ARI: {stability.max_pairwise_ari.toFixed(4)}
                </span>
              </div>
              <div className="grid grid-cols-10 sm:grid-cols-20 gap-1.5">
                {stability.seed_agreement_curve.map((sa) => (
                  <div
                    key={sa.seed}
                    title={`Seed ${sa.seed}: ARI = ${sa.ari_to_baseline.toFixed(4)}`}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center"
                  >
                    <span className="text-[9px] font-mono text-slate-400">s{sa.seed}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {sa.ari_to_baseline.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Curves Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Chart 1: WCSS Elbow Method */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-blue-500" />
                Elbow Method (WCSS)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Within-Cluster Sum of Squares (Inertia)</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evaluations} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="k" stroke="#94a3b8" fontSize={12} label={{ value: 'K', position: 'insideBottomRight', offset: -5 }} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="wcss"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6, fill: '#60a5fa' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Silhouette Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Silhouette Score
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cluster separation quality (Higher is better)</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evaluations} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="k" stroke="#94a3b8" fontSize={12} label={{ value: 'K', position: 'insideBottomRight', offset: -5 }} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="silhouette_score"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Davies-Bouldin Index */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-500" />
                Davies–Bouldin Index
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cluster similarity index (Lower is better)</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evaluations} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="k" stroke="#94a3b8" fontSize={12} label={{ value: 'K', position: 'insideBottomRight', offset: -5 }} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="davies_bouldin_index"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f43f5e' }}
                  activeDot={{ r: 6, fill: '#fb7185' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Feature Separation Power (ANOVA) & Multi-K Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Multi-Configuration Evaluation Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Multi-Configuration Evaluation Table (K = 2 to K = 8)
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Weighted composite: 35% Sil + 35% DB + 30% Interpretability
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Clusters</th>
                  <th className="py-2.5 px-3">WCSS</th>
                  <th className="py-2.5 px-3">Silhouette</th>
                  <th className="py-2.5 px-3">Davies–Bouldin</th>
                  <th className="py-2.5 px-3">Calinski–Harabasz</th>
                  <th className="py-2.5 px-3">Domain Fit</th>
                  <th className="py-2.5 px-3">Composite</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {evaluations.map((row) => {
                  const isOptimal = optimalKData?.optimal_k === row.k;
                  const isActive = activeK === row.k;
                  return (
                    <tr
                      key={row.k}
                      className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        isActive ? 'bg-sky-50/70 dark:bg-sky-950/30 font-bold text-sky-900 dark:text-sky-300' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 flex items-center gap-1.5">
                        <span>K = {row.k}</span>
                        {isOptimal && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 rounded font-bold">
                            Optimal
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{row.wcss.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                        {row.silhouette_score.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-600 dark:text-rose-400">
                        {row.davies_bouldin_index.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{row.calinski_harabasz_index.toFixed(1)}</td>
                      <td className="py-2.5 px-3" title={row.interpretability_assessment || ''}>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500 font-mono text-xs">{row.interpretability_stars || '★★★☆☆'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold">
                        {row.composite_score !== undefined ? row.composite_score.toFixed(3) : '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => onSelectK(row.k)}
                          disabled={isActive}
                          className={`px-2 py-0.5 rounded text-xs transition ${
                            isActive
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-default'
                              : 'bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600'
                          }`}
                        >
                          {isActive ? 'Active' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Importance & Cluster Separation Power (ANOVA & Kruskal-Wallis) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
              <BarChart2 className="w-4 h-4 text-amber-500" />
              Feature Separation Power (ANOVA & KW)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Parametric ANOVA (F) &amp; Non-parametric Kruskal-Wallis (H)
            </p>

            <div className="space-y-2.5">
              {featureSeparation.map((f, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]" title={f.feature}>
                      {f.feature}
                    </span>
                    <span className="font-mono text-slate-500 font-semibold text-[11px]">
                      F={f.f_statistic.toFixed(1)} | H={f.kruskal_statistic !== undefined ? f.kruskal_statistic.toFixed(1) : '-'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${f.separation_score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <p>
              <strong>Statistical Separation:</strong> Evaluates feature-level discriminative variance across clusters, <em>not model predictive accuracy</em> (clustering is unsupervised).
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              High F and H statistics confirm thermal and moisture indicators independently differentiate biometeorological profiles.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
