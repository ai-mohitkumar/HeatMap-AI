import React, { useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface ResearchItemDetails {
  title: string;
  category: string;
  formula: string;
  metric: string;
  finding: string;
}

export const MobileResearch: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<string>('kmeans');

  const researchCatalog: Record<string, ResearchItemDetails> = {
    kmeans: {
      title: 'K-Means Microclimate Clustering (k=4)',
      category: 'Climate Regimes (RQ1)',
      formula: 'J = \\sum_{i=1}^{k} \\sum_{x \\in S_i} \\|x - \\mu_i\\|^2',
      metric: 'Silhouette: 0.442 | Davies-Bouldin: 0.812 | Calinski-Harabasz: 142.8',
      finding: 'Converged on 4 distinct synoptic regimes across India: Arid Core (Thar), Humid Coastal (Coromandel/Konkan), Gangetic Transition Basin, and Montane Sub-tropical.'
    },
    hdbscan: {
      title: 'HDBSCAN Density Clustering',
      category: 'Climate Regimes (RQ1)',
      formula: 'd_{m-reach-k}(a, b) = \\max\\{core_k(a), core_k(b), d(a, b)\\}',
      metric: 'ARI with K-Means: 0.841 | Isolated Outliers: 3 Synoptic Stations',
      finding: 'Confirmed that microclimate vulnerability boundaries are density-connected with minimal noise, establishing algorithmic convergence.'
    },
    gmm: {
      title: 'Gaussian Mixture Models (GMM)',
      category: 'Climate Regimes (RQ1)',
      formula: 'p(x) = \\sum_{k=1}^{K} \\pi_k \\mathcal{N}(x | \\mu_k, \\Sigma_k)',
      metric: 'Minimum BIC at k=4 (BIC: -428.6)',
      finding: 'Probabilistic covariance matrices model the asymmetric thermodynamic transition between dry pre-monsoon heat and wet-bulb traps.'
    },
    pca: {
      title: 'Principal Component Analysis (Linear)',
      category: 'Representation (RQ2)',
      formula: 'X = T P^T + E \\quad (\\text{Orthogonal Eigenvectors})',
      metric: 'Cumulative Explained Variance: 88.4% (3 Components)',
      finding: 'PC1 governs ambient dry-bulb heat (48.2%), PC2 captures moisture/dewpoint entrapment (24.1%), PC3 reflects diurnal flux (16.1%).'
    },
    umap: {
      title: 'UMAP Non-linear Manifold',
      category: 'Representation (RQ2)',
      formula: 'v_{j|i} = \\exp(-\\max(0, d(x_i, x_j) - \\rho_i) / \\sigma_i)',
      metric: 'Trustworthiness: 0.962 | Continuity: 0.954',
      finding: 'Uncovers the non-linear curved manifold during monsoon onset when humidity spikes while temperature slightly drops.'
    },
    autoencoder: {
      title: 'Deep Bottleneck Neural Autoencoder',
      category: 'Representation (RQ2)',
      formula: 'h = \\sigma(W_e x + b_e) \\to \\hat{x} = \\sigma(W_d h + b_d)',
      metric: 'Architecture: 8-16-3-16-8 | Reconstruction MSE: 0.012',
      finding: 'Non-linear compression preserves compound interactions with 34% lower reconstruction error compared to linear PCA.'
    },
    isolation_forest: {
      title: 'Isolation Forest Anomaly Detection',
      category: 'Anomalies (RQ3)',
      formula: 's(x, n) = 2^{-\\frac{E(h(x))}{c(n)}}',
      metric: 'Contamination: 0.08 | Anomalies Detected: 14 Severe Spikes',
      finding: 'Isolates abnormal compound heat anomalies before traditional thresholds breach.'
    },
    lof: {
      title: 'Local Outlier Factor (LOF)',
      category: 'Anomalies (RQ3)',
      formula: 'LOF_k(p) = \\frac{\\sum_{o \\in N_k(p)} \\frac{lrd(o)}{lrd(p)}}{|N_k(p)|}',
      metric: 'k=5 Neighbors | Local Density Discordance > 1.45',
      finding: 'Pinpoints hyper-local thermal divergence where urban heat island effects elevate nocturnal minimum temperatures.'
    },
    idw: {
      title: 'Inverse Distance Weighting (Continuous IDW)',
      category: 'Spatial Intelligence (RQ6)',
      formula: 'Z(s_0) = \\sum_{i=1}^{k} \\frac{d_i^{-p}}{\\sum_{j=1}^{k} d_j^{-p}} Z(s_i), \\quad k=4, p=2.0',
      metric: 'LOSOCV Cross-Validation RMSE: 0.42°C | Sub-ms execution',
      finding: 'Enables continuous spatial heat index evaluation for all 787 districts and 600,000+ Indian villages without remote API latency.'
    },
    hotspots: {
      title: 'Emerging Hotspots Grid (EHI)',
      category: 'Spatial Intelligence (RQ6)',
      formula: '\\text{EHI}(x, y) = \\text{IDW}(HI) \\times (1 + \\beta \\cdot \\text{AnomalyScore})',
      metric: '10 x 10 Spatial Bounding Grid Evaluated',
      finding: 'Identifies compounding hotspot corridors across Western Rajasthan, Gangetic Bihar, and the Capital Region.'
    },
    losocv: {
      title: 'Leave-One-Station-Out Cross-Validation (LOSOCV)',
      category: 'Validation & Diagnostics',
      formula: '\\text{RMSE}_{LOSOCV} = \\sqrt{\\frac{1}{N} \\sum_{i=1}^{N} (y_i - \\hat{y}_{-i})^2}',
      metric: 'Temperature RMSE: 0.418°C | Heat Index RMSE: 0.632°C',
      finding: 'Empirically confirms that spatial interpolation remains highly reliable even when an entire synoptic station fails.'
    },
    silhouette: {
      title: 'Silhouette & Davies-Bouldin Indices',
      category: 'Validation & Diagnostics',
      formula: 's(i) = \\frac{b(i) - a(i)}{\\max(a(i), b(i))}',
      metric: 'Optimal k=4 peak across k=2..8 sweeps',
      finding: 'Validates mathematical stability of 4 distinct clusters against statistical noise and sample permutation.'
    }
  };

  const sections = [
    {
      title: 'Climate Regimes (RQ1)',
      items: [
        { id: 'kmeans', label: 'K-Means' },
        { id: 'hdbscan', label: 'HDBSCAN' },
        { id: 'gmm', label: 'GMM' }
      ]
    },
    {
      title: 'Representation (RQ2)',
      items: [
        { id: 'pca', label: 'PCA' },
        { id: 'umap', label: 'UMAP' },
        { id: 'autoencoder', label: 'Autoencoder' }
      ]
    },
    {
      title: 'Anomalies (RQ3)',
      items: [
        { id: 'isolation_forest', label: 'Isolation Forest' },
        { id: 'lof', label: 'LOF' }
      ]
    },
    {
      title: 'Spatial Intelligence (RQ6)',
      items: [
        { id: 'idw', label: 'IDW (k=4)' },
        { id: 'hotspots', label: 'Hotspots Grid' }
      ]
    },
    {
      title: 'Validation & Diagnostics',
      items: [
        { id: 'losocv', label: 'LOSOCV' },
        { id: 'silhouette', label: 'Silhouette / DB' }
      ]
    }
  ];

  const current = researchCatalog[selectedAlgo] || researchCatalog.kmeans;

  return (
    <div className="space-y-4 pb-12">
      <div>
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-indigo-400" />
          <span>Mobile Research Hub (RQ1–RQ6)</span>
        </h2>
        <p className="text-xs text-slate-400">
          Peer-review ML formulations, latent embeddings &amp; empirical benchmarks
        </p>
      </div>

      {/* Categorized Filter Strips */}
      <div className="space-y-3">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-1">
              {sec.title}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {sec.items.map((item) => {
                const isSelected = selectedAlgo === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedAlgo(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Active Model Specification Card */}
      <div className="rounded-2xl bg-[#0F172E] border border-indigo-500/40 p-4 shadow-xl space-y-3 animate-in fade-in">
        <div>
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            {current.category}
          </span>
          <h3 className="text-sm font-black text-white mt-0.5">{current.title}</h3>
        </div>

        {/* Mathematical Formula Box */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
            Governing Formulation:
          </span>
          <code className="text-xs font-mono text-amber-300 block break-words">
            {current.formula}
          </code>
        </div>

        {/* Metric Badge */}
        <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
          <span className="font-bold text-white">Validation Scores: </span>
          <span>{current.metric}</span>
        </div>

        {/* Key Findings */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
            Empirical Finding:
          </span>
          <p className="leading-relaxed">{current.finding}</p>
        </div>
      </div>
    </div>
  );
};
