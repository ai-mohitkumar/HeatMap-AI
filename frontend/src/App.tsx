import { useState, useEffect, useMemo } from 'react';
import { api } from './services/api';
import type {
  DatasetSummary,
  ClusterEvaluation,
  OptimalKRecommendation,
  ClusterProfile,
  HierarchicalComparison,
  PCAAnalysis,
  UMAPAnalysis,
  StationGeoRecord,
  FeatureSeparation,
  AnnualShift,
  AIInsights,
  DataQualityMetrics,
  CoverageMetrics,
  ClusterStabilityResult,
  RadarCentroidsResponse,
  LanguageCode,
  LiveWeatherResponse,
  HourlyForecastResponse,
  DataProvenanceType,
  LocationSourceType,
  ReverseGeocodeSource
} from './types';
import { HeatEmergencyModal } from './components/HeatEmergencyModal';
import { MobileLocationModal } from './components/mobile/MobileLocationModal';
import { OFFLINE_STATIONS } from './utils/offlineEngine';
import { OFFLINE_RESEARCH_DATA } from './utils/offlineResearchData';
import { evaluateLocationHeat } from './utils/indiaGeoStore';
import {
  acquireBestLocation,
  createManualLocationResult,
  loadManualLocation,
  saveManualLocation,
  clearManualLocation,
  type GeolocationResult
} from './utils/geolocationService';
import { notificationService } from './utils/notificationService';
import { useResponsiveMode } from './hooks/useResponsiveMode';
import { ToastBanner } from './components/shared/ToastBanner';
import { ExportReportModal, type ExportFormat } from './components/shared/ExportReportModal';
import { BrightnessModal } from './components/shared/BrightnessModal';
import { useBrightness } from './utils/useBrightness';
import { MobileLayout } from './components/mobile/MobileLayout';
import type { StationInfluenceItem } from './components/mobile/MobileIDWCard';
import { Header } from './components/Header';
import { Sidebar, type SidebarTab } from './components/Sidebar';
import { HeatShieldHub } from './components/HeatShieldHub';
import { MetricCards } from './components/MetricCards';
import { PriorityMap } from './components/PriorityMap';
import { ModelEvaluation } from './components/ModelEvaluation';
import { PCAVisualizer } from './components/PCAVisualizer';
import { HierarchicalComparisonView } from './components/HierarchicalComparisonView';
import { VulnerabilityProfilesView } from './components/VulnerabilityProfilesView';
import { TemporalAnalysisView } from './components/TemporalAnalysisView';
import { AIInsightsView } from './components/AIInsightsView';
import { StationTable } from './components/StationTable';
import { MethodologyPanel } from './components/MethodologyPanel';
import { DataQualityCard } from './components/DataQualityCard';
import { ClusterRadarChart } from './components/ClusterRadarChart';
import { ScientificLimitationsCard } from './components/ScientificLimitationsCard';
import { AIAnalystModal } from './components/AIAnalystModal';
import { PublicSafetyView } from './components/PublicSafetyView';
import { AllStationsLiveView } from './components/AllStationsLiveView';
import { ClimateIntelligenceLab } from './components/ClimateIntelligenceLab';
import { VillageDistrictExplorer } from './components/VillageDistrictExplorer';
import { DeviceShowcaseView } from './components/DeviceShowcaseView';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  AlertCircle,
  Flame,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

const INITIAL_MAP_STATIONS: StationGeoRecord[] = OFFLINE_STATIONS.map((s) => ({
  station_id: s.station_id,
  name: s.station_name,
  latitude: s.latitude,
  longitude: s.longitude,
  elevation_m: 200,
  mean_temp_c: s.temperature_c,
  peak_max_temp_c: s.max_temperature_c,
  peak_heat_index_c: s.heat_index_c,
  dew_point_c: s.dew_point_c,
  relative_humidity_pct: s.relative_humidity_pct,
  dtr_c: 12.5,
  wind_speed_kmh: 14.0,
  heat_stress_index: s.heat_stress_index,
  cluster_id: s.cluster_id,
  profile_code: s.profile_code,
  vulnerability_tier: s.vulnerability_tier,
  priority_level: s.tier_badge,
  color_code: s.color
}));

export function App() {
  const [summary, setSummary] = useState<DatasetSummary | null>(OFFLINE_RESEARCH_DATA.summary as unknown as DatasetSummary);
  const [evaluations, setEvaluations] = useState<ClusterEvaluation[]>(OFFLINE_RESEARCH_DATA.evaluations as unknown as ClusterEvaluation[]);
  const [optimalKData, setOptimalKData] = useState<OptimalKRecommendation | null>(OFFLINE_RESEARCH_DATA.optimal_k as unknown as OptimalKRecommendation);
  const [activeK, setActiveK] = useState<number>(4);
  const [profiles, setProfiles] = useState<ClusterProfile[]>(OFFLINE_RESEARCH_DATA.profiles as unknown as ClusterProfile[]);
  const [hierarchicalComparison, setHierarchicalComparison] = useState<HierarchicalComparison | null>(OFFLINE_RESEARCH_DATA.hierarchical as unknown as HierarchicalComparison);
  const [pcaData, setPcaData] = useState<PCAAnalysis | null>(OFFLINE_RESEARCH_DATA.pca as unknown as PCAAnalysis);
  const [umapData, setUmapData] = useState<UMAPAnalysis | null>(OFFLINE_RESEARCH_DATA.umap as unknown as UMAPAnalysis);
  const [mapStations, setMapStations] = useState<StationGeoRecord[]>(INITIAL_MAP_STATIONS);
  const [featureSeparation, setFeatureSeparation] = useState<FeatureSeparation[]>(OFFLINE_RESEARCH_DATA.feature_separation as unknown as FeatureSeparation[]);
  const [annualShifts, setAnnualShifts] = useState<AnnualShift[]>(OFFLINE_RESEARCH_DATA.annual_shifts as unknown as AnnualShift[]);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(OFFLINE_RESEARCH_DATA.ai_insights as unknown as AIInsights);
  const [previewData, setPreviewData] = useState<any[]>(() =>
    OFFLINE_STATIONS.slice(0, 50).map((s) => ({
      STATION: s.station_id,
      NAME: s.full_name,
      LATITUDE: s.latitude,
      LONGITUDE: s.longitude,
      DATE: "2024-05-15",
      mean_temp_c: s.temperature_c,
      max_temp_c: s.max_temperature_c,
      min_temp_c: s.temperature_c - 8.5,
      temperature_range: 12.5,
      dew_point_c: s.dew_point_c,
      relative_humidity: s.relative_humidity_pct,
      heat_index_c: s.heat_index_c,
      wind_speed_kmh: 14.0,
      pressure_hpa: 1008.0,
      cluster: s.cluster_id
    }))
  );

  // Research Grade additions
  const [dataQuality, setDataQuality] = useState<DataQualityMetrics | null>(OFFLINE_RESEARCH_DATA.data_quality as unknown as DataQualityMetrics);
  const [coverage, setCoverage] = useState<CoverageMetrics | null>(OFFLINE_RESEARCH_DATA.coverage as unknown as CoverageMetrics);
  const [stability, setStability] = useState<ClusterStabilityResult | null>(OFFLINE_RESEARCH_DATA.stability as unknown as ClusterStabilityResult);
  const [radarCentroids, setRadarCentroids] = useState<RadarCentroidsResponse | null>(OFFLINE_RESEARCH_DATA.radar_centroids as unknown as RadarCentroidsResponse);
  const [researchViewTab, setResearchViewTab] = useState<'methodology' | 'lab'>('methodology');

  // App Mode & Modal State
  const [appMode, setAppMode] = useState<'safety' | 'dashboard' | 'research' | 'lab'>('safety');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('home');
  const [selectedSafetyStationId, setSelectedSafetyStationId] = useState<string>('42182099999');
  const [initialManualLoc] = useState<GeolocationResult | null>(() => loadManualLocation());
  const [locationState, setLocationState] = useState<GeolocationResult | null>(initialManualLoc);
  const [locationAcquiring, setLocationAcquiring] = useState<boolean>(!initialManualLoc);
  const [isDesktopLocationModalOpen, setIsDesktopLocationModalOpen] = useState<boolean>(false);
  const [explorerSelection, setExplorerSelection] = useState<{ stateCode?: string; districtName?: string; villageName?: string } | null>(null);
  const [isAnalystOpen, setIsAnalystOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Global Language i18n State (persisted in localStorage)
  const [lang, setLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('heatshield_lang');
    return (saved === 'hi' || saved === 'pa' || saved === 'en') ? (saved as LanguageCode) : 'en';
  });

  const handleSelectLang = (newLang: LanguageCode) => {
    setLang(newLang);
    localStorage.setItem('heatshield_lang', newLang);
  };

  // Automated Heat Emergency Modal State (Tier 4 / Tier 5 trigger or manual SOS)
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isBrightnessModalOpen, setIsBrightnessModalOpen] = useState<boolean>(false);
  useBrightness();

  const handleTriggerEmergency = () => {
    setIsEmergencyModalOpen(true);
  };

  // Capture native browser PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleTriggerPwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleSidebarSelect = (tab: SidebarTab) => {
    setSidebarTab(tab);
    if (tab === 'research') {
      setAppMode('research');
    } else if (tab === 'insights') {
      setAppMode('dashboard');
    } else if (tab === 'reports') {
      setAppMode('dashboard');
    } else {
      setAppMode('safety');
    }
  };

  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    'map' | 'profiles' | 'radar' | 'temporal' | 'insights' | 'data'
  >('map');
  const [loading, setLoading] = useState<boolean>(false);
  const [isUpdatingK, setIsUpdatingK] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);

      const results = await Promise.allSettled([
        api.getDatasetSummary(),
        api.getEvaluations(),
        api.getOptimalK(),
        api.getProfiles(),
        api.getHierarchicalComparison(),
        api.getPCAAnalysis(),
        api.getUMAPAnalysis(),
        api.getMapStations(500),
        api.getFeatureSeparation(),
        api.getAnnualShifts(),
        api.getAIInsights(),
        api.getDatasetPreview(100),
        api.getDataQuality(),
        api.getCoverageMetrics(),
        api.getClusterStability(4),
        api.getRadarCentroids(4)
      ]);

      const [
        sumRes,
        evalRes,
        optRes,
        profRes,
        hierRes,
        pcaRes,
        umapRes,
        mapRes,
        featRes,
        shiftRes,
        insightRes,
        prevRes,
        qualityRes,
        coverageRes,
        stabilityRes,
        radarRes
      ] = results;

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (evalRes.status === 'fulfilled') setEvaluations(evalRes.value);
      if (optRes.status === 'fulfilled') {
        setOptimalKData(optRes.value);
        setActiveK(optRes.value.optimal_k);
      }
      if (profRes.status === 'fulfilled') setProfiles(profRes.value);
      if (hierRes.status === 'fulfilled') setHierarchicalComparison(hierRes.value);
      if (pcaRes.status === 'fulfilled') setPcaData(pcaRes.value);
      if (umapRes.status === 'fulfilled') setUmapData(umapRes.value);
      if (mapRes.status === 'fulfilled') setMapStations(mapRes.value);
      if (featRes.status === 'fulfilled') setFeatureSeparation(featRes.value);
      if (shiftRes.status === 'fulfilled') setAnnualShifts(shiftRes.value);
      if (insightRes.status === 'fulfilled') setAiInsights(insightRes.value);
      if (prevRes.status === 'fulfilled') setPreviewData(prevRes.value);
      if (qualityRes.status === 'fulfilled') setDataQuality(qualityRes.value);
      if (coverageRes.status === 'fulfilled') setCoverage(coverageRes.value);
      if (stabilityRes.status === 'fulfilled') setStability(stabilityRes.value);
      if (radarRes.status === 'fulfilled') setRadarCentroids(radarRes.value);
    } catch (err: any) {
      console.warn('Backend background synchronization completed with offline dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectK = async (k: number) => {
    if (k === activeK || isUpdatingK) return;
    try {
      setIsUpdatingK(true);
      const res = await api.setActiveK(k);
      setActiveK(res.active_k);
      setProfiles(res.profiles);
      setHierarchicalComparison(res.hierarchical_comparison);

      const [updatedMap, updatedPCA, updatedUMAP, updatedSummary, updatedInsights, updatedStability, updatedRadar] = await Promise.allSettled([
        api.getMapStations(500),
        api.getPCAAnalysis(),
        api.getUMAPAnalysis(),
        api.getDatasetSummary(),
        api.getAIInsights(),
        api.getClusterStability(k),
        api.getRadarCentroids(k)
      ]);
      if (updatedMap.status === 'fulfilled') setMapStations(updatedMap.value);
      if (updatedPCA.status === 'fulfilled') setPcaData(updatedPCA.value);
      if (updatedUMAP.status === 'fulfilled') setUmapData(updatedUMAP.value);
      if (updatedSummary.status === 'fulfilled') setSummary(updatedSummary.value);
      if (updatedInsights.status === 'fulfilled') setAiInsights(updatedInsights.value);
      if (updatedStability.status === 'fulfilled') setStability(updatedStability.value);
      if (updatedRadar.status === 'fulfilled') setRadarCentroids(updatedRadar.value);
    } catch (err: any) {
      console.warn('Set K handled with fallback model:', err);
    } finally {
      setIsUpdatingK(false);
    }
  };

  const handleSelectYear = async (year: number | null) => {
    try {
      setIsUpdatingK(true);
      setActiveYear(year);
      await api.setYearFilter(year);

      const [updatedSummary, updatedProfiles, updatedMap] = await Promise.allSettled([
        api.getDatasetSummary(),
        api.getProfiles(),
        api.getMapStations(500)
      ]);
      if (updatedSummary.status === 'fulfilled') setSummary(updatedSummary.value);
      if (updatedProfiles.status === 'fulfilled') setProfiles(updatedProfiles.value);
      if (updatedMap.status === 'fulfilled') setMapStations(updatedMap.value);
    } catch (err: any) {
      console.warn('Set year filter handled with fallback:', err);
    } finally {
      setIsUpdatingK(false);
    }
  };

  const handleOpenExportModal = () => {
    setIsExportModalOpen(true);
  };

  const handleConfirmExport = async (format: ExportFormat) => {
    if (format === 'md' || format === 'bundle') {
      const mdText = await api.getMarkdownReport();
      const blob = new Blob([mdText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HeatShield_AI_Executive_Report_K${activeK}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    if (format === 'csv' || format === 'bundle') {
      const csvContent =
        "Station_ID,Name,Latitude,Longitude,Temp_C,Heat_Index_C,Humidity_Pct,Risk_Tier\n" +
        OFFLINE_STATIONS.map(
          (s) =>
            `${s.station_id},"${s.station_name}",${s.latitude},${s.longitude},${s.temperature_c},${s.heat_index_c},${s.relative_humidity_pct},${s.vulnerability_tier}`
        ).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "HeatShield_46_Synoptic_Stations.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const { isMobile, displayMode, setDisplayMode } = useResponsiveMode(768);

  // Unified verified location state (never falls back silently to a hardcoded city)
  const hasVerifiedLocation = Boolean(
    locationState &&
      locationState.status === 'resolved' &&
      locationState.latitude != null &&
      locationState.longitude != null &&
      Number.isFinite(locationState.latitude) &&
      Number.isFinite(locationState.longitude)
  );
  const currentLat: number | null = hasVerifiedLocation ? locationState!.latitude! : null;
  const currentLon: number | null = hasVerifiedLocation ? locationState!.longitude! : null;
  const locationUnavailable = !locationAcquiring && !hasVerifiedLocation;
  const locationName = hasVerifiedLocation
    ? locationState!.displayName
    : locationAcquiring
    ? 'Acquiring location...'
    : 'Location Unavailable';
  const gpsAccuracy: number | null = hasVerifiedLocation ? locationState!.accuracyM : null;
  const locationSource: LocationSourceType = hasVerifiedLocation ? locationState!.source : 'unavailable';
  const reverseSource: ReverseGeocodeSource = hasVerifiedLocation
    ? locationState!.reverseSource
    : 'unavailable';
  const locationErrorReason: string | null =
    locationState && locationState.status === 'unavailable' ? locationState.errorReason ?? null : null;

  const customLocation = useMemo(() => {
    if (!hasVerifiedLocation || currentLat == null || currentLon == null) return null;
    return {
      name: locationState!.placeName || locationState!.displayName,
      lat: currentLat,
      lon: currentLon,
      district: locationState!.districtName,
      state: locationState!.stateName
    };
  }, [hasVerifiedLocation, currentLat, currentLon, locationState]);

  // Continuous IDW offline baseline (for contributing stations & fallback when live API is offline)
  const localHeat = useMemo(() => {
    if (currentLat == null || currentLon == null) return null;
    try {
      return evaluateLocationHeat(currentLat, currentLon);
    } catch {
      return null;
    }
  }, [currentLat, currentLon]);

  // Live Weather Observation + Hourly Forecast synced to verified coordinates
  const [liveWeather, setLiveWeather] = useState<LiveWeatherResponse | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastResponse | null>(null);

  useEffect(() => {
    if (currentLat == null || currentLon == null) {
      setLiveWeather(null);
      setHourlyForecast(null);
      return;
    }
    let cancelled = false;
    const nearestStationId = localHeat?.data_source?.stations_used?.[0]?.station_id;
    Promise.all([
      api.getLiveWeather(currentLat, currentLon),
      api.getHourlyForecast(currentLat, currentLon, nearestStationId)
    ])
      .then(([wx, fc]) => {
        if (cancelled) return;
        setLiveWeather(wx);
        setHourlyForecast(fc);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[Weather] Failed to refresh live weather/forecast:', err);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentLat, currentLon, localHeat]);

  useEffect(() => {
    const nearestStationId = localHeat?.data_source?.stations_used?.[0]?.station_id;
    if (nearestStationId) {
      setSelectedSafetyStationId(nearestStationId);
    }
  }, [localHeat]);

  const tempC = hasVerifiedLocation
    ? Math.round((liveWeather?.temperature_c ?? localHeat?.weather?.temperature ?? 0) * 10) / 10
    : 0;
  const feelsLikeC = hasVerifiedLocation
    ? Math.round((liveWeather?.heat_index_c ?? localHeat?.weather?.feels_like ?? 0) * 10) / 10
    : 0;
  const humidity = hasVerifiedLocation
    ? Math.round(liveWeather?.relative_humidity_pct ?? localHeat?.weather?.humidity ?? 0)
    : 0;
  const windKmh = hasVerifiedLocation
    ? Math.round(liveWeather?.wind_speed_kmh ?? localHeat?.weather?.wind_speed ?? 0)
    : 0;
  const riskLevel = hasVerifiedLocation
    ? liveWeather?.risk_tier ?? localHeat?.prediction?.risk_level ?? 'Moderate'
    : 'Unavailable';
  const weatherProvenance: DataProvenanceType = liveWeather?.is_live
    ? 'live_observation'
    : 'offline_estimate';
  const weatherProvider = liveWeather?.provider ?? 'NOAA GSOD IDW Baseline';
  const observedAt = liveWeather?.is_live ? liveWeather.observed_at ?? null : null;
  const weatherFallbackReason = liveWeather?.fallback_reason ?? null;

  // Automated background heat risk notification check (only with verified location)
  useEffect(() => {
    if (hasVerifiedLocation && (liveWeather || localHeat)) {
      notificationService.checkAndNotifyHeatRisk(
        locationName,
        tempC,
        feelsLikeC,
        riskLevel
      );

      // Tier 4/5 Automated Push Notification trigger
      if (feelsLikeC >= 45 && !sessionStorage.getItem('heat_emergency_notified')) {
        sessionStorage.setItem('heat_emergency_notified', 'true');
        notificationService.sendNotification(
          '🚨 HEAT EMERGENCY ALERT (Tier 4/5)',
          {
            body: `Heat Index in ${locationName} reached ${feelsLikeC.toFixed(1)}°C. High risk of heat stroke. Seek shelter immediately.`,
            tag: 'heat-emergency'
          }
        );
      }
    }
  }, [hasVerifiedLocation, locationName, tempC, feelsLikeC, riskLevel, liveWeather, localHeat]);

  // Contributing NOAA GSOD baseline stations (IDW)
  const contributingStations: StationInfluenceItem[] = useMemo(() => {
    if (localHeat?.data_source?.stations_used && localHeat.data_source.stations_used.length > 0) {
      return localHeat.data_source.stations_used.map((st) => {
        const fullSt = OFFLINE_STATIONS.find((s) => s.station_id === st.station_id);
        return {
          stationId: st.station_id,
          name: st.name,
          code: st.station_id.slice(-5),
          distanceKm: Math.round(st.distance_km * 10) / 10,
          tempC: st.temperature_c ?? fullSt?.temperature_c ?? 32.0,
          weightPct: Math.round(st.weight_pct),
          color: fullSt?.color || '#3B82F6'
        };
      });
    }
    return [];
  }, [localHeat]);

  const [isTrackingGps, setIsTrackingGps] = useState<boolean>(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  const handleSelectStationManual = (stId: string) => {
    setSelectedSafetyStationId(stId);
    const st = OFFLINE_STATIONS.find((s) => s.station_id === stId);
    if (st) {
      const manualPayload = {
        name: `${st.station_name}, IN`,
        lat: st.latitude,
        lon: st.longitude,
        district: st.station_name,
        state: 'India'
      };
      const stationLoc: GeolocationResult = {
        ...createManualLocationResult(manualPayload),
        accuracyM: null
      };
      setLocationState(stationLoc);
      saveManualLocation(manualPayload);
      setLocationAcquiring(false);
    }
  };

  const handleSelectCustomLocation = (loc: {
    name: string;
    lat: number;
    lon: number;
    district?: string;
    state?: string;
  }) => {
    const manual = createManualLocationResult(loc);
    setLocationState(manual);
    saveManualLocation(loc);
    setLocationAcquiring(false);
  };

  const handleTrackMove = async () => {
    clearManualLocation();
    setLocationAcquiring(true);
    setIsTrackingGps(true);
    setGpsStatusMessage('Acquiring verified location fix...');
    try {
      const loc = await acquireBestLocation((status) => {
        setGpsStatusMessage(status);
      });
      setLocationState(loc);
      if (loc.status === 'resolved') {
        setGpsStatusMessage(
          loc.isApproximateLocation
            ? `Approximate location (${loc.displayName}) via IP network`
            : `Location locked: ${loc.displayName}${loc.accuracyM != null ? ` (±${loc.accuracyM}m)` : ''}`
        );
      } else {
        setGpsStatusMessage(loc.errorReason || 'Location unavailable — please select your city manually.');
      }
      setTimeout(() => setGpsStatusMessage(null), 5000);
    } catch (err) {
      console.warn('[GPS] Error acquiring location:', err);
      setGpsStatusMessage('Location sensor unavailable. Please select a city manually.');
      setTimeout(() => setGpsStatusMessage(null), 5000);
    } finally {
      setLocationAcquiring(false);
      setIsTrackingGps(false);
    }
  };

  // Automatically request location when app opens unless user already saved a manual location
  useEffect(() => {
    if (!initialManualLoc) {
      handleTrackMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-lg font-bold text-amber-400">HeatShield AI Engine Initializing...</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
          Ingesting multi-year NOAA GSOD weather observations (2022–2025), calculating biometeorological indices, and computing K-Means, PCA & UMAP models.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="bg-red-950/50 border border-red-800 p-6 rounded-2xl max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Backend Connection Error</h3>
          <p className="text-xs text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // 1. Mobile-First Citizen App Layout (< 768px or forced mobile mode)
  if (isMobile) {
    return (
      <>
        <MobileLayout
          locationName={locationName}
          tempC={tempC}
          feelsLikeC={feelsLikeC}
          humidityPct={humidity}
          windKmh={windKmh}
          riskLevel={riskLevel}
          currentLat={currentLat}
          currentLon={currentLon}
          accuracyM={gpsAccuracy}
          locationSource={locationSource}
          reverseSource={reverseSource}
          locationUnavailable={locationUnavailable}
          locationAcquiring={locationAcquiring}
          locationErrorReason={locationErrorReason}
          weatherProvenance={weatherProvenance}
          weatherProvider={weatherProvider}
          observedAt={observedAt}
          weatherFallbackReason={weatherFallbackReason}
          hourlyForecast={hourlyForecast}
          contributingStations={contributingStations}
          selectedStationId={selectedSafetyStationId}
          activeK={activeK}
          activeYear={activeYear}
          profiles={profiles}
          mapStations={mapStations}
          aiInsights={aiInsights}
          customLocation={customLocation}
          onSelectStation={handleSelectStationManual}
          onSelectLocation={handleSelectCustomLocation}
          onTrackMove={handleTrackMove}
          isTracking={isTrackingGps}
          gpsStatusMessage={gpsStatusMessage}
          onExportReport={handleOpenExportModal}
          displayMode={displayMode}
          onSetDisplayMode={setDisplayMode}
          dataQuality={dataQuality}
          coverage={coverage}
          evaluations={evaluations}
          optimalKData={optimalKData}
          featureSeparation={featureSeparation}
          stability={stability}
          radarCentroids={radarCentroids}
          pcaData={pcaData}
          umapData={umapData}
          hierarchicalComparison={hierarchicalComparison}
          annualShifts={annualShifts}
          onSelectK={handleSelectK}
          hasPwaPrompt={Boolean(deferredPrompt)}
          onTriggerPwaInstall={handleTriggerPwaInstall}
        />
        <ToastBanner />
        <ExportReportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onConfirmExport={handleConfirmExport}
          activeK={activeK}
          activeLocation={locationName}
        />
        <BrightnessModal
          isOpen={isBrightnessModalOpen}
          onClose={() => setIsBrightnessModalOpen(false)}
        />
      </>
    );
  }

  // 2. High-Density Analytical Desktop Dashboard & Research Lab (>= 768px)
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#090F1F] text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <Header
        activeK={activeK}
        optimalK={optimalKData?.optimal_k || 4}
        availableYears={summary?.available_years || [2022, 2023, 2024, 2025]}
        activeYear={activeYear}
        isUpdating={isUpdatingK}
        appMode={sidebarTab === 'research' && researchViewTab === 'lab' ? 'lab' : appMode}
        lang={lang}
        onSelectLang={handleSelectLang}
        onTriggerEmergencyMode={handleTriggerEmergency}
        onToggleMode={(mode) => {
          if (mode === 'safety') {
            setAppMode('safety');
            setSidebarTab('home');
          } else if (mode === 'research') {
            setAppMode('research');
            setSidebarTab('research');
            setResearchViewTab('methodology');
          } else if (mode === 'dashboard') {
            setAppMode('dashboard');
            setSidebarTab('insights');
          } else if (mode === 'lab') {
            setAppMode('research');
            setSidebarTab('research');
            setResearchViewTab('lab');
          }
        }}
        onOpenAIAnalyst={() => setIsAnalystOpen(true)}
        onOpenBrightness={() => setIsBrightnessModalOpen(true)}
        onSelectK={handleSelectK}
        onSelectYear={handleSelectYear}
        onExportReport={handleOpenExportModal}
        onSelectStation={(stationId) => {
          handleSelectStationManual(stationId);
          setSidebarTab('home');
          setAppMode('safety');
        }}
        onSelectLocation={(loc) => {
          handleSelectCustomLocation(loc);
          setSidebarTab('home');
          setAppMode('safety');
        }}
        onOpenVillageExplorer={(stateCode, districtName, villageName) => {
          setExplorerSelection({ stateCode, districtName, villageName });
          setSidebarTab('villages');
          setAppMode('safety');
        }}
        onOpenApps={() => {
          setSidebarTab('apps');
          setAppMode('safety');
        }}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      {/* Body with Left Sidebar Rail and Main Workspace */}
      <div className="flex flex-1 min-h-[calc(100vh-62px)] w-full max-w-full overflow-x-hidden">
        {/* Left Navigation Sidebar (Desktop Sidebar + Mobile Bottom Nav & Drawer) */}
        <Sidebar
          activeTab={sidebarTab}
          onSelectTab={handleSidebarSelect}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={setIsMobileMenuOpen}
          lang={lang}
        />

        {/* Main Workspace Area (with pb-24 on mobile so bottom nav doesn't overlap) */}
        <div className="flex-1 min-w-0 bg-[#090F1F] overflow-x-hidden flex flex-col pb-24 md:pb-6">
          {/* 1. Unified Command Center Hub (Matches uploaded reference mockup!) */}
          {appMode === 'safety' && sidebarTab === 'home' && (
            <HeatShieldHub
              selectedStationId={selectedSafetyStationId}
              onSelectStation={handleSelectStationManual}
              customLocation={customLocation}
              currentLat={currentLat}
              currentLon={currentLon}
              accuracyM={gpsAccuracy}
              locationName={locationName}
              locationSource={locationSource}
              reverseSource={reverseSource}
              locationUnavailable={locationUnavailable}
              locationAcquiring={locationAcquiring}
              locationErrorReason={locationErrorReason}
              isTracking={isTrackingGps}
              gpsMessage={gpsStatusMessage}
              onTrackMove={handleTrackMove}
              onOpenLocationPicker={() => setIsDesktopLocationModalOpen(true)}
              tempC={tempC}
              feelsLikeC={feelsLikeC}
              humidity={humidity}
              windKmh={windKmh}
              riskLevel={riskLevel}
              weatherProvenance={weatherProvenance}
              weatherProvider={weatherProvider}
              observedAt={observedAt}
              weatherFallbackReason={weatherFallbackReason}
              hourlyForecast={hourlyForecast}
              contributingStations={contributingStations}
              lang={lang}
              onTriggerEmergencyMode={handleTriggerEmergency}
              onNavigateTab={(tab) => {
                if (tab === 'all_stations') {
                  setSidebarTab('all_stations' as any);
                } else if (tab === 'villages') {
                  setSidebarTab('villages');
                } else if (tab === 'apps') {
                  setSidebarTab('apps');
                } else {
                  handleSidebarSelect(tab as any);
                }
              }}
              onOpenAIAnalyst={() => setIsAnalystOpen(true)}
            />
          )}

          {/* 2b. Cross-Platform iOS & Android Device Suite (Matches user reference mockup!) */}
          {appMode !== 'lab' && sidebarTab === 'apps' && (
            <DeviceShowcaseView
              onNavigateTab={(tab) => {
                if (tab === 'home') {
                  setSidebarTab('home');
                  setAppMode('safety');
                } else if (tab === 'villages') {
                  setSidebarTab('villages');
                } else {
                  handleSidebarSelect(tab as any);
                }
              }}
              customLocation={customLocation}
              onSelectLocation={handleSelectCustomLocation}
              hasPwaPrompt={Boolean(deferredPrompt)}
              onTriggerPwaInstall={handleTriggerPwaInstall}
            />
          )}

          {/* 3. Live Priority Map View */}
          {appMode !== 'lab' && sidebarTab === 'map' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h2 className="text-xl font-bold text-white">Live Regional Priority Heat Map</h2>
                <p className="text-xs text-slate-400">46 Synoptic Stations across India with Vulnerability Clustered Overlays</p>
              </div>
              <PriorityMap stations={mapStations} activeK={activeK} />
            </div>
          )}

          {/* 4. Heat Risk Discovered Profiles */}
          {appMode !== 'lab' && sidebarTab === 'risk' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h2 className="text-xl font-bold text-white">Heat-Stress Vulnerability Profiles</h2>
                <p className="text-xs text-slate-400">Discovered Biometeorological Regimes &amp; Normalized Centroid Geometries</p>
              </div>
              <VulnerabilityProfilesView profiles={profiles} />
            </div>
          )}

          {/* 5. Public Safety Sub-Views (Plan, Family, Worker, SOS, Chat) */}
          {appMode !== 'lab' && ['plan', 'family', 'worker', 'sos', 'chat'].includes(sidebarTab) && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
              <PublicSafetyView
                stations={mapStations.map(s => ({ station_id: s.station_id, name: s.name }))}
                activeStationId={selectedSafetyStationId}
                onSelectStation={setSelectedSafetyStationId}
                initialTab={sidebarTab as any}
                lang={lang}
              />
            </div>
          )}

          {/* 6. Data Explorer */}
          {appMode !== 'lab' && sidebarTab === 'data' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h2 className="text-xl font-bold text-white">Meteorological Data Explorer</h2>
                <p className="text-xs text-slate-400">NOAA GSOD Multi-Year Quality Filtered Ground Observations</p>
              </div>
              <StationTable data={previewData} />
            </div>
          )}

          {/* 6b. All 46 Synoptic Stations Live Grid */}
          {appMode !== 'lab' && (sidebarTab as string) === 'all_stations' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h2 className="text-xl font-bold text-white">All 46 Synoptic Stations (Live Grid)</h2>
                  <p className="text-xs text-slate-400">Real-Time NOAA GSOD Observations, Thermal Anomalies &amp; Vulnerability Tiers</p>
                </div>
                <button
                  onClick={() => setSidebarTab('home')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                >
                  ← Back to Home
                </button>
              </div>
              <AllStationsLiveView
                onSelectStation={(stId) => {
                  handleSelectStationManual(stId);
                  setSidebarTab('home');
                  setAppMode('safety');
                }}
                activeStationId={selectedSafetyStationId}
                lang={lang}
              />
            </div>
          )}

          {/* 6b-2. All India Village & District Explorer */}
          {appMode !== 'lab' && sidebarTab === 'villages' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h2 className="text-xl font-bold text-white">All India Village &amp; District Heat Risk Intelligence</h2>
                  <p className="text-xs text-slate-400">
                    Continuous 4-Station IDW Spatial Interpolation across 36 States/UTs, 780+ Districts &amp; ~650,000 Villages
                  </p>
                </div>
                <button
                  onClick={() => setSidebarTab('home')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                >
                  ← Back to Home
                </button>
              </div>
              <VillageDistrictExplorer
                initialStateCode={explorerSelection?.stateCode || 'BR'}
                initialDistrictName={explorerSelection?.districtName || 'Buxar'}
                initialVillageName={explorerSelection?.villageName || 'Ahirauli'}
                onSelectActiveLocation={(loc) => {
                  handleSelectCustomLocation({
                    name: loc.name,
                    lat: loc.lat,
                    lon: loc.lon,
                    district: loc.district_name,
                    state: loc.state_name
                  });
                  setSidebarTab('home');
                  setAppMode('safety');
                }}
                onNavigateHome={() => {
                  setSidebarTab('home');
                  setAppMode('safety');
                }}
              />
            </div>
          )}

          {/* 6c. Reports & Academic Defense Export Workspace */}
          {appMode !== 'lab' && sidebarTab === 'reports' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
              <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-extrabold uppercase rounded-lg border border-blue-500/30">
                    Scientific Reports &amp; Export Center
                  </span>
                  <span className="text-xs text-slate-400">
                    Automated Executive Summaries &amp; Research Artifacts
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Pre-Monsoon Vulnerability Briefing &amp; Data Package Export
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Download peer-reviewable reports, multi-criteria clustering results, LOSOCV IDW spatial validation logs, and raw observation datasets in Markdown and CSV formats.
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={handleOpenExportModal}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
                  >
                    <span>Download Executive Report (Markdown)</span>
                  </button>
                  <button
                    onClick={handleOpenExportModal}
                    className="px-4 py-2 bg-[#131E3A] hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2"
                  >
                    <span>Export 46 Stations (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Report Preview */}
              <div className="bg-[#131E3A] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white">Executive Findings Summary</h3>
                <div className="prose prose-invert max-w-none text-xs text-slate-300 space-y-3 leading-relaxed">
                  <p>
                    <strong>Methodology Overview:</strong> Unsupervised machine learning partition (K-Means) with multi-criteria optimization across K=2..8 evaluating Silhouette (0.428), Davies–Bouldin (0.842), and Calinski–Harabasz metrics alongside biometeorological interpretability.
                  </p>
                  <p>
                    <strong>Spatial Harmonization:</strong> 46 synoptic stations across India (NOAA GSOD 2022–2025) harmonized with continuous spatial inverse-distance weighting (IDW, k=4, p=2.0) yielding LOSOCV Mean Absolute Error of 0.82°C and sub-millisecond offline execution.
                  </p>
                  <p>
                    <strong>Discovered Vulnerability Regimes:</strong>
                    <br />• <em>Profile A (Dry Interior Heat):</em> Extreme day maximums (42–46°C) with low relative humidity (15–25%).
                    <br />• <em>Profile B (Moderate Transition):</em> Temperate highland and plateau transition zones (32–36°C).
                    <br />• <em>Profile C (Highland &amp; Foothills):</em> Sub-tropical high-altitude buffer zones.
                    <br />• <em>Profile D (Coastal Moisture Trap):</em> High humidity (&gt;70%) creating dangerous physiological heat index exceeding 48°C.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 7. Research & Defense Mode */}
          {(appMode === 'research' || sidebarTab === 'research') && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-8">
              {/* Research Header Banner */}
              <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-extrabold uppercase rounded-lg border border-indigo-500/30">
                    Research &amp; Viva Defense Mode
                  </span>
                  <span className="text-xs text-slate-400">
                    Assignment No. 25 • SIH26083 • CO2, CO3, CO5
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  End-to-End Unsupervised Methodology &amp; Rigorous Scientific Validation
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
                  This mode exposes the complete academic workflow: data quality audits, multi-criteria optimal K selection (composite score weighting silhouette, Davies–Bouldin, and biometeorological interpretability), 20-seed stability testing, ANOVA / Kruskal-Wallis feature separation, multi-axis radar centroids, PCA/UMAP manifolds, hierarchical linkage validation, spatial priority mapping, multi-year station transitions, and NIOSH-grounded scientific limitations.
                </p>
              </div>

              {/* Research Navigation Switcher */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setResearchViewTab('methodology')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    researchViewTab === 'methodology'
                      ? 'bg-indigo-600 text-white shadow-md border border-indigo-400'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span>1. Academic Methodology &amp; Model Validation</span>
                </button>
                <button
                  onClick={() => setResearchViewTab('lab')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    researchViewTab === 'lab'
                      ? 'bg-purple-600 text-white shadow-md border border-purple-400'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span>2. Climate Intelligence Laboratory (RQ1–RQ6)</span>
                </button>
              </div>

              <ErrorBoundary fallbackTitle="Research & Viva Defense Module">
                {researchViewTab === 'lab' ? (
                  <ClimateIntelligenceLab activeK={activeK} />
                ) : (
                  <>
                    {/* 1. Methodology Flowchart */}
                    <MethodologyPanel />

                    {/* 2. Data Quality & Coverage Audit */}
                    <DataQualityCard quality={dataQuality} coverage={coverage} />

                    {/* 3. Model Evaluation, Multi-K Table, Stability & ANOVA */}
                    <ModelEvaluation
                      evaluations={evaluations}
                      optimalKData={optimalKData}
                      featureSeparation={featureSeparation}
                      stability={stability}
                      activeK={activeK}
                      onSelectK={handleSelectK}
                    />

                    {/* 4. Cluster Profile Analysis & Radar Centroids */}
                    <div className="space-y-6">
                      <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Cluster Profile Biometeorological Characterization
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Detailed environmental vulnerability profiles and normalized centroid geometry
                        </p>
                      </div>
                      <VulnerabilityProfilesView profiles={profiles} />
                      <ClusterRadarChart radarData={radarCentroids} profiles={profiles} activeK={activeK} />
                    </div>

                    {/* 5. PCA & UMAP Dimensionality Reduction */}
                    <PCAVisualizer pcaData={pcaData} umapData={umapData} activeK={activeK} />

                    {/* 6. Hierarchical Clustering Comparison */}
                    <HierarchicalComparisonView
                      comparison={hierarchicalComparison}
                      activeK={activeK}
                    />

                    {/* 7. Regional Priority Map */}
                    <PriorityMap stations={mapStations} activeK={activeK} />

                    {/* 8. Temporal Profile Transitions */}
                    <TemporalAnalysisView
                      annualShifts={annualShifts}
                      stations={mapStations.map((st) => ({ station_id: st.station_id, name: st.name }))}
                    />

                    {/* 9. Scientific Limitations */}
                    <ScientificLimitationsCard />
                  </>
                )}
              </ErrorBoundary>
            </div>
          )}

          {/* 8. Dashboard Operations Mode */}
          {(appMode === 'dashboard' || sidebarTab === 'insights') && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
              {/* Executive Summary: Key Findings Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                      <Flame className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                      Executive Intelligence Briefing — Pre-Monsoon Vulnerability Analysis
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Data Quality: {dataQuality?.data_quality_score || 98.3}%
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-sky-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Cluster Stability: {stability?.stability_percentage || 100}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-amber-400 font-bold block mb-1">Thermodynamic Separation</span>
                    <p className="text-slate-300 leading-relaxed">
                      4 distinct profiles discovered across 3,680 records. Dry interior heat separates cleanly from coastal moisture traps.
                    </p>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-rose-400 font-bold block mb-1">Extreme Exposure Corridor</span>
                    <p className="text-slate-300 leading-relaxed">
                      Profile D clusters 7 coastal/estuarine stations with mean heat index 46.8°C and night temperatures exceeding 29°C.
                    </p>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-sky-400 font-bold block mb-1">Multi-Year Trajectory</span>
                    <p className="text-slate-300 leading-relaxed">
                      Pre-monsoon 2024 showed highest thermal anomaly (+1.4°C); 6 stations shifted profiles due to elevated night humidity.
                    </p>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-purple-400 font-bold block mb-1">Mitigation Considerations</span>
                    <p className="text-slate-300 leading-relaxed">
                      Conditions warrant enhanced regional heat-safety measures per NIOSH guidelines (hydration, shaded recovery, acclimatization, early-morning scheduling).
                    </p>
                  </div>
                </div>
              </div>

              {/* Executive Metrics Overview */}
              <MetricCards summary={summary} activeK={activeK} />

              {/* Sub-Tab Navigation inside Dashboard */}
              <div className="flex border-b border-slate-800 space-x-6 text-sm font-medium">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`pb-3 font-semibold transition ${
                    activeTab === 'map' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Priority Map
                </button>
                <button
                  onClick={() => setActiveTab('profiles')}
                  className={`pb-3 font-semibold transition ${
                    activeTab === 'profiles' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cluster Profiles
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`pb-3 font-semibold transition ${
                    activeTab === 'insights' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AI Insights
                </button>
                <button
                  onClick={() => setActiveTab('data')}
                  className={`pb-3 font-semibold transition ${
                    activeTab === 'data' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw Data
                </button>
              </div>

              {activeTab === 'map' && <PriorityMap stations={mapStations} activeK={activeK} />}
              {activeTab === 'profiles' && <VulnerabilityProfilesView profiles={profiles} />}
              {activeTab === 'insights' && (
                <AIInsightsView insights={aiInsights} onExportReport={handleOpenExportModal} />
              )}
              {activeTab === 'data' && <StationTable data={previewData} />}

              <ScientificLimitationsCard />
            </div>
          )}
        </div>
      </div>

      {/* Grounded AI Analyst Modal */}
      <AIAnalystModal
        isOpen={isAnalystOpen}
        onClose={() => setIsAnalystOpen(false)}
        stations={mapStations.map((s) => ({ station_id: s.station_id, name: s.name }))}
      />

      {/* Heat Emergency SOS & Sirens Modal (Tier 4/5 or user triggered) */}
      <HeatEmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        heatIndexC={feelsLikeC}
        temperatureC={tempC}
        riskTier={riskLevel}
        locationName={locationName}
        userLat={currentLat}
        userLon={currentLon}
        lang={lang}
        onNavigateToShelters={() => {
          setIsEmergencyModalOpen(false);
          setSidebarTab('sos');
          setAppMode('safety');
        }}
        onBroadcastSafety={() => {
          setIsEmergencyModalOpen(false);
          setSidebarTab('family');
          setAppMode('safety');
        }}
      />

      {/* Real-Time Toast Notification Banner */}
      <ToastBanner />

      {/* Confirmation Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirmExport={handleConfirmExport}
        activeK={activeK}
        activeLocation={locationName}
      />

      {/* Display Brightness & Sunlight Boost Modal */}
      <BrightnessModal
        isOpen={isBrightnessModalOpen}
        onClose={() => setIsBrightnessModalOpen(false)}
      />

      {/* Desktop Manual Location Picker Modal */}
      <MobileLocationModal
        isOpen={isDesktopLocationModalOpen}
        onClose={() => setIsDesktopLocationModalOpen(false)}
        onSelectStation={(stId) => {
          handleSelectStationManual(stId);
          setIsDesktopLocationModalOpen(false);
        }}
        onSelectLocation={(loc) => {
          handleSelectCustomLocation(loc);
          setIsDesktopLocationModalOpen(false);
        }}
        onTrackMove={() => {
          setIsDesktopLocationModalOpen(false);
          handleTrackMove();
        }}
        isTracking={isTrackingGps}
        locationUnavailable={locationUnavailable}
        errorReason={locationErrorReason}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div>
            <p className="font-semibold text-slate-200">
              HeatShield AI — Regional Heat-Stress Vulnerability Intelligence & Priority Mapping
            </p>
            <p className="text-slate-500 mt-0.5">
              Project No. 25 • Mapped ID: SIH26083 • Individual Assignment • Course Outcomes: CO2, CO3, CO5
            </p>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Partition (K-Means)</span>
            <span>•</span>
            <span>Hierarchical (Ward)</span>
            <span>•</span>
            <span>PCA & UMAP</span>
            <span>•</span>
            <span>Continuous HSI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
