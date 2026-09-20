import React from 'react';
import { MapPin, Network, Sparkles, AlertTriangle, Gauge } from 'lucide-react';
import type { DatasetSummary } from '../types';

interface MetricCardsProps {
  summary: DatasetSummary | null;
  activeK: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ summary, activeK }) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-slate-800/50 rounded-xl"></div>
        ))}
      </div>
    );
  }

  const hsi = summary.mean_heat_stress_index || 50.0;
  const hsiColor = hsi > 75 ? 'text-purple-500' : hsi > 60 ? 'text-red-500' : hsi > 40 ? 'text-amber-500' : 'text-emerald-500';

  const cards = [
    {
      title: 'Stations Monitored',
      value: summary.unique_stations.toLocaleString(),
      subtitle: `${summary.total_observations.toLocaleString()} multi-year records`,
      icon: MapPin,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-100 dark:border-blue-900/50'
    },
    {
      title: 'Active Clusters',
      value: `K = ${activeK}`,
      subtitle: `Recommended: K = ${summary.optimal_k}`,
      icon: Network,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-100 dark:border-indigo-900/50'
    },
    {
      title: 'Mean Heat Stress Index',
      value: `${hsi.toFixed(1)} / 100`,
      subtitle: 'Continuous Vulnerability (HSI)',
      icon: Gauge,
      color: hsiColor,
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/50'
    },
    {
      title: 'Silhouette Score',
      value: summary.best_silhouette_score.toFixed(3),
      subtitle: 'Partition quality index',
      icon: Sparkles,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-100 dark:border-emerald-900/50'
    },
    {
      title: 'High-Priority Regions',
      value: summary.high_risk_stations_count.toLocaleString(),
      subtitle: 'Immediate mitigation alert',
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-100 dark:border-red-900/50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${card.border} ${card.bg} shadow-sm backdrop-blur-sm transition hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {card.value}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
