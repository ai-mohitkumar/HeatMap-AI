import React, { useState } from 'react';
import { Bot, ChevronRight, Send } from 'lucide-react';
import { MobileHeatCard } from './MobileHeatCard';
import { MobilePeakRiskCard } from './MobilePeakRiskCard';
import { MobileInsightsCarousel } from './MobileInsightsCarousel';
import { MobileTimeline } from './MobileTimeline';
import { MobileIDWCard, type StationInfluenceItem } from './MobileIDWCard';
import { MobileMap } from './MobileMap';

interface MobileHomeProps {
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
  onSelectStation: (stationId: string) => void;
  onTrackMove: () => void;
  isTracking?: boolean;
  gpsStatusMessage?: string | null;
  onOpenLocationPicker: () => void;
  onNavigateTab: (tab: string) => void;
  onViewSafetyPlan: () => void;
}

export const MobileHome: React.FC<MobileHomeProps> = ({
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
  onSelectStation,
  onTrackMove,
  isTracking = false,
  gpsStatusMessage,
  onOpenLocationPicker,
  onNavigateTab,
  onViewSafetyPlan
}) => {
  const [waterCount, setWaterCount] = useState<number>(8);
  const [quickAiInput, setQuickAiInput] = useState<string>('');

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? 'Good Morning 👋'
      : hour < 17
      ? 'Good Afternoon 👋'
      : 'Good Evening 👋';

  const handleQuickAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAiInput.trim()) return;
    onNavigateTab('ai');
  };

  return (
    <div className="space-y-4 px-3.5 py-3 pb-24">
      {/* 1. Greeting Banner */}
      <div className="px-1">
        <span className="text-xs font-bold text-amber-400 block tracking-wide">{greeting}</span>
        <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
          Smarter Insights for a Safer Day
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Real-time hyper-local heat stress intelligence, continuous IDW models, and proactive health recommendations.
        </p>
      </div>

      {/* 2. HUGE Temperature Card */}
      <MobileHeatCard
        locationName={locationName}
        tempC={tempC}
        feelsLikeC={feelsLikeC}
        humidityPct={humidityPct}
        windKmh={windKmh}
        riskLevel={riskLevel}
        onOpenLocationPicker={onOpenLocationPicker}
        onOpenRiskDetails={() => onNavigateTab('risk')}
      />

      {/* 3. Peak Risk Window Card */}
      <MobilePeakRiskCard
        peakWindow="12:30 PM – 3:30 PM"
        riskLevel={riskLevel}
        onViewSafetyPlan={onViewSafetyPlan}
      />

      {/* Emergency Quick Action Strip */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-red-950/60 via-slate-900 to-rose-950/60 border border-rose-500/40 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
            🚨
          </div>
          <div>
            <span className="text-xs font-black text-white block">Emergency Helplines &amp; SOS</span>
            <span className="text-[10px] text-slate-300">Ambulance 108 • National 112 • Cooling Shelters</span>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('alerts')}
          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow flex items-center gap-1 active:scale-95"
        >
          <span>Open SOS</span>
        </button>
      </div>

      {/* 4. Swipeable Interactive Insight Cards */}
      <MobileInsightsCarousel
        riskLevel={riskLevel}
        peakWindow="12:30 – 3:30 PM"
        waterLoggedCount={waterCount}
        onLogWater={() => setWaterCount((prev) => Math.min(prev + 1, 16))}
        onNavigateTab={onNavigateTab}
      />

      {/* 5. 24-Hour Diurnal Timeline */}
      <MobileTimeline
        baseTempC={tempC}
        baseHeatIndexC={feelsLikeC}
        baseHumidity={humidityPct}
        baseWind={windKmh}
      />

      {/* 6. Exact Location & 4-Station IDW Influence Breakdown */}
      <MobileIDWCard
        currentLat={currentLat}
        currentLon={currentLon}
        accuracyM={accuracyM}
        contributingStations={contributingStations}
        onTrackMove={onTrackMove}
        isTracking={isTracking}
        gpsStatusMessage={gpsStatusMessage}
        onSelectStation={onSelectStation}
      />

      {/* 7. Interactive Heat Risk Map Preview */}
      <MobileMap
        currentLat={currentLat}
        currentLon={currentLon}
        locationName={locationName}
        heatIndexC={feelsLikeC}
        riskLevel={riskLevel}
        selectedStationId={selectedStationId}
        onSelectStation={onSelectStation}
        onToggleFullscreen={() => onNavigateTab('map')}
      />

      {/* 8. Quick AI Assistant Launcher Card */}
      <div className="rounded-2xl bg-[#0F172E] border border-slate-800 p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                AI Safety Assistant
              </h3>
              <p className="text-[10px] text-slate-400">Trained on NIOSH &amp; NOAA biometeorology</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('ai')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Open Chat</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            'Is it safe to go outside?',
            'What should I wear?',
            'Give me a hydration plan',
            'Can I exercise now?'
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => onNavigateTab('ai')}
              className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 hover:border-blue-500 text-slate-300 text-[11px] font-medium transition shrink-0 whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Quick Input Bar */}
        <form onSubmit={handleQuickAiSubmit} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={quickAiInput}
            onChange={(e) => setQuickAiInput(e.target.value)}
            placeholder="Ask anything about today's heat..."
            className="flex-1 bg-[#14203D] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
