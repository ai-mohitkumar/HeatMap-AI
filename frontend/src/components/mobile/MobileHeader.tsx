import React from 'react';
import { Bell, Settings, MapPin, ChevronDown } from 'lucide-react';
import { HeatShieldLogo } from '../shared/HeatShieldLogo';

interface MobileHeaderProps {
  locationName: string;
  onOpenLocationPicker: () => void;
  onOpenAlerts: () => void;
  onOpenDrawer: () => void;
  hasUnreadAlerts?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  locationName,
  onOpenLocationPicker,
  onOpenAlerts,
  onOpenDrawer,
  hasUnreadAlerts = true
}) => {
  // Clean location string (e.g., "Patna, Bihar" or "Buxar, IN")
  const shortLocation = locationName.replace(/, India$/, ', IN').replace(/ Station$/, '');

  return (
    <header className="md:hidden sticky top-0 z-40 bg-[#0B132B]/95 backdrop-blur-xl border-b border-slate-800/80 px-3.5 py-2.5 flex items-center justify-between shadow-lg">
      {/* Brand & Logo */}
      <HeatShieldLogo size="sm" showTagline={false} />

      {/* Center: Tappable Location Pill */}
      <button
        onClick={onOpenLocationPicker}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#14203D] hover:bg-[#1D2E56] border border-blue-500/30 text-slate-200 transition shadow-inner max-w-[170px]"
        title="Change location"
      >
        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
        <span className="text-[11px] font-bold text-white truncate">{shortLocation}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {/* Right: Notification Bell & Settings / Drawer */}
      <div className="flex items-center gap-1">
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
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
          aria-label="Open settings and menu"
        >
          <Settings className="w-4 h-4 text-slate-400 hover:text-slate-200" />
        </button>
      </div>
    </header>
  );
};
