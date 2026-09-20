import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type {
  CoolingCenter,
  CommunityHelpRequest,
  LanguageCode
} from '../types';
import { getTranslation } from '../utils/localization';
import { initiatePhoneCall } from '../utils/phoneCall';
import {
  MapPin,
  Building2,
  Droplets,
  HeartPulse,
  Navigation,
  PlusCircle,
  UserCheck,
  PhoneCall,
  Clock,
  CheckCircle2,
  X,
  AlertOctagon,
  ShieldCheck
} from 'lucide-react';

interface CoolingSosViewProps {
  activeStationId: string;
  stationName: string;
  lang: LanguageCode;
}

export const CoolingSosView: React.FC<CoolingSosViewProps> = ({
  activeStationId,
  stationName,
  lang
}) => {
  const [centers, setCenters] = useState<CoolingCenter[]>([]);
  const [requests, setRequests] = useState<CommunityHelpRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [centerFilter, setCenterFilter] = useState<'all' | 'cooling_shelter' | 'water_point' | 'hospital'>('all');

  // New Help Request Modal
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [formBeneficiary, setFormBeneficiary] = useState<string>('elderly');
  const [formUrgency, setFormUrgency] = useState<'low' | 'medium' | 'high' | 'extreme'>('high');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formContact, setFormContact] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadData(activeStationId);
  }, [activeStationId]);

  const loadData = async (stId: string) => {
    try {
      setLoading(true);
      const [cRes, rRes] = await Promise.all([
        api.getCoolingCenters(stId),
        api.getCommunityRequests(stId)
      ]);
      setCenters(cRes);
      setRequests(rRes);
    } catch (err) {
      console.error('Failed to load cooling and SOS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string) => {
    try {
      const updated = await api.respondCommunityRequest(requestId);
      setRequests(prev => prev.map(r => (r.id === requestId ? updated : r)));
    } catch (err) {
      console.error('Failed to volunteer for request:', err);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    try {
      setIsSubmitting(true);
      const newReq = await api.createCommunityRequest({
        station_id: activeStationId,
        location_name: formLocation.trim() || stationName,
        beneficiary_type: formBeneficiary,
        urgency: formUrgency,
        title: formTitle.trim(),
        description: formDescription.trim(),
        contact_name: formContact.trim() || 'Community Member',
        distance_km: 1.2
      });

      setRequests(prev => [newReq, ...prev]);
      setIsHelpModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      setFormContact('');
      setFormLocation('');
    } catch (err) {
      console.error('Failed to submit community help request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCenters = centers.filter(c => {
    if (centerFilter === 'all') return true;
    return c.type === centerFilter;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/60 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Civic Resilience & Mutual Aid</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            {getTranslation(lang, 'cooling_centers', 'Cooling Shelters & Water Pyaaus')}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Verified air-conditioned public facilities, drinking water points, and neighborhood SOS requests for {stationName}.
          </p>
        </div>

        <button
          onClick={() => setIsHelpModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Help Request</span>
        </button>
      </div>

      {/* Emergency Hotline Quick Access */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={(e) => initiatePhoneCall('108', e)}
          className="bg-red-950/40 border border-red-500/40 hover:border-red-500 p-4 rounded-2xl flex items-center gap-3 transition shadow-lg group active:scale-98 text-left cursor-pointer w-full"
        >
          <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center font-black group-hover:scale-110 transition shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-red-400">Medical Emergency</div>
            <div className="text-lg font-black text-white">108 Ambulance</div>
          </div>
        </button>

        <button
          type="button"
          onClick={(e) => initiatePhoneCall('112', e)}
          className="bg-amber-950/30 border border-amber-500/40 hover:border-amber-500 p-4 rounded-2xl flex items-center gap-3 transition shadow-lg group active:scale-98 text-left cursor-pointer w-full"
        >
          <div className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center font-black group-hover:scale-110 transition shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-400">National Emergency</div>
            <div className="text-lg font-black text-white">112 Helpline</div>
          </div>
        </button>

        <button
          type="button"
          onClick={(e) => initiatePhoneCall('1078', e)}
          className="bg-blue-950/30 border border-blue-500/40 hover:border-blue-500 p-4 rounded-2xl flex items-center gap-3 transition shadow-lg group active:scale-98 text-left cursor-pointer w-full"
        >
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black group-hover:scale-110 transition shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-blue-400">Disaster Management</div>
            <div className="text-lg font-black text-white">1078 Control Room</div>
          </div>
        </button>
      </div>

      {/* Section 1: Cooling Centers & Water Points */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Verified Shelters & Hydration Kiosks
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Nearest municipal refuge points offering shade, air conditioning, and fresh water.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Resources' },
              { id: 'cooling_shelter', label: 'AC Shelters' },
              { id: 'water_point', label: 'Water Pyaaus' },
              { id: 'hospital', label: 'Hospitals' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setCenterFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  centerFilter === f.id
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCenters.map((center, idx) => (
              <div
                key={idx}
                className="bg-gray-800/60 border border-gray-700/60 hover:border-gray-600 p-5 rounded-2xl flex flex-col justify-between transition shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-900 text-emerald-400 rounded-xl border border-gray-700">
                        {center.type === 'hospital' && <HeartPulse className="w-4 h-4 text-rose-400" />}
                        {center.type === 'water_point' && <Droplets className="w-4 h-4 text-cyan-400" />}
                        {center.type === 'cooling_shelter' && <Building2 className="w-4 h-4 text-emerald-400" />}
                        {center.type === 'transit_hub' && <Building2 className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {center.name}
                        </h3>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {center.address}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 flex-shrink-0">
                      ~{center.distance_km} km
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 my-2.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Operating Hours: <strong className="text-gray-200">{center.hours}</strong></span>
                  </div>

                  {/* Live Capacity & Verification Status */}
                  <div className="flex items-center justify-between mb-3 px-3 py-2 bg-gray-900/70 rounded-xl border border-gray-700/60 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        center.status === 'crowded' ? 'bg-amber-400' : center.status === 'full' ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'
                      }`}></span>
                      <span className="font-bold text-white">
                        {center.status === 'crowded' ? 'Near Capacity' : center.status === 'full' ? 'Full' : 'Open'}
                      </span>
                      {center.capacity_current !== undefined && center.capacity_total && (
                        <span className="text-gray-400 text-[10px]">
                          ({center.capacity_total - center.capacity_current} spots left of {center.capacity_total})
                        </span>
                      )}
                    </div>
                    {center.is_verified_today && (
                      <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Today
                      </span>
                    )}
                  </div>

                  {/* Amenities Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {center.has_ac && (
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-300 font-bold px-2 py-0.5 rounded-md border border-cyan-500/20">
                        ❄️ Air Conditioned
                      </span>
                    )}
                    {center.has_water && (
                      <span className="text-[10px] bg-blue-500/10 text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-500/20">
                        💧 Free Chilled Water
                      </span>
                    )}
                    {center.has_meds && (
                      <span className="text-[10px] bg-rose-500/10 text-rose-300 font-bold px-2 py-0.5 rounded-md border border-rose-500/20">
                        🩹 ORS & First Aid
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${center.name} ${center.address} ${stationName}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gray-700/60 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Get Directions</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Community Assistance SOS Board */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              Community Heat Assistance Requests
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Neighbors helping neighbors: volunteer to deliver cold water, ORS, or check on vulnerable citizens.
            </p>
          </div>

          <span className="text-xs bg-cyan-500/10 text-cyan-300 font-bold px-3 py-1 rounded-full border border-cyan-500/20 self-start sm:self-center">
            {requests.length} Open Requests
          </span>
        </div>

        <div className="space-y-4">
          {requests.map(req => (
            <div
              key={req.id}
              className="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white ${
                      req.urgency === 'extreme'
                        ? 'bg-red-600'
                        : req.urgency === 'high'
                        ? 'bg-orange-500'
                        : 'bg-amber-500'
                    }`}
                  >
                    {req.urgency} Urgency
                  </span>
                  <span className="text-xs font-bold text-gray-300">
                    Beneficiary: <strong className="capitalize text-emerald-400">{req.beneficiary_type.replace('_', ' ')}</strong>
                  </span>
                  <span className="text-xs text-gray-500">• {req.timestamp}</span>
                </div>

                <h3 className="text-sm font-bold text-white">
                  {req.title}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {req.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {req.location_name} (~{req.distance_km} km)
                  </span>
                  <span>Contact: <strong className="text-gray-200">{req.contact_name}</strong></span>
                  <span className="text-emerald-400 font-medium">
                    {req.volunteers_signed_up} Volunteers Responded
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleRespondToRequest(req.id)}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg self-start sm:self-center flex-shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Offer Help</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Post Help Request Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                Post Community Assistance Request
              </h3>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Short Title / Need
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ORS sachets needed for elderly resident"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Beneficiary Group
                </label>
                <select
                  value={formBeneficiary}
                  onChange={(e) => setFormBeneficiary(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="elderly">Elderly / Senior Citizen</option>
                  <option value="outdoor_worker">Outdoor / Street Worker</option>
                  <option value="delivery_worker">Delivery Courier</option>
                  <option value="child">Child / Infant Family</option>
                  <option value="no_cooling">Household without AC / Fan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Urgency Level
                </label>
                <select
                  value={formUrgency}
                  onChange={(e) => setFormUrgency(e.target.value as any)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="high">High — Needs assistance within hours</option>
                  <option value="extreme">Extreme — Urgent hydration / cooling distress</option>
                  <option value="medium">Medium — General support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Area / Neighborhood
                </label>
                <input
                  type="text"
                  placeholder={`e.g. Sector 4, ${stationName}`}
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Details & Instructions
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what help is needed (e.g. cold water jars, shade tarpaulin, fan repair)..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Your Name / Contact Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ward Volunteer Suresh"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  {isSubmitting ? 'Posting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
