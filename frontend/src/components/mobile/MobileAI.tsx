import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, RotateCcw, PhoneCall } from 'lucide-react';
import { api } from '../../services/api';
import { initiatePhoneCall, initiateEmergencySms } from '../../utils/phoneCall';
import { answerHeatSafetyQuery } from '../../utils/universalAIEngine';
import type { AIAnalystResponse } from '../../types';

interface MobileAIProps {
  locationName: string;
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  riskLevel: string;
  peakWindow?: string;
  currentLat?: number | null;
  currentLon?: number | null;
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
  peakWindow = '12:30 PM – 3:30 PM',
  currentLat,
  currentLon
}) => {
  const quickPrompts = [
    '📍 How hot is Jaipur right now?',
    '⚖️ Delhi vs Mumbai comparison',
    '🚨 Heat Stroke Symptoms & Helpline 108',
    '💧 ORS Recipe & Traditional Drinks',
    '👶 Kids & Pregnant Women Safety',
    '👕 Work & Outdoor Labor Guidelines',
    '🏠 35°C Fan Safety & Home Cooling'
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'assistant',
      text: `Hello! I am your HeatShield AI Safety Assistant. In ${locationName}, current ambient temperature is ${tempC.toFixed(1)}°C (feels like ${feelsLikeC.toFixed(1)}°C, ${humidityPct}% humidity) with ${riskLevel} heat risk. Peak radiant stress is between ${peakWindow}. How can I assist your health and safety today?`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Universal Knowledge Engine (Evaluates any Indian location, comparison, and safety domain)
  const generateOfflineResponse = (userPrompt: string): {
    headline: string;
    text: string;
    category: string;
    directives: string[];
    isEmergency: boolean;
  } => {
    const res = answerHeatSafetyQuery(userPrompt, {
      name: locationName,
      lat: currentLat ?? undefined,
      lon: currentLon ?? undefined,
      tempC,
      feelsLikeC,
      humidity: humidityPct,
      riskTier: riskLevel
    });
    const q = userPrompt.toLowerCase();
    const isEmerg =
      q.includes('108') ||
      q.includes('112') ||
      q.includes('emergency') ||
      q.includes('stroke') ||
      q.includes('faint') ||
      q.includes('unconscious') ||
      q.includes('ambulance');

    return {
      headline: res.title,
      text: res.markdown,
      category: res.category,
      directives: [
        res.actionSuggestion,
        'Maintain continuous hydration with ORS, Sattu, Chaas, or water.',
        'Follow local NDMA heat advisories and stay out of direct midday sun.'
      ],
      isEmergency: isEmerg
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
                <div className="pt-2 border-t border-rose-500/30 space-y-1.5">
                  <div className="flex gap-2">
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
                  <button
                    type="button"
                    onClick={(e) => initiateEmergencySms(`EMERGENCY: Heat stroke / severe collapse symptoms reported in ${locationName}. Need ambulance!`, undefined, e)}
                    className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1 border border-rose-500/30 transition active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-rose-400" />
                    <span>Send Emergency SOS SMS</span>
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
          placeholder="Ask any question for any city, village, or state..."
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
