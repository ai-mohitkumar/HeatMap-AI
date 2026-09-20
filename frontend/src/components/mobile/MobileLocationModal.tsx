import React, { useState } from 'react';
import { X, Search, MapPin, Building2, Sun, ChevronRight, Compass } from 'lucide-react';
import { searchVillagesAndDistricts } from '../../utils/indiaGeoStore';
import { OFFLINE_STATIONS } from '../../utils/offlineEngine';

interface MobileLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStation: (stationId: string) => void;
  onSelectLocation: (loc: { name: string; lat: number; lon: number; district?: string; state?: string }) => void;
  onTrackMove: () => void;
  isTracking?: boolean;
}

export const MobileLocationModal: React.FC<MobileLocationModalProps> = ({
  isOpen,
  onClose,
  onSelectStation,
  onSelectLocation,
  onTrackMove,
  isTracking = false
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  // Top preset cities in India for 1-tap selection
  const presets = [
    { name: 'Patna, Bihar', lat: 25.5941, lon: 85.1376, district: 'Patna', state: 'Bihar' },
    { name: 'Buxar, Bihar', lat: 25.5647, lon: 83.9777, district: 'Buxar', state: 'Bihar' },
    { name: 'New Delhi', lat: 28.585, lon: 77.206, district: 'Central Delhi', state: 'Delhi' },
    { name: 'Phalodi, Rajasthan', lat: 27.13, lon: 72.36, district: 'Phalodi', state: 'Rajasthan' },
    { name: 'Mumbai, Maharashtra', lat: 19.117, lon: 72.857, district: 'Mumbai', state: 'Maharashtra' },
    { name: 'Kolkata, West Bengal', lat: 22.653, lon: 88.447, district: 'Kolkata', state: 'West Bengal' },
    { name: 'Chennai, Tamil Nadu', lat: 12.994, lon: 80.18, district: 'Chennai', state: 'Tamil Nadu' },
  ];

  // Dynamic search results
  const geoResults = query.trim().length >= 2 ? searchVillagesAndDistricts(query, 12) : [];
  const matchingStations =
    query.trim().length >= 2
      ? OFFLINE_STATIONS.filter(
          (s) =>
            s.station_name.toLowerCase().includes(query.toLowerCase()) ||
            s.full_name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6)
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet Modal */}
      <div className="relative w-full max-w-lg bg-[#0B132B] border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl z-50 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-black text-white">Select Location or Village</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Quick Track Button */}
        <div className="py-3">
          <button
            onClick={() => {
              onTrackMove();
              onClose();
            }}
            disabled={isTracking}
            className="w-full py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
          >
            <Compass className={`w-4 h-4 text-blue-400 ${isTracking ? 'animate-spin' : ''}`} />
            <span>{isTracking ? 'Acquiring GPS / Network Fix...' : 'Use My Exact GPS Location'}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search village, tehsil, district or station..."
            className="w-full bg-[#131E3A] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            autoFocus
          />
        </div>

        {/* Search Results / Presets Container */}
        <div className="flex-1 overflow-y-auto space-y-3 divide-y divide-slate-800/80 pr-1 text-xs">
          {query.trim().length >= 2 ? (
            <>
              {/* Synoptic Stations */}
              {matchingStations.length > 0 && (
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Synoptic Stations
                  </span>
                  {matchingStations.map((st) => (
                    <button
                      key={st.station_id}
                      onClick={() => {
                        onSelectStation(st.station_id);
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">{st.station_name}</div>
                          <div className="text-[10px] text-slate-400">{st.full_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-400">{st.temperature_c}°C</div>
                        <span className="text-[9px] text-slate-400">{st.vulnerability_tier}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Geo Villages & Districts */}
              {geoResults.length > 0 && (
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Villages &amp; Districts of India
                  </span>
                  {geoResults.map((geo, idx) => (
                    <button
                      key={`${geo.name}-${idx}`}
                      onClick={() => {
                        onSelectLocation({
                          name: `${geo.name}, ${geo.district_name || geo.state_name || 'IN'}`,
                          lat: geo.latitude,
                          lon: geo.longitude,
                          district: geo.district_name,
                          state: geo.state_name
                        });
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition text-left"
                    >
                      <div className="flex items-center gap-2">
                        {geo.type === 'village' ? (
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{geo.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold uppercase">
                              {geo.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {geo.hierarchy || `${geo.district_name || ''}, ${geo.state_name || ''}`}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Popular Cities &amp; Regions
              </span>
              {presets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    onSelectLocation(p);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-bold text-white">{p.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
