import React, { useState } from 'react';
import { Users, CheckCircle2, Plus, Bell, MapPin } from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  location: string;
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
    setAlertSentNotice(`Hydration reminder & safety advisory sent to ${name}`);
    setTimeout(() => setAlertSentNotice(null), 3000);
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
            Real-time heat stress tracking for vulnerable loved ones
          </p>
        </div>

        <button
          onClick={() => alert('Add new family member profile dialog')}
          className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 transition"
          title="Add family member"
        >
          <Plus className="w-4 h-4" />
        </button>
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

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800/80">
                <span className="text-[11px]">
                  Status:{' '}
                  <strong className={m.checked ? 'text-emerald-400' : 'text-amber-400'}>
                    {m.checked ? `Checked (${m.lastChecked})` : 'Needs Check-in'}
                  </strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendNudge(m.name)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition flex items-center gap-1"
                  >
                    <Bell className="w-3 h-3 text-amber-400" />
                    <span>Alert</span>
                  </button>

                  <button
                    onClick={() => handleToggleCheck(m.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
                      m.checked
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{m.checked ? 'Safe' : 'Mark Checked'}</span>
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
