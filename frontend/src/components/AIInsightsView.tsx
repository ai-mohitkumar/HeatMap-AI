import React from 'react';
import type { AIInsights } from '../types';
import { Bot, Sparkles, Shield, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

interface AIInsightsViewProps {
  insights: AIInsights | null;
  onExportReport: () => void;
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({ insights, onExportReport }) => {
  if (!insights) {
    return <div className="h-96 flex items-center justify-center text-slate-400">Synthesizing AI intelligence brief...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Bot className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                AI Intelligence & Natural Language Synthesis Layer
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              Automated Biometeorological Decision Intelligence
            </h3>
            <p className="text-sm text-slate-300 max-w-3xl">
              Converts complex multi-dimensional cluster centroids, thermodynamic distributions, and multi-year anomalies
              into human-interpretable risk intelligence for municipal disaster response.
            </p>
          </div>

          <button
            onClick={onExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md"
          >
            <FileText className="w-4 h-4" />
            Export Executive Brief (.md)
          </button>
        </div>
      </div>

      {/* Key Takeaways Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Key Analytical Takeaways (Machine Learning Synthesis)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {insights.key_takeaways.map((takeaway, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 flex items-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {takeaway}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Civil Defense Directive & Temporal Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Civil Defense Brief */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-red-500" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Civil Defense & Resource Allocation Protocol
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {insights.civil_defense_brief}
            </p>
          </div>

          <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-slate-800 dark:text-slate-200">
            <span className="font-bold text-red-600 dark:text-red-400 block mb-1">
              Critical Action Profile:
            </span>
            Focus immediate cooling intervention tankers and emergency hydration points on <strong>{insights.recommended_focus_profile}</strong>.
          </div>
        </div>

        {/* Multi-Year Longitudinal Observation */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-5 h-5 text-amber-500" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Year Longitudinal Observation
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              {insights.temporal_trend_narrative}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              *Note: Changes in cluster assignment indicate empirical shifts in observed meteorological features across summer seasons, providing decision-support rather than clinical causality.
            </p>
          </div>

          <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">
              Baseline Contrast:
            </span>
            {insights.baseline_comparison}
          </div>
        </div>

      </div>
    </div>
  );
};
