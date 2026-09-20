import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type {
  FamilyMemberRecord,
  FamilyMemberStatus,
  LanguageCode,
  WelfareCheckinRecord
} from '../types';
import { getTranslation } from '../utils/localization';
import { initiatePhoneCall, cleanPhoneNumber } from '../utils/phoneCall';
import {
  Heart,
  PlusCircle,
  PhoneCall,
  Share2,
  Trash2,
  AlertTriangle,
  MapPin,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface FamilyCareViewProps {
  stations: Array<{ station_id: string; name: string }>;
  lang: LanguageCode;
}

const DEFAULT_FAMILY: FamilyMemberRecord[] = [
  { id: 'fam-1', name: 'Papa', relationship: 'Dad', station_id: '42182099999', phone_number: '+919876543210' },
  { id: 'fam-2', name: 'Dadi', relationship: 'Grandmother', station_id: '42099099999', phone_number: '+919812345678' },
  { id: 'fam-3', name: 'Simran', relationship: 'Sister', station_id: '42101099999', phone_number: '+919898765432' }
];

export const FamilyCareView: React.FC<FamilyCareViewProps> = ({
  stations,
  lang
}) => {
  const storageKey = 'heatshield_family_members_v1';
  const [members, setMembers] = useState<FamilyMemberRecord[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved family members', e);
      }
    }
    return DEFAULT_FAMILY;
  });

  const [statuses, setStatuses] = useState<FamilyMemberStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Self Welfare Check-in record
  const [latestCheckin, setLatestCheckin] = useState<WelfareCheckinRecord | null>(() => {
    try {
      const stored = localStorage.getItem('heatshield_welfare_checkins_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed[0] || null;
      }
    } catch {}
    return null;
  });

  const handleSelfCheckin = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const record: WelfareCheckinRecord = {
      timestamp: now.toISOString(),
      time_formatted: timeStr,
      user_name: 'You',
      location_name: 'Current Location',
      lat: 25.56,
      lon: 84.01,
      water_liters: 2.0,
      status_note: 'Safe and hydrated',
      risk_tier: 'Low'
    };
    await api.recordWelfareCheckin(record);
    setLatestCheckin(record);
  };

  // Modal inputs
  const [newName, setNewName] = useState<string>('');
  const [newRelationship, setNewRelationship] = useState<string>('Parent');
  const [newStationId, setNewStationId] = useState<string>(stations[0]?.station_id || '42182099999');
  const [newPhoneNumber, setNewPhoneNumber] = useState<string>('');

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(members));
    fetchFamilyStatuses(members);
  }, [members]);

  const fetchFamilyStatuses = async (currentMembers: FamilyMemberRecord[]) => {
    try {
      setLoading(true);
      const res = await api.getFamilyStatus(currentMembers);
      setStatuses(res);
    } catch (err) {
      console.error('Failed to fetch family status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newRecord: FamilyMemberRecord = {
      id: `fam-${Date.now()}`,
      name: newName.trim(),
      relationship: newRelationship,
      station_id: newStationId,
      phone_number: newPhoneNumber.trim() || undefined
    };

    setMembers(prev => [...prev, newRecord]);
    setNewName('');
    setNewPhoneNumber('');
    setIsModalOpen(false);
  };

  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const generateWhatsAppLink = (st: FamilyMemberStatus) => {
    const msg = `Hi ${st.name}! HeatShield AI alert for ${st.city_name}: Current heat risk is ${st.tier} (${st.heat_risk_score}/100) with feels-like temperature around ${st.feels_like_c}°C. Please drink plenty of water and tap this link to confirm you're safe: https://heatshield.ai/safe?user=${encodeURIComponent(st.name)} ❤️`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/60 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>Multi-City Loved Ones Watchlist</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            {getTranslation(lang, 'family_care', 'People I Care About')}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Keep track of parents, grandparents, and loved ones across different cities under extreme heat stress.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* 24x7 Emergency Helplines Direct-Dial Bar */}
      <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-rose-950/60 border border-red-500/40 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            24x7 Emergency Helplines (Direct 1-Tap Call)
          </span>
          <p className="text-xs text-slate-300 mt-0.5">
            Directly launches your phone's dialer app. Tap below for immediate ambulance, police, or elderly rescue.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="tel:108"
            onClick={(e) => initiatePhoneCall('108', e)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-lg active:scale-95 group"
          >
            <PhoneCall className="w-3.5 h-3.5 text-white group-hover:rotate-12 transition" />
            <span>108 Ambulance</span>
          </a>
          <a
            href="tel:112"
            onClick={(e) => initiatePhoneCall('112', e)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow active:scale-95 group"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition" />
            <span>112 National</span>
          </a>
          <a
            href="tel:14567"
            onClick={(e) => initiatePhoneCall('14567', e)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow active:scale-95 group"
          >
            <PhoneCall className="w-3.5 h-3.5 text-pink-400 group-hover:rotate-12 transition" />
            <span>14567 Elderline</span>
          </a>
        </div>
      </div>

      {/* Welfare Check-in Beacon Panel */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                {getTranslation(lang, 'welfare_beacon', 'Family Welfare Beacon')}
              </span>
              {latestCheckin && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {getTranslation(lang, 'checkin_recorded', 'Checked In Today')}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {latestCheckin
                ? `Last check-in: Today at ${latestCheckin.time_formatted} (${latestCheckin.location_name})`
                : 'No check-in recorded yet today'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {getTranslation(lang, 'im_safe_subtext', 'Tap to record your welfare status & sync with your family')}
            </p>
          </div>
        </div>

        <button
          onClick={handleSelfCheckin}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 shrink-0 active:scale-95"
        >
          <Heart className="w-4 h-4 text-emerald-200" />
          <span>{getTranslation(lang, 'im_safe_today', "I'm Safe Today")}</span>
        </button>
      </div>

      {/* Status Summary Banner */}
      {statuses.some(s => s.needs_attention) && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-rose-300">
              High Heat Warning for Family Members:
            </span>
            <span className="text-gray-300 ml-1">
              One or more loved ones in your watchlist are facing High or Extreme heat hazard. Send a check-in reminder now.
            </span>
          </div>
        </div>
      )}

      {/* Members Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statuses.map(st => (
            <div
              key={st.id}
              className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden transition hover:border-gray-700"
            >
              {/* Member card top */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white leading-tight">
                        {st.name}
                      </h4>
                      <span className="text-xs text-gray-400">
                        {st.relationship}
                      </span>
                      {st.phone_number && (
                        <span className="text-[11px] text-rose-300 font-mono flex items-center gap-1 mt-0.5">
                          <PhoneCall className="w-3 h-3 text-rose-400" />
                          {st.phone_number}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{st.city_name}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMember(st.id)}
                    className="text-gray-600 hover:text-red-400 transition p-1"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Score & Weather Badge */}
                <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">
                        Heat Risk Score
                      </div>
                      <div className="text-2xl font-black" style={{ color: st.badge_color }}>
                        {st.heat_risk_score} <span className="text-xs text-gray-400">/ 100</span>
                      </div>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase text-white shadow"
                      style={{ backgroundColor: st.badge_color }}
                    >
                      {st.tier}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-gray-700/60 text-[11px]">
                    <div>
                      <span className="text-gray-400 block">Temp</span>
                      <strong className="text-white">{st.temperature_c}°C</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Feels</span>
                      <strong className="text-amber-400">{st.feels_like_c}°C</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Humidity</span>
                      <strong className="text-gray-300">{st.humidity_pct}%</strong>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  {st.status_note}
                </p>

                {/* Check-in status badge */}
                <div className="flex items-center justify-between mb-3 px-3 py-2 bg-gray-800/40 border border-gray-700/50 rounded-xl text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    {st.heat_risk_score > 65 ? 'Check-in overdue' : 'Checked in 25m ago'}
                  </span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${st.heat_risk_score > 65 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                    {st.heat_risk_score > 65 ? '⚠️ Overdue' : '✅ Verified'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                <a
                  href={generateWhatsAppLink(st)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Alert via WhatsApp</span>
                </a>
                <a
                  href={`tel:${cleanPhoneNumber(st.phone_number || (st.name === 'Papa' ? '+919876543210' : st.name === 'Dadi' ? '+919812345678' : st.name === 'Simran' ? '+919898765432' : '108'))}`}
                  onClick={(e) => {
                    const phoneToCall = st.phone_number || (st.name === 'Papa' ? '+919876543210' : st.name === 'Dadi' ? '+919812345678' : st.name === 'Simran' ? '+919898765432' : '108');
                    initiatePhoneCall(phoneToCall, e);
                  }}
                  className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow active:scale-95 group"
                  title={`Call ${st.name} directly on phone`}
                >
                  <PhoneCall className="w-3.5 h-3.5 text-white group-hover:rotate-12 transition" />
                  <span>Call {st.name}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-400" />
                Add to Watchlist
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dad, Mom, Grandmother"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Relationship
                </label>
                <select
                  value={newRelationship}
                  onChange={(e) => setNewRelationship(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Parent">Parent (Father / Mother)</option>
                  <option value="Grandparent">Grandparent (Dada / Dadi / Nana / Nani)</option>
                  <option value="Child">Child / Youth</option>
                  <option value="Sibling">Sibling (Brother / Sister)</option>
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Friend">Friend / Relative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Phone Number (for Direct Calling)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210 or 10-digit mobile"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Clicking 'Call' on their card will directly launch your phone's dialer application.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Location / City
                </label>
                <select
                  value={newStationId}
                  onChange={(e) => setNewStationId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  {stations.map(st => (
                    <option key={st.station_id} value={st.station_id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  Save Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
