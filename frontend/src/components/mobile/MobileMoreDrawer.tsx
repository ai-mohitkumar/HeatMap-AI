import React from 'react';
import {
  X,
  Flame,
  Calendar,
  HardHat,
  Snowflake,
  FlaskConical,
  Database,
  BarChart3,
  FileText,
  Building2,
  Smartphone,
  Monitor,
  ChevronRight,
  Info
} from 'lucide-react';
import { HeatShieldLogo } from '../shared/HeatShieldLogo';
import type { DisplayMode } from '../../hooks/useResponsiveMode';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  displayMode: DisplayMode;
  onSetDisplayMode: (mode: DisplayMode) => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  displayMode,
  onSetDisplayMode
}) => {
  if (!isOpen) return null;

  const citizenItems = [
    { id: 'risk', label: 'Heat Risk Details', icon: Flame, color: 'text-amber-400' },
    { id: 'plan', label: 'Plan & Daily Routine', icon: Calendar, color: 'text-blue-400' },
    { id: 'worker', label: 'Worker Safety Mode', icon: HardHat, color: 'text-yellow-400' },
    { id: 'sos', label: 'Cooling Shelters & SOS', icon: Snowflake, color: 'text-cyan-400' },
    { id: 'villages', label: 'All Villages & Districts (787)', icon: Building2, color: 'text-emerald-400' },
    { id: 'apps', label: 'Download Suite (APK / iOS)', icon: Smartphone, color: 'text-purple-400' },
  ];

  const researchItems = [
    { id: 'research', label: 'Research & Defense Mode', icon: FlaskConical, color: 'text-indigo-400' },
    { id: 'lab', label: 'Full Climate Intelligence Lab (RQ1–RQ6)', icon: Database, color: 'text-purple-400' },
    { id: 'insights', label: 'Model Insights & ANOVA', icon: BarChart3, color: 'text-rose-400' },
    { id: 'reports', label: 'Export Executive Report (.md)', icon: FileText, color: 'text-teal-400' },
  ];

  const handleItemClick = (id: string) => {
    onNavigateTab(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dark Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-Over Drawer Container */}
      <div className="relative w-80 max-w-[85vw] bg-[#0B132B] border-r border-slate-800 h-full flex flex-col justify-between p-4 shadow-2xl z-50 overflow-y-auto">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <HeatShieldLogo size="sm" showTagline={true} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Citizen Suite Section */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-2">
              Citizen &amp; Workplace Suite
            </span>
            <div className="space-y-1">
              {citizenItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Research & Data Section */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-2">
              Research &amp; Analytics
            </span>
            <div className="space-y-1">
              {researchItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience Switcher (Mobile App vs Desktop Mode) */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>Display Experience</span>
            </span>

            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => onSetDisplayMode('mobile')}
                className={`py-1.5 rounded-lg transition ${
                  displayMode === 'mobile' || displayMode === 'auto'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mobile App
              </button>
              <button
                onClick={() => onSetDisplayMode('desktop')}
                className={`py-1.5 rounded-lg transition ${
                  displayMode === 'desktop'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Desktop Mode
              </button>
            </div>
          </div>

          {/* Scientific Attribution Footnote */}
          <div className="p-3 rounded-2xl bg-[#090F1F] border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Info className="w-3 h-3 text-emerald-400" />
              <span>Data Sources &amp; Integrity</span>
            </div>
            <p className="leading-relaxed">
              NOAA GSOD 46 Synoptic Stations (2022–2025) • IMD Heat Action Plans • Continuous 4-Station Spatial IDW ($k=4, p=2.0$).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-center text-[10px] text-slate-500">
          HeatShield AI • SIH26083 Release
        </div>
      </div>
    </div>
  );
};
