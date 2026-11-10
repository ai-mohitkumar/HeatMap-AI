/**
 * HeatShield AI — Multi-Tier Geolocation & Reverse-Geocoding Service
 *
 * Strictly separates:
 * - Location acquisition (Native Android / Browser GPS / Cell-WiFi / Approximate IP / Manual)
 * - Reverse geocoding for human-readable place names (Nominatim -> BigDataCloud -> Offline Haversine centroid)
 * - Explicit "unavailable" state when all location tiers fail (NEVER silently defaults to Patna or any preset city)
 *
 * Raw acquired (latitude, longitude) coordinates are always preserved for weather & IDW calculations.
 */

import { ALL_INDIA_DISTRICTS, findNearestDistrictClient } from './indiaGeoStore';
import type { LocationSourceType, ReverseGeocodeSource } from '../types';

export const MANUAL_LOCATION_STORAGE_KEY = 'heatshield_manual_location_v1';

const configuredApiUrl =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL
    ? String((import.meta as any).env.VITE_API_URL).trim()
    : '';
const GEO_API_BASE = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/+$/, '').replace(/\/api$/, '')}/api`
  : '/api';
const IS_FILE_PROTOCOL_NO_BACKEND =
  typeof window !== 'undefined' && window.location?.protocol === 'file:' && !configuredApiUrl;

export interface GeolocationResult {
  status: 'resolved' | 'unavailable';
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  displayName: string;
  placeName: string;
  districtName: string;
  stateName: string;
  stateCode: string;
  country?: string;
  source: LocationSourceType;
  reverseSource: ReverseGeocodeSource;
  isApproximateLocation: boolean;
  isApproximateCentroid: boolean;
  timestamp: number;
  errorCode?: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  errorReason?: string;
}

export interface ReverseGeocodeResult {
  placeName: string;
  districtName: string;
  stateName: string;
  stateCode: string;
  country?: string;
  reverseSource: ReverseGeocodeSource;
  isApproximateCentroid: boolean;
  distanceKm?: number;
}

export interface LocationConfidenceInfo {
  label: string;
  shortTag: string;
  isApproximate: boolean;
  accuracyLabel: string;
  detail: string;
}

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

function createAbortSignal(timeoutMs: number): { signal?: AbortSignal; cleanup: () => void } {
  if (typeof AbortController === 'undefined') {
    return { signal: undefined, cleanup: () => {} };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer)
  };
}

function isWithinIndiaBounds(lat: number, lon: number): boolean {
  return lat >= 6.0 && lat <= 38.0 && lon >= 68.0 && lon <= 98.0;
}

function findStateCodeForName(stateName?: string, districtName?: string): string {
  const sClean = (stateName || '').trim().toLowerCase();
  const dClean = (districtName || '').trim().toLowerCase();
  if (dClean) {
    const dMatch = ALL_INDIA_DISTRICTS.find(
      (d) =>
        d.district_name.toLowerCase() === dClean &&
        (!sClean || d.state_name.toLowerCase() === sClean || d.state_name.toLowerCase().includes(sClean))
    );
    if (dMatch) return dMatch.state_code;
  }
  if (sClean) {
    const sMatch = ALL_INDIA_DISTRICTS.find(
      (d) => d.state_name.toLowerCase() === sClean || d.state_name.toLowerCase().includes(sClean)
    );
    if (sMatch) return sMatch.state_code;
  }
  return '';
}

export function formatLocationConfidence(
  source: LocationSourceType,
  accuracyM?: number | null
): LocationConfidenceInfo {
  const accText = accuracyM != null && Number.isFinite(accuracyM)
    ? accuracyM >= 1000
      ? `±${(accuracyM / 1000).toFixed(1)} km`
      : `±${Math.round(accuracyM)} m`
    : 'Unknown';

  switch (source) {
    case 'native_android':
    case 'hardware_gps':
      return {
        label: 'GPS Fix',
        shortTag: accuracyM != null ? `GPS ${accText}` : 'GPS',
        isApproximate: (accuracyM ?? 0) > 500,
        accuracyLabel: accText,
        detail: `Device GNSS / Hardware GPS (${accText})`
      };
    case 'network_cellular':
      return {
        label: 'Network / Wi-Fi',
        shortTag: accuracyM != null ? `Wi-Fi ${accText}` : 'Network',
        isApproximate: true,
        accuracyLabel: accText,
        detail: `Network Wi-Fi / Cell triangulation (${accText})`
      };
    case 'ip_geolocation':
      return {
        label: 'Approx. IP Location',
        shortTag: accuracyM != null ? `IP ${accText}` : 'Approx. IP',
        isApproximate: true,
        accuracyLabel: accText,
        detail: `Approximate IP-based regional estimate (${accText}) — select city manually or enable GPS for street-level accuracy`
      };
    case 'manual':
      return {
        label: 'Manual Selection',
        shortTag: 'Manual',
        isApproximate: false,
        accuracyLabel: 'Selected',
        detail: 'User-selected place / meteorological station'
      };
    case 'unavailable':
    default:
      return {
        label: 'Location Unavailable',
        shortTag: 'Unavailable',
        isApproximate: true,
        accuracyLabel: 'None',
        detail: 'Device GPS and network IP geolocation unavailable'
      };
  }
}

/**
 * Reverse geocodes GPS coordinates to a real place name without mutating the coordinates.
 * Hierarchy: Backend /api/geo/reverse (Nominatim) -> Direct BigDataCloud -> Offline Haversine centroid fallback.
 */
export async function reverseGeocodeCoords(
  lat: number,
  lon: number,
  hints?: { city?: string; district?: string; state?: string }
): Promise<ReverseGeocodeResult> {
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

  if (isOnline && typeof fetch === 'function') {
    // 1. Try HeatShield backend Nominatim proxy (unless running standalone file:// bundle)
    if (!IS_FILE_PROTOCOL_NO_BACKEND) {
      const backendReq = createAbortSignal(3500);
      try {
        const res = await fetch(
          `${GEO_API_BASE}/geo/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
          { signal: backendReq.signal }
        );
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          const districtObj = data.district || {};
          const placeName =
            data.place_name ||
            data.city ||
            hints?.city ||
            data.district_name ||
            districtObj.district_name ||
            '';
          const districtName =
            data.district_name || districtObj.district_name || hints?.district || placeName;
          const stateName = data.state || districtObj.state_name || hints?.state || '';
          const stateCode =
            data.state_code || districtObj.state_code || findStateCodeForName(stateName, districtName);
          const reverseSource: ReverseGeocodeSource =
            data.reverse_source === 'nominatim' ? 'nominatim' : 'local_centroid_fallback';

          if (placeName || districtName) {
            return {
              placeName: placeName || districtName,
              districtName,
              stateName,
              stateCode,
              country: data.country || (isWithinIndiaBounds(lat, lon) ? 'India' : undefined),
              reverseSource,
              isApproximateCentroid: Boolean(data.is_approximate_centroid),
              distanceKm: typeof data.distance_km === 'number' ? data.distance_km : undefined
            };
          }
        } else {
          console.warn(`[ReverseGeocode] Backend returned HTTP ${res.status} (${ct})`);
        }
      } catch (err) {
        console.warn('[ReverseGeocode] Backend /api/geo/reverse failed:', err);
      } finally {
        backendReq.cleanup();
      }
    }

    // 2. Direct browser CORS-friendly BigDataCloud reverse geocoder fallback (static / Vercel deploys)
    const bdcReq = createAbortSignal(3500);
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`,
        { signal: bdcReq.signal }
      );
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const bdc = await res.json();
        const adminList: Array<{ name?: string; adminLevel?: number; order?: number }> =
          bdc.localityInfo?.administrative || [];
        const adminDistrict = adminList.find((a) => a.adminLevel === 5 || a.adminLevel === 6)?.name;
        const rawDistrict = (adminDistrict || bdc.city || '').replace(/\s+District$/i, '').trim();
        const placeName = bdc.city || bdc.locality || hints?.city || rawDistrict;
        const stateName = bdc.principalSubdivision || hints?.state || '';
        const districtName = rawDistrict || hints?.district || placeName;

        if (placeName || districtName) {
          return {
            placeName: placeName || districtName,
            districtName,
            stateName,
            stateCode: findStateCodeForName(stateName, districtName),
            country: bdc.countryName || undefined,
            reverseSource: 'bigdatacloud',
            isApproximateCentroid: false
          };
        }
      } else {
        console.warn(`[ReverseGeocode] BigDataCloud returned HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn('[ReverseGeocode] BigDataCloud reverse geocode failed:', err);
    } finally {
      bdcReq.cleanup();
    }
  }

  // 3. Offline Haversine nearest-district centroid fallback (clearly marked as approximate centroid!)
  if (isWithinIndiaBounds(lat, lon)) {
    const nearest = findNearestDistrictClient(lat, lon);
    if (nearest.district_name) {
      return {
        placeName: hints?.city || `Near ${nearest.district_name}`,
        districtName: hints?.district || nearest.district_name,
        stateName: hints?.state || nearest.state_name,
        stateCode: nearest.state_code,
        country: 'India',
        reverseSource: 'local_centroid_fallback',
        isApproximateCentroid: true,
        distanceKm: nearest.distance_km
      };
    }
  }

  // Outside India offline
  const coordLabel = `${lat.toFixed(3)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(3)}° ${lon >= 0 ? 'E' : 'W'}`;
  return {
    placeName: hints?.city || coordLabel,
    districtName: hints?.district || hints?.city || '',
    stateName: hints?.state || '',
    stateCode: '',
    reverseSource: 'unavailable',
    isApproximateCentroid: false
  };
}

function buildDisplayName(
  placeName: string,
  districtName: string,
  stateName: string,
  source: LocationSourceType,
  reverseSource: ReverseGeocodeSource
): string {
  const parts: string[] = [];
  if (placeName) parts.push(placeName);
  if (districtName && districtName.toLowerCase() !== placeName.toLowerCase()) {
    parts.push(districtName);
  }
  if (stateName) parts.push(stateName);

  const base = parts.slice(0, 2).join(', ') || 'Resolved Coordinates';
  if (source === 'ip_geolocation') return `${base} (Approx. IP)`;
  if (reverseSource === 'local_centroid_fallback' && !base.startsWith('Near ')) {
    return `${base} (Offline Area)`;
  }
  return base;
}

async function formatResolvedLocation(
  lat: number,
  lon: number,
  acc: number,
  source: Exclude<LocationSourceType, 'unavailable' | 'manual'>,
  hints?: { city?: string; district?: string; state?: string; country?: string }
): Promise<GeolocationResult> {
  const rev = await reverseGeocodeCoords(lat, lon, hints);
  const placeName = rev.placeName || hints?.city || rev.districtName || '';
  const districtName = rev.districtName || hints?.district || placeName;
  const stateName = rev.stateName || hints?.state || '';
  const isApproxLoc =
    source === 'ip_geolocation' || source === 'network_cellular' || acc > 500;

  return {
    status: 'resolved',
    latitude: Number(lat.toFixed(5)),
    longitude: Number(lon.toFixed(5)),
    accuracyM: Math.round(acc),
    displayName: buildDisplayName(placeName, districtName, stateName, source, rev.reverseSource),
    placeName,
    districtName,
    stateName,
    stateCode: rev.stateCode,
    country: rev.country || hints?.country,
    source,
    reverseSource: rev.reverseSource,
    isApproximateLocation: isApproxLoc,
    isApproximateCentroid: rev.isApproximateCentroid,
    timestamp: Date.now()
  };
}

export function buildUnavailableLocationResult(
  errorCode: GeolocationResult['errorCode'] = 'POSITION_UNAVAILABLE',
  errorReason: string = 'Location unavailable. Please enable GPS or select a city manually.'
): GeolocationResult {
  return {
    status: 'unavailable',
    latitude: null,
    longitude: null,
    accuracyM: null,
    displayName: 'Location Unavailable',
    placeName: '',
    districtName: '',
    stateName: '',
    stateCode: '',
    source: 'unavailable',
    reverseSource: 'unavailable',
    isApproximateLocation: true,
    isApproximateCentroid: false,
    timestamp: Date.now(),
    errorCode,
    errorReason
  };
}

export function createManualLocationResult(loc: {
  name: string;
  lat: number;
  lon: number;
  district?: string;
  state?: string;
  accuracyM?: number;
}): GeolocationResult {
  const cleanName = loc.name.trim();
  const stateCode = findStateCodeForName(loc.state, loc.district);
  return {
    status: 'resolved',
    latitude: Number(loc.lat.toFixed(5)),
    longitude: Number(loc.lon.toFixed(5)),
    accuracyM: loc.accuracyM ?? 50,
    displayName: cleanName,
    placeName: cleanName.split(',')[0].trim() || cleanName,
    districtName: loc.district || cleanName.split(',')[0].trim(),
    stateName: loc.state || '',
    stateCode,
    country: isWithinIndiaBounds(loc.lat, loc.lon) ? 'India' : undefined,
    source: 'manual',
    reverseSource: 'manual',
    isApproximateLocation: false,
    isApproximateCentroid: false,
    timestamp: Date.now()
  };
}

export function saveManualLocation(loc: {
  name: string;
  lat: number;
  lon: number;
  district?: string;
  state?: string;
}): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MANUAL_LOCATION_STORAGE_KEY, JSON.stringify(loc));
  } catch (err) {
    console.warn('[Geolocation] Failed to save manual location:', err);
  }
}

export function loadManualLocation(): GeolocationResult | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MANUAL_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.lat === 'number' &&
      typeof parsed.lon === 'number' &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lon) &&
      parsed.name
    ) {
      return createManualLocationResult(parsed);
    }
  } catch (err) {
    console.warn('[Geolocation] Failed to parse stored manual location:', err);
  }
  return null;
}

export function clearManualLocation(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(MANUAL_LOCATION_STORAGE_KEY);
  } catch (err) {
    console.warn('[Geolocation] Failed to clear manual location:', err);
  }
}

/**
 * Acquire the best possible location through cascading multi-tier resolution.
 * Never returns a silent hardcoded city on failure — returns explicit `status: 'unavailable'`.
 */
export async function acquireBestLocation(
  onStatusUpdate?: (status: string) => void
): Promise<GeolocationResult> {
  let gpsErrorCode: GeolocationResult['errorCode'] = 'POSITION_UNAVAILABLE';
  let gpsErrorDetail = '';

  // 1. TIER 1: Native Android Bridge (inside HeatShield APK)
  const nativeBridge = typeof window !== 'undefined' ? (window as any).HeatShieldNativeGps : undefined;
  if (nativeBridge && typeof nativeBridge.requestLocation === 'function') {
    onStatusUpdate?.('Accessing native Android GNSS / Network sensors...');
    try {
      const nativeLoc = await acquireFromNativeBridge(nativeBridge, 8000);
      return await formatResolvedLocation(
        nativeLoc.latitude,
        nativeLoc.longitude,
        nativeLoc.accuracy,
        'native_android'
      );
    } catch (e) {
      console.warn('[Geolocation] Native bridge failed, falling back to browser API:', e);
    }
  }

  // 2. TIER 2: Browser W3C High Accuracy (GNSS/GPS satellites)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    onStatusUpdate?.('Acquiring high-accuracy satellite GPS fix...');
    try {
      const pos = await getW3cPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
      return await formatResolvedLocation(
        pos.coords.latitude,
        pos.coords.longitude,
        pos.coords.accuracy || 25,
        'hardware_gps'
      );
    } catch (err: any) {
      console.warn('[Geolocation] High-accuracy GPS failed:', err?.message || err);

      if (err?.code === 1) {
        gpsErrorCode = 'PERMISSION_DENIED';
        gpsErrorDetail = 'Location permission denied by user.';
        onStatusUpdate?.('GPS permission denied. Trying approximate network IP lookup...');
        return await acquireFromIpFallback(onStatusUpdate, gpsErrorCode, gpsErrorDetail);
      }

      if (err?.code === 3) {
        gpsErrorCode = 'TIMEOUT';
        gpsErrorDetail = 'Satellite GPS timed out.';
      } else {
        gpsErrorCode = 'POSITION_UNAVAILABLE';
        gpsErrorDetail = err?.message || 'GPS position unavailable.';
      }

      // 3. TIER 3: Low-Accuracy Cellular / Wi-Fi Triangulation (Fast indoor fix)
      onStatusUpdate?.('Satellite signal weak. Trying Wi-Fi / network positioning...');
      try {
        const lowAccPos = await getW3cPosition({
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 300000
        });
        return await formatResolvedLocation(
          lowAccPos.coords.latitude,
          lowAccPos.coords.longitude,
          lowAccPos.coords.accuracy || 250,
          'network_cellular'
        );
      } catch (lowAccErr: any) {
        console.warn('[Geolocation] Low-accuracy positioning failed:', lowAccErr?.message || lowAccErr);
        gpsErrorDetail = lowAccErr?.message || gpsErrorDetail || 'Browser geolocation unavailable.';
      }
    }
  } else {
    gpsErrorDetail = 'Browser geolocation API unavailable.';
  }

  // 4. TIER 4: Approximate IP-Based Geolocation Fallback
  onStatusUpdate?.('Trying approximate regional IP lookup...');
  return await acquireFromIpFallback(onStatusUpdate, gpsErrorCode, gpsErrorDetail);
}

/**
 * Native Android APK bridge helper
 */
function acquireFromNativeBridge(
  bridge: any,
  timeoutMs: number
): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Native Android GPS request timed out.'));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      if (typeof window !== 'undefined') {
        delete (window as any).__onNativeGpsSuccess;
        delete (window as any).__onNativeGpsError;
      }
    };

    (window as any).__onNativeGpsSuccess = (lat: number, lon: number, acc: number) => {
      cleanup();
      resolve({ latitude: lat, longitude: lon, accuracy: acc || 20 });
    };

    (window as any).__onNativeGpsError = (errStr: string) => {
      cleanup();
      reject(new Error(errStr));
    };

    bridge.requestLocation();
  });
}

/**
 * W3C Promise Wrapper
 */
function getW3cPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Approximate IP-Based Geolocation Fallback.
 * Returns IP coordinates ONLY when a provider actually resolves valid public coordinates;
 * otherwise returns explicit `status: 'unavailable'` (NEVER Patna or any hardcoded city).
 */
async function acquireFromIpFallback(
  onStatusUpdate?: (status: string) => void,
  priorErrorCode: GeolocationResult['errorCode'] = 'POSITION_UNAVAILABLE',
  priorErrorDetail: string = ''
): Promise<GeolocationResult> {
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  const reasons: string[] = [];
  if (priorErrorDetail) reasons.push(priorErrorDetail);

  if (!isOnline || typeof fetch !== 'function') {
    const offlineMsg = 'Device is offline and GPS could not acquire a fix. Select your city or district manually.';
    onStatusUpdate?.(offlineMsg);
    return buildUnavailableLocationResult(priorErrorCode, offlineMsg);
  }

  // 1. Direct browser HTTPS IP providers (resolves client's real public ISP IP directly without
  // intermediate CDN/proxy hop ambiguity or backend cold-start latency)
  const directIpReq1 = createAbortSignal(3000);
  try {
    const res = await fetch('https://ipwho.is/', { signal: directIpReq1.signal });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (
        data.success === true &&
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number' &&
        Number.isFinite(data.latitude) &&
        Number.isFinite(data.longitude)
      ) {
        return await formatResolvedLocation(
          data.latitude,
          data.longitude,
          15000,
          'ip_geolocation',
          {
            city: data.city || undefined,
            state: data.region || undefined,
            country: data.country || undefined
          }
        );
      }
      reasons.push(`ipwho.is: ${data.message || 'unsuccessful lookup'}`);
    }
  } catch (err) {
    console.warn('[Geolocation] ipwho.is request failed:', err);
  } finally {
    directIpReq1.cleanup();
  }

  const directIpReq2 = createAbortSignal(3000);
  try {
    const res = await fetch('https://freeipapi.com/api/json', { signal: directIpReq2.signal });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number' &&
        Number.isFinite(data.latitude) &&
        Number.isFinite(data.longitude) &&
        !(data.latitude === 0 && data.longitude === 0)
      ) {
        return await formatResolvedLocation(
          data.latitude,
          data.longitude,
          15000,
          'ip_geolocation',
          {
            city: data.cityName || undefined,
            state: data.regionName || undefined,
            country: data.countryName || undefined
          }
        );
      }
    }
  } catch (err) {
    console.warn('[Geolocation] freeipapi.com request failed:', err);
  } finally {
    directIpReq2.cleanup();
  }

  // 2. Fallback to same-origin HeatShield backend IP geolocation (/api/geo/ip) if direct third-party
  // providers are blocked by privacy extensions or corporate firewalls
  if (!IS_FILE_PROTOCOL_NO_BACKEND) {
    const backendReq = createAbortSignal(3500);
    try {
      const res = await fetch(`${GEO_API_BASE}/geo/ip`, { signal: backendReq.signal });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (
          data.status === 'resolved' &&
          typeof data.latitude === 'number' &&
          typeof data.longitude === 'number' &&
          Number.isFinite(data.latitude) &&
          Number.isFinite(data.longitude)
        ) {
          return await formatResolvedLocation(
            data.latitude,
            data.longitude,
            typeof data.accuracy_m === 'number' ? data.accuracy_m : 15000,
            'ip_geolocation',
            {
              city: data.city || undefined,
              district: data.district || data.nearest_district_hint || undefined,
              state: data.state || undefined,
              country: data.country || undefined
            }
          );
        }
        if (data.reason) {
          console.warn('[Geolocation] /api/geo/ip unavailable:', data.reason);
          reasons.push(String(data.reason));
        }
      } else {
        console.warn(`[Geolocation] /api/geo/ip returned HTTP ${res.status} (${ct})`);
      }
    } catch (err) {
      console.warn('[Geolocation] /api/geo/ip request failed:', err);
    } finally {
      backendReq.cleanup();
    }
  }

  const finalReason =
    reasons[0] ||
    'Unable to determine your location via GPS or network IP. Please search or select your city manually.';
  onStatusUpdate?.('Location unavailable — please select your city or village manually.');
  return buildUnavailableLocationResult(priorErrorCode, finalReason);
}
