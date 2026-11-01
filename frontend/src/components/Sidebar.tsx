import React from 'react';
import {
  Home,
  Map,
  Flame,
  Calendar,
  Heart,
  HardHat,
  Snowflake,
  Bot,
  FlaskConical,
  Database,
  BarChart3,
  FileText,
  Leaf,
  Building2,
  Smartphone,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

import type { LanguageCode } from '../types';
import { getTranslation } from '../utils/localization';

export type SidebarTab =
  | 'home'
  | 'apps'
  | 'villages'
  | 'map'
  | 'risk'
  | 'plan'
  | 'family'
  | 'worker'
  | 'sos'
  | 'chat'
  | 'research'
  | 'data'
  | 'insights'
  | 'reports';

interface SidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  lang?: LanguageCode;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  lang = 'en',
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  const citizenNav = [
    { id: 'home' as SidebarTab, label: getTranslation(lang, 'tab_home', 'Home (Safety Overview)'), icon: Home },
    { id: 'map' as SidebarTab, label: getTranslation(lang, 'tab_map', 'Live Heat Map'), icon: Map },
    { id: 'villages' as SidebarTab, label: getTranslation(lang, 'tab_villages', 'Villages & Districts'), icon: Building2 },
    { id: 'sos' as SidebarTab, label: getTranslation(lang, 'tab_sos', 'Cooling Shelters & SOS'), icon: Snowflake },
    { id: 'risk' as SidebarTab, label: getTranslation(lang, 'tab_risk', 'Heat Risk Profiles'), icon: Flame },
  ];

  const protectionNav = [
    { id: 'plan' as SidebarTab, label: getTranslation(lang, 'tab_plan', 'Plan & Routine'), icon: Calendar },
    { id: 'worker' as SidebarTab, label: getTranslation(lang, 'tab_worker', 'Worker Mode'), icon: HardHat },
    { id: 'family' as SidebarTab, label: getTranslation(lang, 'tab_family', 'Family Watchlist'), icon: Heart },
    { id: 'chat' as SidebarTab, label: getTranslation(lang, 'tab_chat', 'AI Safety Assistant'), icon: Bot },
  ];

  const researchNav = [
    { id: 'research' as SidebarTab, label: getTranslation(lang, 'tab_research', 'Research & Defense'), icon: FlaskConical },
    { id: 'insights' as SidebarTab, label: getTranslation(lang, 'tab_insights', 'Model Insights'), icon: BarChart3 },
    { id: 'data' as SidebarTab, label: getTranslation(lang, 'tab_data', 'Data Explorer'), icon: Database },
    { id: 'reports' as SidebarTab, label: getTranslation(lang, 'tab_reports', 'Reports & Export'), icon: FileText },
  ];

  const deviceNav = [
    { id: 'apps' as SidebarTab, label: getTranslation(lang, 'tab_apps', 'iOS & Android Suite'), icon: Smartphone },
  ];

  const handleMobileNavClick = (tabId: SidebarTab) => {
    onSelectTab(tabId);
    if (onToggleMobileMenu) {
      onToggleMobileMenu(false);
    }
  };

  const renderNavGroup = (title: string, items: typeof citizenNav, badge?: string) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
        <span>{title}</span>
        {badge && (
          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {badge}
          </span>
        )}
      </div>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 text-left ${
                isActive
                  ? 'bg-[#1D2D50] text-blue-400 font-bold shadow-inner border-l-4 border-blue-500 rounded-l-none pl-2'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. DESKTOP / TABLET SIDEBAR RAIL (Hidden on mobile phones!)
          ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 bg-[#0B132B] border-r border-slate-800/80 flex-col justify-between select-none min-h-screen py-4 overflow-y-auto">
        <div className="px-2 space-y-5">
          {/* Group 1: Citizen Safety */}
          {renderNavGroup('Citizen Safety', citizenNav)}

          {/* Group 2: Protection & Planning */}
          {renderNavGroup('Personal & Work', protectionNav)}

          {/* Divider */}
          <div className="border-t border-slate-800/80 mx-2" />

          {/* Group 3: Science & Research */}
          {renderNavGroup('Science & Research', researchNav, 'Advanced')}

          {/* Group 4: Device Suite */}
          {renderNavGroup('Download & Suite', deviceNav)}
        </div>

        {/* Footer Motivational Quote */}
        <div className="px-5 pt-6 pb-2 text-center border-t border-slate-800/60 mt-4">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-400/90">
            <Leaf className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] italic text-slate-400 leading-relaxed font-serif">
            “A Safer Tomorrow,<br />For a Healthier You”
          </p>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. NATIVE MOBILE BOTTOM NAVIGATION BAR (Visible on mobile!)
          ───────────────────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B132B]/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-2 flex items-center justify-around shadow-2xl safe-area-bottom">
        {/* Home */}
        <button
          onClick={() => handleMobileNavClick('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'home'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''}`} />
          <span className="text-[10px]">Home</span>
        </button>

        {/* Live Map */}
        <button
          onClick={() => handleMobileNavClick('map')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'map'
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Map className={`w-5 h-5 ${activeTab === 'map' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
          <span className="text-[10px]">Live Map</span>
        </button>

        {/* All India Villages */}
        <button
          onClick={() => handleMobileNavClick('villages')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'villages'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Building2 className={`w-5 h-5 ${activeTab === 'villages' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`} />
          <span className="text-[10px]">Villages</span>
        </button>

        {/* Heat Risk */}
        <button
          onClick={() => handleMobileNavClick('risk')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'risk'
              ? 'text-rose-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Flame className={`w-5 h-5 ${activeTab === 'risk' ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`} />
          <span className="text-[10px]">Heat Risk</span>
        </button>

        {/* More / Full Menu Drawer */}
        <button
          onClick={() => onToggleMobileMenu && onToggleMobileMenu(true)}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            isMobileMenuOpen
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          3. NATIVE MOBILE SLIDE-OVER DRAWER (When Menu is tapped)
          ───────────────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Dark Blurred Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => onToggleMobileMenu && onToggleMobileMenu(false)}
          />

          {/* Slide-in Drawer Container */}
          <div className="relative w-80 max-w-[85vw] bg-[#0B132B] border-r border-slate-800/90 h-full flex flex-col justify-between p-4 shadow-2xl z-50 overflow-y-auto">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 rounded-xl shadow flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center">
                      HeatShield <span className="text-amber-400 ml-1">AI</span>
                    </h2>
                    <p className="text-[10px] text-slate-400 font-medium">All Features &amp; Modules</p>
                  </div>
                </div>
                <button
                  onClick={() => onToggleMobileMenu && onToggleMobileMenu(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/70 border border-slate-700/60 transition"
                  aria-label="Close navigation menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Section 1: Citizen Safety */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-2">
                  Citizen Safety
                </span>
                <div className="space-y-1">
                  {citizenNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMobileNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                          isActive
                            ? 'bg-[#1D2D50] text-blue-400 font-bold border-l-4 border-blue-500 rounded-l-none pl-2'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Personal & Work Protection */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-2">
                  Personal &amp; Work
                </span>
                <div className="space-y-1">
                  {protectionNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMobileNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                          isActive
                            ? 'bg-[#1D2D50] text-blue-400 font-bold border-l-4 border-blue-500 rounded-l-none pl-2'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Advanced AI & Academic Research */}
              <div>
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Science &amp; Research
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Advanced
                  </span>
                </div>
                <div className="space-y-1">
                  {researchNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMobileNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                          isActive
                            ? 'bg-[#1D2D50] text-blue-400 font-bold border-l-4 border-blue-500 rounded-l-none pl-2'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Device Suite */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-2">
                  Download &amp; Suite
                </span>
                <div className="space-y-1">
                  {deviceNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMobileNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                          isActive
                            ? 'bg-[#1D2D50] text-blue-400 font-bold border-l-4 border-blue-500 rounded-l-none pl-2'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer Quote */}
            <div className="pt-4 border-t border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-400/90">
                <Leaf className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] italic text-slate-400 leading-relaxed font-serif">
                “A Safer Tomorrow,<br />For a Healthier You”
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
