import React, { useState } from 'react';
import { api } from '../services/api';
import type {
  AssistantChatResponse,
  LanguageCode
} from '../types';
import { getTranslation } from '../utils/localization';
import {
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  Lightbulb,
  MapPin,
  HelpCircle
} from 'lucide-react';

interface HeatAssistantChatProps {
  activeStationId: string;
  stationName: string;
  lang: LanguageCode;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  riskTier?: string;
  actionSuggestion?: string;
  timestamp: string;
}

const PRESET_QUESTIONS = [
  'Can I play cricket at 2 PM today?',
  'I have a 4-hour outdoor construction shift today.',
  'How to sleep comfortably tonight without high AC bills?',
  'I feel dizzy after walking outside in the sun.'
];

export const HeatAssistantChat: React.FC<HeatAssistantChatProps> = ({
  activeStationId,
  stationName,
  lang
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I am your HeatShield AI Assistant. I analyze real-time biometeorological data for ${stationName} to give you personalized, life-saving advice on outdoor activities, hydration, and heat hazards. How can I help you stay safe today?`,
      timestamp: 'Just now'
    }
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSendMessage = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res: AssistantChatResponse = await api.queryAssistantChat(activeStationId, q);
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        riskTier: res.risk_tier,
        actionSuggestion: res.action_suggestion,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Failed to query assistant chat:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I'm having trouble connecting right now. Please hydrate and avoid midday sun exposure while I reconnect.",
        timestamp: 'Just now'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/60 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Thermodynamic Conversational Safety</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            {getTranslation(lang, 'ai_assistant', 'Grounded AI Heat Assistant')}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Ask any question about outdoor activities, workouts, work safety, or cooling methods.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-800 px-3.5 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 self-start sm:self-center">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Grounded in: <strong className="text-white">{stationName}</strong></span>
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tap a quick question to ask the AI:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(pq)}
              disabled={loading}
              className="bg-gray-800/80 hover:bg-gray-800 border border-gray-700/80 hover:border-cyan-500/50 text-xs text-gray-300 hover:text-white px-3.5 py-1.5 rounded-full transition text-left"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => {
            const isAssistant = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAssistant ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    isAssistant
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-emerald-600 text-white shadow-md'
                  }`}
                >
                  {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2.5 ${
                    isAssistant
                      ? 'bg-gray-800/90 text-gray-200 border border-gray-700/60 shadow-lg'
                      : 'bg-emerald-600 text-white font-medium shadow-md ml-auto'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Metadata Chips for Assistant responses */}
                  {isAssistant && (msg.riskTier || msg.actionSuggestion) && (
                    <div className="pt-2 border-t border-gray-700/60 flex flex-wrap items-center gap-2 text-xs">
                      {msg.riskTier && (
                        <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          Risk Tier: {msg.riskTier}
                        </span>
                      )}
                      {msg.actionSuggestion && (
                        <span className="flex items-center gap-1 bg-cyan-500/20 text-cyan-300 font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                          <Lightbulb className="w-3 h-3" />
                          {msg.actionSuggestion}
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className={`text-[10px] ${
                      isAssistant ? 'text-gray-500 text-right' : 'text-emerald-200 text-right'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-800/90 rounded-2xl px-4 py-3 border border-gray-700/60 flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                <span>Analyzing biometeorological conditions for {stationName}...</span>
              </div>
            </div>
          )}
        </div>

        {/* Query Input */}
        <div className="pt-4 border-t border-gray-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask about running, cricket, night heat, or work in ${stationName}...`}
              disabled={loading}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition flex items-center gap-1.5 shadow-lg flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
