import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type {
  ActivityEvaluationResult,
  LanguageCode
} from '../types';
import { getTranslation } from '../utils/localization';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Bike,
  Sparkles,
  MapPin,
  ChevronRight
} from 'lucide-react';

interface ActivityPlannerViewProps {
  activeStationId: string;
  stationName: string;
  lang: LanguageCode;
}

const ACTIVITIES = [
  { id: 'Running', label: '🏃 Running / Jogging', icon: '🏃', type: 'strenuous' },
  { id: 'Cricket', label: '🏏 Cricket / Outdoor Sports', icon: '🏏', type: 'strenuous' },
  { id: 'Construction', label: '🏗️ Field Work / Construction', icon: '🏗️', type: 'strenuous' },
  { id: 'Commute', label: '🛵 Two-Wheeler Commute', icon: '🛵', type: 'moderate' },
  { id: 'Walking', label: '🚶 Walking / Errands', icon: '🚶', type: 'light' },
  { id: 'Gym', label: '🏋️ Outdoor Gym / Fitness', icon: '🏋️', type: 'moderate' }
];

const COMMUTE_MODES = [
  {
    mode: 'Two-Wheeler / Scooter',
    icon: '🛵',
    risk: 'High Radiant & Convective Heat',
    tips: [
      'Tie a damp cotton cloth or scarf under helmet to cool carotid arteries.',
      'Wear UV-protective visor or sunglasses to avoid radiant eye fatigue.',
      'Stop at traffic signals under overpasses or tree shade whenever possible.',
      'Drink 300ml of water before starting even for short 20-min rides.'
    ]
  },
  {
    mode: 'Pedestrian / Walking',
    icon: '🚶',
    risk: 'Direct Solar & Asphalt Radiation',
    tips: [
      'Carry a dark-canopy UV-coated umbrella (reduces felt heat by 3–4°C).',
      'Walk on the shaded side of the street along building shadows.',
      'Wear breathable loose cotton long-sleeve shirts.',
      'Map your path through transit hubs or shops with air conditioning.'
    ]
  },
  {
    mode: 'Bus / Public Transit',
    icon: '🚌',
    risk: 'Crowd Heat & Thermal Trap at Stops',
    tips: [
      'Avoid standing in direct sunlight at exposed bus shelters.',
      'Carry an insulated water bottle with lemon electrolyte water.',
      'If waiting prolonged periods, look for shaded pyaaus or shop awnings.'
    ]
  },
  {
    mode: 'Car / Auto Rickshaw',
    icon: '🛺',
    risk: 'Greenhouse Cabin Heat Shock',
    tips: [
      'Roll down windows for 60 seconds to purge trapped 50°C cabin air before AC kicks in.',
      'Use sun-shades on passenger windows.',
      'Never leave children or pets inside an unventilated vehicle for even 1 minute.'
    ]
  }
];

export const ActivityPlannerView: React.FC<ActivityPlannerViewProps> = ({
  activeStationId,
  stationName,
  lang
}) => {
  const [selectedActivity, setSelectedActivity] = useState<string>('Running');
  const [plannedHour, setPlannedHour] = useState<number>(14); // 2 PM default
  const [durationMins, setDurationMins] = useState<number>(45);
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCommuteIndex, setActiveCommuteIndex] = useState<number>(0);

  useEffect(() => {
    handleEvaluate(selectedActivity, plannedHour, durationMins);
  }, [activeStationId, selectedActivity, plannedHour, durationMins]);

  const handleEvaluate = async (act: string, hour: number, duration: number) => {
    try {
      setLoading(true);
      const res = await api.evaluateActivity({
        station_id: activeStationId,
        activity: act,
        planned_hour: hour,
        duration_mins: duration
      });
      setEvaluation(res);
    } catch (err) {
      console.error('Failed to evaluate activity schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatHourLabel = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:00 ${period}`;
  };

  const adoptAlternative = (slotStr: string) => {
    // Extract first hour e.g. "06:30 AM" -> 6
    if (slotStr.includes('06:') || slotStr.includes('07:')) {
      setPlannedHour(7);
    } else if (slotStr.includes('07:00 PM') || slotStr.includes('07:30 PM') || slotStr.includes('08:')) {
      setPlannedHour(19);
    } else {
      setPlannedHour(8);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/60 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Smart Thermal Schedule Negotiator</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              {getTranslation(lang, 'activity_negotiator', 'Activity Schedule Negotiator')}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Don't cancel your day — let AI calculate the safest thermal windows for outdoor activities in {stationName}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-gray-800 px-3.5 py-2 rounded-xl border border-gray-700 text-gray-300">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Target: <strong className="text-white">{stationName}</strong></span>
          </div>
        </div>
      </div>

      {/* Interactive Activity Evaluator Card */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
            1. Select Planned Outdoor Activity
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ACTIVITIES.map(act => (
              <button
                key={act.id}
                onClick={() => setSelectedActivity(act.id)}
                className={`p-3 rounded-xl border text-xs font-medium transition text-left flex items-center gap-2 ${
                  selectedActivity === act.id
                    ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold shadow-md'
                    : 'bg-gray-800/70 border-gray-700 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="text-lg">{act.icon}</span>
                <span>{act.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time and Duration Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                2. Planned Time: <span className="text-emerald-400 font-black">{formatHourLabel(plannedHour)}</span>
              </label>
            </div>
            <input
              type="range"
              min="5"
              max="22"
              step="1"
              value={plannedHour}
              onChange={(e) => setPlannedHour(parseInt(e.target.value, 10))}
              aria-label="Planned Hour"
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-gray-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-gray-500 mt-1">
              <span>5:00 AM (Cool)</span>
              <span>1:00 PM (Peak Sun)</span>
              <span>10:00 PM (Night)</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                3. Duration: <span className="text-emerald-400 font-black">{durationMins} Minutes</span>
              </label>
            </div>
            <div className="flex gap-2">
              {[30, 45, 60, 90, 120].map(mins => (
                <button
                  key={mins}
                  onClick={() => setDurationMins(mins)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition ${
                    durationMins === mins
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Verdict & Explanation Card */}
        {evaluation && (
          <div
            className="rounded-2xl p-6 border transition-all space-y-4"
            style={{
              backgroundColor: `${evaluation.color}15`,
              borderColor: `${evaluation.color}50`
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: evaluation.color }}
                >
                  {evaluation.verdict === 'SAFE' && <CheckCircle2 className="w-6 h-6" />}
                  {evaluation.verdict === 'CAUTION' && <AlertTriangle className="w-6 h-6" />}
                  {evaluation.verdict === 'DANGEROUS' && <AlertOctagon className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded text-[11px] font-black tracking-wider uppercase text-white"
                      style={{ backgroundColor: evaluation.color }}
                    >
                      {evaluation.verdict}
                    </span>
                    <span className="text-xs font-bold text-gray-300">
                      {evaluation.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {evaluation.activity} at {formatHourLabel(plannedHour)} ({durationMins} mins)
                  </h3>
                </div>
              </div>

              {loading && (
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
              {evaluation.explanation}
            </p>

            <div className="bg-black/40 p-3 rounded-xl border border-white/10 text-xs text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span><strong>AI Recommendation:</strong> {evaluation.recommended_action}</span>
            </div>

            {/* Safer Alternative Slots */}
            {evaluation.safer_alternatives.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  🔄 Suggested Safer Alternative Slots Today:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {evaluation.safer_alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-900/90 border border-emerald-500/40 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-md"
                    >
                      <div>
                        <div className="text-sm font-bold text-emerald-400">
                          {alt.slot}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Expected temp: <strong className="text-white">{alt.expected_temp}</strong> • {alt.rating}
                        </div>
                      </div>
                      <button
                        onClick={() => adoptAlternative(alt.slot)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow"
                      >
                        <span>Adopt</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Commute Heat Protection Guide */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-2">
          <Bike className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="text-lg font-bold text-white">
              Transit & Commute Heat Protection Guide
            </h2>
            <p className="text-xs text-gray-400">
              Urban road tarmac radiates up to 10°C higher than ambient air. Stay protected on the move.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {COMMUTE_MODES.map((cm, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCommuteIndex(idx)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeCommuteIndex === idx
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{cm.icon}</span>
              <span>{cm.mode}</span>
            </button>
          ))}
        </div>

        {/* Mode Directives */}
        <div className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{COMMUTE_MODES[activeCommuteIndex].icon}</span>
              <span>Directives for {COMMUTE_MODES[activeCommuteIndex].mode}</span>
            </h3>
            <span className="text-[11px] bg-rose-500/20 text-rose-300 font-bold px-2.5 py-0.5 rounded-full border border-rose-500/30">
              {COMMUTE_MODES[activeCommuteIndex].risk}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {COMMUTE_MODES[activeCommuteIndex].tips.map((tip, idx) => (
              <div
                key={idx}
                className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-700/50 text-xs text-gray-200 leading-relaxed flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
