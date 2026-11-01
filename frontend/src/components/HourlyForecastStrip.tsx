import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { HourlyForecastResponse, HourlyForecastItem, LanguageCode } from '../types';
import { getTranslation } from '../utils/localization';
import {
  Sun,
  Flame,
  Droplets,
  Clock
} from 'lucide-react';

interface HourlyForecastStripProps {
  lat: number;
  lon: number;
  stationId?: string;
  lang: LanguageCode;
  onPeakRiskDetected?: (peakHi: number, peakTier: string) => void;
}

export const HourlyForecastStrip: React.FC<HourlyForecastStripProps> = ({
  lat,
  lon,
  stationId,
  lang,
  onPeakRiskDetected
}) => {
  const [forecast, setForecast] = useState<HourlyForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedHour, setSelectedHour] = useState<HourlyForecastItem | null>(null);

  // Current system hour to highlight
  const currentHourNum = new Date().getHours();

  useEffect(() => {
    let isMounted = true;
    const loadForecast = async () => {
      try {
        setLoading(true);
        const data = await api.getHourlyForecast(lat, lon, stationId);
        if (isMounted) {
          setForecast(data);
          // Set default selected hour to current hour or peak hour
          const curr = data.hourly.find(h => h.hour_num === currentHourNum) || data.hourly.find(h => h.is_peak) || data.hourly[0];
          setSelectedHour(curr);

          if (onPeakRiskDetected && data.peak_heat_index_c) {
            onPeakRiskDetected(data.peak_heat_index_c, data.peak_tier);
          }
        }
      } catch (err) {
        console.error('Failed to load hourly forecast:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadForecast();
    return () => { isMounted = false; };
  }, [lat, lon, stationId]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Low':
        return {
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          bg: 'hover:border-emerald-500/50',
          text: 'text-emerald-400',
          dot: 'bg-emerald-500'
        };
      case 'Moderate':
        return {
          badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          bg: 'hover:border-yellow-500/50',
          text: 'text-yellow-400',
          dot: 'bg-yellow-500'
        };
      case 'High':
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          bg: 'hover:border-amber-500/50',
          text: 'text-amber-400',
          dot: 'bg-amber-500'
        };
      case 'Very High':
        return {
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          bg: 'hover:border-rose-500/50',
          text: 'text-rose-400',
          dot: 'bg-rose-500'
        };
      case 'Extreme':
      default:
        return {
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          bg: 'hover:border-purple-500/50',
          text: 'text-purple-300',
          dot: 'bg-purple-500'
        };
    }
  };

  const formatHourLabel = (hNum: number) => {
    if (hNum === 12) return '12 PM';
    if (hNum > 12) return `${hNum - 12} PM`;
    return `${hNum} AM`;
  };

  if (loading) {
    return (
      <div className="bg-[#131E3A]/70 border border-slate-800 rounded-2xl p-5 animate-pulse">
        <div className="h-5 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 w-24 bg-slate-800/60 rounded-xl shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  const [viewMode, setViewMode] = useState<'both' | 'chart' | 'cards'>('both');

  if (!forecast || forecast.hourly.length === 0) return null;

  const peakColors = getTierColor(forecast.peak_tier);

  // SVG dimensions for compact chart
  const svgWidth = 600;
  const svgHeight = 130;
  const padLeft = 35;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 25;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const minHI = Math.min(...forecast.hourly.map(h => Math.min(h.heat_index_c, h.temp_c)), 24);
  const maxHI = Math.max(...forecast.hourly.map(h => Math.max(h.heat_index_c, h.temp_c)), 46);

  const getX = (idx: number) => padLeft + (idx / (forecast.hourly.length - 1)) * chartW;
  const getY = (val: number) => padTop + chartH - ((val - minHI) / (maxHI - minHI || 1)) * chartH;

  // Generate smooth path
  const hiPoints = forecast.hourly.map((h, i) => `${getX(i)},${getY(h.heat_index_c)}`);
  const tempPoints = forecast.hourly.map((h, i) => `${getX(i)},${getY(h.temp_c)}`);
  const hiPathD = `M ${hiPoints.join(' L ')}`;
  const tempPathD = `M ${tempPoints.join(' L ')}`;
  const areaPathD = `M ${getX(0)},${padTop + chartH} L ${hiPoints.join(' L ')} L ${getX(forecast.hourly.length - 1)},${padTop + chartH} Z`;

  return (
    <div className="bg-gradient-to-b from-[#131E3A]/90 to-[#0F172A]/90 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 backdrop-blur transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg">
              <Sun className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white tracking-wide">
              {getTranslation(lang, 'hourly_forecast', 'Hourly Heat Stress Forecast & Risk Curve')}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {getTranslation(lang, 'hourly_strip_subtitle', 'Interactive Diurnal Thermal Profile & Danger Window Prediction')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setViewMode('both')}
              className={`px-2 py-0.5 rounded-md font-semibold transition ${
                viewMode === 'both' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-2 py-0.5 rounded-md font-semibold transition ${
                viewMode === 'chart' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Chart
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2 py-0.5 rounded-md font-semibold transition ${
                viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cards
            </button>
          </div>

          {/* Peak Danger Window Pill */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border ${peakColors.badge} shadow-sm`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${peakColors.dot}`}></span>
            </span>
            <div className="text-xs">
              <span className="font-semibold text-slate-300 mr-1.5">
                {getTranslation(lang, 'peak_risk', 'Peak Danger')}:
              </span>
              <span className="font-bold text-white tracking-tight">
                {forecast.peak_window}
              </span>
              <span className="ml-1 text-xs opacity-90 font-extrabold">
                ({forecast.peak_heat_index_c}°C HI)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Interactive Heat-Risk Area Chart */}
      {(viewMode === 'both' || viewMode === 'chart') && (
        <div className="bg-[#0B132B]/70 border border-slate-800/80 rounded-xl p-3 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-rose-500 rounded" />
                <strong className="text-white">Heat Index (Feels Like)</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-amber-500 rounded border-dashed" />
                <span>Ambient Temp</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px]">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />&lt;32° Safe</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />38-42° High</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />&ge;42° Danger</span>
            </div>
          </div>

          <div className="relative w-full h-32 sm:h-36">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-visible select-none"
            >
              <defs>
                <linearGradient id="hi-area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padLeft} y1={getY(30)} x2={padLeft + chartW} y2={getY(30)} stroke="#1E293B" strokeDasharray="3 3" />
              <line x1={padLeft} y1={getY(38)} x2={padLeft + chartW} y2={getY(38)} stroke="#334155" strokeDasharray="3 3" />
              <line x1={padLeft} y1={getY(44)} x2={padLeft + chartW} y2={getY(44)} stroke="#475569" strokeDasharray="3 3" />

              <text x={padLeft - 5} y={getY(30) + 3} fill="#64748B" fontSize="8" textAnchor="end">30°</text>
              <text x={padLeft - 5} y={getY(38) + 3} fill="#F59E0B" fontSize="8" textAnchor="end">38°</text>
              <text x={padLeft - 5} y={getY(44) + 3} fill="#EF4444" fontSize="8" textAnchor="end">44°</text>

              {/* Peak Danger Zone Shading (11:30 AM to 4:00 PM) */}
              {(() => {
                const startIdx = forecast.hourly.findIndex(h => h.hour_num >= 11);
                const endIdx = forecast.hourly.findIndex(h => h.hour_num >= 16);
                if (startIdx >= 0 && endIdx > startIdx) {
                  const x1 = getX(startIdx);
                  const x2 = getX(endIdx);
                  return (
                    <g>
                      <rect
                        x={x1}
                        y={padTop}
                        width={x2 - x1}
                        height={chartH}
                        fill="#EF4444"
                        fillOpacity="0.12"
                        stroke="#EF4444"
                        strokeOpacity="0.25"
                        strokeDasharray="2 2"
                      />
                      <text
                        x={(x1 + x2) / 2}
                        y={padTop + 10}
                        fill="#F87171"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        ⚠️ DANGER ZONE
                      </text>
                    </g>
                  );
                }
                return null;
              })()}

              {/* Shaded Area under Heat Index */}
              <path d={areaPathD} fill="url(#hi-area-gradient)" />

              {/* Ambient Temp Line */}
              <path d={tempPathD} fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="4 2" />

              {/* Heat Index Main Line */}
              <path d={hiPathD} fill="none" stroke="#EF4444" strokeWidth="2.5" />

              {/* Interactive Scrub Nodes */}
              {forecast.hourly.map((h, i) => {
                const cx = getX(i);
                const cy = getY(h.heat_index_c);
                const isSelected = selectedHour?.hour_num === h.hour_num;
                const isNow = h.hour_num === currentHourNum;
                const nodeColor = h.heat_index_c >= 42 ? '#EF4444' : h.heat_index_c >= 38 ? '#F97316' : '#10B981';

                return (
                  <g key={h.hour} className="cursor-pointer" onClick={() => setSelectedHour(h)}>
                    {/* Hover hotspot */}
                    <circle cx={cx} cy={cy} r="10" fill="transparent" />
                    {/* Now Indicator line */}
                    {isNow && (
                      <line x1={cx} y1={padTop} x2={cx} y2={padTop + chartH} stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2 2" />
                    )}
                    {/* Selected Halo */}
                    {isSelected && (
                      <circle cx={cx} cy={cy} r="7" fill="none" stroke="#FFFFFF" strokeWidth="2" className="animate-pulse" />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 5 : 3.5}
                      fill={nodeColor}
                      stroke="#0F172A"
                      strokeWidth="1.5"
                    />
                    {/* Label */}
                    <text
                      x={cx}
                      y={padTop + chartH + 14}
                      fill={isNow ? '#38BDF8' : isSelected ? '#FFFFFF' : '#64748B'}
                      fontSize="8"
                      fontWeight={isNow || isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {formatHourLabel(h.hour_num)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Horizontal Scrollable Daylight Hourly Cards */}
      {(viewMode === 'both' || viewMode === 'cards') && (
        <div className="relative">
        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
          {forecast.hourly.map((item) => {
            const colors = getTierColor(item.risk_tier);
            const isSelected = selectedHour?.hour_num === item.hour_num;
            const isNow = item.hour_num === currentHourNum;

            return (
              <button
                key={item.hour}
                type="button"
                onClick={() => setSelectedHour(item)}
                className={`flex-shrink-0 w-24 p-3 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-between gap-1.5 relative select-none ${
                  isSelected
                    ? 'bg-[#1E293B] border-amber-400 shadow-md ring-1 ring-amber-400/40'
                    : item.is_peak
                    ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70'
                    : 'bg-slate-900/60 border-slate-800/90 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                {/* Now Badge */}
                {isNow && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-blue-600 text-[9px] font-black uppercase text-white rounded-full tracking-wider shadow">
                    NOW
                  </span>
                )}

                {/* Peak Badge */}
                {item.is_peak && !isNow && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-rose-600 text-[9px] font-black uppercase text-white rounded-full tracking-wider shadow">
                    PEAK
                  </span>
                )}

                {/* Hour Label */}
                <span className="text-xs font-semibold text-slate-300 mt-1">
                  {formatHourLabel(item.hour_num)}
                </span>

                {/* Weather Icon */}
                <div className="my-1">
                  {item.heat_index_c >= 45 ? (
                    <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
                  ) : item.heat_index_c >= 38 ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : item.heat_index_c >= 30 ? (
                    <Sun className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-emerald-400" />
                  )}
                </div>

                {/* Feels-Like Heat Index */}
                <div className="text-sm font-extrabold text-white">
                  {item.heat_index_c}°
                  <span className="text-[10px] font-normal text-slate-400 ml-0.5">HI</span>
                </div>

                {/* Ambient Temp & Humidity */}
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 w-full">
                  <span>{item.temp_c}°</span>
                  <span>•</span>
                  <span className="flex items-center text-sky-400">
                    <Droplets className="w-2.5 h-2.5 inline mr-0.5" />
                    {item.humidity_pct}%
                  </span>
                </div>

                {/* Tier Indicator Pill */}
                <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border w-full truncate ${colors.badge}`}>
                  {getTranslation(lang, `tier_${item.risk_tier.toLowerCase().replace(' ', '_')}`, item.risk_tier)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Selected Hour Detail Banner */}
      {selectedHour && (
        <div className="bg-[#162038] border border-slate-700/60 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${getTierColor(selectedHour.risk_tier).badge}`}>
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {formatHourLabel(selectedHour.hour_num)} Outlook
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getTierColor(selectedHour.risk_tier).badge}`}>
                  {getTranslation(lang, `tier_${selectedHour.risk_tier.toLowerCase().replace(' ', '_')}`, selectedHour.risk_tier)}
                </span>
                {selectedHour.is_peak && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    🔥 {getTranslation(lang, 'peak_window_badge', 'PEAK RISK WINDOW')}
                  </span>
                )}
              </div>
              <p className="text-slate-300 mt-1 leading-relaxed">
                {selectedHour.advice}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-300 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 block">{getTranslation(lang, 'feels_like', 'Feels Like')}</span>
              <span className="font-bold text-white text-sm">{selectedHour.heat_index_c}°C</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{getTranslation(lang, 'temp', 'Temperature')}</span>
              <span className="font-semibold text-slate-200 text-sm">{selectedHour.temp_c}°C</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{getTranslation(lang, 'humidity', 'Humidity')}</span>
              <span className="font-semibold text-sky-400 text-sm">{selectedHour.humidity_pct}%</span>
            </div>
            {selectedHour.uv_index !== undefined && (
              <div>
                <span className="text-[10px] text-slate-400 block">{getTranslation(lang, 'uv_index', 'UV Index')}</span>
                <span className="font-semibold text-amber-400 text-sm">{selectedHour.uv_index}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
