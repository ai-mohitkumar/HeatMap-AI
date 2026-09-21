import React, { useState } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav, type MobileTab } from './MobileBottomNav';
import { MobileMoreDrawer } from './MobileMoreDrawer';
import { MobileLocationModal } from './MobileLocationModal';
import { MobileHome } from './MobileHome';
import { MobileMap } from './MobileMap';
import { MobileAI } from './MobileAI';
import { MobileFamily } from './MobileFamily';
import { MobileAlerts } from './MobileAlerts';
import { MobileResearch } from './MobileResearch';
import type { DisplayMode } from '../../hooks/useResponsiveMode';
import type { StationInfluenceItem } from './MobileIDWCard';

// Secondary views reused from components
import { OFFLINE_STATIONS } from '../../utils/offlineEngine';
import { VulnerabilityProfilesView } from '../VulnerabilityProfilesView';
import { PublicSafetyView } from '../PublicSafetyView';
import { VillageDistrictExplorer } from '../VillageDistrictExplorer';
import { DeviceShowcaseView } from '../DeviceShowcaseView';
import { ClimateIntelligenceLab } from '../ClimateIntelligenceLab';
import { AIInsightsView } from '../AIInsightsView';
import { MethodologyPanel } from '../MethodologyPanel';
import { DataQualityCard } from '../DataQualityCard';
import { ModelEvaluation } from '../ModelEvaluation';
import { ClusterRadarChart } from '../ClusterRadarChart';
import { PCAVisualizer } from '../PCAVisualizer';
import { HierarchicalComparisonView } from '../HierarchicalComparisonView';
import { ScientificLimitationsCard } from '../ScientificLimitationsCard';
import { TemporalAnalysisView } from '../TemporalAnalysisView';
import { ErrorBoundary } from '../ErrorBoundary';

interface MobileLayoutProps {
  locationName: string;
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windKmh: number;
  riskLevel: string;
  currentLat: number;
  currentLon: number;
  accuracyM?: number;
  contributingStations: StationInfluenceItem[];
  selectedStationId: string;
  activeK: number;
  activeYear?: number | null;
  profiles: any[];
  mapStations?: any[];
  aiInsights: any;
  customLocation: any;
  onSelectStation: (stationId: string) => void;
  onSelectLocation: (loc: any) => void;
  onTrackMove: () => void;
  isTracking?: boolean;
  gpsStatusMessage?: string | null;
  onExportReport: () => void;
  displayMode: DisplayMode;
  onSetDisplayMode: (mode: DisplayMode) => void;
  dataQuality?: any;
  coverage?: any;
  evaluations?: any[];
  optimalKData?: any;
  featureSeparation?: any[];
  stability?: any;
  radarCentroids?: any;
  pcaData?: any;
  umapData?: any;
  hierarchicalComparison?: any;
  annualShifts?: any[];
  onSelectK?: (k: number) => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  locationName,
  tempC,
  feelsLikeC,
  humidityPct,
  windKmh,
  riskLevel,
  currentLat,
  currentLon,
  accuracyM = 50,
  contributingStations,
  selectedStationId,
  activeK,
  profiles,
  mapStations,
  aiInsights,
  customLocation,
  onSelectStation,
  onSelectLocation,
  onTrackMove,
  isTracking = false,
  gpsStatusMessage,
  onExportReport,
  displayMode,
  onSetDisplayMode,
  dataQuality,
  coverage,
  evaluations,
  optimalKData,
  featureSeparation,
  stability,
  radarCentroids,
  pcaData,
  umapData,
  hierarchicalComparison,
  annualShifts,
  onSelectK
}) => {
  const [mobileTab, setMobileTab] = useState<MobileTab>('home');
  const [secondaryRoute, setSecondaryRoute] = useState<string | null>(null);
  const [mobileResearchSubTab, setMobileResearchSubTab] = useState<'lab' | 'validation' | 'formulas'>('lab');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  const handleSelectBottomTab = (tab: MobileTab) => {
    setMobileTab(tab);
    setSecondaryRoute(null);
  };

  const handleNavigateAny = (target: string) => {
    if (target === 'home' || target === 'map' || target === 'ai' || target === 'family' || target === 'alerts') {
      setMobileTab(target as MobileTab);
      setSecondaryRoute(null);
    } else if (target === 'reports') {
      onExportReport();
    } else {
      setSecondaryRoute(target);
    }
  };

  return (
    <div className="min-h-screen bg-[#090F1F] text-slate-100 flex flex-col font-sans select-none">
      {/* 1. Sleek Compact Mobile Header */}
      <MobileHeader
        locationName={locationName}
        onOpenLocationPicker={() => setIsLocationModalOpen(true)}
        onOpenAlerts={() => {
          setMobileTab('alerts');
          setSecondaryRoute(null);
        }}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        hasUnreadAlerts={true}
      />

      {/* Live GPS / Location Status Notification */}
      {gpsStatusMessage && (
        <div className="fixed top-14 left-3 right-3 z-50 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none">
          <div className="bg-gradient-to-r from-blue-900/95 via-indigo-900/95 to-slate-900/95 text-blue-200 text-xs font-bold px-3.5 py-2 rounded-2xl shadow-2xl border border-blue-400/50 backdrop-blur-xl flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="text-white font-medium tracking-wide">{gpsStatusMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Scroll Area */}
      <main className="flex-1 overflow-y-auto px-1 pt-1 pb-16">
        {/* Secondary Routes (Triggered from More Drawer or action buttons) */}
        {secondaryRoute === 'risk' && (
          <div className="p-3.5 space-y-3 pb-24">
            <button
              onClick={() => setSecondaryRoute(null)}
              className="text-xs text-blue-400 font-bold mb-2 flex items-center gap-1"
            >
              ← Back to Overview
            </button>
            <VulnerabilityProfilesView profiles={profiles} />
          </div>
        )}

        {secondaryRoute === 'plan' && (
          <div className="p-3.5 space-y-3 pb-24">
            <button
              onClick={() => setSecondaryRoute(null)}
              className="text-xs text-blue-400 font-bold mb-2 flex items-center gap-1"
            >
              ← Back to Overview
            </button>
            <PublicSafetyView
              stations={OFFLINE_STATIONS.map((s) => ({ station_id: s.station_id, name: s.station_name }))}
              activeStationId={selectedStationId}
              onSelectStation={onSelectStation}
              initialTab="plan"
            />
          </div>
        )}

        {secondaryRoute === 'worker' && (
          <div className="p-3.5 space-y-3 pb-24">
            <button
              onClick={() => setSecondaryRoute(null)}
              className="text-xs text-blue-400 font-bold mb-2 flex items-center gap-1"
            >
              ← Back to Overview
            </button>
            <PublicSafetyView
              stations={OFFLINE_STATIONS.map((s) => ({ station_id: s.station_id, name: s.station_name }))}
              activeStationId={selectedStationId}
              onSelectStation={onSelectStation}
              initialTab="worker"
            />
          </div>
        )}

        {secondaryRoute === 'sos' && (
          <div className="p-3.5 space-y-3 pb-24">
            <button
              onClick={() => setSecondaryRoute(null)}
              className="text-xs text-blue-400 font-bold mb-2 flex items-center gap-1"
            >
              ← Back to Overview
            </button>
            <PublicSafetyView
              stations={OFFLINE_STATIONS.map((s) => ({ station_id: s.station_id, name: s.station_name }))}
              activeStationId={selectedStationId}
              onSelectStation={onSelectStation}
              initialTab="sos"
            />
          </div>
        )}

        {secondaryRoute === 'villages' && (
          <div className="p-3.5 space-y-3 pb-24">
            <button
              onClick={() => setSecondaryRoute(null)}
              className="text-xs text-blue-400 font-bold mb-2 flex items-center gap-1"
            >
              ← Back to Overview
            </button>
            <VillageDistrictExplorer
              onSelectActiveLocation={(loc) => {
                onSelectLocation({
                  name: `${loc.name}, ${loc.district_name || loc.state_name || 'IN'}`,
                  lat: loc.lat,
                  lon: loc.lon,
                  district: loc.district_name,
                  state: loc.state_name
                });
                setSecondaryRoute(null);
                setMobileTab('home');
              }}
            />
          </div>
        )}

        {secondaryRoute === 'apps' && (
          <div className="p-3.5 space-y-3 pb-24">
            <button
              onClick={() => setSecondaryRoute(null)}
              className="text-xs text-blue-400 font-bold mb-2 flex items-center gap-1"
            >
              ← Back to Overview
            </button>
            <DeviceShowcaseView
              customLocation={customLocation}
              onSelectLocation={onSelectLocation}
            />
          </div>
        )}

        {(secondaryRoute === 'research' || secondaryRoute === 'mobile_research') && (
          <div className="p-3.5 space-y-4 pb-24">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSecondaryRoute(null)}
                className="text-xs text-blue-400 font-bold flex items-center gap-1 hover:text-blue-300 transition"
              >
                ← Back to Overview
              </button>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase border border-indigo-500/30">
                Research &amp; Viva Defense Hub
              </span>
            </div>

            {/* Mobile Research Subtab Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => setMobileResearchSubTab('lab')}
                className={`py-2 px-1 rounded-lg text-center transition ${
                  mobileResearchSubTab === 'lab'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Lab (RQ1–6)
              </button>
              <button
                onClick={() => setMobileResearchSubTab('validation')}
                className={`py-2 px-1 rounded-lg text-center transition ${
                  mobileResearchSubTab === 'validation'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Validation
              </button>
              <button
                onClick={() => setMobileResearchSubTab('formulas')}
                className={`py-2 px-1 rounded-lg text-center transition ${
                  mobileResearchSubTab === 'formulas'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3. Formulas
              </button>
            </div>

            <ErrorBoundary fallbackTitle="Research Mode Module">
              {mobileResearchSubTab === 'lab' && (
                <ClimateIntelligenceLab activeK={activeK} />
              )}

              {mobileResearchSubTab === 'validation' && (
                <div className="space-y-4">
                  <MethodologyPanel />
                  <DataQualityCard quality={dataQuality} coverage={coverage} />
                  <ModelEvaluation
                    evaluations={evaluations || []}
                    optimalKData={optimalKData}
                    featureSeparation={featureSeparation || []}
                    stability={stability}
                    activeK={activeK}
                    onSelectK={onSelectK || (() => {})}
                  />
                  <VulnerabilityProfilesView profiles={profiles} />
                  <ClusterRadarChart radarData={radarCentroids} profiles={profiles} activeK={activeK} />
                  <PCAVisualizer pcaData={pcaData} umapData={umapData} activeK={activeK} />
                  <HierarchicalComparisonView comparison={hierarchicalComparison} activeK={activeK} />
                  {annualShifts && annualShifts.length > 0 && (
                    <TemporalAnalysisView
                      annualShifts={annualShifts}
                      stations={(mapStations || OFFLINE_STATIONS).map((st: any) => ({
                        station_id: st.station_id,
                        name: st.name || st.station_name
                      }))}
                    />
                  )}
                  <ScientificLimitationsCard />
                </div>
              )}

              {mobileResearchSubTab === 'formulas' && (
                <MobileResearch />
              )}
            </ErrorBoundary>
          </div>
        )}

        {secondaryRoute === 'lab' && (
          <div className="p-3.5 space-y-3 pb-24">
            <button
              onClick={() => setSecondaryRoute(null)}
              className="text-xs text-blue-400 font-bold mb-2 flex items-center gap-1"
            >
              ← Back to Overview
            </button>
            <ErrorBoundary fallbackTitle="Climate Intelligence Lab">
              <ClimateIntelligenceLab activeK={activeK} />
            </ErrorBoundary>
          </div>
        )}

        {secondaryRoute === 'insights' && (
          <div className="p-3.5 space-y-3 pb-24">
            <button
              onClick={() => setSecondaryRoute(null)}
              className="text-xs text-blue-400 font-bold mb-2 flex items-center gap-1"
            >
              ← Back to Overview
            </button>
            <AIInsightsView
              insights={aiInsights}
              onExportReport={onExportReport}
            />
          </div>
        )}

        {/* Primary 5-Tab Views */}
        {!secondaryRoute && mobileTab === 'home' && (
          <MobileHome
            locationName={locationName}
            tempC={tempC}
            feelsLikeC={feelsLikeC}
            humidityPct={humidityPct}
            windKmh={windKmh}
            riskLevel={riskLevel}
            currentLat={currentLat}
            currentLon={currentLon}
            accuracyM={accuracyM}
            contributingStations={contributingStations}
            selectedStationId={selectedStationId}
            onSelectStation={onSelectStation}
            onTrackMove={onTrackMove}
            isTracking={isTracking}
            gpsStatusMessage={gpsStatusMessage}
            onOpenLocationPicker={() => setIsLocationModalOpen(true)}
            onNavigateTab={handleNavigateAny}
            onViewSafetyPlan={() => setSecondaryRoute('plan')}
          />
        )}

        {!secondaryRoute && mobileTab === 'map' && (
          <div className="p-3.5 pb-24">
            <MobileMap
              currentLat={currentLat}
              currentLon={currentLon}
              locationName={locationName}
              heatIndexC={feelsLikeC}
              riskLevel={riskLevel}
              selectedStationId={selectedStationId}
              onSelectStation={onSelectStation}
              isFullscreen={false}
            />
          </div>
        )}

        {!secondaryRoute && mobileTab === 'ai' && (
          <div className="p-3.5 pb-24">
            <MobileAI
              locationName={locationName}
              tempC={tempC}
              feelsLikeC={feelsLikeC}
              humidityPct={humidityPct}
              riskLevel={riskLevel}
            />
          </div>
        )}

        {!secondaryRoute && mobileTab === 'family' && (
          <div className="p-3.5 pb-24">
            <MobileFamily />
          </div>
        )}

        {!secondaryRoute && mobileTab === 'alerts' && (
          <div className="p-3.5 pb-24">
            <MobileAlerts
              locationName={locationName}
              riskLevel={riskLevel}
              tempC={tempC}
              feelsLikeC={feelsLikeC}
              currentLat={currentLat}
              currentLon={currentLon}
              selectedStationId={selectedStationId}
            />
          </div>
        )}
      </main>

      {/* 3. Native 5-Tab Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={mobileTab}
        onSelectTab={handleSelectBottomTab}
        onOpenMore={() => setIsDrawerOpen(true)}
        hasUnreadAlerts={true}
      />

      {/* 4. Slide-Over More & Settings Drawer */}
      <MobileMoreDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigateTab={handleNavigateAny}
        displayMode={displayMode}
        onSetDisplayMode={onSetDisplayMode}
      />

      {/* 5. Mobile Location Picker Modal */}
      <MobileLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectStation={(stId) => {
          onSelectStation(stId);
          setIsLocationModalOpen(false);
        }}
        onSelectLocation={(loc) => {
          onSelectLocation(loc);
          setIsLocationModalOpen(false);
        }}
        onTrackMove={onTrackMove}
        isTracking={isTracking}
      />
    </div>
  );
};
