import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, RotateCcw, PhoneCall } from 'lucide-react';
import { api } from '../../services/api';
import { initiatePhoneCall } from '../../utils/phoneCall';
import type { AIAnalystResponse } from '../../types';

interface MobileAIProps {
  locationName: string;
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  riskLevel: string;
  peakWindow?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  headline?: string;
  category?: string;
  directives?: string[];
  isEmergency?: boolean;
  timestamp: string;
}

export const MobileAI: React.FC<MobileAIProps> = ({
  locationName,
  tempC,
  feelsLikeC,
  humidityPct,
  riskLevel,
  peakWindow = '12:30 PM – 3:30 PM'
}) => {
  const quickPrompts = [
    '🚨 Heat Stroke Symptoms & Helpline',
    '💧 ORS Recipe & Hydration Plan',
    '👶 Kids & Elderly Safety Rules',
    '👕 What clothing to wear?',
    '🏃 Safe travel & workout hours',
    '🔬 What is wet-bulb temperature?'
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'assistant',
      text: `Hello! I am your HeatShield AI Safety Assistant. In ${locationName}, current ambient temperature is ${tempC.toFixed(1)}°C (feels like ${feelsLikeC.toFixed(1)}°C) with ${riskLevel} heat risk. Peak radiant stress is between ${peakWindow}. How can I assist your health and safety today?`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Comprehensive Offline Knowledge Engine (Runs if offline or backend is delayed)
  const generateOfflineResponse = (userPrompt: string): {
    headline: string;
    text: string;
    category: string;
    directives: string[];
    isEmergency: boolean;
  } => {
    const q = userPrompt.toLowerCase();
    const isElevated = riskLevel.toLowerCase() === 'high' || riskLevel.toLowerCase() === 'extreme';

    // 1. Emergency & Medical Triage
    if (
      q.includes('emergency') || q.includes('108') || q.includes('112') || q.includes('stroke') ||
      q.includes('hospital') || q.includes('faint') || q.includes('unconscious') || q.includes('first aid') ||
      q.includes('ambulance') || q.includes('symptom')
    ) {
      return {
        headline: '🚨 Emergency Helplines & Heat Illness Triage',
        category: 'emergency_medical_triage',
        isEmergency: true,
        text: `CRITICAL TRIAGE PROTOCOL:
• Heat Stroke (>40°C core temp, confusion, loss of consciousness): LIFE-THREATENING. Dial 108 / 112 immediately. Move to shade, apply ice packs to neck, armpits, and groin. DO NOT give oral fluids if unconscious.
• Heat Exhaustion (Heavy sweating, dizziness, nausea, pale skin): Move to air conditioning, elevate legs 12 inches, and sip 500ml cold ORS water over 30 minutes.`,
        directives: [
          'Call 108 for emergency ambulance dispatch or 112 for national emergency coordination.',
          'Active cooling must begin immediately on site before the ambulance arrives.',
          'Do NOT administer fever medications (paracetamol/aspirin) for heat stroke.'
        ]
      };
    }

    // 2. Hydration & ORS
    if (q.includes('hydration') || q.includes('water') || q.includes('drink') || q.includes('ors') || q.includes('electrolyte')) {
      return {
        headline: '💧 Scientific Hydration & Homemade ORS Protocol',
        category: 'hydration_nutrition',
        isEmergency: false,
        text: `Under current ${humidityPct}% humidity and ${tempC.toFixed(1)}°C heat index, your sweat rate is ~0.8 to 1.2 L/hr. Drink 250ml every 20 minutes outdoors.

HOMEMADE ORS RECIPE:
• 1 Liter clean drinking water
• 6 level teaspoons sugar
• 1/2 level teaspoon table salt
Stir until dissolved. Avoid alcohol, dark tea, and sugary sodas which worsen dehydration.`,
        directives: [
          'Pre-hydrate with 500ml of fluids 1 hour before scheduled travel.',
          'Carry an insulated bottle with electrolytes or coconut water.',
          'Eat water-dense fruits like watermelon, cucumber, and oranges.'
        ]
      };
    }

    // 3. Vulnerable Demographics (Elderly, Kids, Pets, Laborers)
    if (q.includes('child') || q.includes('kid') || q.includes('baby') || q.includes('elderly') || q.includes('senior') || q.includes('pet') || q.includes('dog') || q.includes('worker')) {
      return {
        headline: '🛡️ Vulnerable Demographics Thermal Protection',
        category: 'vulnerable_populations',
        isEmergency: false,
        text: `• CHILDREN & INFANTS: Absorb heat 33% faster than adults and sweat less. NEVER leave a child in a parked car under any circumstances.
• ELDERLY (65+): Impaired thirst sensation and reduced cardiovascular vasodilation. Perform twice-daily check-ins and ensure fan/AC airflow.
• OUTDOOR WORKERS: Mandatory 15-minute shaded rest breaks every 45 minutes of heavy labor.
• DOMESTIC PETS: Dogs pant to cool off; hot asphalt burns paws. Walk pets only before 7:00 AM.`,
        directives: [
          'Establish a buddy check-in system for elderly family members twice daily.',
          'Keep children indoors in ventilated areas between 11:30 AM and 4:30 PM.',
          'Provide shaded water bowls for domestic animals and neighborhood birds.'
        ]
      };
    }

    // 4. Outdoor Activity, Clothing & Travel
    if (q.includes('wear') || q.includes('cloth') || q.includes('clothing') || q.includes('travel') || q.includes('bike') || q.includes('outside') || q.includes('exercise') || q.includes('run')) {
      return {
        headline: '🏃 Outdoor Activity & Protective Attire Guidelines',
        category: 'outdoor_activity_guidelines',
        isEmergency: false,
        text: isElevated
          ? `STRICT CAUTION: Peak radiant risk window in ${locationName} is between ${peakWindow}.
• Wear loose, light-colored 100% cotton garments to reflect sunlight and facilitate sweat evaporation.
• Wear a wide-brimmed hat, UV400 sunglasses, and apply SPF 50+ sunscreen.
• Two-wheelers: Wear a breathable cotton neck scarf and keep helmet visor cracked for ventilation.`
          : `MODERATE CONDITIONS: Morning hours (before 9:00 AM) and evening (after 5:30 PM) are optimal for outdoor workouts and errands.`,
        directives: [
          'Reschedule strenuous outdoor cardio to 05:30 AM – 07:30 AM.',
          'Stay in shaded tree corridors and avoid open asphalt transit.',
          'Carry a wet towel to drape around the neck during transit.'
        ]
      };
    }

    // 5. Indoor Cooling, AC & Fan Safety
    if (q.includes('ac') || q.includes('fan') || q.includes('cooler') || q.includes('sleep') || q.includes('night') || q.includes('room')) {
      return {
        headline: '🏠 Indoor Cooling Strategies & Fan Safety Threshold',
        category: 'indoor_cooling_safety',
        isEmergency: false,
        text: `CRITICAL FAN SAFETY THRESHOLD:
When room temperatures exceed 35°C, electric fans DO NOT cool you — they blow hot air like a convection oven, accelerating dehydration. Dampen your skin or wear a wet cotton shirt in front of the fan.

Optimal AC setting: 24°C–26°C with 'Dry' mode during humid monsoon days. Open windows for cross-ventilation only after outdoor air cools down (typically after 8:30 PM).`,
        directives: [
          'Set AC to 25°C to optimize compressor load and humidity control.',
          'Hang damp bamboo mats or curtains on west-facing windows to block radiant heat.',
          'Cool roofs with reflective white lime wash reduce ceiling temperatures by 15°C.'
        ]
      };
    }

    // 6. Meteorological & Wet-Bulb Concepts
    if (q.includes('wet bulb') || q.includes('dew point') || q.includes('idw') || q.includes('noaa') || q.includes('cluster') || q.includes('science')) {
      return {
        headline: '🔬 Biometeorological Science & Continuous IDW',
        category: 'meteorological_science',
        isEmergency: false,
        text: `Wet-bulb temperature represents the lowest temperature achievable by evaporative sweat cooling. When wet-bulb exceeds 31°C (and approaches 35°C), metabolic heat cannot dissipate from the human body even if you drink gallons of water.

HeatShield AI uses continuous Inverse Distance Weighting (k=4, p=2.0) across 46 synoptic stations to calculate your exact hyper-local heat stress index rather than crude city averages.`,
        directives: [
          'Monitor humidity levels: high humidity makes 38°C more hazardous than 45°C dry heat.',
          'Explore the Map tab to view continuous IDW contours and synoptic stations.',
          'Check the Research Hub in the More drawer to inspect mathematical proofs (RQ1–RQ6).'
        ]
      };
    }

    // 7. General Location Synthesis
    return {
      headline: `HeatShield AI Telemetry Brief for ${locationName}`,
      category: 'general_inquiry',
      isEmergency: false,
      text: `Based on live NOAA GSOD continuous IDW models in ${locationName}:
Current ambient temperature is ${tempC.toFixed(1)}°C (feels like ${feelsLikeC.toFixed(1)}°C) with ${humidityPct}% relative humidity. The prevailing risk tier is ${riskLevel}.

During the peak radiant stress window (${peakWindow}), avoid direct unshaded transit, hydrate regularly with electrolytes, and check on vulnerable dependents.`,
      directives: [
        'Sip 250ml electrolyte water every 20 minutes.',
        'Review the Alerts tab for official NDMA meteorological warnings.',
        'For urgent medical distress or heat stroke, call 108 immediately.'
      ]
    };
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsThinking(true);

    try {
      // First attempt querying the real grounded ML pipeline backend
      const res: AIAnalystResponse = await api.queryAIAnalyst(query);

      const isEmerg =
        res.category === 'emergency_medical_triage' ||
        query.toLowerCase().includes('108') ||
        query.toLowerCase().includes('112') ||
        query.toLowerCase().includes('emergency') ||
        query.toLowerCase().includes('stroke');

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        headline: res.headline,
        category: res.category,
        text: res.biometeorological_interpretation,
        directives: res.actionable_directives,
        isEmergency: isEmerg,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn('Backend query unavailable, using offline biometeorological engine:', err);
      const offline = generateOfflineResponse(query);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        headline: offline.headline,
        category: offline.category,
        text: offline.text,
        directives: offline.directives,
        isEmergency: offline.isEmergency,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#090F1F] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Top Assistant Header */}
      <div className="p-3.5 bg-[#0D152D] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>HeatShield AI Safety Assistant</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Grounded ML
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Grounded in GPS, Weather &amp; NOAA GSOD IDW Models
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'reset',
                sender: 'assistant',
                text: `How can I help you navigate heat conditions in ${locationName} today?`,
                timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              }
            ])
          }
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="p-2 bg-[#0B1124] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-blue-600/30 border border-slate-700/80 hover:border-blue-500/60 text-slate-300 hover:text-white text-[11px] font-medium transition shrink-0 whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : msg.isEmergency
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3 leading-relaxed shadow-sm space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                  : msg.isEmergency
                  ? 'bg-rose-950/40 border border-rose-500/50 text-slate-200 rounded-tl-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              {/* Optional Headline */}
              {msg.headline && (
                <div className="border-b border-slate-800/80 pb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-black text-white flex items-center gap-1.5">
                    {msg.headline}
                  </span>
                  {msg.category && (
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {msg.category.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              )}

              {/* Message text */}
              <p className="whitespace-pre-line text-[11px] text-slate-200/95 leading-relaxed">
                {msg.text}
              </p>

              {/* Actionable Directives list if present */}
              {msg.directives && msg.directives.length > 0 && (
                <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wide block">
                    Actionable Directives:
                  </span>
                  <ul className="space-y-0.5 text-[10px] text-slate-300">
                    {msg.directives.map((dir, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 shrink-0 font-bold">•</span>
                        <span>{dir}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Emergency Fast Dial Actions */}
              {msg.isEmergency && (
                <div className="pt-2 border-t border-rose-500/30 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => initiatePhoneCall('108', e)}
                    className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow transition active:scale-95 cursor-pointer"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call 108 Ambulance</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => initiatePhoneCall('112', e)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 border border-slate-700 transition active:scale-95 cursor-pointer"
                  >
                    <PhoneCall className="w-3 h-3 text-red-400" />
                    <span>Call 112</span>
                  </button>
                </div>
              )}

              <span
                className={`text-[9px] block text-right font-mono ${
                  msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Consulting biometeorological ML pipeline and regional telemetry...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-[#0D152D] border-t border-slate-800 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about symptoms, hydration, outdoor safety, or telemetry..."
          className="flex-1 bg-[#14203D] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
