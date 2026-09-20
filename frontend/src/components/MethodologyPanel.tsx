import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingUp,
  Activity,
  Info
} from 'lucide-react';

interface PipelineStep {
  id: number;
  title: string;
  shortDesc: string;
  co: string;
  formula: string;
  details: string;
  icon: any;
  color: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 1,
    title: 'NOAA GSOD Ingestion',
    shortDesc: '3,680 records across 46 stations',
    co: 'CO2',
    formula: 'T, T_dew, SLP, WDSP, PRCP from NOAA Surface Observations',
    details: 'Ingests multi-year (2022–2025) daily surface weather observations from the official NOAA Global Summary of the Day dataset across diverse Indian biometeorological zones.',
    icon: Database,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900'
  },
  {
    id: 2,
    title: 'Data Quality & Imputation',
    shortDesc: '98.3% Data Quality Score',
    co: 'CO2',
    formula: 'x_imputed = Median(Station) fallback Median(Global)',
    details: 'Detects and cleans NOAA sensor missing flags (9999.9, 999.9), applies station-level median imputation, bounds physical outliers, and converts imperial units into metric SI units (°C, km/h, hPa).',
    icon: CheckCircle2,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900'
  },
  {
    id: 3,
    title: 'Feature Engineering',
    shortDesc: 'Magnus-Tetens RH, Rothfusz HI, HSI',
    co: 'CO2',
    formula: 'RH = 100 * exp(17.625*Td/(243.04+Td)) / exp(17.625*T/(243.04+T))',
    details: 'Derives biometeorologically grounded indices: Magnus-Tetens Relative Humidity, Rothfusz NOAA Heat Index, Diurnal Temperature Range (DTR), Canadian Humidex, and continuous Heat Stress Index (HSI: 0–100).',
    icon: Cpu,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
  },
  {
    id: 4,
    title: 'StandardScaler',
    shortDesc: 'Zero mean & unit variance',
    co: 'CO2',
    formula: 'z = (x - μ) / σ',
    details: 'Standardizes variables with radically disparate scales (e.g. Pressure ~1000 hPa vs Temp ~35°C) to prevent high-magnitude features from dominating Euclidean distance calculations.',
    icon: Layers,
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900'
  },
  {
    id: 5,
    title: 'Partition & Hierarchical',
    shortDesc: 'K-Means sweeps (K=2..8) & Ward',
    co: 'CO3',
    formula: 'min Σ ||x_i - μ_k||^2  vs  Ward Linkage min ΔESS',
    details: 'Executes K-Means sweeps across K=2..8 with k-means++ initialization. Benchmarks against Agglomerative Hierarchical Clustering (Ward linkage) evaluating Cophenetic correlation (r = 0.76) and Adjusted Rand Index.',
    icon: Activity,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900'
  },
  {
    id: 6,
    title: 'Multi-Criteria Validation',
    shortDesc: 'Optimal K=4 + 20-seed Stability',
    co: 'CO3',
    formula: 'Score(K) = 0.30*Sil + 0.25*(1-DB) + 0.15*Elbow + 0.30*Interp',
    details: 'Evaluates WCSS Elbow, Silhouette, Davies-Bouldin, and biometeorological interpretability stars. Recommends K=4 with 100% 20-seed stability, avoiding simplistic K=2 binary splits.',
    icon: TrendingUp,
    color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900'
  },
  {
    id: 7,
    title: 'PCA & UMAP Projections',
    shortDesc: 'Orthogonal biplot & manifold',
    co: 'CO5',
    formula: 'C = (1/n) X^T X;  C v_i = λ_i v_i',
    details: 'Computes 2D/3D PCA orthogonal projections revealing thermal vs moisture thermodynamic axes with biplot feature loadings, complemented by non-linear UMAP manifold projection.',
    icon: Sparkles,
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
  },
  {
    id: 8,
    title: 'Profiles & Priority Mapping',
    shortDesc: 'Profiles A..D & Explainability',
    co: 'CO5',
    formula: 'Profile A..D + HSI (0-100) Geospatial Priority Pinning',
    details: 'Maps cluster centroids to data-derived biometeorological profiles, couples with civil defense protocols, and renders geospatial priority maps with station-level indicator explainability.',
    icon: MapPin,
    color: 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900'
  }
];

export const MethodologyPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedStep, setSelectedStep] = useState<PipelineStep>(PIPELINE_STEPS[2]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-850 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/80 transition"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs border border-amber-500/20">
            ML
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              HeatShield AI End-to-End Methodology & Pipeline Flow
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                SIH26083 • CO2, CO3, CO5
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              NOAA GSOD Data → Quality & Cleaning → Feature Engineering → Scaling → Clustering → Multi-K Validation → PCA/UMAP → Priority Mapping
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="hidden sm:inline font-medium">
            {isExpanded ? 'Collapse Architecture' : 'Expand Architecture'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 flex flex-col gap-4">
          {/* Interactive Stepper Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {PIPELINE_STEPS.map((step) => {
              const Icon = step.icon;
              const isSelected = selectedStep.id === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedStep(step)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition relative ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center font-mono">
                      {step.id}
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                      {step.co}
                    </span>
                  </div>
                  <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-amber-500' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight">
                    {step.title}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {step.shortDesc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Step Deep-Dive Card */}
          <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono">
                  Step {selectedStep.id} of 8 • Course Outcome {selectedStep.co}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {selectedStep.title}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedStep.details}
              </p>
            </div>

            <div className="md:w-80 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                <Info className="w-3 h-3 text-amber-500" />
                Mathematical Formulation / Logic:
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 break-words leading-snug">
                {selectedStep.formula}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
