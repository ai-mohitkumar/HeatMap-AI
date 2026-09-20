export interface DatasetSummary {
  total_observations: number;
  unique_stations: number;
  available_years: number[];
  active_year_filter: number | null;
  features_used: string[];
  optimal_k: number;
  best_silhouette_score: number;
  high_risk_stations_count: number;
  mean_heat_index_c: number;
  mean_heat_stress_index: number;
  max_recorded_temp_c: number;
  min_recorded_temp_c: number;
}

export interface ClusterEvaluation {
  k: number;
  wcss: number;
  silhouette_score: number;
  davies_bouldin_index: number;
  calinski_harabasz_index: number;
  cluster_counts: number[];
  normalized_silhouette?: number;
  normalized_davies_bouldin?: number;
  elbow_curvature?: number;
  interpretability_score?: number;
  interpretability_stars?: string;
  interpretability_star_count?: number;
  interpretability_assessment?: string;
  composite_score?: number;
}

export interface OptimalKRecommendation {
  optimal_k: number;
  best_evaluation: ClusterEvaluation;
  all_evaluations: ClusterEvaluation[];
  rationale: string;
}

export interface ClusterProfile {
  cluster_id: number;
  rank: number;
  profile_code: string;
  count: number;
  percentage: number;
  vulnerability_tier: "Low" | "Moderate" | "High" | "Extreme";
  priority_level: string;
  color_code: string;
  title: string;
  description: string;
  avg_temp_c: number;
  max_temp_c: number;
  min_temp_c: number;
  dew_point_c: number;
  relative_humidity_pct: number;
  heat_index_c: number;
  dtr_c: number;
  wind_speed_kmh: number;
  pressure_hpa: number;
  mean_heat_stress_index: number;
  actionable_recommendations: string[];
}

export interface HierarchicalComparison {
  n_clusters: number;
  linkage_method: string;
  cophenetic_correlation: number;
  adjusted_rand_index: number;
  normalized_mutual_info: number;
  kmeans: {
    silhouette_score: number;
    davies_bouldin_index: number;
  };
  hierarchical: {
    silhouette_score: number;
    davies_bouldin_index: number;
  };
  comparison_summary: string;
}

export interface PCAPoint {
  x: number;
  y: number;
  cluster: number;
  station_name: string;
  station_id: string;
  heat_index_c: number;
  heat_stress_index?: number;
}

export interface FeatureLoading {
  feature: string;
  pc1_loading: number;
  pc2_loading: number;
  magnitude: number;
}

export interface PCAAnalysis {
  points: PCAPoint[];
  explained_variance_ratio: number[];
  cumulative_variance_ratio: number[];
  total_variance_explained_2d: number;
  feature_loadings: FeatureLoading[];
}

export interface UMAPAnalysis {
  points: PCAPoint[];
  method: string;
}

export interface StationGeoRecord {
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  mean_temp_c: number;
  peak_max_temp_c: number;
  peak_heat_index_c: number;
  dew_point_c: number;
  relative_humidity_pct: number;
  dtr_c: number;
  wind_speed_kmh: number;
  heat_stress_index: number;
  cluster_id: number;
  profile_code: string;
  vulnerability_tier: "Low" | "Moderate" | "High" | "Extreme";
  priority_level: string;
  color_code: string;
}

export interface ContributingIndicator {
  name: string;
  value: string;
  percentile: number;
  importance: number;
}

export interface StationExplanation {
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  cluster_id: number;
  profile_title: string;
  vulnerability_tier: "Low" | "Moderate" | "High" | "Extreme";
  priority_level: string;
  color_code: string;
  heat_stress_index: number;
  assignment_confidence_pct?: number;
  assignment_confidence_tier?: "High" | "Moderate" | "Borderline";
  assignment_confidence_badge?: string;
  assignment_confidence_color?: string;
  is_borderline?: boolean;
  borderline_advisory?: string | null;
  runner_up_cluster?: number;
  runner_up_title?: string;
  key_contributing_indicators: ContributingIndicator[];
  explanation: string;
}

export interface FeatureSeparation {
  feature: string;
  f_statistic: number;
  p_value: number;
  kruskal_statistic?: number;
  kruskal_p_value?: number;
  is_significant?: boolean;
  separation_score: number;
}

export interface AnnualShift {
  year: number;
  total_observations: number;
  mean_heat_stress_index: number;
  mean_temperature_c: number;
  peak_temperature_c: number;
  [key: string]: any;
}

export interface YearRecord {
  year: number;
  cluster_id: number;
  vulnerability_tier: string;
  priority_level: string;
  color_code: string;
  mean_temp_c: number;
  peak_max_temp_c: number;
  dew_point_c: number;
  heat_index_c: number;
  heat_stress_index: number;
}

export interface StationTransitionHistory {
  station_id: string;
  name: string;
  annual_history: YearRecord[];
  transitions: string[];
  transition_summary: string;
}

export interface AIInsights {
  title: string;
  model_confidence: string;
  key_takeaways: string[];
  temporal_trend_narrative: string;
  civil_defense_brief: string;
  recommended_focus_profile: string;
  baseline_comparison: string;
}

export interface DataQualityMetrics {
  total_records: number;
  unique_stations: number;
  recorded_years: number[];
  missing_values_count: number;
  missing_values_pct: number;
  outliers_count: number;
  outliers_pct: number;
  complete_stations: number;
  data_quality_score: number;
  clean_records_count: number;
}

export interface CoverageYear {
  year: number;
  observation_count: number;
  stations_reporting: number;
  share_percentage: number;
}

export interface CoverageMetrics {
  total_stations: number;
  total_observations: number;
  period: string;
  coverage_by_year: CoverageYear[];
  selection_criteria: string;
}

export interface SeedAgreement {
  seed: number;
  ari_to_baseline: number;
  nmi_to_baseline: number;
}

export interface ClusterStabilityResult {
  k: number;
  n_seeds_tested: number;
  stability_percentage: number;
  mean_pairwise_ari: number;
  mean_pairwise_nmi?: number;
  min_pairwise_ari: number;
  max_pairwise_ari: number;
  stability_tier: string;
  seed_agreement_curve?: SeedAgreement[];
  scientific_rationale: string;
}

export interface TransitionMatrixRecord {
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  y2022_code: string;
  y2022_tier: string;
  y2022_color: string;
  y2022_temp: number;
  y2022_hsi: number;
  y2023_code: string;
  y2023_tier: string;
  y2023_color: string;
  y2023_temp: number;
  y2023_hsi: number;
  y2024_code: string;
  y2024_tier: string;
  y2024_color: string;
  y2024_temp: number;
  y2024_hsi: number;
  y2025_code: string;
  y2025_tier: string;
  y2025_color: string;
  y2025_temp: number;
  y2025_hsi: number;
  has_transition: boolean;
  transition_trajectory: string;
  overall_shift: string;
  mean_hsi: number;
}

export interface RadarCentroidItem {
  indicator: string;
  feature_key: string;
  [key: string]: any;
}

export interface RadarCentroidsResponse {
  radar_data: RadarCentroidItem[];
  clusters: number[];
  indicators: string[];
}

export interface AIAnalystIndicator {
  label: string;
  value: string;
  percentile: number;
}

export interface AIAnalystResponse {
  query: string;
  category: string;
  headline: string;
  assigned_profile: string;
  vulnerability_tier: string;
  priority_level: string;
  key_indicators: AIAnalystIndicator[];
  biometeorological_interpretation: string;
  actionable_directives: string[];
}

export interface ActionItem {
  id: string;
  text: string;
  done: boolean;
}

export interface PersonaAdvice {
  persona_id: string;
  title: string;
  icon: string;
  vulnerability_reason: string;
  tailored_steps: string[];
}

export interface EmergencyNumber {
  label: string;
  number: string;
}

export interface SafetyRiskAssessment {
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  heat_risk_score: number;
  tier_name: string;
  tier_badge: string;
  urgency_level: 'normal' | 'caution' | 'warning' | 'alert' | 'emergency';
  color: string;
  bg_light: string;
  border_color: string;
  summary_headline: string;
  danger_explanation: string;
  peak_danger_window: string;
  current_weather: {
    temperature_c: number;
    max_temperature_c: number;
    dew_point_c: number;
    relative_humidity_pct: number;
    heat_index_c: number;
    wind_speed_kmh: number;
  };
  immediate_actions: ActionItem[];
  persona_advice: PersonaAdvice[];
  emergency_numbers: EmergencyNumber[];
}

export interface CoolingCenter {
  name: string;
  type: 'cooling_shelter' | 'transit_hub' | 'public_facility' | 'water_point' | 'hospital';
  address: string;
  hours: string;
  distance_km: number;
  has_ac: boolean;
  has_water: boolean;
  has_meds: boolean;
  status?: 'open' | 'crowded' | 'full';
  capacity_current?: number;
  capacity_total?: number;
  is_verified_today?: boolean;
  water_refill_available?: boolean;
  last_updated_time?: string;
}

export interface HourlyForecastItem {
  hour: string;
  hour_num: number;
  temp_c: number;
  heat_index_c: number;
  humidity_pct: number;
  risk_tier: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  is_peak: boolean;
  uv_index?: number;
  advice: string;
}

export interface HourlyForecastResponse {
  station_id?: string;
  station_name?: string;
  latitude: number;
  longitude: number;
  peak_window: string;
  peak_heat_index_c: number;
  peak_tier: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  generated_at: string;
  data_source?: string;
  is_live?: boolean;
  hourly: HourlyForecastItem[];
}

export interface WelfareCheckinRecord {
  timestamp: string;
  time_formatted: string;
  user_name?: string;
  location_name: string;
  lat: number;
  lon: number;
  water_liters: number;
  status_note: string;
  risk_tier: string;
}

export interface CommunityHelpRequest {
  id: string;
  station_id: string;
  location_name: string;
  beneficiary_type: string;
  urgency: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  description: string;
  timestamp: string;
  status: 'open' | 'in_progress' | 'completed';
  volunteers_signed_up: number;
  contact_name: string;
  distance_km: number;
}

export interface DailyHeatBrief {
  station_name: string;
  headline: string;
  trend_summary: string;
  peak_risk_window: string;
  best_outdoor_window: string;
  max_temperature_c: number;
  humidity_pct: number;
  feels_like_c: number;
  target_hydration_liters: number;
  morning_reminder: string;
}

export interface ActivityAlternative {
  slot: string;
  expected_temp: string;
  rating: string;
}

export interface ActivityEvaluationRequest {
  station_id: string;
  activity: string;
  planned_hour: number;
  duration_mins: number;
}

export interface ActivityEvaluationResult {
  activity: string;
  planned_time: string;
  duration_mins: number;
  verdict: 'SAFE' | 'CAUTION' | 'DANGEROUS';
  badge: string;
  color: string;
  explanation: string;
  recommended_action: string;
  safer_alternatives: ActivityAlternative[];
}

export interface SymptomCheckResult {
  triage_tier: 'NORMAL' | 'WARNING' | 'EMERGENCY';
  badge: string;
  color: string;
  urgency: 'low' | 'high' | 'critical';
  primary_directive: string;
  action_steps: string[];
  emergency_call_number: string;
}

export interface FamilyMemberRecord {
  id?: string;
  name: string;
  relationship: string;
  station_id: string;
  phone_number?: string;
}

export interface FamilyMemberStatus {
  id: string;
  name: string;
  relationship: string;
  station_id: string;
  city_name: string;
  phone_number?: string;
  heat_risk_score: number;
  tier: string;
  badge_color: string;
  temperature_c: number;
  feels_like_c: number;
  humidity_pct: number;
  status_note: string;
  needs_attention: boolean;
}

export interface AssistantChatResponse {
  query: string;
  answer: string;
  risk_tier: string;
  action_suggestion: string;
}

export type LanguageCode = 'en' | 'hi' | 'pa';

export type LocalizationStrings = Record<LanguageCode, Record<string, string>>;

export interface NearestStationResponse {
  nearest_station_id: string;
  nearest_station_name: string;
  distance_km: number;
  user_coordinates: { latitude: number; longitude: number };
  station_coordinates: { latitude: number; longitude: number };
  risk_assessment: SafetyRiskAssessment;
  is_live_gps: boolean;
}

export interface StationLiveSummaryItem {
  station_id: string;
  station_name: string;
  full_name: string;
  latitude: number;
  longitude: number;
  temperature_c: number;
  max_temperature_c: number;
  dew_point_c: number;
  relative_humidity_pct: number;
  heat_index_c: number;
  heat_stress_index: number;
  heat_risk_score: number;
  tier_badge: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'EXTREME';
  tier_name: string;
  color: string;
  cluster_id: number;
  profile_code: string;
  profile_title: string;
  vulnerability_tier: 'Low' | 'Moderate' | 'High' | 'Extreme';
  peak_danger_window: string;
}

export interface AllStationsLiveResponse {
  total_stations: number;
  stations: StationLiveSummaryItem[];
  tier_counts: {
    extreme: number;
    very_high: number;
    high: number;
    moderate: number;
    low: number;
  };
  mean_temperature_c: number;
  hottest_station: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface StationUsed {
  station_id: string;
  name: string;
  distance_km: number;
  weight_pct: number;
  temperature_c?: number;
  heat_index_c?: number;
}

export interface LocationPredictionRequest {
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  mode?: 'online' | 'offline';
}

export interface LocationPredictionResponse {
  location: {
    latitude: number;
    longitude: number;
    accuracy_m: number;
    timestamp?: number;
  };
  location_source: 'GPS' | 'CACHED_GPS' | 'SELECTED' | 'FALLBACK';
  data_source: {
    mode: 'online' | 'offline';
    stations_used: StationUsed[];
    interpolation: string;
    provider_note?: string;
  };
  weather: {
    temperature: number;
    dew_point: number;
    humidity: number;
    wind_speed: number;
    pressure: number;
    max_temperature: number;
    feels_like: number;
  };
  prediction: {
    risk_score: number;
    risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'EXTREME';
    profile: string;
    profile_title: string;
    cluster_id: number;
    peak_window: string;
    confidence_score: number;
    recommendations: string[];
  };
  risk_assessment: SafetyRiskAssessment;
}

export interface IDWGridEntry {
  k: number;
  p: number;
  temperature_mae?: number;
  temp_mae?: number;
  temperature_rmse?: number;
  temp_rmse?: number;
  heat_index_mae: number;
  heat_index_rmse: number;
  heat_index_r2?: number;
  r2_score?: number;
  dew_point_mae?: number;
}

export interface StationResidualEntry {
  station_id: string;
  station_name: string;
  actual_temp: number;
  predicted_temp: number;
  temp_residual: number;
  actual_hi: number;
  predicted_hi: number;
  hi_residual: number;
  nearest_station_distance_km: number;
  physical_context?: string;
}

export interface IDWValidationReport {
  total_stations_evaluated: number;
  k_range: number[];
  p_range: number[];
  parameter_configurations_tested: number;
  grid_search_matrix: IDWGridEntry[];
  selected_configuration: {
    k: number;
    p: number;
    heat_index_mae?: number;
    heat_index_mae_c?: number;
    temp_mae?: number;
    temperature_mae_c?: number;
    r2_score?: number;
    heat_index_r2?: number;
    rationale?: string;
  };
  best_configuration: {
    k: number;
    p: number;
    heat_index_mae: number;
    temp_mae?: number;
    temperature_mae?: number;
    r2_score?: number;
    heat_index_r2?: number;
  };
  distance_correlation: {
    pearson_r: number;
    p_value_est: string;
    interpretation: string;
  };
  top_accurate_stations: StationResidualEntry[];
  most_challenging_stations: StationResidualEntry[];
  scientific_rationale: string;
}

export interface BenchmarkReport {
  test_name: string;
  iterations: number;
  total_elapsed_ms: number;
  throughput_ops_sec: number;
  latency_ms: {
    mean: number;
    median: number;
    p90: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
  latency_microseconds: {
    mean_us: number;
    median_us: number;
    p95_us: number;
  };
  sub_millisecond_verified: boolean;
}

// -------------------------------------------------------------
// HeatShield AI 2.0: Climate Intelligence Lab Types (RQ1 - RQ6)
// -------------------------------------------------------------

export interface AlgorithmComparisonRow {
  algorithm: string;
  paradigm: string;
  clusters_found: number;
  noise_points: number;
  silhouette_score: number;
  davies_bouldin_index: number;
  calinski_harabasz_index: number;
  cluster_distribution: number[];
}

export interface GmmBicAicCurvePoint {
  k: number;
  bic: number;
  aic: number;
}

export interface HdbscanDiagnostics {
  clusters_discovered: number;
  noise_count: number;
  noise_percentage: number;
}

export interface ClimateDiscoveryResponse {
  comparison_table: AlgorithmComparisonRow[];
  algorithm_names: string[];
  ari_consensus_matrix: number[][];
  nmi_consensus_matrix: number[][];
  gmm_bic_aic_curve: GmmBicAicCurvePoint[];
  hdbscan_diagnostics: HdbscanDiagnostics;
  scientific_convergence_verdict: string;
  labels: {
    kmeans: number[];
    gmm: number[];
    hdbscan: number[];
    ward: number[];
  };
}

export interface ClimateAnomalyRecord {
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  mean_temp_c: number;
  mean_heat_index_c: number;
  mean_relative_humidity: number;
  dtr_c: number;
  delta_temp_c: number;
  delta_heat_index_c: number;
  delta_relative_humidity: number;
  isolation_forest_score: number;
  lof_score: number;
  composite_anomaly_score: number;
  outlier_frequency_pct: number;
  taxonomy: string;
  badge_color: string;
  risk_tier: string;
  explanation: string;
}

export interface AnomalyScatterPoint {
  station_id: string;
  name: string;
  x_iso: number;
  y_lof: number;
  composite_score: number;
  taxonomy: string;
  color: string;
}

export interface AnomalyDistributionBin {
  bin_range: string;
  count: number;
  pct: number;
}

export interface TaxonomySummaryItem {
  taxonomy: string;
  count: number;
  pct: number;
}

export interface ClimateAnomalyResponse {
  top_anomalous_stations: ClimateAnomalyRecord[];
  all_station_anomalies: ClimateAnomalyRecord[];
  scatter_points: AnomalyScatterPoint[];
  distribution: AnomalyDistributionBin[];
  taxonomy_summary: TaxonomySummaryItem[];
  total_observations_audited: number;
  total_stations: number;
  extreme_outlier_count: number;
  methodology_note: string;
}

export interface ManifoldStationPoint {
  station_id: string;
  name: string;
  cluster_id: number;
  color: string;
  pca: { x: number; y: number };
  spectral_umap: { x: number; y: number };
  autoencoder: { x: number; y: number };
}

export interface LatentRepresentationResponse {
  station_points: ManifoldStationPoint[];
  pca_variance_explained: number[];
  autoencoder_reconstruction_mse: number;
  autoencoder_architecture: string;
  manifold_synthesis: string;
}

export interface MarkovMatrixRow {
  regime_id: number;
  regime_name: string;
  persistence_rate: number;
  escalation_prob: number;
  probabilities: number[];
}

export interface MarkovTransitionEvent {
  station_id: string;
  station_name: string;
  from_year: number;
  to_year: number;
  from_cluster: number;
  to_cluster: number;
  escalation: boolean;
}

export interface MarkovTransitionResponse {
  years_analyzed: number[];
  matrix_rows: MarkovMatrixRow[];
  transition_counts: number[][];
  persistence_rates: number[];
  recent_shifts: MarkovTransitionEvent[];
  total_shifts_observed: number;
  trajectory_verdict: string;
}

export interface AblationConfigResult {
  config_id: string;
  name: string;
  feature_count: number;
  features_used: string[];
  description: string;
  silhouette_score: number;
  davies_bouldin_index: number;
  calinski_harabasz_index: number;
  silhouette_change_pct: number;
  cluster_separation_rating: string;
}

export interface FeatureImportanceItem {
  feature: string;
  f_statistic: number;
  p_value: number;
  significance: string;
}

export interface FeatureAblationResponse {
  ablation_results: AblationConfigResult[];
  feature_importance_ranking: FeatureImportanceItem[];
  baseline_silhouette: number;
  scientific_synthesis: string;
}

export interface HotspotGridPoint {
  lat: number;
  lon: number;
  interpolated_heat_index: number;
  interpolated_anomaly: number;
  emerging_hotspot_intensity: number;
  status: string;
  color: string;
}

export interface EmergingHotspotResponse {
  grid_points: HotspotGridPoint[];
  top_emerging_zones: HotspotGridPoint[];
  total_grid_cells_computed: number;
  idw_configuration: { k: number; p: number };
  formula: string;
}

