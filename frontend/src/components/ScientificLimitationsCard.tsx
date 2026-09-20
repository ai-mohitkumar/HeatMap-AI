import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, AlertCircle, BookOpen, HeartPulse, HardHat, Compass } from 'lucide-react';

export const ScientificLimitationsCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      {/* Clickable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-850/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Scientific Scope, Assumptions &amp; Responsible Use Limitations
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Biometeorological framework parameters, NIOSH guidelines, and environmental screening boundaries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-semibold hidden sm:inline">
            {isExpanded ? 'Collapse' : 'Expand Details'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-6 space-y-5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {/* Primary Scope Statement */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-slate-900 dark:text-white block font-bold text-xs sm:text-sm">
                Screening Framework Disclaimer (NIOSH / WMO Standards)
              </strong>
              <p>
                HeatShield AI provides a <strong>weather-based regional screening and vulnerability prioritization framework</strong>,
                not a definitive clinical diagnostic instrument or statutory occupational safety determination. All indices (including the continuous Heat Stress Index) represent project-defined analytical screening scores.
              </p>
            </div>
          </div>

          {/* Core Scientific Caveats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <HeartPulse className="w-4 h-4" />
                <span>Environmental vs Physiological Heat Strain</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                NOAA GSOD provides surface atmospheric variables (ambient dry-bulb temperature, dew point, pressure, wind speed).
                True human physiological strain also depends heavily on <strong>metabolic workload</strong>, <strong>clothing and PPE permeability</strong>,
                individual <strong>acclimatization state</strong>, age, and radiant heat exposure.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                <HardHat className="w-4 h-4" />
                <span>Heat Index vs Occupational WBGT</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                The National Institute for Occupational Safety and Health (NIOSH) recommends <strong>Wet Bulb Globe Temperature (WBGT)</strong> for
                occupational exposure limits because it measures black-globe solar radiation. Apparent Heat Index serves as a practical surface proxy when radiant black-globe sensors are unavailable across standard synoptic weather networks.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Compass className="w-4 h-4" />
                <span>Exploratory Statistical Clusters</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Clusters A through D are <strong>unsupervised mathematical groupings</strong> derived from standardized feature vectors,
                not permanent real-world meteorological categories. They delineate relative thermodynamic boundaries across the evaluated observation sample rather than static climatological zones.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                <BookOpen className="w-4 h-4" />
                <span>Spatial &amp; Temporal Representativeness</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Station measurements represent specific sensor sites (frequently airport or municipal centers) and may not capture hyper-local urban heat island (UHI) microclimates. Multi-year shifts between 2022 and 2025 reflect interannual synoptic weather variations and observational coverage, not definitive long-term climate change causation.
              </p>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Grounding Reference: NIOSH Criteria for a Recommended Standard (Occupational Exposure to Heat &amp; Hot Environments, Pub No. 2016-106).</span>
            <span className="font-semibold text-slate-500 dark:text-slate-400">SIH26083 • CO2, CO3, CO5</span>
          </div>
        </div>
      )}
    </div>
  );
};
