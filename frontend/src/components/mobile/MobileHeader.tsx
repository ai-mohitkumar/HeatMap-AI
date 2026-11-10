import React from 'react';
import { Bell, Menu, MapPin, ChevronDown, AlertTriangle } from 'lucide-react';
import { HeatShieldLogo } from '../shared/HeatShieldLogo';
import type { LocationSourceType } from '../../types';

interface MobileHeaderProps {
  locationName: string;
  onOpenLocationPicker: () => void;
  onOpenAlerts: () => void;
  onOpenDrawer: () => void;
  hasUnreadAlerts?: boolean;
  locationSource?: LocationSourceType;
  locationUnavailable?: boolean;
  locationAcquiring?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  locationName,
  onOpenLocationPicker,
  onOpenAlerts,
  onOpenDrawer,
  hasUnreadAlerts = true,
  locationSource,
  locationUnavailable = false,
  locationAcquiring = false
}) => {
  const shortLocation = locationUnavailable
    ? 'Select Location'
    : locationAcquiring && locationSource === 'unavailable'
    ? 'Locating...'
    : locationName.replace(/, India$/, ', IN').replace(/ Station$/, '');

  return (
    <header className="md:hidden sticky top-0 z-40 bg-[#0B132B]/95 backdrop-blur-xl border-b border-slate-800/80 px-3.5 py-2.5 flex items-center justify-between shadow-lg">
      {/* Brand & Logo */}
      <HeatShieldLogo size="sm" showTagline={false} />

      {/* Center: Tappable Location Pill */}
      <button
        onClick={onOpenLocationPicker}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-slate-200 transition shadow-inner max-w-[178px] ${
          locationUnavailable
            ? 'bg-amber-950/60 hover:bg-amber-900/60 border-amber-500/50 text-amber-200'
            : 'bg-[#14203D] hover:bg-[#1D2E56] border-blue-500/30'
        }`}
        title="Change location"
      >
        {locationUnavailable ? (
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
        ) : (
          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
        )}
        <span className="text-[11px] font-bold text-white truncate">{shortLocation}</span>
        {!locationUnavailable && locationSource === 'ip_geolocation' && (
          <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">IP</span>
        )}
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {/* Right: Notification Bell & Menu Drawer */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
          aria-label="View heat alerts"
        >
          <Bell className="w-4 h-4" />
          {hasUnreadAlerts && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0B132B] animate-pulse" />
          )}
        </button>

        <button
          onClick={onOpenDrawer}
          className="py-1 px-2 rounded-xl text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition flex items-center gap-1 border border-slate-700/60 shadow-sm"
          aria-label="Open menu and research suite"
        >
          <Menu className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold">Menu</span>
        </button>
      </div>
    </header>

  );
};
