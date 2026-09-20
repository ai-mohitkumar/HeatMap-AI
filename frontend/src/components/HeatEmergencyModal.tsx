import React, { useState, useEffect, useRef } from 'react';
import type { LanguageCode } from '../types';
import { getTranslation } from '../utils/localization';
import { initiatePhoneCall } from '../utils/phoneCall';
import {
  AlertOctagon,
  PhoneCall,
  Navigation,
  Heart,
  Volume2,
  VolumeX,
  X,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

interface HeatEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  heatIndexC: number;
  temperatureC?: number;
  riskTier?: string;
  userLat?: number;
  userLon?: number;
  lang: LanguageCode;
  onNavigateToShelters?: () => void;
  onBroadcastSafety?: () => void;
}

export const HeatEmergencyModal: React.FC<HeatEmergencyModalProps> = ({
  isOpen,
  onClose,
  locationName,
  heatIndexC,
  temperatureC,
  riskTier = 'Extreme (Tier 5)',
  lang,
  onNavigateToShelters,
  onBroadcastSafety
}) => {
  const [isSirenMuted, setIsSirenMuted] = useState<boolean>(false);
  const [isBroadcastSent, setIsBroadcastSent] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Web Audio Synthesizer for Emergency Warning Chime
  useEffect(() => {
    if (!isOpen || isSirenMuted) {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch {
          // ignore already stopped
        }
        oscillatorRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      // Siren frequency modulation: oscillate between 650Hz and 950Hz
      osc.frequency.linearRampToValueAtTime(950, ctx.currentTime + 0.4);
      osc.frequency.linearRampToValueAtTime(650, ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.08, ctx.currentTime); // Soft background siren volume

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      oscillatorRef.current = osc;
      gainRef.current = gain;

      // Repeat chime
      const interval = setInterval(() => {
        if (oscillatorRef.current && audioCtxRef.current) {
          const now = audioCtxRef.current.currentTime;
          oscillatorRef.current.frequency.cancelScheduledValues(now);
          oscillatorRef.current.frequency.setValueAtTime(700, now);
          oscillatorRef.current.frequency.linearRampToValueAtTime(950, now + 0.35);
          oscillatorRef.current.frequency.linearRampToValueAtTime(700, now + 0.7);
        }
      }, 800);

      return () => {
        clearInterval(interval);
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      };
    } catch (e) {
      console.warn('[Audio Alert] Web Audio playback not allowed without user interaction:', e);
    }
  }, [isOpen, isSirenMuted]);

  const handleBroadcast = () => {
    if (onBroadcastSafety) {
      onBroadcastSafety();
    }
    setIsBroadcastSent(true);
    setTimeout(() => setIsBroadcastSent(false), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Container with High-Visibility Emergency Border */}
      <div className="bg-[#0D1117] border-2 border-rose-500 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative shadow-rose-950/60 ring-4 ring-rose-500/20">
        {/* Pulsing Emergency Top Header */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-black/30 rounded-xl animate-bounce">
              <AlertOctagon className="w-6 h-6 text-white" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-full inline-block mb-1">
                {getTranslation(lang, 'emergency_badge', 'HEAT EMERGENCY MODE')}
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                {getTranslation(lang, 'emergency_title', 'CRITICAL HEAT EMERGENCY DETECTED')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSirenMuted(!isSirenMuted)}
              aria-label={isSirenMuted ? 'Unmute siren' : 'Mute siren'}
              className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl transition"
              title={isSirenMuted ? 'Enable siren' : 'Mute siren'}
            >
              {isSirenMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" />}
            </button>
            <button
              onClick={onClose}
              aria-label="Close emergency modal"
              className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Core Warning Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Location & Severe Metrics Banner */}
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-300 font-bold block">{locationName}</span>
              <p className="text-xs text-slate-300 mt-0.5">
                {getTranslation(lang, 'emergency_directive', 'Heat Index has exceeded life-threatening threshold (≥45°C). Halt all outdoor exertion immediately.')}
              </p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <span className="text-2xl sm:text-3xl font-black text-rose-400">
                {heatIndexC}°C
              </span>
              <span className="text-[10px] block text-rose-300 font-bold uppercase tracking-wider">
                {temperatureC !== undefined ? `${temperatureC}°C Air • ` : ''}{riskTier}
              </span>
            </div>
          </div>

          {/* Instant Emergency Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Direct 108 Emergency Ambulance Call */}
            <button
              type="button"
              onClick={(e) => initiatePhoneCall('108', e)}
              className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-2xl font-bold text-sm shadow-md transition transform active:scale-95 group text-left w-full cursor-pointer"
            >
              <div className="p-2 bg-white/20 rounded-xl shrink-0 group-hover:rotate-12 transition">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
              <div className="leading-snug">
                <span className="block text-xs font-normal opacity-90">Medical Emergency</span>
                <span>{getTranslation(lang, 'call_108', 'Call 108 Ambulance')}</span>
              </div>
            </button>

            {/* 2. Direct 112 National Emergency Helpline Call */}
            <button
              type="button"
              onClick={(e) => initiatePhoneCall('112', e)}
              className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white rounded-2xl font-bold text-sm shadow-md transition transform active:scale-95 group text-left w-full cursor-pointer"
            >
              <div className="p-2 bg-white/20 rounded-xl shrink-0 group-hover:rotate-12 transition">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
              <div className="leading-snug">
                <span className="block text-xs font-normal opacity-90">National Emergency</span>
                <span>Call 112 Helpline</span>
              </div>
            </button>

            {/* 3. Navigate to Nearest Cooling Shelter */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateToShelters) onNavigateToShelters();
                onClose();
              }}
              className="flex items-center gap-3 p-3.5 bg-[#1E293B] hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white rounded-2xl font-bold text-sm shadow-md transition transform active:scale-95 group text-left"
            >
              <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl shrink-0 group-hover:scale-110 transition">
                <Navigation className="w-5 h-5" />
              </div>
              <div className="leading-snug">
                <span className="block text-xs font-normal text-slate-400">Air-Conditioned / Free Water</span>
                <span>{getTranslation(lang, 'evacuate_shelter', 'Navigate to Shelter')}</span>
              </div>
            </button>

            {/* 3. Broadcast Safety Check-in to Family */}
            <button
              type="button"
              onClick={handleBroadcast}
              className="flex items-center gap-3 p-3.5 bg-[#1E293B] hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white rounded-2xl font-bold text-sm shadow-md transition transform active:scale-95 group text-left sm:col-span-2"
            >
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 group-hover:scale-110 transition">
                {isBroadcastSent ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Heart className="w-5 h-5" />}
              </div>
              <div className="flex-1 leading-snug">
                <span className="block text-xs font-normal text-slate-400">
                  {isBroadcastSent ? 'Beacon Recorded!' : 'Notify Watchlist Contacts'}
                </span>
                <span className={isBroadcastSent ? 'text-emerald-400' : 'text-white'}>
                  {isBroadcastSent ? 'Safety Broadcast Sent to Family' : getTranslation(lang, 'broadcast_family', 'Broadcast "I\'m Safe" to Family')}
                </span>
              </div>
            </button>
          </div>

          {/* Immediate First-Aid Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              {getTranslation(lang, 'first_aid_title', 'Immediate NIOSH First-Aid Protocols')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-300">
              <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-700/50 flex items-start gap-2">
                <span className="text-base">1️⃣</span>
                <span>{getTranslation(lang, 'first_aid_shade', 'Move person to air-conditioned shelter or deep shade.')}</span>
              </div>
              <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-700/50 flex items-start gap-2">
                <span className="text-base">2️⃣</span>
                <span>{getTranslation(lang, 'first_aid_water', 'Douse skin with cool water and fan aggressively.')}</span>
              </div>
              <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-700/50 flex items-start gap-2">
                <span className="text-base">3️⃣</span>
                <span>{getTranslation(lang, 'first_aid_hydrate', 'Sip cool water or electrolyte oral rehydration salts.')}</span>
              </div>
            </div>
          </div>

          {/* Dismiss Button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              {getTranslation(lang, 'close', 'Acknowledge & Dismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
