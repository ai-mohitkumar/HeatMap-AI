/**
 * HeatShield AI — Universal Fail-Safe Geolocation Service
 * 
 * Provides robust, multi-tier location acquisition:
 * Tier 1: Native Android Java Bridge (in APK: bypasses Chromium file:// sandbox)
 * Tier 2: W3C High-Accuracy Satellite GPS (mobile/desktop browsers)
 * Tier 3: W3C Low-Accuracy Cellular/Wi-Fi Triangulation (fast indoor fix)
 * Tier 4: Fast IP-Based Geolocation Fallback (desktop or permission blocked)
 * Tier 5: Client-Side District Reverse Geocoding via ALL_INDIA_DISTRICTS
 */

import { findNearestDistrictClient } from './indiaGeoStore';

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracyM: number;
  displayName: string;
  districtName: string;
  stateName: string;
  stateCode: string;
  source: 'native_android' | 'hardware_gps' | 'network_cellular' | 'ip_geolocation' | 'preset_fallback';
  timestamp: number;
}

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

/**
 * Acquire the best possible location through cascading multi-tier resolution.
 */
export async function acquireBestLocation(
  onStatusUpdate?: (status: string) => void
): Promise<GeolocationResult> {
  // 1. TIER 1: Native Android Bridge (inside HeatShield APK)
  const nativeBridge = (window as any).HeatShieldNativeGps;
  if (nativeBridge && typeof nativeBridge.requestLocation === 'function') {
    onStatusUpdate?.('Accessing native Android GNSS / Network sensors...');
    try {
      const nativeLoc = await acquireFromNativeBridge(nativeBridge, 8000);
      return formatResult(nativeLoc.latitude, nativeLoc.longitude, nativeLoc.accuracy, 'native_android');
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
      return formatResult(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy || 25, 'hardware_gps');
    } catch (err: any) {
      console.warn('[Geolocation] High-accuracy GPS failed:', err?.message || err);

      // If permission explicitly denied by user, skip to IP fallback
      if (err?.code === 1) { // PERMISSION_DENIED
        onStatusUpdate?.('GPS permission denied. Resolving regional location via network IP...');
        return await acquireFromIpFallback(onStatusUpdate);
      }

      // 3. TIER 3: Low-Accuracy Cellular / Wi-Fi Triangulation (Fast indoor fix)
      onStatusUpdate?.('Satellite signal weak. Using cell tower & Wi-Fi triangulation...');
      try {
        const lowAccPos = await getW3cPosition({
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 300000 // Accept up to 5 min cached position
        });
        return formatResult(
          lowAccPos.coords.latitude,
          lowAccPos.coords.longitude,
          lowAccPos.coords.accuracy || 150,
          'network_cellular'
        );
      } catch (lowAccErr) {
        console.warn('[Geolocation] Low-accuracy positioning failed:', lowAccErr);
      }
    }
  }

  // 4. TIER 4: IP-Based Geolocation Fallback
  onStatusUpdate?.('Resolving location from regional network IP...');
  return await acquireFromIpFallback(onStatusUpdate);
}

/**
 * Native Android APK bridge helper
 */
function acquireFromNativeBridge(bridge: any, timeoutMs: number): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Native Android GPS request timed out.'));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      delete (window as any).__onNativeGpsSuccess;
      delete (window as any).__onNativeGpsError;
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
 * IP-Based Geolocation Fallback (Calls backend /api/geo/ip or public IP API)
 */
async function acquireFromIpFallback(onStatusUpdate?: (status: string) => void): Promise<GeolocationResult> {
  // Try backend proxy first to avoid client CORS
  try {
    const res = await fetch('/api/geo/ip', { signal: AbortSignal.timeout(3500) });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return formatResult(data.latitude, data.longitude, 5000, 'ip_geolocation', data.city || data.district);
      }
    }
  } catch (e) {
    // ignore
  }

  // Try public fast endpoint (freeipapi.com)
  try {
    const res = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(3000) });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return formatResult(data.latitude, data.longitude, 10000, 'ip_geolocation', data.cityName);
      }
    }
  } catch (e) {
    // ignore
  }

  // Fail-safe Default: Patna / Central Reference
  onStatusUpdate?.('Using default regional reference point.');
  return formatResult(25.5941, 85.1376, 15000, 'preset_fallback', 'Patna');
}

/**
 * Formats coordinates with instant client-side reverse geocoding to Indian administrative district
 */
function formatResult(
  lat: number,
  lon: number,
  acc: number,
  source: GeolocationResult['source'],
  hintCity?: string
): GeolocationResult {
  const nearest = findNearestDistrictClient(lat, lon);
  const districtName = nearest.district_name || hintCity || 'Patna';
  const stateName = nearest.state_name || 'India';
  const stateCode = nearest.state_code || 'IN';

  let tag = 'GPS';
  if (source === 'network_cellular') tag = 'Cell/Wi-Fi';
  if (source === 'ip_geolocation') tag = 'Network IP';
  if (source === 'preset_fallback') tag = 'Regional';

  return {
    latitude: Number(lat.toFixed(4)),
    longitude: Number(lon.toFixed(4)),
    accuracyM: Math.round(acc),
    displayName: `${districtName}, ${stateName} (${tag})`,
    districtName,
    stateName,
    stateCode,
    source,
    timestamp: Date.now()
  };
}
