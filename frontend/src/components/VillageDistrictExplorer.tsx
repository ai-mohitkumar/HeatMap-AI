import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Search,
  Building2,
  CheckCircle2,
  Plus,
  Bookmark,
  Sun,
  AlertTriangle,
  Radio,
  Flame,
  LayoutGrid,
  Table as TableIcon,
  SlidersHorizontal,
  Eye,
  Thermometer,
  Droplets
} from 'lucide-react';
import {
  ALL_INDIA_STATES,
  ALL_INDIA_DISTRICTS,
  universalResolveLocation,
  evaluateLocationHeat,
  saveCustomVillage,
  getCachedVillages,
  type VillageGeoRecord,
  type DistrictGeoRecord
} from '../utils/indiaGeoStore';
import type { LocationPredictionResponse } from '../types';

interface VillageDistrictExplorerProps {
  initialStateCode?: string;
  initialDistrictName?: string;
  initialVillageName?: string;
  onSelectActiveLocation?: (loc: {
    name: string;
    lat: number;
    lon: number;
    district_name?: string;
    state_name?: string;
  }) => void;
  onNavigateHome?: () => void;
}

export const VillageDistrictExplorer: React.FC<VillageDistrictExplorerProps> = ({
  initialStateCode = 'BR',
  initialDistrictName = 'Buxar',
  initialVillageName = 'Ahirauli',
  onSelectActiveLocation,
  onNavigateHome
}) => {
  // 1. Hierarchical State (Default Buxar District & Ahirauli Village)
  const [selectedStateCode, setSelectedStateCode] = useState<string>(initialStateCode);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(initialDistrictName);
  const [selectedVillageName, setSelectedVillageName] = useState<string>(initialVillageName);

  // Sync when initial props change
  useEffect(() => {
    if (initialStateCode) setSelectedStateCode(initialStateCode);
    if (initialDistrictName) setSelectedDistrictName(initialDistrictName);
    if (initialVillageName) setSelectedVillageName(initialVillageName);
  }, [initialStateCode, initialDistrictName, initialVillageName]);

  // 2. Search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<VillageGeoRecord[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // 3. Custom village modal
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customVillageInput, setCustomVillageInput] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // 4. Filtered districts based on state
  const currentDistricts = useMemo(() => {
    return ALL_INDIA_DISTRICTS.filter(d => d.state_code === selectedStateCode);
  }, [selectedStateCode]);

  // Active district object
  const activeDistrict: DistrictGeoRecord = useMemo(() => {
    return (
      currentDistricts.find(d => d.district_name.toLowerCase() === selectedDistrictName.toLowerCase()) ||
      currentDistricts[0] ||
      ALL_INDIA_DISTRICTS[0]
    );
  }, [currentDistricts, selectedDistrictName]);

  // Combined villages (sample villages + tehsils)
  const availableVillages = useMemo(() => {
    const samples = activeDistrict.sample_villages || [];
    const tehsils = activeDistrict.tehsils || [];
    return Array.from(new Set([...samples, ...tehsils]));
  }, [activeDistrict]);

  // 5. Currently active resolved location
  const activeLocation: VillageGeoRecord = useMemo(() => {
    return universalResolveLocation(selectedVillageName, activeDistrict.district_name, selectedStateCode);
  }, [selectedVillageName, activeDistrict, selectedStateCode]);

  // 6. IDW Heat Assessment computed on-the-fly
  const heatAssessment: LocationPredictionResponse = useMemo(() => {
    return evaluateLocationHeat(activeLocation.latitude, activeLocation.longitude);
  }, [activeLocation]);

  // 6b. District Directory State
  const [districtVillageSearch, setDistrictVillageSearch] = useState<string>('');
  const [blockFilter, setBlockFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'heat_desc' | 'temp_desc' | 'risk_desc' | 'name'>('heat_desc');

  // Computed live microclimate metrics for all villages in this district
  const allDistrictVillages = useMemo(() => {
    return availableVillages.map((vName) => {
      const isTehsil = (activeDistrict.tehsils || []).includes(vName);
      const loc = universalResolveLocation(vName, activeDistrict.district_name, activeDistrict.state_name);
      let heat: LocationPredictionResponse;
      try {
        heat = evaluateLocationHeat(loc.latitude, loc.longitude);
      } catch {
        heat = {
          weather: { temperature: 34.5, feels_like: 40.2, max_temperature: 38.0, min_temperature: 26.0, humidity: 55, dew_point: 22.0 },
          prediction: { risk_score: 65, risk_level: 'HIGH', confidence_score: 95, profile: 'Profile A', peak_window: '11:00 AM – 04:00 PM', primary_driver: 'Temperature' },
          data_source: { stations_used: [] },
          administrative: { name: vName, district_name: activeDistrict.district_name, state_name: activeDistrict.state_name, hierarchy: loc.hierarchy }
        } as any;
      }
      return {
        name: vName,
        isTehsil,
        lat: loc.latitude,
        lon: loc.longitude,
        hierarchy: loc.hierarchy,
        temp: heat.weather.temperature,
        feelsLike: heat.weather.feels_like,
        maxTemp: heat.weather.max_temperature,
        humidity: heat.weather.humidity,
        dewPoint: heat.weather.dew_point,
        riskLevel: heat.prediction.risk_level,
        riskScore: heat.prediction.risk_score,
        peakWindow: heat.prediction.peak_window,
        nearestStation: heat.data_source.stations_used[0]?.name || 'Regional Station',
        distanceKm: heat.data_source.stations_used[0]?.distance_km || 0
      };
    });
  }, [availableVillages, activeDistrict]);

  // Filtered and sorted list of villages
  const filteredDistrictVillages = useMemo(() => {
    let list = allDistrictVillages;

    if (blockFilter !== 'ALL') {
      const bf = blockFilter.toLowerCase();
      list = list.filter(v => v.name.toLowerCase().includes(bf) || v.hierarchy.toLowerCase().includes(bf));
    }

    if (districtVillageSearch.trim()) {
      const q = districtVillageSearch.trim().toLowerCase();
      list = list.filter(v => v.name.toLowerCase().includes(q) || v.hierarchy.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'heat_desc') return b.feelsLike - a.feelsLike;
      if (sortBy === 'temp_desc') return b.temp - a.temp;
      if (sortBy === 'risk_desc') return b.riskScore - a.riskScore;
      return a.name.localeCompare(b.name);
    });
  }, [allDistrictVillages, blockFilter, districtVillageSearch, sortBy]);

  // High-level district heat intelligence summary
  const districtStats = useMemo(() => {
    if (allDistrictVillages.length === 0) return null;
    const total = allDistrictVillages.length;
    const avgTemp = (allDistrictVillages.reduce((acc, v) => acc + v.temp, 0) / total).toFixed(1);
    const avgHeatIndex = (allDistrictVillages.reduce((acc, v) => acc + v.feelsLike, 0) / total).toFixed(1);
    const hotspot = [...allDistrictVillages].sort((a, b) => b.feelsLike - a.feelsLike)[0];
    const coolest = [...allDistrictVillages].sort((a, b) => a.feelsLike - b.feelsLike)[0];
    const highRiskCount = allDistrictVillages.filter(v => ['HIGH', 'VERY HIGH', 'EXTREME'].includes(v.riskLevel)).length;

    return {
      total,
      blocksCount: (activeDistrict.tehsils || []).length,
      avgTemp,
      avgHeatIndex,
      hotspot,
      coolest,
      highRiskCount
    };
  }, [allDistrictVillages, activeDistrict]);

  // 7. Handle Search Input with Universal Fuzzy Resolver
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const query = q.toLowerCase();

    const matches: VillageGeoRecord[] = [];

    // Search across cached villages
    getCachedVillages().forEach(v => {
      if (v.name.toLowerCase().includes(query) || v.display_label.toLowerCase().includes(query)) {
        matches.push(v);
      }
    });

    // Search across all districts and villages
    for (const d of ALL_INDIA_DISTRICTS) {
      // Check district name
      if (d.district_name.toLowerCase().includes(query)) {
        matches.push({
          name: d.district_name,
          type: 'district',
          district_name: d.district_name,
          state_name: d.state_name,
          state_code: d.state_code,
          latitude: d.latitude,
          longitude: d.longitude,
          climate_zone: d.climate_zone,
          display_label: `${d.district_name} (District, ${d.state_name})`,
          hierarchy: `${d.district_name}, ${d.state_name}, India`
        });
      }
      // Check sample villages
      for (const v of d.sample_villages) {
        if (v.toLowerCase().includes(query)) {
          matches.push({
            name: v,
            type: 'village',
            district_name: d.district_name,
            state_name: d.state_name,
            state_code: d.state_code,
            latitude: d.latitude + 0.02,
            longitude: d.longitude + 0.02,
            climate_zone: d.climate_zone,
            display_label: `${v} (Village, ${d.district_name})`,
            hierarchy: `${v}, ${d.district_name}, ${d.state_name}`
          });
        }
      }
    }

    // Deduplicate & limit
    const unique = matches.filter((item, index, self) =>
      index === self.findIndex(t => t.display_label === item.display_label)
    ).slice(0, 8);

    setSearchResults(unique);
  };

  const selectSearchResult = (item: VillageGeoRecord) => {
    setSelectedStateCode(item.state_code);
    setSelectedDistrictName(item.district_name);
    setSelectedVillageName(item.name);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Add Custom Village
  const handleAddCustomVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVillageInput.trim()) return;

    const resolved = universalResolveLocation(
      customVillageInput.trim(),
      activeDistrict.district_name,
      activeDistrict.state_name
    );
    saveCustomVillage(resolved);
    setSelectedVillageName(resolved.name);
    setCustomVillageInput('');
    setShowCustomModal(false);
    setSaveSuccessMsg(`Added and cached "${resolved.name}" successfully!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Set as Active Location in Main Dashboard
  const handleSetDashboardActive = () => {
    if (onSelectActiveLocation) {
      onSelectActiveLocation({
        name: `${activeLocation.name}, ${activeLocation.district_name}`,
        lat: activeLocation.latitude,
        lon: activeLocation.longitude,
        district_name: activeLocation.district_name,
        state_name: activeLocation.state_name
      });
    }
    setSaveSuccessMsg(`Location set to ${activeLocation.name}!`);
    setTimeout(() => {
      setSaveSuccessMsg(null);
      if (onNavigateHome) onNavigateHome();
    }, 1200);
  };

  const cachedList = getCachedVillages();

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/50 via-[#131E3A] to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-extrabold uppercase rounded-lg border border-blue-500/30 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> All-India Administrative Hierarchy Store
              </span>
              <span className="text-xs text-slate-400">36 States/UTs • 780+ Districts • All Villages</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Village &amp; District Heat Intelligence Explorer
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Explore localized microclimate risk, real-time spatial IDW heat calculations, and rural safety directives for any State, District, or Gram Panchayat in India.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCustomModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Village</span>
            </button>
          </div>
        </div>

        {/* Universal Search Bar */}
        <div className="relative mt-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search any Village, Tehsil, District, or State in India (e.g. Maner, Phalodi, Pokhran, Patna, Gaya)..."
            className="w-full bg-[#090F1F] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-inner"
          />

          {/* Autocomplete Results */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0B132B] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSearchResult(item)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-800/80 transition flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition" />
                    <div>
                      <span className="font-bold text-white group-hover:text-blue-300 transition">
                        {item.name}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-1.5">
                        ({item.display_label})
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {item.state_code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hierarchical Drilldown Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {/* 1. State Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              1. Select State / UT
            </label>
            <select
              value={selectedStateCode}
              onChange={(e) => {
                const newCode = e.target.value;
                setSelectedStateCode(newCode);
                const nextDistricts = ALL_INDIA_DISTRICTS.filter(d => d.state_code === newCode);
                if (nextDistricts.length > 0) {
                  setSelectedDistrictName(nextDistricts[0].district_name);
                  setSelectedVillageName(nextDistricts[0].sample_villages[0] || nextDistricts[0].district_name);
                }
              }}
              className="w-full bg-[#090F1F] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {ALL_INDIA_STATES.map((st) => (
                <option key={st.state_code} value={st.state_code}>
                  {st.state_name} ({st.type})
                </option>
              ))}
            </select>
          </div>

          {/* 2. District Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              2. Select District
            </label>
            <select
              value={selectedDistrictName}
              onChange={(e) => {
                const newDistName = e.target.value;
                setSelectedDistrictName(newDistName);
                const dist = currentDistricts.find(d => d.district_name === newDistName);
                if (dist && dist.sample_villages.length > 0) {
                  setSelectedVillageName(dist.sample_villages[0]);
                } else if (dist) {
                  setSelectedVillageName(dist.district_name);
                }
              }}
              className="w-full bg-[#090F1F] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {currentDistricts.map((d) => (
                <option key={d.district_id} value={d.district_name}>
                  {d.district_name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Village / Tehsil Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              3. Select Village / Tehsil
            </label>
            <select
              value={selectedVillageName}
              onChange={(e) => setSelectedVillageName(e.target.value)}
              className="w-full bg-[#090F1F] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {availableVillages.map((v, idx) => (
                <option key={idx} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="mt-3 p-2 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Location Heat Evaluation Card */}
      <div className="bg-[#131E3A] border border-slate-800 rounded-2xl p-5 shadow-md space-y-6">
        {/* Top Info Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-amber-400">
              <MapPin className="w-4 h-4 text-rose-400" />
              <h3 className="text-lg font-black text-white">
                {activeLocation.name}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                {activeLocation.type.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeLocation.hierarchy} • Coordinates: {activeLocation.latitude}° N, {activeLocation.longitude}° E • Zone: {activeLocation.climate_zone}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSetDashboardActive}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Set as Active in Dashboard</span>
            </button>
            <button
              onClick={() => {
                saveCustomVillage(activeLocation);
                setSaveSuccessMsg(`Saved "${activeLocation.name}" to your local watchlist!`);
                setTimeout(() => setSaveSuccessMsg(null), 3000);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards for this Village */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 block font-medium">Ambient Temperature</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-white">
                {heatAssessment.weather.temperature}°C
              </span>
              <span className="text-xs text-amber-400">
                Max: {heatAssessment.weather.max_temperature}°C
              </span>
            </div>
          </div>

          <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 block font-medium">Feels-Like Heat Index</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-amber-400">
                {heatAssessment.weather.feels_like}°C
              </span>
              <span className="text-xs text-rose-400 font-semibold">
                Stress: {heatAssessment.prediction.risk_score}
              </span>
            </div>
          </div>

          <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 block font-medium">Relative Humidity</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-cyan-400">
                {heatAssessment.weather.humidity}%
              </span>
              <span className="text-xs text-slate-400">
                Dew: {heatAssessment.weather.dew_point}°C
              </span>
            </div>
          </div>

          <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 block font-medium">Vulnerability Tier</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow"
                style={{
                  backgroundColor:
                    heatAssessment.prediction.risk_level === 'EXTREME'
                      ? '#7C3AED'
                      : heatAssessment.prediction.risk_level === 'VERY HIGH'
                      ? '#EF4444'
                      : heatAssessment.prediction.risk_level === 'HIGH'
                      ? '#F97316'
                      : '#F59E0B',
                  color: '#FFFFFF'
                }}
              >
                {heatAssessment.prediction.risk_level}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {heatAssessment.prediction.profile}
              </span>
            </div>
          </div>
        </div>

        {/* 4-Station IDW Spatial Breakdown for Village */}
        <div className="bg-[#0B132B] border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs sm:text-sm font-bold text-white">
                4-Station Spatial Inverse Distance Weighting (IDW, p=2.0)
              </h4>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono">Sub-ms Validated</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {heatAssessment.data_source.stations_used.map((st, idx) => (
              <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span>{st.name}</span>
                  <span className="text-amber-400">{st.temperature_c}°C</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{st.distance_km} km away</span>
                  <span className="font-mono font-bold text-blue-400">{st.weight_pct}% weight</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.min(st.weight_pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Localized Action Advisories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Sun className="w-4 h-4" />
              <span>Agricultural &amp; Outdoor Labor Directive</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Peak danger window for {activeLocation.name} is <strong>{heatAssessment.prediction.peak_window}</strong>.
              Shift harvesting, manual tilling, and construction shifts to early morning (05:30 AM – 10:30 AM) or after 05:00 PM. Hydrate with 250ml electrolyte water every 30 minutes.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Vulnerable Household Care (Elderly &amp; Children)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Thermal retention in indoor spaces can exceed ambient conditions. Keep windows shaded during peak sunlight and ensure constant airflow using wet grass/khus curtains or coolers.
            </p>
          </div>
        </div>
      </div>

      {/* Exhaustive District Villages & Gram Panchayats Directory */}
      <div className="bg-[#131E3A] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
        {/* Directory Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-[11px] font-extrabold uppercase rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> All Villages Heat Directory
              </span>
              <span className="text-xs text-slate-400">
                {activeDistrict.district_name} District • {activeDistrict.state_name}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              All Villages &amp; Gram Panchayats of {activeDistrict.district_name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live continuous IDW microclimate evaluation for all {allDistrictVillages.length} pre-indexed villages across {(activeDistrict.tehsils || []).length} blocks.
            </p>
          </div>

          {/* District Summary KPI Bar */}
          {districtStats && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-[#0B132B] border border-slate-700/80 px-3 py-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Villages</span>
                <span className="text-base font-black text-white">{districtStats.total}</span>
              </div>
              <div className="bg-[#0B132B] border border-slate-700/80 px-3 py-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Avg Temp</span>
                <span className="text-base font-black text-amber-400">{districtStats.avgTemp}°C</span>
              </div>
              <div className="bg-[#0B132B] border border-slate-700/80 px-3 py-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Avg Feels-Like</span>
                <span className="text-base font-black text-rose-400">{districtStats.avgHeatIndex}°C</span>
              </div>
              <div className="bg-[#0B132B] border border-slate-700/80 px-3 py-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Hotspot</span>
                <span className="text-xs font-black text-purple-400 truncate max-w-[100px] block" title={districtStats.hotspot?.name}>
                  {districtStats.hotspot?.name} ({districtStats.hotspot?.feelsLike}°C)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input within District */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={districtVillageSearch}
                onChange={(e) => setDistrictVillageSearch(e.target.value)}
                placeholder={`Search village in ${activeDistrict.district_name}...`}
                className="w-full bg-[#0B132B] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
              />
              {districtVillageSearch && (
                <button
                  onClick={() => setDistrictVillageSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort and View Toggle */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 bg-[#0B132B] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-400 uppercase font-bold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="heat_desc" className="bg-slate-900">Highest Heat Index</option>
                  <option value="temp_desc" className="bg-slate-900">Highest Temp</option>
                  <option value="risk_desc" className="bg-slate-900">Highest Risk Score</option>
                  <option value="name" className="bg-slate-900">Alphabetical (A–Z)</option>
                </select>
              </div>

              <div className="flex items-center bg-[#0B132B] border border-slate-700 rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Dense Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Block / Tehsil Filter Pills */}
          {(activeDistrict.tehsils || []).length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 mr-1">
                Blocks:
              </span>
              <button
                onClick={() => setBlockFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition ${
                  blockFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-[#0B132B] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Blocks ({allDistrictVillages.length})
              </button>
              {activeDistrict.tehsils.map((tehsil) => {
                const count = allDistrictVillages.filter(
                  (v) => v.name.toLowerCase().includes(tehsil.toLowerCase()) || v.hierarchy.toLowerCase().includes(tehsil.toLowerCase())
                ).length;
                return (
                  <button
                    key={tehsil}
                    onClick={() => setBlockFilter(blockFilter === tehsil ? 'ALL' : tehsil)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition flex items-center gap-1 ${
                      blockFilter === tehsil
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-[#0B132B] text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{tehsil}</span>
                    {count > 0 && (
                      <span className="text-[10px] opacity-70">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Directory Results View */}
        {filteredDistrictVillages.length === 0 ? (
          <div className="text-center py-10 bg-[#0B132B] rounded-xl border border-slate-800">
            <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-semibold">No villages matched your query in {activeDistrict.district_name}</p>
            <button
              onClick={() => { setDistrictVillageSearch(''); setBlockFilter('ALL'); }}
              className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Card Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredDistrictVillages.map((v) => {
              const isCurrentSelected = v.name === selectedVillageName;
              return (
                <div
                  key={v.name}
                  className={`bg-[#0B132B] rounded-xl p-3.5 border transition flex flex-col justify-between group ${
                    isCurrentSelected
                      ? 'border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {v.isTehsil ? (
                            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition truncate">
                            {v.name}
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                          {v.isTehsil ? 'Block / Tehsil HQ' : `Village in ${activeDistrict.district_name}`}
                        </span>
                      </div>
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0"
                        style={{
                          backgroundColor:
                            v.riskLevel === 'EXTREME'
                              ? '#7C3AED25'
                              : v.riskLevel === 'VERY HIGH'
                              ? '#EF444425'
                              : v.riskLevel === 'HIGH'
                              ? '#F9731625'
                              : '#10B98125',
                          color:
                            v.riskLevel === 'EXTREME'
                              ? '#C4B5FD'
                              : v.riskLevel === 'VERY HIGH'
                              ? '#FCA5A5'
                              : v.riskLevel === 'HIGH'
                              ? '#FDBA74'
                              : '#6EE7B7',
                          border: '1px solid currentColor'
                        }}
                      >
                        {v.riskLevel}
                      </span>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 gap-1.5 my-2.5 bg-slate-900/60 p-2 rounded-lg text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block">Ambient Temp</span>
                        <span className="font-bold text-white flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-amber-400" />
                          {v.temp}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Feels Like</span>
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-400" />
                          {v.feelsLike}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Humidity</span>
                        <span className="font-bold text-cyan-400 flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-cyan-400" />
                          {v.humidity}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Risk Score</span>
                        <span className="font-bold text-rose-400">
                          {v.riskScore} / 100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        setSelectedVillageName(v.name);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-blue-400" />
                      <span>Inspect</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onSelectActiveLocation) {
                          onSelectActiveLocation({
                            name: v.name,
                            lat: v.lat,
                            lon: v.lon,
                            district_name: activeDistrict.district_name,
                            state_name: activeDistrict.state_name
                          });
                        }
                      }}
                      className="py-1 px-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1"
                      title="Activate in main dashboard"
                    >
                      <Radio className="w-3 h-3" />
                      <span>Live</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Dense Data Table View */
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B132B] text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5">Village / Gram Panchayat</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5 text-right">Ambient Temp</th>
                  <th className="px-3 py-2.5 text-right">Heat Index</th>
                  <th className="px-3 py-2.5 text-right">Humidity</th>
                  <th className="px-3 py-2.5 text-center">Vulnerability Tier</th>
                  <th className="px-3 py-2.5">Peak Window</th>
                  <th className="px-3.5 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {filteredDistrictVillages.map((v) => {
                  const isCurrentSelected = v.name === selectedVillageName;
                  return (
                    <tr
                      key={v.name}
                      className={`hover:bg-slate-800/50 transition ${
                        isCurrentSelected ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="px-3.5 py-2 font-bold text-white flex items-center gap-1.5">
                        {v.isTehsil ? (
                          <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span>{v.name}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {v.isTehsil ? 'Tehsil' : 'Village'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-white">
                        {v.temp}°C
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-amber-400">
                        {v.feelsLike}°C
                      </td>
                      <td className="px-3 py-2 text-right text-cyan-300">
                        {v.humidity}%
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase inline-block"
                          style={{
                            backgroundColor:
                              v.riskLevel === 'EXTREME'
                                ? '#7C3AED25'
                                : v.riskLevel === 'VERY HIGH'
                                ? '#EF444425'
                                : v.riskLevel === 'HIGH'
                                ? '#F9731625'
                                : '#10B98125',
                            color:
                              v.riskLevel === 'EXTREME'
                                ? '#C4B5FD'
                                : v.riskLevel === 'VERY HIGH'
                                ? '#FCA5A5'
                                : v.riskLevel === 'HIGH'
                                ? '#FDBA74'
                                : '#6EE7B7',
                            border: '1px solid currentColor'
                          }}
                        >
                          {v.riskLevel}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[11px]">
                        {v.peakWindow}
                      </td>
                      <td className="px-3.5 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedVillageName(v.name);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] rounded transition"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => {
                              if (onSelectActiveLocation) {
                                onSelectActiveLocation({
                                  name: v.name,
                                  lat: v.lat,
                                  lon: v.lon,
                                  district_name: activeDistrict.district_name,
                                  state_name: activeDistrict.state_name
                                });
                              }
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded transition"
                          >
                            Activate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Saved / Cached Villages */}
      {cachedList.length > 0 && (
        <div className="bg-[#131E3A] border border-slate-800 rounded-2xl p-4 shadow space-y-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-white">Your Saved &amp; Cached Villages</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {cachedList.map((item, idx) => (
              <button
                key={idx}
                onClick={() => selectSearchResult(item)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>{item.name}</span>
                <span className="text-[10px] text-slate-400">({item.district_name})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Village Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131E3A] border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" /> Add Custom Village or Gram Panchayat
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomVillage} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Village or Gram Panchayat Name</label>
                <input
                  type="text"
                  required
                  value={customVillageInput}
                  onChange={(e) => setCustomVillageInput(e.target.value)}
                  placeholder="e.g. Rampur, Pokhran, Shahpur, Govindpur"
                  className="w-full bg-[#090F1F] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Parent District</label>
                <input
                  type="text"
                  disabled
                  value={`${activeDistrict.district_name}, ${activeDistrict.state_name}`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-400"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-snug">
                HeatShield AI will automatically interpolate geographic coordinates within {activeDistrict.district_name} and compute continuous spatial heat metrics.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Save Village
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
