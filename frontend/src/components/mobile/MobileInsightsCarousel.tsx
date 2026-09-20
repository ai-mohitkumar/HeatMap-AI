import React, { useState, useRef } from 'react';
import { Flame, Droplets, TreePine, Users, Plus, ChevronRight } from 'lucide-react';

interface MobileInsightsCarouselProps {
  riskLevel: string;
  peakWindow?: string;
  waterLoggedCount: number;
  onLogWater: () => void;
  onNavigateTab: (tab: 'home' | 'map' | 'ai' | 'family' | 'alerts' | string) => void;
}

export const MobileInsightsCarousel: React.FC<MobileInsightsCarouselProps> = ({
  riskLevel,
  peakWindow = '12:30 – 3:30 PM',
  waterLoggedCount,
  onLogWater,
  onNavigateTab
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const insights = [
    {
      id: 'heat',
      title: 'Heat Risk',
      icon: Flame,
      color: 'from-orange-500/20 to-rose-500/10 border-orange-500/30 text-orange-400',
      tag: 'Peak Window',
      headline: `${riskLevel} Risk Expected`,
      detail: `Peak thermal radiation between ${peakWindow}. Keep hydration active.`,
      actionLabel: 'Details',
      onAction: () => onNavigateTab('risk')
    },
    {
      id: 'hydration',
      title: 'Hydration Target',
      icon: Droplets,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
      tag: '8 / 12 Glasses',
      headline: `${waterLoggedCount} Glasses Logged Today`,
      detail: 'Drink approx. 250ml every 20–25 minutes under current sweat rate.',
      actionLabel: '+1 Glass',
      onAction: onLogWater,
      actionIcon: Plus
    },
    {
      id: 'cooling',
      title: 'Cooling Shelter',
      icon: TreePine,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      tag: '1.2 km Away',
      headline: 'Civic Misting & Shaded Park',
      detail: 'Public cool pavilion active with free chilled drinking water.',
      actionLabel: 'Directions',
      onAction: () => onNavigateTab('sos')
    },
    {
      id: 'family',
      title: 'Family Watchlist',
      icon: Users,
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400',
      tag: 'All Safe',
      headline: '2 Family Members Monitored',
      detail: 'Grandparents in Buxar & children in Patna checked within last hour.',
      actionLabel: 'View Watchlist',
      onAction: () => onNavigateTab('family')
    }
  ];

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setActiveIdx(index);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
          Today's Live Insights
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">← Swipe →</span>
      </div>

      {/* Horizontal Snap Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {insights.map((item) => {
          const Icon = item.icon;
          const ActionIcon = item.actionIcon || ChevronRight;

          return (
            <div
              key={item.id}
              className={`min-w-[84vw] sm:min-w-[340px] snap-center rounded-2xl bg-gradient-to-br ${item.color} bg-[#10182E] border p-4 flex flex-col justify-between shadow-lg relative overflow-hidden`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700/60">
                    {item.tag}
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-black text-white">{item.headline}</h4>
                  <p className="text-xs text-slate-300/90 mt-1 leading-relaxed">{item.detail}</p>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-end">
                <button
                  onClick={item.onAction}
                  className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                >
                  <span>{item.actionLabel}</span>
                  <ActionIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {insights.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTo({
                  left: i * scrollRef.current.clientWidth,
                  behavior: 'smooth'
                });
              }
            }}
            className={`transition-all duration-300 rounded-full ${
              activeIdx === i
                ? 'w-5 h-1.5 bg-amber-400'
                : 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-500'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
