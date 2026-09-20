import React from 'react';
import type { DataQualityMetrics, CoverageMetrics } from '../types';
import { ShieldCheck, Database, MapPin, Calendar, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DataQualityCardProps {
  quality: DataQualityMetrics | null;
  coverage: CoverageMetrics | null;
}

export const DataQualityCard: React.FC<DataQualityCardProps> = ({ quality, coverage }) => {
  if (!quality) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
      {/* Header & Overall Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            NOAA GSOD Dataset Quality & Station Coverage Audit
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validated against authentic surface observation records across 4 summer seasons (2022–2025)
          </p>
        </div>

        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Data Quality Index
            </span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono leading-none">
              {quality.data_quality_score}%
            </span>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        </div>
      </div>

      {/* Grid of Quality Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            <span>Total Records</span>
          </div>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
            {quality.total_records.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Multi-Year Daily</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span>Ground Stations</span>
          </div>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
            {quality.unique_stations}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">5 Climatic Zones</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
            <span>Time Horizon</span>
          </div>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
            2022–2025
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Summer (Apr–Jun)</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Missing Flags</span>
          </div>
          <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {quality.missing_values_pct}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{quality.missing_values_count} cells imputed</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
            <span>Valid Stations</span>
          </div>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
            {quality.complete_stations} / {quality.unique_stations}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">100% Census</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Outliers Cleaned</span>
          </div>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
            {quality.outliers_count} records
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Physically Bounded</span>
        </div>
      </div>

      {/* Multi-Year Coverage Bars */}
      {coverage && coverage.coverage_by_year && (
        <div className="bg-slate-50/70 dark:bg-slate-850/70 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            <span>Multi-Year Observation Coverage Breakdown:</span>
            <span className="text-slate-500 font-mono font-normal">
              {coverage.total_observations.toLocaleString()} total daily vectors
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {coverage.coverage_by_year.map((yr) => (
              <div key={yr.year} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    Season {yr.year}
                  </span>
                  <span className="text-slate-500 text-[11px] font-mono">
                    {yr.observation_count} obs ({yr.share_percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${yr.share_percentage * 4}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Scientific Station Selection Criteria */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Station Selection Rationale:</strong> {coverage.selection_criteria}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
