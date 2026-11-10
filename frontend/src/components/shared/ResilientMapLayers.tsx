import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export type TileProviderId =
  | 'carto_dark'
  | 'carto_voyager'
  | 'esri_street'
  | 'osm_standard';

export type MapBaseMode = 'auto' | 'offline_vector' | TileProviderId;

interface TileProviderConfig {
  id: TileProviderId;
  label: string;
  shortLabel: string;
  url: string;
  subdomains?: string;
  attribution: string;
}

export const TILE_PROVIDERS: TileProviderConfig[] = [
  {
    id: 'carto_dark',
    label: 'Dark Atlas (CARTO)',
    shortLabel: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  },
  {
    id: 'carto_voyager',
    label: 'Street Atlas (CARTO)',
    shortLabel: 'Streets',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  },
  {
    id: 'esri_street',
    label: 'World Street (Esri)',
    shortLabel: 'Esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, TomTom, Garmin, OpenStreetMap'
  },
  {
    id: 'osm_standard',
    label: 'OpenStreetMap',
    shortLabel: 'OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: '&copy; OpenStreetMap contributors'
  }
];

type CoordPair = [number, number]; // [lon, lat]

const INDIA_OUTLINE: CoordPair[] = [
  [68.18, 23.72], [68.96, 22.24], [70.40, 20.75], [72.20, 21.65], [72.83, 21.17],
  [72.83, 18.95], [73.32, 16.99], [73.82, 15.49], [74.84, 12.87], [75.80, 11.25],
  [76.26, 9.93],  [77.54, 8.08],  [78.14, 8.76],  [79.31, 9.29],  [79.88, 10.76],
  [79.83, 11.93], [80.28, 13.08], [80.12, 14.45], [81.14, 16.18], [82.25, 16.95],
  [83.30, 17.71], [84.90, 19.25], [85.83, 19.80], [86.67, 20.32], [87.52, 21.62],
  [88.35, 21.68], [89.05, 22.05], [88.90, 23.40], [88.20, 24.95], [89.80, 26.05],
  [90.30, 25.15], [92.10, 25.05], [91.27, 23.83], [92.72, 21.95], [93.35, 23.80],
  [94.75, 25.10], [95.30, 27.15], [97.35, 28.15], [96.10, 29.25], [92.10, 27.85],
  [91.60, 26.85], [89.85, 26.80], [88.75, 27.10], [88.62, 27.95], [88.10, 27.20],
  [87.30, 26.45], [84.90, 27.35], [81.15, 28.45], [80.10, 29.10], [79.00, 31.10],
  [78.60, 32.55], [79.55, 34.45], [77.60, 35.60], [75.80, 36.75], [73.95, 36.15],
  [74.35, 34.55], [73.85, 33.15], [74.60, 32.65], [74.55, 31.60], [73.85, 30.10],
  [72.90, 29.10], [70.55, 27.95], [69.50, 26.85], [71.05, 24.75], [68.85, 24.15],
  [68.18, 23.72]
];

const SRI_LANKA_OUTLINE: CoordPair[] = [
  [79.75, 9.75], [81.15, 8.65], [81.85, 7.40], [81.20, 6.15],
  [80.25, 5.95], [79.78, 7.15], [79.88, 8.85], [79.75, 9.75]
];

const ANDAMAN_NICOBAR_LINE: CoordPair[] = [
  [92.95, 13.55], [92.75, 11.65], [92.55, 10.65], [93.75, 7.15]
];

const WORLD_LAND_POLYGONS: CoordPair[][] = [
  // Asia / Europe coarse landmass envelope
  [
    [-9.5, 38.7], [-8.0, 43.4], [-1.8, 43.4], [-4.5, 48.4], [2.2, 51.0],
    [8.5, 54.0], [10.5, 57.7], [5.3, 60.4], [18.9, 69.7], [30.0, 70.0],
    [45.0, 67.0], [68.0, 69.5], [105.0, 73.5], [140.0, 71.0], [170.0, 66.0],
    [162.0, 56.0], [142.0, 53.0], [135.0, 44.0], [129.0, 35.1], [121.5, 31.2],
    [114.2, 22.3], [108.5, 21.5], [109.2, 12.2], [103.8, 1.3], [100.3, 5.4],
    [98.6, 10.0], [96.2, 16.5], [94.3, 16.0], [92.2, 21.1], [89.1, 21.8],
    [88.0, 21.6], [85.8, 19.8], [80.3, 13.1], [77.5, 8.1], [76.2, 10.0],
    [72.8, 19.0], [68.9, 22.3], [67.0, 24.8], [61.5, 25.2], [56.3, 26.9],
    [51.5, 25.3], [59.8, 22.5], [54.0, 17.0], [45.0, 12.8], [43.4, 12.6],
    [39.2, 21.5], [34.9, 29.5], [32.6, 31.2], [35.5, 33.9], [27.1, 38.4],
    [23.7, 37.9], [16.0, 38.0], [12.4, 41.9], [5.4, 43.3], [-5.3, 36.1],
    [-9.5, 38.7]
  ],
  // Africa
  [
    [-17.5, 14.7], [-13.5, 27.5], [-5.8, 35.8], [10.2, 36.8], [32.3, 31.2],
    [43.4, 12.6], [51.3, 11.9], [45.3, 2.0], [40.5, -10.5], [35.5, -23.8],
    [28.0, -33.0], [18.4, -34.4], [14.5, -22.9], [12.2, -6.0], [9.4, 3.9],
    [3.4, 6.4], [-7.8, 4.4], [-17.5, 14.7]
  ],
  // Australia
  [
    [113.5, -22.0], [122.2, -18.0], [131.0, -12.3], [142.5, -10.7], [153.6, -28.2],
    [149.9, -37.5], [138.6, -35.0], [121.9, -33.9], [115.1, -34.3], [113.5, -22.0]
  ],
  // North America
  [
    [-168.0, 65.5], [-140.0, 69.5], [-95.0, 70.0], [-64.0, 62.0], [-55.6, 51.5],
    [-67.0, 45.0], [-74.0, 40.7], [-80.2, 25.8], [-90.0, 29.0], [-97.2, 26.0],
    [-87.0, 21.5], [-79.5, 8.9], [-92.0, 14.5], [-105.5, 20.5], [-117.1, 32.5],
    [-124.5, 48.4], [-150.0, 60.5], [-168.0, 65.5]
  ],
  // South America
  [
    [-79.5, 9.0], [-71.5, 12.0], [-61.0, 10.5], [-50.0, 1.5], [-35.0, -5.8],
    [-38.5, -13.0], [-43.2, -23.0], [-53.5, -33.7], [-67.5, -54.8], [-74.5, -52.0],
    [-71.6, -33.0], [-77.0, -12.0], [-81.0, -4.5], [-79.5, 9.0]
  ]
];

const REGIONAL_LABELS: Array<{ name: string; lon: number; lat: number; minZoom: number }> = [
  { name: 'INDIA', lon: 78.6, lat: 22.8, minZoom: 3 },
  { name: 'New Delhi', lon: 77.21, lat: 28.61, minZoom: 5 },
  { name: 'Mumbai', lon: 72.88, lat: 19.08, minZoom: 5 },
  { name: 'Kolkata', lon: 88.36, lat: 22.57, minZoom: 5 },
  { name: 'Chennai', lon: 80.27, lat: 13.08, minZoom: 5 },
  { name: 'Bengaluru', lon: 77.59, lat: 12.97, minZoom: 5 },
  { name: 'Hyderabad', lon: 78.48, lat: 17.38, minZoom: 5 },
  { name: 'Ahmedabad', lon: 72.57, lat: 23.02, minZoom: 5 },
  { name: 'Patna', lon: 85.14, lat: 25.59, minZoom: 5 },
  { name: 'Jaipur', lon: 75.79, lat: 26.91, minZoom: 5 },
  { name: 'Nagpur', lon: 79.09, lat: 21.15, minZoom: 6 },
  { name: 'Lucknow', lon: 80.95, lat: 26.85, minZoom: 6 },
  { name: 'Bhopal', lon: 77.41, lat: 23.26, minZoom: 6 },
  { name: 'Bhubaneswar', lon: 85.82, lat: 20.29, minZoom: 6 },
  { name: 'Guwahati', lon: 91.74, lat: 26.14, minZoom: 6 },
  { name: 'Sri Lanka', lon: 80.7, lat: 7.8, minZoom: 4 }
];

function lonToTileX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function latToTileY(lat: number, zoom: number): number {
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const rad = (clamped * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom);
}

function tileXToLon(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

function tileYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function getGridStepDeg(zoom: number): number {
  if (zoom <= 3) return 15;
  if (zoom <= 5) return 5;
  if (zoom <= 7) return 2;
  if (zoom <= 9) return 1;
  if (zoom <= 11) return 0.25;
  return 0.05;
}

class OfflineVectorGridLayer extends L.GridLayer {
  private showDetailedLabels: boolean;

  constructor(options?: L.GridLayerOptions & { showDetailedLabels?: boolean }) {
    super(options);
    this.showDetailedLabels = Boolean(options?.showDetailedLabels);
  }

  setShowDetailedLabels(show: boolean) {
    if (this.showDetailedLabels !== show) {
      this.showDetailedLabels = show;
      this.redraw();
    }
  }

  override createTile(coords: L.Coords): HTMLElement {
    const tile = document.createElement('canvas');
    const size = this.getTileSize();
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    tile.width = size.x * dpr;
    tile.height = size.y * dpr;
    tile.style.width = `${size.x}px`;
    tile.style.height = `${size.y}px`;

    const ctx = tile.getContext('2d');
    if (!ctx) return tile;
    ctx.scale(dpr, dpr);

    const z = coords.z;
    const tx = coords.x;
    const ty = coords.y;

    const toPx = (lon: number, lat: number): [number, number] => [
      (lonToTileX(lon, z) - tx) * size.x,
      (latToTileY(lat, z) - ty) * size.y
    ];

    // 1. Ocean / Void backdrop
    ctx.fillStyle = '#070E21';
    ctx.fillRect(0, 0, size.x, size.y);

    // 2. Surrounding landmass silhouettes
    const drawPolygon = (ring: CoordPair[], fillStyle: string, strokeStyle: string, lineWidth: number) => {
      if (ring.length < 3) return;
      ctx.beginPath();
      for (let i = 0; i < ring.length; i++) {
        const [px, py] = toPx(ring[i][0], ring[i][1]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    for (const poly of WORLD_LAND_POLYGONS) {
      drawPolygon(poly, '#0D1936', '#1F3A70', 1);
    }

    // 3. Detailed India, Sri Lanka & Island Arc contours
    drawPolygon(INDIA_OUTLINE, '#12244D', '#38BDF8', 1.4);
    drawPolygon(SRI_LANKA_OUTLINE, '#12244D', '#38BDF8', 1.1);

    ctx.beginPath();
    ANDAMAN_NICOBAR_LINE.forEach(([lon, lat], idx) => {
      const [px, py] = toPx(lon, lat);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Adaptive Graticule (lat/lon lines)
    const minLon = tileXToLon(tx, z);
    const maxLon = tileXToLon(tx + 1, z);
    const maxLat = tileYToLat(ty, z);
    const minLat = tileYToLat(ty + 1, z);
    const step = getGridStepDeg(z);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 0.8;
    ctx.font = '600 9px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';

    const firstLon = Math.ceil(minLon / step) * step;
    for (let lon = firstLon; lon <= maxLon + step * 0.01; lon += step) {
      const [px] = toPx(lon, (minLat + maxLat) / 2);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, size.y);
      ctx.stroke();
      if (px > 4 && px < size.x - 28) {
        const label = `${Math.abs(lon).toFixed(step < 1 ? 2 : 0)}°${lon >= 0 ? 'E' : 'W'}`;
        ctx.fillText(label, px + 3, 11);
      }
    }

    const firstLat = Math.ceil(minLat / step) * step;
    for (let lat = firstLat; lat <= maxLat + step * 0.01; lat += step) {
      const [, py] = toPx((minLon + maxLon) / 2, lat);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(size.x, py);
      ctx.stroke();
      if (py > 12 && py < size.y - 6) {
        const label = `${Math.abs(lat).toFixed(step < 1 ? 2 : 0)}°${lat >= 0 ? 'N' : 'S'}`;
        ctx.fillText(label, 4, py - 3);
      }
    }

    // 5. Regional & City reference labels (crisp in offline mode or pre-tile paint)
    if (this.showDetailedLabels) {
      ctx.textBaseline = 'middle';
      for (const loc of REGIONAL_LABELS) {
        if (z < loc.minZoom) continue;
        const [px, py] = toPx(loc.lon, loc.lat);
        if (px < -60 || px > size.x + 60 || py < -20 || py > size.y + 20) continue;
        const isCountry = loc.name === 'INDIA';
        ctx.font = isCountry
          ? '800 12px system-ui, -apple-system, sans-serif'
          : '600 10px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isCountry ? 'rgba(56, 189, 248, 0.7)' : 'rgba(226, 232, 240, 0.78)';
        ctx.fillText(loc.name, px + 4, py - 4);
      }
    }

    return tile;
  }
}

/**
 * Keeps Leaflet map size synchronized across flex/tab switches, screen rotations,
 * Android keyboard transitions, and fullscreen toggles.
 */
export function MapResizeObserver() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => {
      try {
        map.invalidateSize({ animate: false });
      } catch {
        // Ignore calls while map unmounts
      }
    };

    invalidate();
    const t1 = window.setTimeout(invalidate, 100);
    const t2 = window.setTimeout(invalidate, 350);
    const t3 = window.setTimeout(invalidate, 850);

    const container = map.getContainer();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      observer = new ResizeObserver(() => {
        invalidate();
      });
      observer.observe(container);
    }

    window.addEventListener('resize', invalidate);
    window.addEventListener('orientationchange', invalidate);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      observer?.disconnect();
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('orientationchange', invalidate);
    };
  }, [map]);

  return null;
}

interface ResilientMapLayersProps {
  compact?: boolean;
  defaultProvider?: TileProviderId;
}

export const ResilientMapLayers: React.FC<ResilientMapLayersProps> = ({
  compact = false,
  defaultProvider = 'carto_dark'
}) => {
  const map = useMap();
  const initialIndex = useMemo(() => {
    const idx = TILE_PROVIDERS.findIndex((p) => p.id === defaultProvider);
    return idx >= 0 ? idx : 0;
  }, [defaultProvider]);

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [selectedMode, setSelectedMode] = useState<MapBaseMode>('auto');
  const [autoProviderIdx, setAutoProviderIdx] = useState<number>(initialIndex);
  const [allTilesFailed, setAllTilesFailed] = useState<boolean>(false);

  const errorStreakRef = useRef<number>(0);
  const loadedCountRef = useRef<number>(0);
  const vectorLayerRef = useRef<OfflineVectorGridLayer | null>(null);

  const activeProvider: TileProviderConfig | null = useMemo(() => {
    if (selectedMode === 'offline_vector') return null;
    if (!isOnline) return null;
    if (selectedMode !== 'auto') {
      return TILE_PROVIDERS.find((p) => p.id === selectedMode) || TILE_PROVIDERS[0];
    }
    if (allTilesFailed) return null;
    return TILE_PROVIDERS[autoProviderIdx] || TILE_PROVIDERS[0];
  }, [selectedMode, isOnline, allTilesFailed, autoProviderIdx]);

  const isOfflineVectorActive = activeProvider === null;

  // Always mount the offline canvas vector layer inside Leaflet's tilePane at zIndex=1
  useEffect(() => {
    const layer = new OfflineVectorGridLayer({
      zIndex: 1,
      minZoom: 1,
      maxZoom: 18,
      showDetailedLabels: true
    });
    layer.addTo(map);
    vectorLayerRef.current = layer;

    return () => {
      layer.remove();
      vectorLayerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    vectorLayerRef.current?.setShowDetailedLabels(isOfflineVectorActive);
  }, [isOfflineVectorActive]);

  // Listen to browser/Android connectivity recovery
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      errorStreakRef.current = 0;
      loadedCountRef.current = 0;
      setAllTilesFailed(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTileLoad = () => {
    errorStreakRef.current = 0;
    loadedCountRef.current += 1;
  };

  const handleTileError = () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return;
    }

    errorStreakRef.current += 1;
    // Rotate only on sustained errors (avoids transient 1-tile ocean 404 switching providers)
    const threshold = loadedCountRef.current === 0 ? 4 : 8;
    if (errorStreakRef.current < threshold) return;

    errorStreakRef.current = 0;
    loadedCountRef.current = 0;

    if (selectedMode !== 'auto') {
      // User manually chose a specific tile provider that is blocked right now; fall back safely
      setAllTilesFailed(true);
      setSelectedMode('auto');
      return;
    }

    setAutoProviderIdx((prev) => {
      const next = prev + 1;
      if (next < TILE_PROVIDERS.length) {
        return next;
      }
      setAllTilesFailed(true);
      return 0;
    });
  };

  const handleRetryLive = () => {
    errorStreakRef.current = 0;
    loadedCountRef.current = 0;
    setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    setAllTilesFailed(false);
    setAutoProviderIdx(0);
    setSelectedMode('auto');
  };

  const handleCycleStyle = () => {
    errorStreakRef.current = 0;
    loadedCountRef.current = 0;
    setAllTilesFailed(false);
    if (selectedMode === 'auto' || selectedMode === 'carto_dark') {
      setSelectedMode('carto_voyager');
    } else if (selectedMode === 'carto_voyager') {
      setSelectedMode('esri_street');
    } else if (selectedMode === 'esri_street') {
      setSelectedMode('offline_vector');
    } else {
      setAutoProviderIdx(0);
      setSelectedMode('auto');
    }
  };

  return (
    <>
      {activeProvider && (
        <TileLayer
          key={activeProvider.id}
          attribution={activeProvider.attribution}
          url={activeProvider.url}
          subdomains={activeProvider.subdomains || 'abc'}
          maxZoom={18}
          zIndex={5}
          eventHandlers={{
            tileload: handleTileLoad,
            tileerror: handleTileError
          }}
        />
      )}

      {/* Map Tile Status & Style Switcher HUD */}
      <div
        className="absolute top-2.5 right-2.5 z-[1000] pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center gap-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 shadow-lg text-slate-200 ${
            compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-[11px]'
          }`}
        >
          {activeProvider ? (
            <span className="flex items-center gap-1 font-bold text-emerald-300">
              <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{compact ? activeProvider.shortLabel : `Live • ${activeProvider.shortLabel}`}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 font-bold text-amber-300">
              <WifiOff className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{compact ? 'Offline Map' : 'Offline Vector Map'}</span>
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCycleStyle();
            }}
            title="Switch map layer style (Dark / Streets / Esri / Offline Vector)"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition border border-slate-700/80 cursor-pointer"
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Style</span>
          </button>

          {isOfflineVectorActive && isOnline && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRetryLive();
              }}
              title="Retry live map tiles"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
