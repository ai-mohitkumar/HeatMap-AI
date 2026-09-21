import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Plus,
  Bell,
  MapPin,
  PhoneCall,
  MessageSquare,
  Send,
  Heart,
  AlertTriangle
} from 'lucide-react';
import {
  initiatePhoneCall,
  initiateEmergencySms,
  initiateWhatsAppShare
} from '../../utils/phoneCall';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  location: string;
  phone: string;
  tempC: number;
  risk: 'Low' | 'Moderate' | 'High' | 'Extreme';
  checked: boolean;
  lastChecked: string;
}

export const MobileFamily: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: 'Dad & Mom',
      relation: 'Elderly Parents',
      location: 'Buxar, Bihar',
      phone: '+919876543210',
      tempC: 38.4,
      risk: 'Extreme',
      checked: true,
      lastChecked: '25 min ago'
    },
    {
      id: '2',
      name: 'Aarav (Son)',
      relation: 'School / Outdoor Sports',
      location: 'Patna, Bihar',
      phone: '+919812345678',
      tempC: 34.2,
      risk: 'Moderate',
      checked: false,
      lastChecked: '2 hrs ago'
    },
    {
      id: '3',
      name: 'Dadi (Grandmother)',
      relation: 'High Vulnerability Care',
      location: 'Varanasi, UP',
      phone: '+919898765432',
      tempC: 37.1,
      risk: 'High',
      checked: true,
      lastChecked: '40 min ago'
    }
  ]);

  const [alertSentNotice, setAlertSentNotice] = useState<string | null>(null);

  const handleToggleCheck = (id: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, checked: !m.checked, lastChecked: !m.checked ? 'Just now' : m.lastChecked }
          : m
      )
    );
  };

  const handleSendNudge = (name: string) => {
    setAlertSentNotice(`Hydration reminder & safety advisory recorded for ${name}`);
    setTimeout(() => setAlertSentNotice(null), 3000);
  };

  const getFamilyAdvisoryMessage = (m: FamilyMember) => {
    return `Hi ${m.name}! HeatShield AI alert for ${m.location}: Current heat risk is ${m.risk} (${m.tempC}°C). Please drink electrolyte water, stay inside air-conditioned shade, and reply to confirm you're safe! ❤️`;
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Family Heat Watchlist</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time heat stress tracking & 1-tap care for loved ones
          </p>
        </div>

        <button
          onClick={() => {
            const name = prompt('Enter family member name (e.g. Grandma):');
            if (!name) return;
            const phone = prompt('Enter phone number (e.g. +919876543210):') || '';
            const location = prompt('Enter city (e.g. Lucknow, UP):') || 'Patna, Bihar';
            const newMember: FamilyMember = {
              id: String(Date.now()),
              name,
              relation: 'Family',
              location,
              phone,
              tempC: 36.5,
              risk: 'High',
              checked: false,
              lastChecked: 'Just added'
            };
            setMembers((prev) => [...prev, newMember]);
            setAlertSentNotice(`Added ${name} to family heat watchlist!`);
            setTimeout(() => setAlertSentNotice(null), 3000);
          }}
          className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 transition cursor-pointer"
          title="Add family member"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 24x7 Emergency Helplines Direct-Dial Strip */}
      <div className="rounded-2xl bg-gradient-to-r from-red-950/70 via-[#19152b] to-[#0E152C] border border-rose-500/40 p-3 shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Emergency Direct Dial (1-Tap)
          </span>
          <span className="text-[10px] text-slate-400">24x7 Toll Free</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={(e) => initiatePhoneCall('108', e)}
            className="py-1.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow transition active:scale-95 cursor-pointer"
          >
            <PhoneCall className="w-3 h-3" />
            <span>108 Med</span>
          </button>
          <button
            type="button"
            onClick={(e) => initiatePhoneCall('112', e)}
            className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-[11px] flex items-center justify-center gap-1 shadow transition active:scale-95 cursor-pointer"
          >
            <PhoneCall className="w-3 h-3 text-amber-400" />
            <span>112 All</span>
          </button>
          <button
            type="button"
            onClick={(e) => initiatePhoneCall('14567', e)}
            className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/40 font-bold text-[11px] flex items-center justify-center gap-1 shadow transition active:scale-95 cursor-pointer"
          >
            <Heart className="w-3 h-3 text-pink-400" />
            <span>14567 Elder</span>
          </button>
        </div>
      </div>

      {alertSentNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{alertSentNotice}</span>
        </div>
      )}

      {/* Member Cards */}
      <div className="space-y-3">
        {members.map((m) => {
          const isHighRisk = m.risk === 'High' || m.risk === 'Extreme';
          const advisoryMsg = getFamilyAdvisoryMessage(m);

          return (
            <div
              key={m.id}
              className={`rounded-2xl border p-4 shadow-lg space-y-3 transition ${
                isHighRisk
                  ? 'bg-gradient-to-r from-rose-950/40 via-[#181528] to-[#0E152C] border-rose-500/40'
                  : 'bg-gradient-to-r from-slate-900/90 to-[#0E152C] border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{m.name}</h3>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-medium">
                      {m.relation}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{m.location}</span>
                    {m.phone && <span className="text-slate-500 font-mono text-[10px]">• {m.phone}</span>}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-white font-mono">{m.tempC}°C</div>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      m.risk === 'Extreme'
                        ? 'bg-rose-500/20 text-rose-300'
                        : m.risk === 'High'
                        ? 'bg-orange-500/20 text-orange-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {m.risk} Risk
                  </span>
                </div>
              </div>

              {/* Instant Call & Message Bar */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {/* 1. Direct Call */}
                <button
                  type="button"
                  onClick={(e) => initiatePhoneCall(m.phone || '108', e)}
                  className="py-2 px-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title={`Call ${m.name} directly`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call</span>
                </button>

                {/* 2. WhatsApp Advisory */}
                <button
                  type="button"
                  onClick={(e) => initiateWhatsAppShare(advisoryMsg, m.phone, e)}
                  className="py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title={`Send heat advisory to ${m.name} on WhatsApp`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* 3. SMS Advisory */}
                <button
                  type="button"
                  onClick={(e) => initiateEmergencySms(advisoryMsg, m.phone, e)}
                  className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 font-bold text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title={`Send SMS advisory to ${m.name}`}
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>SMS</span>
                </button>
              </div>

              {/* Status and Check-in Row */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="text-[11px]">
                  Status:{' '}
                  <strong className={m.checked ? 'text-emerald-400' : 'text-amber-400'}>
                    {m.checked ? `Checked (${m.lastChecked})` : 'Needs Check-in'}
                  </strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendNudge(m.name)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Bell className="w-3 h-3 text-amber-400" />
                    <span>Nudge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleCheck(m.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer ${
                      m.checked
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{m.checked ? 'Safe' : 'Mark Safe'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
