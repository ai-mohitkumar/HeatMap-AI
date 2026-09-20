import React, { useState, useMemo } from 'react';
import { Search, Download, Table, Filter } from 'lucide-react';

interface StationTableProps {
  data: any[];
}

export const StationTable: React.FC<StationTableProps> = ({ data }) => {
  const [search, setSearch] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('All');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const matchSearch =
        search === '' ||
        (row.NAME && row.NAME.toLowerCase().includes(search.toLowerCase())) ||
        (row.STATION && String(row.STATION).includes(search));
      const matchCluster = selectedCluster === 'All' || String(row.cluster) === selectedCluster;
      return matchSearch && matchCluster;
    });
  }, [data, search, selectedCluster]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = Object.keys(filtered[0]).join(',');
    const rows = filtered.map((r) => Object.values(r).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heatmap_ai_observations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-sky-500" />
            Meteorological Observations Explorer
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Preprocessed and feature-engineered NOAA GSOD surface records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search station name or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 w-52"
            />
          </div>

          {/* Cluster Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 text-xs">Cluster:</span>
            <select
              value={selectedCluster}
              onChange={(e) => {
                setSelectedCluster(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All</option>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
                <option key={c} value={String(c)}>
                  Cluster {c}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold">
            <tr>
              <th className="py-2.5 px-3 rounded-l-lg">Station</th>
              <th className="py-2.5 px-2">Date</th>
              <th className="py-2.5 px-2">Mean Temp</th>
              <th className="py-2.5 px-2">Max Temp</th>
              <th className="py-2.5 px-2">Heat Index</th>
              <th className="py-2.5 px-2">Dew Point</th>
              <th className="py-2.5 px-2">Humidity</th>
              <th className="py-2.5 px-2">Wind</th>
              <th className="py-2.5 px-2 rounded-r-lg">Cluster</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
            {pageRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-2 px-3">
                  <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-[200px]">
                    {row.NAME}
                  </span>
                  <span className="text-[10px] text-slate-400">ID: {row.STATION}</span>
                </td>
                <td className="py-2 px-2 text-slate-500">{row.DATE}</td>
                <td className="py-2 px-2 font-mono font-medium">{row.mean_temp_c}°C</td>
                <td className="py-2 px-2 font-mono text-amber-600 dark:text-amber-400 font-medium">
                  {row.max_temp_c}°C
                </td>
                <td className="py-2 px-2 font-mono text-orange-600 dark:text-orange-400 font-bold">
                  {row.heat_index_c}°C
                </td>
                <td className="py-2 px-2 font-mono text-blue-600 dark:text-blue-400">{row.dew_point_c}°C</td>
                <td className="py-2 px-2 font-mono">{row.relative_humidity}%</td>
                <td className="py-2 px-2 font-mono">{row.wind_speed_kmh} km/h</td>
                <td className="py-2 px-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    C{row.cluster}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
        <span>
          Showing {pageRows.length} of {filtered.length} matching observations
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
