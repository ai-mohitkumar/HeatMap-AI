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
const REMOTE_FALLBACK_API_BASE = 'https://heatshield-ai-backend-jls2.onrender.com/api';
const IS_FILE_PROTOCOL_NO_BACKEND =
  typeof window !== 'undefined' && window.location?.protocol === 'file:' && !configuredApiUrl;

let localBundleNoBackend = false;

async function inspectAndMarkLocalBundle(res: Response): Promise<boolean> {
  if (res.status !== 404) return false;
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return false;
  try {
    const clone = res.clone();
    const body = await clone.json();
    if (body?.error === 'offline_local_bundle' || body?.offline === true) {
      localBundleNoBackend = true;
      return true;
    }
  } catch {
    // ignore JSON inspection failure
  }
  return false;
}

function getGeoApiCandidates(): string[] {
  if (IS_FILE_PROTOCOL_NO_BACKEND || localBundleNoBackend) {
    return [REMOTE_FALLBACK_API_BASE];
  }
  if (GEO_API_BASE === '/api') {
    return ['/api', REMOTE_FALLBACK_API_BASE];
  }
  return [GEO_API_BASE];
}

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
 * Hierarchy: Backend /api/geo/reverse (Nominatim/BigDataCloud) -> Direct BigDataCloud -> Offline Haversine centroid fallback.
 */
export async function reverseGeocodeCoords(
  lat: number,
  lon: number,
  hints?: { city?: string; district?: string; state?: string }
): Promise<ReverseGeocodeResult> {
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  let backendCentroidFallback: ReverseGeocodeResult | null = null;

  if (isOnline && typeof fetch === 'function') {
    // 1. Try HeatShield backend Nominatim / BigDataCloud proxy (with automatic standalone fallback)
    for (const apiBase of getGeoApiCandidates()) {
      if (localBundleNoBackend && apiBase === '/api') continue;
      const backendReq = createAbortSignal(2400);
      try {
        const res = await fetch(
          `${apiBase}/geo/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
          { signal: backendReq.signal }
        );
        if (await inspectAndMarkLocalBundle(res)) {
          continue;
        }
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
            data.reverse_source === 'nominatim'
              ? 'nominatim'
              : data.reverse_source === 'bigdatacloud'
              ? 'bigdatacloud'
              : 'local_centroid_fallback';

          if (placeName || districtName) {
            const parsed: ReverseGeocodeResult = {
              placeName: placeName || districtName,
              districtName,
              stateName,
              stateCode,
              country: data.country || (isWithinIndiaBounds(lat, lon) ? 'India' : undefined),
              reverseSource,
              isApproximateCentroid: Boolean(data.is_approximate_centroid),
              distanceKm: typeof data.distance_km === 'number' ? data.distance_km : undefined
            };
            // Only return immediately if backed by a true online reverse geocoder;
            // if backend fell back to centroid (e.g. Nominatim 429 on cloud IP), try BigDataCloud next!
            if (reverseSource === 'nominatim' || reverseSource === 'bigdatacloud') {
              return parsed;
            }
            backendCentroidFallback = parsed;
            break;
          }
        } else {
          console.warn(`[ReverseGeocode] ${apiBase}/geo/reverse returned HTTP ${res.status} (${ct})`);
        }
      } catch (err) {
        console.warn(`[ReverseGeocode] ${apiBase}/geo/reverse failed:`, err);
      } finally {
        backendReq.cleanup();
      }
    }

    // 2. Direct browser CORS-friendly BigDataCloud reverse geocoder fallback (static / standalone / Nominatim-limited deploys)
    const bdcReq = createAbortSignal(3200);
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

  if (backendCentroidFallback) {
    return backendCentroidFallback;
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
 * Android 7+ / older WebView compatible replacement for ES2021 Promise.any.
 * Resolves with the first promise that fulfills; rejects only if all reject.
 */
function firstFulfilled<T>(promises: Array<Promise<T>>): Promise<T> {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) {
      reject(new Error('All geolocation providers failed.'));
      return;
    }
    let settled = false;
    let remaining = promises.length;
    const errors: string[] = [];

    promises.forEach((p, idx) => {
      Promise.resolve(p).then(
        (val) => {
          if (!settled) {
            settled = true;
            resolve(val);
          }
        },
        (err) => {
          errors[idx] = err instanceof Error ? err.message : String(err);
          remaining -= 1;
          if (!settled && remaining <= 0) {
            reject(new Error(errors.filter(Boolean).join('; ') || 'All providers failed.'));
          }
        }
      );
    });
  });
}

/**
 * Acquire the best possible location through cascading multi-tier resolution.
 * Never returns a silent hardcoded city on failure — returns explicit `status: 'unavailable'`.
 *
 * Optionally calls `onPreliminaryLocation` as soon as a fast approximate IP fix becomes ready
 * (if hardware/network GPS takes >1.5s), so Live Maps and telemetry never stall blank while GPS locks.
 */
export async function acquireBestLocation(
  onStatusUpdate?: (status: string) => void,
  onPreliminaryLocation?: (preliminary: GeolocationResult) => void
): Promise<GeolocationResult> {
  let gpsErrorCode: GeolocationResult['errorCode'] = 'POSITION_UNAVAILABLE';
  let gpsErrorDetail = '';
  let preciseDone = false;
  let ipPrefetchPromise: Promise<GeolocationResult> | null = null;
  let ipPrefetchTimer: ReturnType<typeof setTimeout> | null = null;

  const ensureIpPrefetch = (): Promise<GeolocationResult> => {
    if (!ipPrefetchPromise) {
      ipPrefetchPromise = acquireFromIpFallback(undefined, gpsErrorCode, gpsErrorDetail).then((res) => {
        if (!preciseDone && res.status === 'resolved' && onPreliminaryLocation) {
          onPreliminaryLocation(res);
        }
        return res;
      });
    }
    return ipPrefetchPromise;
  };

  const stopPrefetchTimer = () => {
    if (ipPrefetchTimer !== null) {
      clearTimeout(ipPrefetchTimer);
      ipPrefetchTimer = null;
    }
  };

  // Start background IP lookup after 1.5s if precise sensors are still acquiring / prompting
  if (onPreliminaryLocation) {
    ipPrefetchTimer = setTimeout(() => {
      if (!preciseDone) {
        void ensureIpPrefetch();
      }
    }, 1500);
  }

  try {
    // 1. TIER 1: Native Android Bridge (inside HeatShield APK)
    const nativeBridge = typeof window !== 'undefined' ? (window as any).HeatShieldNativeGps : undefined;
    if (nativeBridge && typeof nativeBridge.requestLocation === 'function') {
      onStatusUpdate?.('Accessing native Android GNSS / Network sensors...');
      try {
        const nativeLoc = await acquireFromNativeBridge(nativeBridge, 8000);
        preciseDone = true;
        stopPrefetchTimer();
        return await formatResolvedLocation(
          nativeLoc.latitude,
          nativeLoc.longitude,
          nativeLoc.accuracy,
          'native_android'
        );
      } catch (e) {
        console.warn('[Geolocation] Native bridge failed, falling back to browser/IP:', e);
      }
    }

    // 2. TIER 2: Browser W3C High Accuracy (GNSS/GPS satellites)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      onStatusUpdate?.('Acquiring high-accuracy satellite GPS fix...');
      try {
        const pos = await getW3cPosition({
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000
        });
        preciseDone = true;
        stopPrefetchTimer();
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
          onStatusUpdate?.('GPS permission denied. Using approximate network IP lookup...');
          const ipRes = ipPrefetchPromise
            ? await ipPrefetchPromise
            : await acquireFromIpFallback(onStatusUpdate, gpsErrorCode, gpsErrorDetail);
          preciseDone = true;
          stopPrefetchTimer();
          if (ipRes.status === 'unavailable' && onStatusUpdate) {
            onStatusUpdate('Location unavailable — please select your city or village manually.');
          }
          return ipRes;
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
            timeout: 4500,
            maximumAge: 300000
          });
          preciseDone = true;
          stopPrefetchTimer();
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

    // 4. TIER 4: Approximate IP-Based Geolocation Fallback (reusing prefetched IP result if ready)
    preciseDone = true;
    stopPrefetchTimer();
    onStatusUpdate?.('Trying approximate regional IP lookup...');
    const finalIp = ipPrefetchPromise
      ? await ipPrefetchPromise
      : await acquireFromIpFallback(onStatusUpdate, gpsErrorCode, gpsErrorDetail);
    if (finalIp.status === 'unavailable') {
      onStatusUpdate?.('Location unavailable — please select your city or village manually.');
      return buildUnavailableLocationResult(
        gpsErrorCode,
        finalIp.errorReason || gpsErrorDetail || 'Location unavailable.'
      );
    }
    return finalIp;
  } finally {
    preciseDone = true;
    stopPrefetchTimer();
  }
}

/**
 * Native Android APK bridge helper
 * Handles permission prompts gracefully so native OS permission dialogs do not expire prematurely.
 */
function acquireFromNativeBridge(
  bridge: any,
  timeoutMs: number
): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (typeof window !== 'undefined') {
        delete (window as any).__onNativeGpsSuccess;
        delete (window as any).__onNativeGpsError;
        delete (window as any).__onNativeGpsPermissionResult;
      }
    };

    const armTimer = (ms: number) => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Native Android GPS request timed out.'));
      }, ms);
    };

    const waitingForPerm =
      typeof bridge.isWaitingForPermission === 'function' && Boolean(bridge.isWaitingForPermission());
    armTimer(waitingForPerm ? Math.max(timeoutMs, 15000) : timeoutMs);

    (window as any).__onNativeGpsPermissionResult = (granted: boolean) => {
      if (settled) return;
      if (!granted) {
        settled = true;
        cleanup();
        reject(new Error('Android location permission denied.'));
        return;
      }
      armTimer(Math.max(timeoutMs, 8500));
    };

    (window as any).__onNativeGpsSuccess = (lat: number, lon: number, acc: number) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ latitude: lat, longitude: lon, accuracy: acc || 20 });
    };

    (window as any).__onNativeGpsError = (errStr: string) => {
      if (settled) return;
      settled = true;
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

async function fetchIpwhoLocation(reasons: string[]): Promise<GeolocationResult> {
  const req = createAbortSignal(3200);
  try {
    const res = await fetch('https://ipwho.is/', { signal: req.signal });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('application/json')) {
      throw new Error(`ipwho.is HTTP ${res.status}`);
    }
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
    const msg = `ipwho.is: ${data.message || 'unsuccessful lookup'}`;
    reasons.push(msg);
    throw new Error(msg);
  } finally {
    req.cleanup();
  }
}

async function fetchFreeIpApiLocation(reasons: string[]): Promise<GeolocationResult> {
  const req = createAbortSignal(3200);
  try {
    // Use free.freeipapi.com directly (freeipapi.com/api/json issues a 307 redirect)
    const res = await fetch('https://free.freeipapi.com/api/v1/json', { signal: req.signal });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('application/json')) {
      throw new Error(`freeipapi HTTP ${res.status}`);
    }
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
    const msg = 'freeipapi returned invalid coordinates';
    reasons.push(msg);
    throw new Error(msg);
  } finally {
    req.cleanup();
  }
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

  // 1. Race city-level CORS-friendly direct HTTPS IP providers in parallel (fast ~300-800ms fix)
  try {
    return await firstFulfilled([
      fetchIpwhoLocation(reasons),
      fetchFreeIpApiLocation(reasons)
    ]);
  } catch (err) {
    console.warn('[Geolocation] Primary direct IP providers failed:', err);
  }

  // 2. Fallback to HeatShield backend IP geolocation (/api/geo/ip -> remote Render standalone fallback)
  for (const apiBase of getGeoApiCandidates()) {
    if (localBundleNoBackend && apiBase === '/api') continue;
    const backendReq = createAbortSignal(3500);
    try {
      const res = await fetch(`${apiBase}/geo/ip`, { signal: backendReq.signal });
      if (await inspectAndMarkLocalBundle(res)) {
        continue;
      }
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
          console.warn(`[Geolocation] ${apiBase}/geo/ip unavailable:`, data.reason);
          reasons.push(String(data.reason));
        }
      } else {
        console.warn(`[Geolocation] ${apiBase}/geo/ip returned HTTP ${res.status} (${ct})`);
      }
    } catch (err) {
      console.warn(`[Geolocation] ${apiBase}/geo/ip request failed:`, err);
    } finally {
      backendReq.cleanup();
    }
  }

  // 3. Tertiary direct CORS provider (GeoJS — keep last since free tier may return country centroid)
  const geoJsReq = createAbortSignal(3000);
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: geoJsReq.signal });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      const lat = Number(data.latitude);
      const lon = Number(data.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0)) {
        const hasCity = Boolean(data.city && String(data.city).trim());
        const accuracyM = typeof data.accuracy === 'number' && data.accuracy > 0
          ? data.accuracy * 1000
          : hasCity
          ? 25000
          : 150000;
        return await formatResolvedLocation(
          lat,
          lon,
          accuracyM,
          'ip_geolocation',
          {
            city: data.city || undefined,
            state: data.region || undefined,
            country: data.country || undefined
          }
        );
      }
    }
  } catch (err) {
    console.warn('[Geolocation] geojs.io request failed:', err);
  } finally {
    geoJsReq.cleanup();
  }

  const finalReason =
    reasons[0] ||
    'Unable to determine your location via GPS or network IP. Please search or select your city manually.';
  onStatusUpdate?.('Location unavailable — please select your city or village manually.');
  return buildUnavailableLocationResult(priorErrorCode, finalReason);
}
