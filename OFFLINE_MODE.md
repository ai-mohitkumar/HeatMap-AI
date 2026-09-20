# HeatShield AI — Zero-Network Offline Architecture & Mobile Resilience

## 1. The Emergency Rationale: Why Offline-First?

During catastrophic summer heatwaves (such as the 2024 North Indian heatwave where temperatures reached $49\text{--}52^\circ\text{C}$):
- Power grids suffer rolling blackouts due to extreme peak air-conditioning loads.
- Telecom cellular base stations overheat, suffer backhaul dropouts, or experience cellular tower brownouts.
- Outdoor agricultural workers and gig delivery couriers frequently operate in rural or fringe zones with zero cellular coverage.

**Traditional weather apps fail completely in this environment** because they depend on heavy cloud REST API roundtrips. **HeatShield AI is engineered to be $100\%$ autonomous in air-gapped, zero-network environments.**

---

## 2. Satellite GNSS Geolocation Without Cellular Network

A common misconception in mobile computing is that GPS requires an internet connection:
- **How GNSS Hardware Works**: Modern smartphones and tablets contain hardware receivers for the Global Navigation Satellite System (GNSS) constellations: **GPS (USA)**, **GLONASS (Russia)**, **Galileo (EU)**, and **NavIC (India)**.
- **Direct Orbital Reception**: The device antenna directly receives passive $1.57542\,\text{GHz}$ microwave radio frequency signals broadcast by orbiting satellites ($~20,000\,\text{km}$ altitude). By calculating time-of-flight pseudoranges from $\ge 4$ visible satellites, the device hardware solves for user latitude, longitude, and altitude using trilateration.
- **Zero Cellular Data Required**: This hardware trilateration occurs completely independent of SIM cards, cellular data, or WiFi.
- **Browser Access**: The standard HTML5 Geolocation API (`navigator.geolocation.getCurrentPosition`) interfaces directly with the device GNSS hardware driver:
  ```typescript
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      // Coordinates acquired directly from satellite hardware
    },
    (error) => handleGpsError(error),
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
  );
  ```

---

## 3. Pre-Bundled Synoptic Station Cache (`offlineEngine.ts`)

To eliminate cloud database dependency, the core physical characteristics of all **46 NOAA GSOD synoptic stations** are bundled directly into the compiled client application bundle (`OFFLINE_STATIONS`).

Each station entry contains:
```typescript
interface OfflineStationRecord {
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  temperature_c: number;
  dew_point_c: number;
  relative_humidity_pct: number;
  heat_index_c: number;
  wind_speed_kmh: number;
  cluster_id: number;
  profile_title: string;
}
```

The entire 46-station matrix occupies **less than 12 Kilobytes of memory**, enabling instantaneous client-side access with zero network I/O.

---

## 4. Client-Side Geodesic & Spatial Mathematics

When offline, HeatShield AI executes the entire spatial interpolation pipeline in pure JavaScript on the client device:

### Step 1: Spherical Haversine Geodesic Distance
For all 46 cached stations, geodesic distance is computed on the Earth's sphere ($R = 6371\,\text{km}$):
```typescript
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c; // Distance in kilometers
}
```

### Step 2: Inverse Distance Weighting ($k=4, p=2.0$)
```typescript
// Sort all 46 stations by ascending distance to user GPS
const sortedStations = OFFLINE_STATIONS
  .map(st => ({ ...st, distance_km: haversineDistance(userLat, userLon, st.latitude, st.longitude) }))
  .sort((a, b) => a.distance_km - b.distance_km);

// Isolate top-4 nearest synoptic neighbors
const kNearest = sortedStations.slice(0, 4);

// Compute inverse-square weights (p = 2.0, epsilon = 0.001 km)
let totalWeight = 0;
const weighted = kNearest.map(st => {
  const w = 1 / Math.pow(Math.max(st.distance_km, 0.001), 2.0);
  totalWeight += w;
  return { st, weight: w };
});

// Interpolate atmospheric variables
let interpTemp = 0;
let interpDew = 0;
let interpWind = 0;
for (const item of weighted) {
  const normWeight = item.weight / totalWeight;
  interpTemp += item.st.temperature_c * normWeight;
  interpDew += item.st.dew_point_c * normWeight;
  interpWind += item.st.wind_speed_kmh * normWeight;
}
```

### Step 3: Client-Side Rothfusz Heat Index & HSI Evaluation
The client runtime evaluates the full 16-parameter Rothfusz equation and continuous Heat Stress Index ($0\text{--}100$) in sub-millisecond time, outputting risk tiers, hydration targets, and tailored persona advice.

---

## 5. Service Worker & Progressive Web App (PWA) Caching

HeatShield AI implements a **Cache-First Progressive Web App (PWA)** strategy via `sw.js`:

```
                           Network Request
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │    Service Worker     │
                     └───────────┬───────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [Asset in Cache?]               [Asset NOT in Cache?]
                 │                               │
         YES ────┴──── NO                YES ────┴──── NO
          │            │                  │            │
          ▼            ▼                  ▼            ▼
     Return from    Fetch from       Execute Local    Return Network
     Cache Storage  Network & Store  Offline Engine   Error / Cached UI
```

1. **Pre-caching**: On initial installation, the Service Worker caches all core HTML, CSS, JavaScript bundles, Leaflet tiles, and offline datasets.
2. **Offline Interception**: If `fetch()` encounters a network disconnect, the Service Worker returns the cached application shell.
3. **Persistent LocalStorage**:
   - `heatshield_location`: Stores the most recent verified GNSS coordinates and accuracy.
   - `heatshield_hydration_YYYY-MM-DD`: Stores daily glasses of water logged.
   - `heatshield_active_station`: Stores user manual preferences.

---

## 6. How to Verify Zero-Network Autonomy (Step-by-Step Viva Demo)

Examiners can independently verify the zero-network capability using this 60-second protocol:

1. **Load HeatShield AI** in Google Chrome or mobile Safari.
2. **Open Chrome DevTools** (`F12` $\to$ **Network** tab).
3. Under the throttling dropdown, select **"Offline"** (or enable Airplane Mode on a mobile device).
4. Click **"📍 Use Exact Live Location"**.
5. **Observe**:
   - Satellite GNSS coordinates lock immediately.
   - Multi-station IDW predicts localized Heat Index ($k=4, p=2.0$).
   - The top banner displays: `🟠 OFFLINE MODE: Using local NOAA GSOD 2022–2025 Multi-Station IDW`.
   - **Examine the Network Tab**: Exactly **0 network requests are made**; zero HTTP errors; zero failed roundtrips.
6. Click **"National GPS Graph"**: Full nationwide topological graph renders with spatial interpolation vectors rendered via offline SVG math.
7. Click **"🔬 Scientific Proof (LOSOCV)"**: The LOSOCV grid and latency benchmarks render from the immutable offline cache.
