import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type {
  SafetyRiskAssessment,
  LanguageCode
} from '../types';
import { getTranslation } from '../utils/localization';
import { CompanionHome } from './CompanionHome';
import { ActivityPlannerView } from './ActivityPlannerView';
import { FamilyCareView } from './FamilyCareView';
import { WorkerView } from './WorkerView';
import { HeatAssistantChat } from './HeatAssistantChat';
import { CoolingSosView } from './CoolingSosView';
import { AllStationsLiveView } from './AllStationsLiveView';
import { NationalGpsGraph } from './NationalGpsGraph';
import {
  Home,
  Calendar,
  Heart,
  HardHat,
  Bot,
  Building2,
  Globe,
  Radio
} from 'lucide-react';

interface PublicSafetyViewProps {
  stations: Array<{ station_id: string; name: string }>;
  activeStationId?: string;
  onSelectStation?: (stationId: string) => void;
  initialTab?: CompanionTab;
  lang?: LanguageCode;
}

export type CompanionTab = 'home' | 'plan' | 'family' | 'worker' | 'chat' | 'sos' | 'all_stations' | 'gps_graph';

export const PublicSafetyView: React.FC<PublicSafetyViewProps> = ({
  stations,
  activeStationId,
  onSelectStation,
  initialTab = 'home',
  lang = 'en'
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(
    activeStationId || (stations[0]?.station_id ?? '42182099999')
  );
  const [activeTab, setActiveTab] = useState<CompanionTab>(initialTab);
  const [currentLang, setCurrentLang] = useState<LanguageCode>(lang);
  const [assessment, setAssessment] = useState<SafetyRiskAssessment | null>(null);

  useEffect(() => {
    if (lang) {
      setCurrentLang(lang);
    }
  }, [lang]);

  useEffect(() => {
    if (activeStationId && activeStationId !== selectedStationId) {
      setSelectedStationId(activeStationId);
    }
  }, [activeStationId]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    // Keep assessment updated for Worker Mode
    api.getSafetyAssessment(selectedStationId)
      .then(setAssessment)
      .catch(err => console.error('Failed to pre-fetch assessment for companion:', err));
  }, [selectedStationId]);

  const handleStationChange = (newId: string) => {
    setSelectedStationId(newId);
    if (onSelectStation) {
      onSelectStation(newId);
    }
  };

  const activeStationName = stations.find(s => s.station_id === selectedStationId)?.name || 'Local Area';

  const TABS = [
    {
      id: 'home' as CompanionTab,
      label: getTranslation(currentLang, 'tab_home', 'Home'),
      icon: <Home className="w-4 h-4" />
    },
    {
      id: 'plan' as CompanionTab,
      label: getTranslation(currentLang, 'tab_plan', 'Plan & Routine'),
      icon: <Calendar className="w-4 h-4" />
    },
    {
      id: 'family' as CompanionTab,
      label: getTranslation(currentLang, 'tab_family', 'Family Watchlist'),
      icon: <Heart className="w-4 h-4 text-rose-400" />
    },
    {
      id: 'worker' as CompanionTab,
      label: getTranslation(currentLang, 'tab_worker', 'Worker Mode'),
      icon: <HardHat className="w-4 h-4 text-amber-400" />
    },
    {
      id: 'chat' as CompanionTab,
      label: getTranslation(currentLang, 'tab_chat', 'AI Assistant'),
      icon: <Bot className="w-4 h-4 text-cyan-400" />
    },
    {
      id: 'sos' as CompanionTab,
      label: getTranslation(currentLang, 'tab_sos', 'Cooling & SOS'),
      icon: <Building2 className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'all_stations' as CompanionTab,
      label: 'All 46 Sets Live',
      icon: <Globe className="w-4 h-4 text-amber-400" />
    },
    {
      id: 'gps_graph' as CompanionTab,
      label: 'National GPS Graph',
      icon: <Radio className="w-4 h-4 text-cyan-400" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Header Navigation Bar with Multilingual Switcher */}
      <div className="bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-16 z-30">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Multilingual Selector (EN | हिन्दी | ਪੰਜਾਬੀ) */}
        <div className="flex items-center gap-1.5 bg-gray-800/90 px-3 py-1.5 rounded-xl border border-gray-700/80 self-end sm:self-center">
          <Globe className="w-3.5 h-3.5 text-gray-400" />
          {[
            { code: 'en' as LanguageCode, label: 'EN' },
            { code: 'hi' as LanguageCode, label: 'हिन्दी' },
            { code: 'pa' as LanguageCode, label: 'ਪੰਜਾਬੀ' }
          ].map(l => (
            <button
              key={l.code}
              onClick={() => setCurrentLang(l.code)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                currentLang === l.code
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="transition-all">
        {activeTab === 'home' && (
          <CompanionHome
            stations={stations}
            activeStationId={selectedStationId}
            onSelectStation={handleStationChange}
            lang={currentLang}
            onNavigateTab={(tab) => setActiveTab(tab as CompanionTab)}
          />
        )}

        {activeTab === 'plan' && (
          <ActivityPlannerView
            activeStationId={selectedStationId}
            stationName={activeStationName}
            lang={currentLang}
          />
        )}

        {activeTab === 'family' && (
          <FamilyCareView
            stations={stations}
            lang={currentLang}
          />
        )}

        {activeTab === 'worker' && assessment && (
          <WorkerView
            assessment={assessment}
            lang={currentLang}
          />
        )}

        {activeTab === 'chat' && (
          <HeatAssistantChat
            activeStationId={selectedStationId}
            stationName={activeStationName}
            lang={currentLang}
          />
        )}

        {activeTab === 'sos' && (
          <CoolingSosView
            activeStationId={selectedStationId}
            stationName={activeStationName}
            lang={currentLang}
          />
        )}

        {activeTab === 'all_stations' && (
          <AllStationsLiveView
            onSelectStation={(stId) => {
              handleStationChange(stId);
              setActiveTab('home');
            }}
            activeStationId={selectedStationId}
            lang={currentLang}
          />
        )}

        {activeTab === 'gps_graph' && (
          <NationalGpsGraph
            selectedStationId={selectedStationId}
            onSelectStation={(stId) => {
              handleStationChange(stId);
              setActiveTab('home');
            }}
          />
        )}
      </div>
    </div>
  );
};
