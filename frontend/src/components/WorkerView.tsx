import React, { useState, useEffect } from 'react';
import type {
  SafetyRiskAssessment,
  LanguageCode
} from '../types';
import { getTranslation } from '../utils/localization';
import { initiatePhoneCall } from '../utils/phoneCall';
import {
  Droplets,
  TreeDeciduous,
  Timer,
  HardHat,
  PhoneCall,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

interface WorkerViewProps {
  assessment: SafetyRiskAssessment;
  lang: LanguageCode;
}

export const WorkerView: React.FC<WorkerViewProps> = ({
  assessment,
  lang
}) => {
  // 15-minute rest timer
  const [timerSeconds, setTimerSeconds] = useState<number>(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<'water' | 'shade' | 'protection' | null>(null);
  const [glassesLogged, setGlassesLogged] = useState<number>(4);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(15 * 60);
  };

  const workRestRatio = assessment.heat_risk_score > 80
    ? 'Work 30 min / Rest 30 min'
    : assessment.heat_risk_score > 60
    ? 'Work 45 min / Rest 15 min'
    : 'Work 50 min / Rest 10 min';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* High-Contrast Sun-Glared Header Banner */}
      <div className="bg-black border-4 border-amber-500 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-amber-500 text-black rounded-2xl font-black text-xl">
              ⚠️
            </span>
            <div>
              <div className="text-xs uppercase font-black tracking-widest text-amber-400">
                Direct-Sun Tactical Mode
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {getTranslation(lang, 'worker_mode', 'Worker Tactical Heat Shield')}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => initiatePhoneCall('108', e)}
            className="bg-red-600 hover:bg-red-500 text-white font-black text-sm px-4 py-3 rounded-2xl flex items-center gap-2 border-2 border-white shadow-xl animate-pulse active:scale-95 cursor-pointer"
          >
            <PhoneCall className="w-5 h-5" />
            <span className="hidden sm:inline">CALL 108</span>
          </button>
        </div>
      </div>

      {/* Giant Thermal Danger Gauge */}
      <div className="bg-black border-4 border-red-500 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
        <div className="inline-block px-4 py-1.5 rounded-full bg-red-600 text-white font-black text-sm tracking-widest uppercase">
          {assessment.tier_badge} HEAT HAZARD
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-12 py-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">
              Air Temperature
            </div>
            <div className="text-5xl sm:text-6xl font-black text-white tracking-tight">
              {assessment.current_weather.temperature_c}°C
            </div>
          </div>
          <div className="h-16 w-1 bg-gray-800 rounded"></div>
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-400 font-bold">
              Feels-Like Index
            </div>
            <div className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight">
              {assessment.current_weather.heat_index_c}°C
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-4 text-white text-sm sm:text-base font-bold flex items-center justify-center gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>Recommended Protocol: <strong className="text-amber-300">{workRestRatio} in shade</strong></span>
        </div>
      </div>

      {/* Rest Countdown Timer Card */}
      <div className="bg-gray-950 border-4 border-emerald-500 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
        <div className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-2">
          <Timer className="w-4 h-4" />
          <span>Mandatory Shaded Rest Timer</span>
        </div>

        <div className="text-6xl sm:text-7xl font-mono font-black text-white tracking-widest">
          {formatTimer(timerSeconds)}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`px-8 py-3.5 rounded-2xl text-base font-black flex items-center gap-2 transition shadow-xl ${
              isTimerRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{isTimerRunning ? 'PAUSE' : 'START REST'}</span>
          </button>
          <button
            onClick={handleResetTimer}
            className="px-5 py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl text-sm font-bold flex items-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* 4 Giant Tactile Touch Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* 1. WATER */}
        <button
          onClick={() => setActiveModal('water')}
          className="bg-black border-4 border-cyan-500 hover:border-cyan-300 text-white p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition shadow-xl group active:scale-95"
        >
          <div className="w-14 h-14 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
            <Droplets className="w-8 h-8" />
          </div>
          <span className="text-lg font-black tracking-wider uppercase text-cyan-400">
            {getTranslation(lang, 'water', 'WATER')}
          </span>
          <span className="text-xs text-gray-400">
            {glassesLogged} glasses taken
          </span>
        </button>

        {/* 2. SHADE */}
        <button
          onClick={() => setActiveModal('shade')}
          className="bg-black border-4 border-emerald-500 hover:border-emerald-300 text-white p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition shadow-xl group active:scale-95"
        >
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
            <TreeDeciduous className="w-8 h-8" />
          </div>
          <span className="text-lg font-black tracking-wider uppercase text-emerald-400">
            {getTranslation(lang, 'shade', 'SHADE')}
          </span>
          <span className="text-xs text-gray-400">
            Rest protocol
          </span>
        </button>

        {/* 3. BREAK */}
        <button
          onClick={() => {
            setIsTimerRunning(true);
            setTimerSeconds(15 * 60);
          }}
          className="bg-black border-4 border-amber-500 hover:border-amber-300 text-white p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition shadow-xl group active:scale-95"
        >
          <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
            <Timer className="w-8 h-8" />
          </div>
          <span className="text-lg font-black tracking-wider uppercase text-amber-400">
            {getTranslation(lang, 'break', 'BREAK')}
          </span>
          <span className="text-xs text-gray-400">
            15m countdown
          </span>
        </button>

        {/* 4. PROTECTION */}
        <button
          onClick={() => setActiveModal('protection')}
          className="bg-black border-4 border-purple-500 hover:border-purple-300 text-white p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition shadow-xl group active:scale-95"
        >
          <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
            <HardHat className="w-8 h-8" />
          </div>
          <span className="text-lg font-black tracking-wider uppercase text-purple-400">
            {getTranslation(lang, 'protection', 'PROTECTION')}
          </span>
          <span className="text-xs text-gray-400">
            Head & skin gear
          </span>
        </button>
      </div>

      {/* Modal for Tactile Guidance */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-black border-4 border-amber-500 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-xl font-black uppercase text-amber-400 flex items-center gap-2">
                {activeModal === 'water' && '💧 Water & Electrolyte Rules'}
                {activeModal === 'shade' && '🌳 Immediate Shade Protocol'}
                {activeModal === 'protection' && '🧢 Sun Protection Checklist'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-white font-black text-lg p-2"
              >
                ✕
              </button>
            </div>

            {activeModal === 'water' && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-300">
                  Drink 1 glass of water every 20 minutes under direct sun, even if you are not thirsty.
                </p>
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-bold">Logged today: {glassesLogged} glasses</span>
                  <button
                    onClick={() => setGlassesLogged(prev => prev + 1)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    + Drink 1 Glass Now
                  </button>
                </div>
                <div className="text-xs text-amber-300 space-y-1">
                  <div>⚠️ Watch for dark-colored urine — it means severe dehydration!</div>
                  <div>🧂 Add pinch of salt or ORS powder to prevent muscle cramps.</div>
                </div>
              </div>
            )}

            {activeModal === 'shade' && (
              <div className="space-y-3 text-sm text-gray-200">
                <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Always rest under dense tree cover, canopy tent, or ventilated verandas.</span>
                </div>
                <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Remove helmet or heavy harness while resting to let body heat vent.</span>
                </div>
                <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Soak a towel or gamcha in cool water and drape across neck.</span>
                </div>
              </div>
            )}

            {activeModal === 'protection' && (
              <div className="space-y-3 text-sm text-gray-200">
                <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>Wear wide-brim hat, helmet cloth drape, or cotton gamcha on head.</span>
                </div>
                <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>Wear full-sleeve, lightweight, light-colored cotton clothing.</span>
                </div>
                <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>Protect eyes with anti-UV sunglasses to prevent corneal strain.</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-2xl transition"
            >
              GOT IT — RESUME SAFELY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
