import React, { useState, useEffect } from 'react';
import {
  Bell,
  PhoneCall,
  Radio,
  Navigation,
  Send,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { notificationService, type NotificationPermissionStatus } from '../../utils/notificationService';
import { initiatePhoneCall, initiateEmergencySms, initiateWhatsAppShare } from '../../utils/phoneCall';
import { api } from '../../services/api';
import type { CoolingCenter } from '../../types';

interface MobileAlertsProps {
  locationName: string;
  riskLevel: string;
  tempC: number;
  feelsLikeC?: number;
  currentLat?: number;
  currentLon?: number;
  selectedStationId?: string;
}

export const MobileAlerts: React.FC<MobileAlertsProps> = ({
  locationName,
  riskLevel,
  tempC,
  feelsLikeC = tempC + 4,
  currentLat = 25.5941,
  currentLon = 85.1376,
  selectedStationId = '42181'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'emergency' | 'alerts' | 'triage' | 'shelters'>('emergency');
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default');
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [shelters, setShelters] = useState<CoolingCenter[]>([]);
  const [loadingShelters, setLoadingShelters] = useState<boolean>(false);
  const [expandedTriage, setExpandedTriage] = useState<string>('stroke');

  useEffect(() => {
    setPermission(notificationService.getPermission());
    loadShelters(selectedStationId);
  }, [selectedStationId]);

  const loadShelters = async (stId: string) => {
    try {
      setLoadingShelters(true);
      const res = await api.getCoolingCenters(stId);
      setShelters(res);
    } catch (e) {
      console.warn('Failed to load cooling shelters:', e);
    } finally {
      setLoadingShelters(false);
    }
  };

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermission(res);
    if (res === 'granted') {
      setTestSuccess('System notifications enabled successfully! Sent test alert.');
      setTimeout(() => setTestSuccess(null), 4000);
    }
  };

  const handleTestNotification = () => {
    const ok = notificationService.triggerTestNotification(
      `☀️ HeatShield AI Test Alert: ${locationName}`,
      `Current heat index is ${feelsLikeC.toFixed(1)}°C (${riskLevel} Risk). Hydration status: 250ml every 20m recommended.`
    );
    if (ok) {
      setTestSuccess('Test notification sent to your device!');
    } else {
      setTestSuccess('Please allow browser notification permissions first.');
    }
    setTimeout(() => setTestSuccess(null), 4000);
  };

  // Pre-formatted Emergency SOS message with coordinates and Google Maps pin
  const rawEmergencyMessage =
    `EMERGENCY ALERT: I am experiencing severe heat exhaustion/stroke symptoms in ${locationName}. ` +
    `Exact GPS: Lat ${currentLat.toFixed(4)}, Lon ${currentLon.toFixed(4)}. ` +
    `Location Pin: https://maps.google.com/?q=${currentLat.toFixed(5)},${currentLon.toFixed(5)} ` +
    `Please dispatch emergency assistance immediately!`;

  const emergencyHelplines = [
    {
      number: '112',
      name: 'National All-in-One Emergency',
      subtitle: 'Police, Fire, Medical, Disaster (24/7)',
      badge: 'Primary',
      color: 'bg-rose-600 hover:bg-rose-500 text-white'
    },
    {
      number: '108',
      name: 'Emergency Medical Ambulance',
      subtitle: 'Free 24/7 Advanced Life Support Dispatch',
      badge: 'Medical',
      color: 'bg-red-600 hover:bg-red-500 text-white'
    },
    {
      number: '102',
      name: 'Maternal & Child Ambulance',
      subtitle: 'Pregnant Women & Pediatric Emergencies',
      badge: 'Maternal',
      color: 'bg-pink-600 hover:bg-pink-500 text-white'
    },
    {
      number: '1070',
      name: 'State Disaster Control Room',
      subtitle: 'NDMA / State Heatwave Relief Line',
      badge: 'Disaster',
      color: 'bg-amber-600 hover:bg-amber-500 text-white'
    },
    {
      number: '100',
      name: 'Police Emergency Assistance',
      subtitle: 'Immediate Public Safety & Evacuation',
      badge: 'Police',
      color: 'bg-blue-600 hover:bg-blue-500 text-white'
    },
    {
      number: '101',
      name: 'Fire & Rescue Service',
      subtitle: 'Thermal Hazards & Rescue Evacuation',
      badge: 'Rescue',
      color: 'bg-orange-600 hover:bg-orange-500 text-white'
    }
  ];

  return (
    <div className="space-y-4 pb-16">
      {/* Top Header & Risk Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-500" />
            <span>Emergency Services &amp; Alerts</span>
          </h2>
          <p className="text-xs text-slate-400">
            {locationName} • Risk Tier: <strong className="text-amber-400">{riskLevel}</strong>
          </p>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-extrabold border border-rose-500/30 animate-pulse">
          LIVE 24/7
        </span>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('emergency')}
          className={`flex-1 py-1.5 rounded-lg transition text-center ${
            activeSubTab === 'emergency'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🚨 Helplines
        </button>
        <button
          onClick={() => setActiveSubTab('triage')}
          className={`flex-1 py-1.5 rounded-lg transition text-center ${
            activeSubTab === 'triage'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🩺 First Aid
        </button>
        <button
          onClick={() => setActiveSubTab('shelters')}
          className={`flex-1 py-1.5 rounded-lg transition text-center ${
            activeSubTab === 'shelters'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🏥 Hospitals
        </button>
        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`flex-1 py-1.5 rounded-lg transition text-center ${
            activeSubTab === 'alerts'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🔔 Warnings
        </button>
      </div>

      {/* Test feedback toast */}
      {testSuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{testSuccess}</span>
        </div>
      )}

      {/* TAB 1: EMERGENCY HELPLINES & GPS SOS */}
      {activeSubTab === 'emergency' && (
        <div className="space-y-3">
          {/* Instant GPS SOS Broadcast Card */}
          <div className="rounded-2xl bg-gradient-to-r from-red-950 via-rose-900/60 to-red-950 border border-rose-500/70 p-4 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-400/40">
                1-Tap GPS Emergency Broadcast
              </span>
              <span className="text-[10px] font-mono text-rose-300">
                Lat: {currentLat.toFixed(2)}°, Lon: {currentLon.toFixed(2)}°
              </span>
            </div>

            <div>
              <h3 className="text-sm font-black text-white">Broadcast Emergency SOS with GPS Pin</h3>
              <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">
                Sends an instant emergency SMS with your live coordinates and Google Maps pin to emergency contacts or helpline.
              </p>
            </div>

            <div className="pt-1 space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => initiateEmergencySms(rawEmergencyMessage, undefined, e)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                  title="Send Emergency SOS SMS with live GPS pin"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send SOS SMS</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => initiateWhatsAppShare(rawEmergencyMessage, undefined, e)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                  title="Share Emergency SOS via WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>SOS via WhatsApp</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => initiatePhoneCall('112', e)}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-red-700 font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                  title="Direct 1-tap call to 112 National Helpline"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                  <span>Call 112 Helpline</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => initiatePhoneCall('108', e)}
                  className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                  title="Direct 1-tap call to 108 Ambulance"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-white" />
                  <span>Call 108 Ambulance</span>
                </button>
              </div>
            </div>
          </div>

          {/* Directory of Emergency Helplines */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-300 block uppercase tracking-wider px-1">
              National Emergency Helplines (24x7 Free)
            </span>

            {emergencyHelplines.map((item) => (
              <div
                key={item.number}
                className="p-3 rounded-2xl bg-[#0F1A36] border border-slate-800 flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800/80 text-white flex items-center justify-center font-black text-xs shrink-0">
                    {item.badge}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{item.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">
                        {item.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{item.subtitle}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => initiatePhoneCall(item.number, e)}
                  className={`px-3 py-1.5 rounded-lg font-black text-xs shadow flex items-center gap-1 transition active:scale-95 ${item.color}`}
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Call {item.number}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Notification Quick Toggle Strip */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Real-time Push Notifications</span>
                <span className="text-[10px] text-slate-400">
                  Status: <strong className={permission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}>
                    {permission === 'granted' ? 'Active & Receiving' : permission === 'denied' ? 'Permission Blocked' : 'Permission Required'}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {permission !== 'granted' ? (
                <button
                  onClick={handleRequestPermission}
                  className="px-2.5 py-1.2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition shadow"
                >
                  Enable
                </button>
              ) : (
                <button
                  onClick={handleTestNotification}
                  className="px-2.5 py-1.2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-[11px] border border-blue-500/30 transition shadow"
                >
                  Test Alert
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEDICAL TRIAGE & FIRST AID */}
      {activeSubTab === 'triage' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200">
            <strong>NDMA / WHO Heat Illness Protocol:</strong> Act immediately if core body temperature rises or consciousness alters. Active cooling must begin before medical transport.
          </div>

          {/* Heat Stroke Card */}
          <div className="rounded-2xl bg-rose-950/40 border border-rose-500/50 p-3.5 space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedTriage(expandedTriage === 'stroke' ? '' : 'stroke')}
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-black text-[10px] uppercase">
                  Critical Emergency
                </span>
                <h3 className="text-sm font-black text-white">Heat Stroke (Core Temp &gt; 40°C)</h3>
              </div>
              {expandedTriage === 'stroke' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {expandedTriage === 'stroke' && (
              <div className="space-y-2 text-xs text-slate-200 pt-2 border-t border-rose-500/30 animate-in fade-in">
                <div className="space-y-1">
                  <strong className="text-rose-400 block">Symptoms:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                    <li>Confusion, irrational behavior, slurred speech, delirium, seizures, coma.</li>
                    <li>Hot, flushed skin (can be bone-dry or sweating profusely in humid heat).</li>
                    <li>Rapid, pounding pulse and shallow rapid breathing.</li>
                  </ul>
                </div>

                <div className="space-y-1 pt-1">
                  <strong className="text-emerald-400 block">Immediate Life-Saving Steps:</strong>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-300 text-[11px]">
                    <li><strong>CALL 108 / 112 IMMEDIATELY</strong> for emergency ambulance.</li>
                    <li>Move victim into an air-conditioned room or dense tree shade immediately.</li>
                    <li>Apply cold wet sheets or ice packs directly to neck, armpits, and groin.</li>
                    <li>Fan aggressively while misting with cold water to force evaporative cooling.</li>
                    <li><strong>DO NOT GIVE FLUIDS</strong> if unconscious or confused (choking hazard).</li>
                    <li><strong>DO NOT GIVE PARACETAMOL/ASPIRIN</strong> (aggravates internal organ stress).</li>
                  </ol>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => initiatePhoneCall('108', e)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call 108 Ambulance</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => initiatePhoneCall('112', e)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/40 transition active:scale-95 cursor-pointer shadow"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                    <span>Call 112</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Heat Exhaustion Card */}
          <div className="rounded-2xl bg-amber-950/40 border border-amber-500/50 p-3.5 space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedTriage(expandedTriage === 'exhaustion' ? '' : 'exhaustion')}
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-900 font-black text-[10px] uppercase">
                  Severe Warning
                </span>
                <h3 className="text-sm font-black text-white">Heat Exhaustion</h3>
              </div>
              {expandedTriage === 'exhaustion' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {expandedTriage === 'exhaustion' && (
              <div className="space-y-2 text-xs text-slate-200 pt-2 border-t border-amber-500/30 animate-in fade-in">
                <div className="space-y-1">
                  <strong className="text-amber-400 block">Symptoms:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                    <li>Heavy profuse sweating, cold, pale, clammy skin.</li>
                    <li>Fast, weak pulse, dizziness, nausea, vomiting, fainting, weakness.</li>
                  </ul>
                </div>

                <div className="space-y-1 pt-1">
                  <strong className="text-emerald-400 block">Action Protocol:</strong>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-300 text-[11px]">
                    <li>Move to cool shade, loosen all tight garments.</li>
                    <li>Lie down and elevate legs 12 inches above heart level.</li>
                    <li>Sip 500ml of cold electrolyte water, ORS, or lemon water slowly over 30 min.</li>
                    <li>If vomiting continues over 1 hour or dizziness worsens, dial 108.</li>
                  </ol>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => initiatePhoneCall('108', e)}
                    className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call 108 Ambulance</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => initiatePhoneCall('104', e)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/40 transition active:scale-95 cursor-pointer shadow"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                    <span>Call 104 Health Helpline</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Heat Cramps Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedTriage(expandedTriage === 'cramps' ? '' : 'cramps')}
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500 text-white font-black text-[10px] uppercase">
                  Moderate Strain
                </span>
                <h3 className="text-sm font-black text-white">Heat Cramps &amp; Electrolyte Depletion</h3>
              </div>
              {expandedTriage === 'cramps' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {expandedTriage === 'cramps' && (
              <div className="space-y-2 text-xs text-slate-200 pt-2 border-t border-slate-800 animate-in fade-in">
                <p className="text-slate-300 text-[11px]">
                  Painful muscle spasms in legs, abdomen, or arms caused by heavy sweating and electrolyte depletion.
                </p>
                <p className="text-emerald-400 text-[11px]">
                  <strong>Protocol:</strong> Cease physical activity, rest in shade, gently stretch the cramped muscle, and consume 1L of water mixed with 1 packet WHO ORS or 1/2 tsp salt + 6 tsp sugar. Do not resume hard labor for at least 4 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: NEARBY HOSPITALS & COOLING CENTERS */}
      {activeSubTab === 'shelters' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Nearest Medical Centers &amp; Cooling Shelters
            </span>
            <span className="text-[10px] text-blue-400 font-mono">
              Grounded around {locationName}
            </span>
          </div>

          {loadingShelters ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <span className="animate-spin inline-block mr-2">⏳</span> Loading verified nearby facilities...
            </div>
          ) : shelters.length === 0 ? (
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-center space-y-2">
              <Building2 className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-300 font-bold">District Civil Hospital &amp; Emergency Hub</p>
              <p className="text-[11px] text-slate-400">
                Primary Healthcare Center (PHC) &amp; Civil Hospital are on 24/7 heatwave alert in {locationName}.
              </p>
              <a
                href={`https://www.google.com/maps/search/hospital+near+${encodeURIComponent(locationName)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Find Hospitals on Google Maps</span>
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {shelters.map((s, idx) => (
                <div
                  key={`${s.name}-${idx}`}
                  className="rounded-xl bg-[#0D152D] border border-slate-800 p-3 space-y-2 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{s.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          s.type === 'hospital'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {s.type === 'hospital' ? 'Emergency Hospital' : 'Cooling Shelter'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.address}</p>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-300">
                      {s.distance_km.toFixed(1)} km
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                    <span className="text-emerald-400 font-medium">
                      ● {s.has_ac ? 'Air Conditioned' : 'Shaded Cooling'} • {s.hours}
                    </span>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + ', ' + s.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1"
                      >
                        <Navigation className="w-2.5 h-2.5" />
                        <span>Navigate</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACTIVE METEOROLOGICAL WARNINGS */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-500/50 bg-amber-950/40 p-4 shadow-md space-y-2.5 text-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-amber-400">
                IMD Synoptic Alert
              </span>
              <span className="text-[10px] font-mono text-slate-300">Active Warning</span>
            </div>

            <div>
              <h3 className="text-sm font-black text-white">Heatwave Advection Warning: {locationName}</h3>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                Maximum ambient temperature is forecasted at {tempC.toFixed(1)}°C with apparent thermal heat index of {feelsLikeC.toFixed(1)}°C. High probability of heat cramps and exertional heat exhaustion for unprotected outdoor exposure between 12:00 PM and 3:30 PM.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Source: India Meteorological Dept / NDMA</span>
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-4 shadow-md space-y-2.5 text-rose-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-rose-400">
                Wet-Bulb Moisture Trap (RQ3)
              </span>
              <span className="text-[10px] font-mono text-slate-300">Continuous IDW</span>
            </div>

            <div>
              <h3 className="text-sm font-black text-white">Atmospheric Evaporative Cooling Suppression</h3>
              <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                Elevated ambient moisture and dew point are severely curtailing natural convective sweat evaporation. Electric fans blowing unconditioned air above 35°C can accelerate hyperthermia. Shift to shaded cross-ventilated or air-conditioned environments.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Source: HeatShield AI Anomaly Engine</span>
              <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
            </div>
          </div>

          {/* Notification Controls Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black text-white">System Alert Notification Center</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                permission === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {permission.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enable native notifications to receive instant warnings whenever the local biometeorological heat index crosses dangerous thresholds (≥40°C) or entering peak radiant windows.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleRequestPermission}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{permission === 'granted' ? 'Re-verify Permission' : 'Enable Notifications'}</span>
              </button>
              <button
                onClick={handleTestNotification}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
              >
                Send Test Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
