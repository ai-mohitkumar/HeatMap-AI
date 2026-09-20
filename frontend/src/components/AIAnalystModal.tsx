import React, { useState } from 'react';
import type { AIAnalystResponse } from '../types';
import { api } from '../services/api';
import {
  Bot,
  Sparkles,
  X,
  Search,
  Loader2,
  ChevronRight,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

interface AIAnalystModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations?: Array<{ station_id: string; name: string }>;
}

const PRESET_QUERIES = [
  'Why is New Delhi high priority?',
  'Why is Ahmedabad high priority?',
  'What distinguishes Profile C from Profile D?',
  'Which stations are persistently high risk across 2022–2025?',
  'Which meteorological feature has highest discriminative power?'
];

export const AIAnalystModal: React.FC<AIAnalystModalProps> = ({ isOpen, onClose }) => {
  const [queryInput, setQueryInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<AIAnalystResponse | null>(null);

  if (!isOpen) return null;

  const handleRunQuery = async (queryText: string, mode?: string) => {
    if (!queryText.trim()) return;
    try {
      setIsLoading(true);
      setQueryInput(queryText);
      const res = await api.queryAIAnalyst(queryText, mode);
      setResponse(res);
    } catch (err) {
      console.error('Failed to query AI Analyst:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-slate-50 to-slate-100 dark:from-amber-950/20 dark:via-slate-850 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                HeatShield AI Analyst
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold uppercase font-mono">
                  Grounded GenAI
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Natural language biometeorological diagnostics strictly grounded in ML cluster models
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* 4 Interactive Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleRunQuery('Explain Profile D (Extreme Heat & Moisture)', 'explain_cluster')}
              className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition text-center flex flex-col items-center gap-1"
            >
              <span className="text-sm">🔍</span>
              <span>Explain Cluster</span>
            </button>
            <button
              onClick={() => handleRunQuery('Why is New Delhi (42181) high priority?', 'explain_station')}
              className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 text-xs font-semibold text-rose-700 dark:text-rose-300 transition text-center flex flex-col items-center gap-1"
            >
              <span className="text-sm">📍</span>
              <span>Explain Station</span>
            </button>
            <button
              onClick={() => handleRunQuery('What distinguishes Profile C from Profile D?', 'compare_stations')}
              className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold text-amber-700 dark:text-amber-300 transition text-center flex flex-col items-center gap-1"
            >
              <span className="text-sm">⚖️</span>
              <span>Compare Profiles</span>
            </button>
            <button
              onClick={() => handleRunQuery('Generate primary research finding on bifurcated heat extremes', 'generate_finding')}
              className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition text-center flex flex-col items-center gap-1"
            >
              <span className="text-sm">📑</span>
              <span>Research Finding</span>
            </button>
          </div>

          {/* Query Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunQuery(queryInput);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ask about a station (e.g. 'Ahmedabad'), cluster contrast, or persistence..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !queryInput.trim()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Analyze</span>
            </button>
          </form>

          {/* Quick Preset Queries */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Preset Research Inquiries:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_QUERIES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunQuery(preset)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:border-amber-500/30 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition text-left flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{preset}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Response Container */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs font-semibold">Running grounded ML inference...</p>
            </div>
          )}

          {!isLoading && response && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Response Card Header */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 font-mono">
                      {response.priority_level}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                      {response.headline}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Assigned: <strong className="text-slate-800 dark:text-slate-200">{response.assigned_profile}</strong>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                    {response.vulnerability_tier}
                  </span>
                </div>

                {/* Key Indicators Breakdown */}
                {response.key_indicators && response.key_indicators.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      Contributing Thermodynamic Indicators:
                    </span>
                    <div className="space-y-1.5">
                      {response.key_indicators.map((ind, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {ind.label}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {ind.value} ({ind.percentile}% regional rank)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Biometeorological Interpretation */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">
                <span className="font-bold text-amber-600 dark:text-amber-400 block">
                  Diagnostic ML Interpretation:
                </span>
                <p>{response.biometeorological_interpretation}</p>
              </div>

              {/* Actionable Directives */}
              {response.actionable_directives && (
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-emerald-500" />
                    Civil Defense & Public Health Protocols:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {response.actionable_directives.map((dir, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{dir}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
