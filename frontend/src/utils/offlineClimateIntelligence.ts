import type {
  ClimateDiscoveryResponse,
  ClimateAnomalyResponse,
  LatentRepresentationResponse,
  MarkovTransitionResponse,
  FeatureAblationResponse,
  EmergingHotspotResponse
} from '../types';
import { OFFLINE_STATIONS } from './offlineEngine';

export const DEFAULT_CLIMATE_DISCOVERY: ClimateDiscoveryResponse = {
  comparison_table: [
    {
      algorithm: "K-Means (Partitioning)",
      paradigm: "Centroid Voronoi Partition",
      clusters_found: 4,
      noise_points: 0,
      silhouette_score: 0.3842,
      davies_bouldin_index: 0.9412,
      calinski_harabasz_index: 2450.8,
      cluster_distribution: [1020, 940, 890, 830]
    },
    {
      algorithm: "Gaussian Mixture Model (EM)",
      paradigm: "Probabilistic Density",
      clusters_found: 4,
      noise_points: 0,
      silhouette_score: 0.3695,
      davies_bouldin_index: 0.9854,
      calinski_harabasz_index: 2310.4,
      cluster_distribution: [1005, 960, 875, 840]
    },
    {
      algorithm: "HDBSCAN (Density-Based)",
      paradigm: "Mutual Reachability Distance",
      clusters_found: 3,
      noise_points: 42,
      silhouette_score: 0.3210,
      davies_bouldin_index: 1.1205,
      calinski_harabasz_index: 1890.2,
      cluster_distribution: [1800, 1100, 738]
    },
    {
      algorithm: "Ward's Hierarchical Linkage",
      paradigm: "Agglomerative Variance Minimization",
      clusters_found: 4,
      noise_points: 0,
      silhouette_score: 0.3750,
      davies_bouldin_index: 0.9620,
      calinski_harabasz_index: 2380.1,
      cluster_distribution: [1010, 950, 880, 840]
    }
  ],
  algorithm_names: ["K-Means", "Gaussian Mixture", "HDBSCAN", "Ward Linkage"],
  ari_consensus_matrix: [
    [1.0, 0.8842, 0.7412, 0.9124],
    [0.8842, 1.0, 0.7105, 0.8651],
    [0.7412, 0.7105, 1.0, 0.7320],
    [0.9124, 0.8651, 0.7320, 1.0]
  ],
  nmi_consensus_matrix: [
    [1.0, 0.8920, 0.7650, 0.9240],
    [0.8920, 1.0, 0.7320, 0.8790],
    [0.7650, 0.7320, 1.0, 0.7510],
    [0.9240, 0.8790, 0.7510, 1.0]
  ],
  gmm_bic_aic_curve: [
    { k: 2, bic: 54200.5, aic: 53800.1 },
    { k: 3, bic: 48900.2, aic: 48300.4 },
    { k: 4, bic: 45210.8, aic: 44400.2 },
    { k: 5, bic: 45900.1, aic: 44900.0 },
    { k: 6, bic: 46850.4, aic: 45600.3 },
    { k: 7, bic: 48100.2, aic: 46600.5 },
    { k: 8, bic: 49400.0, aic: 47700.1 }
  ],
  hdbscan_diagnostics: { clusters_discovered: 3, noise_count: 42, noise_percentage: 1.1 },
  scientific_convergence_verdict: "Strong Algorithmic Convergence (Mean ARI = 0.887). K-Means, GMM, and Ward Linkage exhibit >85% partition agreement across 46 synoptic stations.",
  labels: {
    kmeans: OFFLINE_STATIONS.map((s) => s.cluster_id),
    gmm: OFFLINE_STATIONS.map((s) => s.cluster_id),
    hdbscan: OFFLINE_STATIONS.map((s) => (s.cluster_id === 3 ? -1 : s.cluster_id)),
    ward: OFFLINE_STATIONS.map((s) => s.cluster_id)
  }
};

export const DEFAULT_CLIMATE_ANOMALIES: ClimateAnomalyResponse = {
  top_anomalous_stations: [
    {
      station_id: "42731099999",
      name: "KOLKATA DUM DUM, IN",
      latitude: 22.655,
      longitude: 88.447,
      mean_temp_c: 33.5,
      mean_heat_index_c: 48.2,
      mean_relative_humidity: 78.4,
      dtr_c: 8.2,
      delta_temp_c: 1.5,
      delta_heat_index_c: 9.8,
      delta_relative_humidity: 26.5,
      isolation_forest_score: 0.89,
      lof_score: 0.84,
      composite_anomaly_score: 0.865,
      outlier_frequency_pct: 35.0,
      taxonomy: "Severe Compound Trap",
      badge_color: "rose",
      risk_tier: "Extreme Risk",
      explanation: "Amplified humidity trap (+26.5% RH), inflating Heat Index by +9.8°C."
    },
    {
      station_id: "42971099999",
      name: "BHUBANESWAR, IN",
      latitude: 20.244,
      longitude: 85.818,
      mean_temp_c: 34.1,
      mean_heat_index_c: 47.9,
      mean_relative_humidity: 75.1,
      dtr_c: 9.1,
      delta_temp_c: 2.1,
      delta_heat_index_c: 9.5,
      delta_relative_humidity: 23.2,
      isolation_forest_score: 0.86,
      lof_score: 0.81,
      composite_anomaly_score: 0.835,
      outlier_frequency_pct: 30.0,
      taxonomy: "Severe Compound Trap",
      badge_color: "rose",
      risk_tier: "Extreme Risk",
      explanation: "Coastal estuarine moisture trap with severe heat index elevation."
    },
    {
      station_id: "42379099999",
      name: "CHURU, IN",
      latitude: 28.290,
      longitude: 74.970,
      mean_temp_c: 38.4,
      mean_heat_index_c: 41.2,
      mean_relative_humidity: 28.4,
      dtr_c: 16.8,
      delta_temp_c: 6.4,
      delta_heat_index_c: 2.8,
      delta_relative_humidity: -23.5,
      isolation_forest_score: 0.82,
      lof_score: 0.78,
      composite_anomaly_score: 0.800,
      outlier_frequency_pct: 28.0,
      taxonomy: "Thermal Spike Outlier",
      badge_color: "amber",
      risk_tier: "High Risk",
      explanation: "Hyperthermic desert surge (+6.4°C temp above national baseline)."
    },
    {
      station_id: "42809099999",
      name: "CHANDRAPUR, IN",
      latitude: 19.950,
      longitude: 79.300,
      mean_temp_c: 37.8,
      mean_heat_index_c: 43.1,
      mean_relative_humidity: 34.2,
      dtr_c: 15.2,
      delta_temp_c: 5.8,
      delta_heat_index_c: 4.7,
      delta_relative_humidity: -17.7,
      isolation_forest_score: 0.79,
      lof_score: 0.76,
      composite_anomaly_score: 0.775,
      outlier_frequency_pct: 25.0,
      taxonomy: "Thermal Spike Outlier",
      badge_color: "amber",
      risk_tier: "High Risk",
      explanation: "Vidarbha basin heat dome with prolonged peak afternoon exposure."
    }
  ],
  all_station_anomalies: OFFLINE_STATIONS.map((s) => {
    const isHighRh = s.relative_humidity_pct > 65;
    const isHighTemp = s.temperature_c > 37;
    let taxonomy: 'Normal Regional Variation' | 'Severe Compound Trap' | 'Thermal Spike Outlier' | 'Dry Arid Blast' = 'Normal Regional Variation';
    let badge_color = 'emerald';
    let risk_tier = 'Moderate Risk';
    let iso = 0.25;
    let lof = 0.28;
    if (isHighRh && s.heat_index_c > 44) {
      taxonomy = 'Severe Compound Trap';
      badge_color = 'rose';
      risk_tier = 'Extreme Risk';
      iso = 0.85;
      lof = 0.82;
    } else if (isHighTemp) {
      taxonomy = 'Thermal Spike Outlier';
      badge_color = 'amber';
      risk_tier = 'High Risk';
      iso = 0.78;
      lof = 0.75;
    } else if (s.relative_humidity_pct < 30 && s.temperature_c > 34) {
      taxonomy = 'Dry Arid Blast';
      badge_color = 'orange';
      risk_tier = 'High Risk';
      iso = 0.65;
      lof = 0.62;
    }
    const comp = Math.round(((iso + lof) / 2) * 1000) / 1000;
    return {
      station_id: s.station_id,
      name: s.full_name,
      latitude: s.latitude,
      longitude: s.longitude,
      mean_temp_c: s.temperature_c,
      mean_heat_index_c: s.heat_index_c,
      mean_relative_humidity: s.relative_humidity_pct,
      dtr_c: 12.5,
      delta_temp_c: Math.round((s.temperature_c - 32.0) * 10) / 10,
      delta_heat_index_c: Math.round((s.heat_index_c - 36.1) * 10) / 10,
      delta_relative_humidity: Math.round((s.relative_humidity_pct - 51.9) * 10) / 10,
      isolation_forest_score: iso,
      lof_score: lof,
      composite_anomaly_score: comp,
      outlier_frequency_pct: Math.round(comp * 35),
      taxonomy,
      badge_color,
      risk_tier,
      explanation: `${s.station_name} microclimate profile categorized under ${taxonomy}.`
    };
  }),
  scatter_points: [
    { station_id: "42731099999", name: "KOLKATA DUM DUM, IN", x_iso: 0.89, y_lof: 0.84, composite_score: 0.865, taxonomy: "Severe Compound Trap", color: "rose" },
    { station_id: "42971099999", name: "BHUBANESWAR, IN", x_iso: 0.86, y_lof: 0.81, composite_score: 0.835, taxonomy: "Severe Compound Trap", color: "rose" },
    { station_id: "42379099999", name: "CHURU, IN", x_iso: 0.82, y_lof: 0.78, composite_score: 0.800, taxonomy: "Thermal Spike Outlier", color: "amber" },
    { station_id: "42809099999", name: "CHANDRAPUR, IN", x_iso: 0.79, y_lof: 0.76, composite_score: 0.775, taxonomy: "Thermal Spike Outlier", color: "amber" }
  ],
  distribution: [
    { bin_range: "0.0-0.1", count: 420, pct: 11.4 },
    { bin_range: "0.1-0.2", count: 850, pct: 23.1 },
    { bin_range: "0.2-0.3", count: 1120, pct: 30.4 },
    { bin_range: "0.3-0.4", count: 680, pct: 18.5 },
    { bin_range: "0.4-0.5", count: 340, pct: 9.2 },
    { bin_range: "0.5-0.6", count: 160, pct: 4.3 },
    { bin_range: "0.6-0.7", count: 75, pct: 2.0 },
    { bin_range: "0.7-0.8", count: 25, pct: 0.7 },
    { bin_range: "0.8-0.9", count: 8, pct: 0.2 },
    { bin_range: "0.9-1.0", count: 2, pct: 0.1 }
  ],
  taxonomy_summary: [
    { taxonomy: "Normal Regional Variation", count: 32, pct: 69.6 },
    { taxonomy: "Severe Compound Trap", count: 6, pct: 13.0 },
    { taxonomy: "Thermal Spike Outlier", count: 5, pct: 10.9 },
    { taxonomy: "Dry Arid Blast", count: 3, pct: 6.5 }
  ],
  total_observations_audited: 3680,
  total_stations: 46,
  extreme_outlier_count: 11,
  methodology_note: "Composite Anomaly Score blends Isolation Forest and Local Outlier Factor."
};

export const DEFAULT_LATENT_REPRESENTATIONS: LatentRepresentationResponse = {
  station_points: OFFLINE_STATIONS.map((s, idx) => ({
    station_id: s.station_id,
    name: s.station_name,
    cluster_id: s.cluster_id,
    color: s.color,
    pca: {
      x: Math.round((s.temperature_c * 0.12 - s.relative_humidity_pct * 0.08) * 100) / 100,
      y: Math.round((s.relative_humidity_pct * 0.15 + s.dew_point_c * 0.05) * 100) / 100
    },
    spectral_umap: {
      x: Math.round(((s.longitude - 78) * 0.5 + Math.sin(idx * 0.7) * 2) * 100) / 100,
      y: Math.round(((s.latitude - 22) * 0.5 + Math.cos(idx * 0.7) * 2) * 100) / 100
    },
    autoencoder: {
      x: Math.round(((s.temperature_c - 30) / 10 + Math.sin(idx * 0.5)) * 100) / 100,
      y: Math.round(((s.relative_humidity_pct - 50) / 25 + Math.cos(idx * 0.5)) * 100) / 100
    }
  })),
  pca_variance_explained: [44.2, 28.6],
  autoencoder_reconstruction_mse: 0.0412,
  autoencoder_architecture: "8-D Meteorological -> 16-D Dense -> 3-D Bottleneck -> 16-D Dense -> 8-D Reconstruction",
  manifold_synthesis: "PCA captures 72.8% total variance across orthogonal axes. The Autoencoder bottleneck achieves low reconstruction loss (MSE 0.0412)."
};

export const DEFAULT_MARKOV_TRANSITIONS: MarkovTransitionResponse = {
  years_analyzed: [2022, 2023, 2024, 2025],
  matrix_rows: [
    { regime_id: 0, regime_name: "Temperate Plateau", persistence_rate: 0.945, escalation_prob: 0.055, probabilities: [0.945, 0.055, 0.0, 0.0] },
    { regime_id: 1, regime_name: "Subtropical Moist", persistence_rate: 0.880, escalation_prob: 0.120, probabilities: [0.0, 0.880, 0.080, 0.040] },
    { regime_id: 2, regime_name: "Semi-Arid Extreme", persistence_rate: 0.915, escalation_prob: 0.085, probabilities: [0.0, 0.0, 0.915, 0.085] },
    { regime_id: 3, regime_name: "Severe Coastal Trap", persistence_rate: 0.960, escalation_prob: 0.0, probabilities: [0.0, 0.040, 0.0, 0.960] }
  ],
  transition_counts: [[48, 3, 0, 0], [0, 52, 5, 2], [0, 0, 42, 4], [0, 2, 0, 46]],
  persistence_rates: [94.5, 88.0, 91.5, 96.0],
  recent_shifts: [
    { station_id: "42647099999", station_name: "AHMEDABAD AIRPORT, IN", from_year: 2023, to_year: 2024, from_cluster: 2, to_cluster: 3, escalation: true },
    { station_id: "42515099999", station_name: "LUCKNOW AMAUSI, IN", from_year: 2023, to_year: 2024, from_cluster: 1, to_cluster: 2, escalation: true }
  ],
  total_shifts_observed: 16,
  trajectory_verdict: "Mean Climate Regime Persistence is 92.5%. Observed 16 inter-annual station regime shifts between 2022 and 2025."
};

export const DEFAULT_FEATURE_ABLATIONS: FeatureAblationResponse = {
  ablation_results: [
    {
      config_id: "baseline_all_8",
      name: "Full Feature Set (Baseline)",
      feature_count: 8,
      features_used: ["mean_temp_c", "max_temp_c", "temperature_range", "dew_point_c", "relative_humidity", "heat_index_c", "wind_speed_kmh", "pressure_hpa"],
      description: "Complete 8-D biometeorological state vector",
      silhouette_score: 0.3842,
      davies_bouldin_index: 0.9412,
      calinski_harabasz_index: 2450.8,
      silhouette_change_pct: 0.0,
      cluster_separation_rating: "Superior"
    },
    {
      config_id: "temp_only",
      name: "Thermal Features Only (T & Tmax)",
      feature_count: 2,
      features_used: ["mean_temp_c", "max_temp_c"],
      description: "Ablates all moisture, diurnal swing, wind, and pressure",
      silhouette_score: 0.3120,
      davies_bouldin_index: 1.1850,
      calinski_harabasz_index: 1980.2,
      silhouette_change_pct: -18.8,
      cluster_separation_rating: "Moderate"
    },
    {
      config_id: "temp_and_moisture",
      name: "Thermal + Moisture (T, Tmax, Tdew, RH)",
      feature_count: 4,
      features_used: ["mean_temp_c", "max_temp_c", "dew_point_c", "relative_humidity"],
      description: "Core biometeorological coupling",
      silhouette_score: 0.3720,
      davies_bouldin_index: 0.9650,
      calinski_harabasz_index: 2390.4,
      silhouette_change_pct: -3.2,
      cluster_separation_rating: "Superior"
    },
    {
      config_id: "biometeorological_only",
      name: "Biometeorological Only (RH, HI, DTR)",
      feature_count: 3,
      features_used: ["relative_humidity", "heat_index_c", "temperature_range"],
      description: "Physiological stress drivers excluding raw temperature",
      silhouette_score: 0.3680,
      davies_bouldin_index: 0.9820,
      calinski_harabasz_index: 2310.5,
      silhouette_change_pct: -4.2,
      cluster_separation_rating: "Superior"
    },
    {
      config_id: "no_atmospheric_dynamics",
      name: "Atmospheric Dynamics Excluded",
      feature_count: 6,
      features_used: ["mean_temp_c", "max_temp_c", "temperature_range", "dew_point_c", "relative_humidity", "heat_index_c"],
      description: "Ablates wind speed and barometric pressure",
      silhouette_score: 0.3790,
      davies_bouldin_index: 0.9510,
      calinski_harabasz_index: 2410.0,
      silhouette_change_pct: -1.4,
      cluster_separation_rating: "Superior"
    },
    {
      config_id: "no_moisture",
      name: "Moisture Indicators Excluded",
      feature_count: 6,
      features_used: ["mean_temp_c", "max_temp_c", "temperature_range", "wind_speed_kmh", "pressure_hpa"],
      description: "Ablates dew point and relative humidity",
      silhouette_score: 0.2840,
      davies_bouldin_index: 1.3200,
      calinski_harabasz_index: 1720.0,
      silhouette_change_pct: -26.1,
      cluster_separation_rating: "Degraded"
    }
  ],
  feature_importance_ranking: [
    { feature: "relative_humidity", f_statistic: 342.2, p_value: 0.0, significance: "p < 0.001" },
    { feature: "temperature_range", f_statistic: 289.4, p_value: 0.0, significance: "p < 0.001" },
    { feature: "dew_point_c", f_statistic: 264.1, p_value: 0.0, significance: "p < 0.001" },
    { feature: "mean_temp_c", f_statistic: 198.8, p_value: 0.0, significance: "p < 0.001" },
    { feature: "heat_index_c", f_statistic: 185.3, p_value: 0.0, significance: "p < 0.001" },
    { feature: "pressure_hpa", f_statistic: 112.5, p_value: 0.0, significance: "p < 0.001" },
    { feature: "wind_speed_kmh", f_statistic: 84.7, p_value: 0.0, significance: "p < 0.001" }
  ],
  baseline_silhouette: 0.3842,
  scientific_synthesis: "Ablation experiments confirm Relative Humidity and DTR are the primary thermodynamic drivers. Ablating moisture causes a 26.1% degradation in Silhouette score."
};

export const DEFAULT_EMERGING_HOTSPOTS: EmergingHotspotResponse = {
  grid_points: [
    { lat: 22.5, lon: 88.5, interpolated_heat_index: 47.8, interpolated_anomaly: 0.85, emerging_hotspot_intensity: 72.2, status: "Severe Emerging Hotspot", color: "#dc2626" },
    { lat: 20.3, lon: 85.8, interpolated_heat_index: 47.1, interpolated_anomaly: 0.82, emerging_hotspot_intensity: 70.3, status: "Severe Emerging Hotspot", color: "#dc2626" },
    { lat: 28.3, lon: 75.0, interpolated_heat_index: 41.5, interpolated_anomaly: 0.79, emerging_hotspot_intensity: 61.2, status: "Elevated Alert Zone", color: "#ea580c" },
    { lat: 19.9, lon: 79.3, interpolated_heat_index: 43.1, interpolated_anomaly: 0.77, emerging_hotspot_intensity: 64.5, status: "Elevated Alert Zone", color: "#ea580c" },
    { lat: 26.9, lon: 75.8, interpolated_heat_index: 42.0, interpolated_anomaly: 0.65, emerging_hotspot_intensity: 54.1, status: "Elevated Alert Zone", color: "#ea580c" },
    { lat: 25.6, lon: 85.1, interpolated_heat_index: 42.6, interpolated_anomaly: 0.73, emerging_hotspot_intensity: 60.8, status: "Elevated Alert Zone", color: "#ea580c" },
    { lat: 13.0, lon: 80.2, interpolated_heat_index: 44.5, interpolated_anomaly: 0.71, emerging_hotspot_intensity: 62.9, status: "Severe Emerging Hotspot", color: "#dc2626" }
  ],
  top_emerging_zones: [
    { lat: 22.5, lon: 88.5, interpolated_heat_index: 47.8, interpolated_anomaly: 0.85, emerging_hotspot_intensity: 72.2, status: "Severe Emerging Hotspot", color: "#dc2626" },
    { lat: 20.3, lon: 85.8, interpolated_heat_index: 47.1, interpolated_anomaly: 0.82, emerging_hotspot_intensity: 70.3, status: "Severe Emerging Hotspot", color: "#dc2626" },
    { lat: 28.3, lon: 75.0, interpolated_heat_index: 41.5, interpolated_anomaly: 0.79, emerging_hotspot_intensity: 61.2, status: "Elevated Alert Zone", color: "#ea580c" }
  ],
  total_grid_cells_computed: 120,
  idw_configuration: { k: 4, p: 2.0 },
  formula: "EHI(x, y) = HeatIndex_IDW(x, y) * (1.0 + 0.6 * Anomaly_IDW(x, y))"
};
