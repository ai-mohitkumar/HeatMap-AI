import React from 'react';
import {
  Search,
  Shield,
  LayoutDashboard,
  FlaskConical,
  Database,
  Calendar,
  Sun,
  BrainCircuit,
  X,
  Building2,
  MapPin,
  Smartphone,
  Menu,
  Globe,
  Bell,
  AlertOctagon
} from 'lucide-react';
import { OFFLINE_STATIONS } from '../utils/offlineEngine';
import {
  searchVillagesAndDistricts,
  universalResolveLocation,
  evaluateLocationHeat,
  type VillageGeoRecord
} from '../utils/indiaGeoStore';
import { HeatShieldLogo } from './shared/HeatShieldLogo';
import { notificationService } from '../utils/notificationService';
import { getTranslation } from '../utils/localization';
import type { LanguageCode } from '../types';

interface HeaderProps {
  activeK: number;
  optimalK: number;
  availableYears: number[];
  activeYear: number | null;
  isUpdating: boolean;
  appMode: 'safety' | 'dashboard' | 'research' | 'lab';
  lang: LanguageCode;
  onSelectLang: (l: LanguageCode) => void;
  onToggleMode: (mode: 'safety' | 'dashboard' | 'research' | 'lab') => void;
  onOpenAIAnalyst: () => void;
  onOpenApps?: () => void;
  onTriggerEmergencyMode?: () => void;
  onSelectK?: (k: number) => void;
  onSelectYear: (year: number | null) => void;
  onExportReport?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSelectStation?: (stationId: string) => void;
  onSelectLocation?: (loc: { name: string; lat: number; lon: number; district?: string; state?: string }) => void;
  onOpenVillageExplorer?: (stateCode?: string, districtName?: string, villageName?: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  availableYears,
  activeYear,
  appMode,
  lang,
  onSelectLang,
  onToggleMode,
  onOpenAIAnalyst,
  onOpenApps,
  onTriggerEmergencyMode,
  onSelectYear,
  searchQuery = '',
  onSearchChange,
  onSelectStation,
  onSelectLocation,
  onOpenVillageExplorer,
  onToggleMobileMenu
}) => {
  const [internalQuery, setInternalQuery] = React.useState(searchQuery);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [notifStatus, setNotifStatus] = React.useState(notificationService.getPermission());

  const handleToggleNotifications = async () => {
    if (notifStatus === 'granted') {
      notificationService.triggerTestNotification(
        '🔔 HeatShield AI Alert Active',
        'You will receive instant alerts when heat index in your location reaches high danger levels (Tier 3+).'
      );
    } else {
      const result = await notificationService.requestPermission();
      setNotifStatus(result);
    }
  };

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  const currentQuery = onSearchChange ? searchQuery : internalQuery;

  const handleQueryChange = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    setInternalQuery(val);
    setIsDropdownOpen(val.trim().length > 0);
  };

  // Keyboard shortcut Ctrl+K / Cmd+K and Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter 46 synoptic stations
  const matchingStations = React.useMemo(() => {
    const q = currentQuery.trim().toLowerCase();
    if (!q) return [];
    return OFFLINE_STATIONS.filter(
      (s) =>
        s.station_name.toLowerCase().includes(q) ||
        s.full_name.toLowerCase().includes(q) ||
        s.station_id.includes(q) ||
        s.vulnerability_tier.toLowerCase().includes(q)
    ).slice(0, 4);
  }, [currentQuery]);

  // Filter All India Villages, Tehsils, Districts & States
  const matchingGeoLocations = React.useMemo(() => {
    const q = currentQuery.trim();
    if (!q) return [];
    return searchVillagesAndDistricts(q, 8);
  }, [currentQuery]);

  const handleSelectStationResult = (stationId: string) => {
    if (onSelectStation) {
      onSelectStation(stationId);
    }
    handleQueryChange('');
    setIsDropdownOpen(false);
  };

  const handleSelectGeoResult = (geo: VillageGeoRecord) => {
    if (onSelectLocation) {
      onSelectLocation({
        name: geo.name,
        lat: geo.latitude,
        lon: geo.longitude,
        district: geo.district_name,
        state: geo.state_name
      });
    }
    handleQueryChange('');
    setIsDropdownOpen(false);
  };

  const handleCustomResolve = () => {
    const resolved = universalResolveLocation(currentQuery);
    if (onSelectLocation) {
      onSelectLocation({
        name: resolved.name,
        lat: resolved.latitude,
        lon: resolved.longitude,
        district: resolved.district_name,
        state: resolved.state_name
      });
    }
    handleQueryChange('');
    setIsDropdownOpen(false);
  };

  const hasAnyResults = matchingStations.length > 0 || matchingGeoLocations.length > 0;
  return (
    <header className="bg-[#0B132B] text-white border-b border-slate-800/80 sticky top-0 z-50 shadow-md">
      <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left: Brand Emblem & Logo with Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="p-1.5 md:hidden text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-amber-400" />
            </button>
          )}
          <HeatShieldLogo size="md" showTagline={true} />
        </div>

        {/* Center-Left: Search Bar with Autocomplete Dropdown */}
        <div ref={searchContainerRef} className="relative hidden md:flex items-center w-72 lg:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={currentQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (currentQuery.trim().length > 0) setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && currentQuery.trim()) {
                e.preventDefault();
                if (matchingStations.length > 0) {
                  handleSelectStationResult(matchingStations[0].station_id);
                } else if (matchingGeoLocations.length > 0) {
                  handleSelectGeoResult(matchingGeoLocations[0]);
                } else {
                  handleCustomResolve();
                }
              }
            }}
            placeholder="Search village, district, state or station..."
            className="w-full bg-[#131E3A] border border-slate-700/70 rounded-xl pl-9 pr-14 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-inner"
          />

          {currentQuery ? (
            <button
              onClick={() => handleQueryChange('')}
              className="absolute right-8 text-slate-400 hover:text-white p-0.5"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          ) : null}

          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-800/80 rounded border border-slate-700 pointer-events-none select-none">
            Ctrl K
          </kbd>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && currentQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0B132B] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
              
              {/* Section 1: Matching Synoptic Stations */}
              {matchingStations.length > 0 && (
                <div>
                  <div className="p-2 bg-slate-900/90 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>Synoptic Stations ({matchingStations.length})</span>
                    <span className="text-[9px] text-slate-500">NOAA GSOD</span>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {matchingStations.map((st) => (
                      <button
                        key={st.station_id}
                        onClick={() => handleSelectStationResult(st.station_id)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-800/70 transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition flex items-center gap-1.5">
                            <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                            {st.station_name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {st.full_name} • ID: {st.station_id}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-amber-400">
                            {st.temperature_c}°C
                          </div>
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-semibold"
                            style={{
                              backgroundColor: `${st.color}20`,
                              color: st.color,
                              border: `1px solid ${st.color}40`
                            }}
                          >
                            {st.vulnerability_tier}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Matching All India Villages, Tehsils & Districts */}
              {matchingGeoLocations.length > 0 && (
                <div>
                  <div className="p-2 bg-slate-900/90 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>Villages &amp; Districts of India ({matchingGeoLocations.length})</span>
                    <span className="text-[9px] text-emerald-400">Continuous IDW Live</span>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {matchingGeoLocations.map((geo, idx) => {
                      let heat: { temp: number; feelsLike: number; risk: string } | null = null;
                      try {
                        const h = evaluateLocationHeat(geo.latitude, geo.longitude);
                        heat = {
                          temp: h.weather.temperature,
                          feelsLike: h.weather.feels_like,
                          risk: h.prediction.risk_level
                        };
                      } catch {
                        heat = null;
                      }

                      return (
                        <div
                          key={`${geo.name}-${idx}`}
                          className="w-full px-3 py-2 hover:bg-slate-800/70 transition flex items-center justify-between group gap-2"
                        >
                          <button
                            onClick={() => handleSelectGeoResult(geo)}
                            className="min-w-0 pr-1 text-left flex-1"
                          >
                            <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition flex items-center gap-1.5 truncate">
                              {geo.type === 'village' ? (
                                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              )}
                              <span className="truncate">{geo.name}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 ${
                                  geo.type === 'village'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : geo.type === 'district'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : geo.type === 'tehsil'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {geo.type}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {geo.hierarchy || `${geo.district_name || ''}, ${geo.state_name || ''}`}
                            </div>
                          </button>

                          {heat && (
                            <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-amber-400">
                                  {heat.temp}°C
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  ({heat.feelsLike}°C)
                                </span>
                              </div>
                              <span
                                className="text-[8px] px-1 py-0.2 rounded font-bold uppercase"
                                style={{
                                  backgroundColor:
                                    heat.risk === 'EXTREME'
                                      ? '#7C3AED25'
                                      : heat.risk === 'VERY HIGH'
                                      ? '#EF444425'
                                      : heat.risk === 'HIGH'
                                      ? '#F9731625'
                                      : '#10B98125',
                                  color:
                                    heat.risk === 'EXTREME'
                                      ? '#A78BFA'
                                      : heat.risk === 'VERY HIGH'
                                      ? '#F87171'
                                      : heat.risk === 'HIGH'
                                      ? '#FB923C'
                                      : '#34D399',
                                  border: '1px solid currentColor'
                                }}
                              >
                                {heat.risk}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {matchingGeoLocations.some((g) => g.type === 'district') && (
                    <div className="p-2 bg-blue-950/60 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-blue-300 font-medium truncate">
                        Looking for all villages in this district?
                      </span>
                      <button
                        onClick={() => {
                          const dMatch = matchingGeoLocations.find((g) => g.type === 'district');
                          if (dMatch) {
                            if (onOpenVillageExplorer) {
                              onOpenVillageExplorer(dMatch.state_code, dMatch.district_name);
                            } else {
                              handleSelectGeoResult(dMatch);
                            }
                          }
                          setIsDropdownOpen(false);
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold underline shrink-0 ml-2"
                      >
                        Explore Villages &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Section 3: Universal Fallback Resolver for Unindexed Queries */}
              {!hasAnyResults && (
                <div className="p-3 text-center">
                  <p className="text-xs text-slate-300 mb-2">
                    No pre-indexed location found for &ldquo;{currentQuery}&rdquo;
                  </p>
                  <button
                    onClick={handleCustomResolve}
                    className="w-full py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Evaluate &ldquo;{currentQuery}&rdquo; via 4-Station IDW</span>
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Center: Top Mode Navigation Pills */}
        <div className="hidden lg:flex items-center p-1 bg-[#131E3A] rounded-xl border border-slate-800 text-xs font-medium space-x-1">
          <button
            onClick={() => onToggleMode('safety')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-semibold ${
              appMode === 'safety'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Public Safety</span>
          </button>

          <button
            onClick={() => onToggleMode('dashboard')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              appMode === 'dashboard'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onToggleMode('research')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              appMode === 'research'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Research</span>
          </button>

          <button
            onClick={() => onToggleMode('lab')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              appMode === 'lab'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>AI Analyst</span>
          </button>

          <button
            onClick={onOpenAIAnalyst}
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Explorer</span>
          </button>
        </div>

        {/* Right: Year Filter, Theme Toggle, User Avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Year Filter Dropdown (hidden on small mobile screens) */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#131E3A] border border-slate-700/70 rounded-xl px-2.5 py-1 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              aria-label="Filter observations by year"
              value={activeYear === null ? 'all' : activeYear}
              onChange={(e) => onSelectYear(e.target.value === 'all' ? null : Number(e.target.value))}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#131E3A] text-slate-200">All (2022–2025)</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-[#131E3A] text-slate-200">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Global Language Selector */}
          <div className="flex items-center gap-1.5 bg-[#131E3A] border border-slate-700/70 rounded-xl px-2.5 py-1 text-xs text-slate-300 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              aria-label="Select language"
              value={lang}
              onChange={(e) => onSelectLang(e.target.value as LanguageCode)}
              className="bg-transparent border-none text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="en" className="bg-[#131E3A] text-slate-200">EN (English)</option>
              <option value="hi" className="bg-[#131E3A] text-slate-200">हिन्दी (Hindi)</option>
              <option value="pa" className="bg-[#131E3A] text-slate-200">ਪੰਜਾਬੀ (Punjabi)</option>
            </select>
          </div>

          {/* Push Notification Alerts Toggle */}
          <button
            onClick={handleToggleNotifications}
            title={notifStatus === 'granted' ? getTranslation(lang, 'alerts_on', 'Alerts Active (Click to test)') : getTranslation(lang, 'alerts_off', 'Enable Alerts')}
            aria-label="Toggle notifications"
            className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
              notifStatus === 'granted'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-amber-300 border-slate-700/70'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${notifStatus === 'granted' ? 'text-emerald-400' : ''}`} />
            <span className="hidden lg:inline">
              {notifStatus === 'granted' ? getTranslation(lang, 'alerts_on', 'Alerts On') : getTranslation(lang, 'alerts_off', 'Alerts')}
            </span>
          </button>

          {/* Emergency SOS Quick Trigger Button */}
          {onTriggerEmergencyMode && (
            <button
              onClick={onTriggerEmergencyMode}
              title="Open Heat Emergency Mode"
              aria-label="Open emergency mode"
              className="px-2.5 py-1.5 bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs font-black shadow-sm group"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse group-hover:rotate-12 transition" />
              <span className="hidden sm:inline tracking-wider">
                {getTranslation(lang, 'emergency_badge', 'EMERGENCY')}
              </span>
            </button>
          )}

          {/* Theme / Sun Toggle */}
          <button
            title="Theme mode"
            aria-label="Toggle theme mode"
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
          >
            <Sun className="w-4 h-4" />
          </button>

          {/* iOS & Android Suite Quick Button */}
          {onOpenApps && (
            <button
              onClick={onOpenApps}
              title="iOS, Android & Smartwatch Suite"
              className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">iOS / Android</span>
            </button>
          )}

          {/* User Profile Avatar "MK" */}
          <div
            title="Mohit Kumar"
            className="w-8 h-8 rounded-full bg-[#1D2D50] border border-blue-400/30 text-blue-300 font-semibold text-xs flex items-center justify-center shadow"
          >
            MK
          </div>
        </div>

      </div>
    </header>
  );
};
