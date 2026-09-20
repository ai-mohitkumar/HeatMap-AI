import type {
  NearestStationResponse,
  SafetyRiskAssessment,
  StationLiveSummaryItem,
  AllStationsLiveResponse,
  DailyHeatBrief,
  CoolingCenter,
  ActivityEvaluationRequest,
  ActivityEvaluationResult,
  SymptomCheckResult,
  FamilyMemberRecord,
  FamilyMemberStatus,
  AssistantChatResponse,
  LocationPredictionResponse,
  StationUsed,
  HourlyForecastItem,
  HourlyForecastResponse
} from '../types';

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const OFFLINE_STATIONS: StationLiveSummaryItem[] = [
  {
    station_id: "43333099999",
    station_name: "Madurai",
    full_name: "MADURAI AIRPORT, IN",
    latitude: 9.835,
    longitude: 78.093,
    temperature_c: 36.3,
    max_temperature_c: 42.4,
    dew_point_c: 26.0,
    relative_humidity_pct: 55.5,
    heat_index_c: 46.7,
    heat_stress_index: 74.4,
    heat_risk_score: 74,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42410099999",
    station_name: "Patna",
    full_name: "PATNA AIRPORT, IN",
    latitude: 25.591,
    longitude: 85.088,
    temperature_c: 38.1,
    max_temperature_c: 44.3,
    dew_point_c: 21.2,
    relative_humidity_pct: 37.9,
    heat_index_c: 42.6,
    heat_stress_index: 72.6,
    heat_risk_score: 73,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42647099999",
    station_name: "Ahmedabad",
    full_name: "AHMEDABAD AIRPORT, IN",
    latitude: 23.073,
    longitude: 72.635,
    temperature_c: 35.9,
    max_temperature_c: 40.5,
    dew_point_c: 23.7,
    relative_humidity_pct: 49.5,
    heat_index_c: 42.8,
    heat_stress_index: 68.7,
    heat_risk_score: 69,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "43245099999",
    station_name: "Tirupati",
    full_name: "TIRUPATI, IN",
    latitude: 13.633,
    longitude: 79.543,
    temperature_c: 35.6,
    max_temperature_c: 40.6,
    dew_point_c: 24.1,
    relative_humidity_pct: 51.6,
    heat_index_c: 42.9,
    heat_stress_index: 68.8,
    heat_risk_score: 69,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42809099999",
    station_name: "Chandrapur",
    full_name: "CHANDRAPUR, IN",
    latitude: 19.95,
    longitude: 79.3,
    temperature_c: 39.5,
    max_temperature_c: 45.8,
    dew_point_c: 15.5,
    relative_humidity_pct: 24.5,
    heat_index_c: 40.1,
    heat_stress_index: 67.6,
    heat_risk_score: 68,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "43150099999",
    station_name: "Vijayawada",
    full_name: "VIJAYAWADA GANNAVARAM, IN",
    latitude: 16.53,
    longitude: 80.797,
    temperature_c: 32.6,
    max_temperature_c: 36.4,
    dew_point_c: 28.0,
    relative_humidity_pct: 77.0,
    heat_index_c: 45.1,
    heat_stress_index: 67.6,
    heat_risk_score: 68,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42071099999",
    station_name: "Amritsar",
    full_name: "AMRITSAR, IN",
    latitude: 31.71,
    longitude: 74.797,
    temperature_c: 36.7,
    max_temperature_c: 44.2,
    dew_point_c: 18.7,
    relative_humidity_pct: 34.9,
    heat_index_c: 38.8,
    heat_stress_index: 65.8,
    heat_risk_score: 66,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42181099999",
    station_name: "New Delhi Palam",
    full_name: "NEW DELHI PALAM, IN",
    latitude: 28.567,
    longitude: 77.1,
    temperature_c: 37.4,
    max_temperature_c: 42.7,
    dew_point_c: 17.1,
    relative_humidity_pct: 30.3,
    heat_index_c: 38.5,
    heat_stress_index: 65.1,
    heat_risk_score: 65,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42515099999",
    station_name: "Lucknow",
    full_name: "LUCKNOW AMAUSI, IN",
    latitude: 26.761,
    longitude: 80.883,
    temperature_c: 35.4,
    max_temperature_c: 41.1,
    dew_point_c: 21.2,
    relative_humidity_pct: 43.8,
    heat_index_c: 39.2,
    heat_stress_index: 64.6,
    heat_risk_score: 65,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42731099999",
    station_name: "Kolkata",
    full_name: "KOLKATA DUM DUM, IN",
    latitude: 22.655,
    longitude: 88.447,
    temperature_c: 34.4,
    max_temperature_c: 38.2,
    dew_point_c: 24.8,
    relative_humidity_pct: 57.3,
    heat_index_c: 42.2,
    heat_stress_index: 63.8,
    heat_risk_score: 64,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42909099999",
    station_name: "Raipur",
    full_name: "RAIPUR MANA, IN",
    latitude: 21.18,
    longitude: 81.739,
    temperature_c: 37.4,
    max_temperature_c: 43.4,
    dew_point_c: 17.5,
    relative_humidity_pct: 31.2,
    heat_index_c: 38.8,
    heat_stress_index: 64.2,
    heat_risk_score: 64,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42404099999",
    station_name: "Gaya",
    full_name: "GAYA AIRPORT, IN",
    latitude: 24.744,
    longitude: 84.951,
    temperature_c: 37.4,
    max_temperature_c: 45.6,
    dew_point_c: 13.7,
    relative_humidity_pct: 24.5,
    heat_index_c: 36.9,
    heat_stress_index: 63.0,
    heat_risk_score: 63,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "43237099999",
    station_name: "Mangalore",
    full_name: "MANGALORE BAJPE, IN",
    latitude: 12.961,
    longitude: 74.89,
    temperature_c: 32.3,
    max_temperature_c: 36.1,
    dew_point_c: 27.3,
    relative_humidity_pct: 75.0,
    heat_index_c: 43.2,
    heat_stress_index: 62.6,
    heat_risk_score: 63,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42492099999",
    station_name: "Gwalior",
    full_name: "GWALIOR, IN",
    latitude: 26.294,
    longitude: 78.258,
    temperature_c: 37.5,
    max_temperature_c: 42.0,
    dew_point_c: 15.6,
    relative_humidity_pct: 27.5,
    heat_index_c: 37.8,
    heat_stress_index: 62.4,
    heat_risk_score: 62,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42867099999",
    station_name: "Nagpur",
    full_name: "NAGPUR SONEGAON, IN",
    latitude: 21.092,
    longitude: 79.059,
    temperature_c: 37.6,
    max_temperature_c: 43.3,
    dew_point_c: 15.4,
    relative_humidity_pct: 27.0,
    heat_index_c: 37.9,
    heat_stress_index: 62.3,
    heat_risk_score: 62,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42863099999",
    station_name: "Akola",
    full_name: "AKOLA, IN",
    latitude: 20.699,
    longitude: 77.058,
    temperature_c: 38.7,
    max_temperature_c: 44.4,
    dew_point_c: 11.6,
    relative_humidity_pct: 19.8,
    heat_index_c: 37.6,
    heat_stress_index: 62.1,
    heat_risk_score: 62,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "43279099999",
    station_name: "Chennai",
    full_name: "CHENNAI MEENAMBAKKAM, IN",
    latitude: 12.994,
    longitude: 80.181,
    temperature_c: 33.3,
    max_temperature_c: 36.2,
    dew_point_c: 24.8,
    relative_humidity_pct: 61.1,
    heat_index_c: 40.7,
    heat_stress_index: 61.8,
    heat_risk_score: 62,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "43353099999",
    station_name: "Kochi",
    full_name: "KOCHI COCHIN AIRPORT, IN",
    latitude: 10.152,
    longitude: 76.402,
    temperature_c: 32.6,
    max_temperature_c: 36.9,
    dew_point_c: 25.2,
    relative_humidity_pct: 65.0,
    heat_index_c: 40.3,
    heat_stress_index: 62.0,
    heat_risk_score: 62,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42971099999",
    station_name: "Bhubaneswar",
    full_name: "BHUBANESWAR, IN",
    latitude: 20.244,
    longitude: 85.818,
    temperature_c: 32.8,
    max_temperature_c: 36.7,
    dew_point_c: 23.7,
    relative_humidity_pct: 58.8,
    heat_index_c: 38.6,
    heat_stress_index: 61.2,
    heat_risk_score: 61,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "43185099999",
    station_name: "Visakhapatnam",
    full_name: "VISAKHAPATNAM, IN",
    latitude: 17.721,
    longitude: 83.224,
    temperature_c: 31.8,
    max_temperature_c: 35.9,
    dew_point_c: 26.7,
    relative_humidity_pct: 74.2,
    heat_index_c: 41.5,
    heat_stress_index: 60.7,
    heat_risk_score: 61,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "43371099999",
    station_name: "Thiruvananthapuram",
    full_name: "THIRUVANANTHAPURAM, IN",
    latitude: 8.482,
    longitude: 76.92,
    temperature_c: 31.2,
    max_temperature_c: 33.6,
    dew_point_c: 27.3,
    relative_humidity_pct: 79.9,
    heat_index_c: 41.6,
    heat_stress_index: 61.1,
    heat_risk_score: 61,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "43111099999",
    station_name: "Solapur",
    full_name: "SOLAPUR, IN",
    latitude: 17.67,
    longitude: 75.906,
    temperature_c: 35.1,
    max_temperature_c: 40.6,
    dew_point_c: 17.9,
    relative_humidity_pct: 36.3,
    heat_index_c: 36.4,
    heat_stress_index: 61.0,
    heat_risk_score: 61,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42348099999",
    station_name: "Jodhpur",
    full_name: "JODHPUR, IN",
    latitude: 26.251,
    longitude: 73.048,
    temperature_c: 39.8,
    max_temperature_c: 47.1,
    dew_point_c: 7.1,
    relative_humidity_pct: 13.8,
    heat_index_c: 37.5,
    heat_stress_index: 60.4,
    heat_risk_score: 60,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42591099999",
    station_name: "Varanasi",
    full_name: "VARANASI BABATPUR, IN",
    latitude: 25.452,
    longitude: 82.859,
    temperature_c: 33.7,
    max_temperature_c: 38.7,
    dew_point_c: 21.4,
    relative_humidity_pct: 48.7,
    heat_index_c: 37.4,
    heat_stress_index: 60.3,
    heat_risk_score: 60,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "43003099999",
    station_name: "Mumbai",
    full_name: "MUMBAI SANTA CRUZ, IN",
    latitude: 19.118,
    longitude: 72.863,
    temperature_c: 32.1,
    max_temperature_c: 35.3,
    dew_point_c: 25.9,
    relative_humidity_pct: 70.0,
    heat_index_c: 40.7,
    heat_stress_index: 60.1,
    heat_risk_score: 60,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "42798099999",
    station_name: "Jabalpur",
    full_name: "JABALPUR, IN",
    latitude: 23.181,
    longitude: 80.053,
    temperature_c: 35.5,
    max_temperature_c: 41.5,
    dew_point_c: 16.8,
    relative_humidity_pct: 33.1,
    heat_index_c: 36.2,
    heat_stress_index: 59.8,
    heat_risk_score: 60,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "11:30 AM – 4:00 PM"
  },
  {
    station_id: "43226099999",
    station_name: "Goa",
    full_name: "GOA DABOLIM, IN",
    latitude: 15.381,
    longitude: 73.831,
    temperature_c: 32.3,
    max_temperature_c: 35.9,
    dew_point_c: 24.3,
    relative_humidity_pct: 62.8,
    heat_index_c: 38.8,
    heat_stress_index: 57.7,
    heat_risk_score: 58,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42475099999",
    station_name: "Agra",
    full_name: "AGRA KHERIA, IN",
    latitude: 27.156,
    longitude: 77.961,
    temperature_c: 34.9,
    max_temperature_c: 41.7,
    dew_point_c: 14.9,
    relative_humidity_pct: 30.2,
    heat_index_c: 34.6,
    heat_stress_index: 57.1,
    heat_risk_score: 57,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42182099999",
    station_name: "New Delhi Safdarjung",
    full_name: "NEW DELHI SAFDARJUNG, IN",
    latitude: 28.583,
    longitude: 77.2,
    temperature_c: 34.9,
    max_temperature_c: 41.5,
    dew_point_c: 15.6,
    relative_humidity_pct: 31.5,
    heat_index_c: 34.9,
    heat_stress_index: 56.5,
    heat_risk_score: 56,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42379099999",
    station_name: "Churu",
    full_name: "CHURU, IN",
    latitude: 28.29,
    longitude: 74.97,
    temperature_c: 36.6,
    max_temperature_c: 42.8,
    dew_point_c: 9.6,
    relative_humidity_pct: 19.5,
    heat_index_c: 34.8,
    heat_stress_index: 55.8,
    heat_risk_score: 56,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42821099999",
    station_name: "Surat",
    full_name: "SURAT, IN",
    latitude: 21.114,
    longitude: 72.742,
    temperature_c: 31.2,
    max_temperature_c: 34.6,
    dew_point_c: 24.6,
    relative_humidity_pct: 68.0,
    heat_index_c: 37.4,
    heat_stress_index: 56.0,
    heat_risk_score: 56,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 2,
    profile_code: "Profile D",
    profile_title: "Extreme Heat & Moisture",
    vulnerability_tier: "High",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42339099999",
    station_name: "Jaipur",
    full_name: "JAIPUR SANGANER, IN",
    latitude: 26.824,
    longitude: 75.812,
    temperature_c: 35.9,
    max_temperature_c: 40.8,
    dew_point_c: 9.7,
    relative_humidity_pct: 20.3,
    heat_index_c: 34.1,
    heat_stress_index: 52.6,
    heat_risk_score: 53,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42671099999",
    station_name: "Rajkot",
    full_name: "RAJKOT, IN",
    latitude: 22.309,
    longitude: 70.78,
    temperature_c: 35.0,
    max_temperature_c: 41.3,
    dew_point_c: 12.3,
    relative_humidity_pct: 25.5,
    heat_index_c: 33.8,
    heat_stress_index: 51.8,
    heat_risk_score: 52,
    tier_badge: "HIGH",
    tier_name: "High Risk",
    color: "#F97316",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "High",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42369099999",
    station_name: "Bikaner",
    full_name: "BIKANER, IN",
    latitude: 28.07,
    longitude: 73.35,
    temperature_c: 36.7,
    max_temperature_c: 42.6,
    dew_point_c: 3.5,
    relative_humidity_pct: 12.7,
    heat_index_c: 34.0,
    heat_stress_index: 50.1,
    heat_risk_score: 50,
    tier_badge: "MODERATE",
    tier_name: "Moderate Risk",
    color: "#F59E0B",
    cluster_id: 1,
    profile_code: "Profile C",
    profile_title: "High Thermal Stress",
    vulnerability_tier: "Moderate",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "43128099999",
    station_name: "Hyderabad",
    full_name: "HYDERABAD AIRPORT, IN",
    latitude: 17.24,
    longitude: 78.43,
    temperature_c: 33.7,
    max_temperature_c: 37.3,
    dew_point_c: 14.6,
    relative_humidity_pct: 31.8,
    heat_index_c: 33.2,
    heat_stress_index: 50.0,
    heat_risk_score: 50,
    tier_badge: "MODERATE",
    tier_name: "Moderate Risk",
    color: "#F59E0B",
    cluster_id: 3,
    profile_code: "Profile B",
    profile_title: "Emerging Heat Stress",
    vulnerability_tier: "Moderate",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42111099999",
    station_name: "Dehradun",
    full_name: "DEHRADUN, IN",
    latitude: 30.326,
    longitude: 78.032,
    temperature_c: 30.3,
    max_temperature_c: 35.1,
    dew_point_c: 17.8,
    relative_humidity_pct: 47.0,
    heat_index_c: 31.1,
    heat_stress_index: 47.7,
    heat_risk_score: 48,
    tier_badge: "MODERATE",
    tier_name: "Moderate Risk",
    color: "#F59E0B",
    cluster_id: 3,
    profile_code: "Profile B",
    profile_title: "Emerging Heat Stress",
    vulnerability_tier: "Moderate",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "43314099999",
    station_name: "Coimbatore",
    full_name: "COIMBATORE PEELAMEDU, IN",
    latitude: 11.03,
    longitude: 77.043,
    temperature_c: 30.3,
    max_temperature_c: 34.1,
    dew_point_c: 19.1,
    relative_humidity_pct: 51.3,
    heat_index_c: 31.7,
    heat_stress_index: 46.8,
    heat_risk_score: 47,
    tier_badge: "MODERATE",
    tier_name: "Moderate Risk",
    color: "#F59E0B",
    cluster_id: 3,
    profile_code: "Profile B",
    profile_title: "Emerging Heat Stress",
    vulnerability_tier: "Moderate",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "43057099999",
    station_name: "Pune",
    full_name: "PUNE LOHEGAON, IN",
    latitude: 18.582,
    longitude: 73.919,
    temperature_c: 32.1,
    max_temperature_c: 36.1,
    dew_point_c: 13.2,
    relative_humidity_pct: 31.7,
    heat_index_c: 31.1,
    heat_stress_index: 45.2,
    heat_risk_score: 45,
    tier_badge: "MODERATE",
    tier_name: "Moderate Risk",
    color: "#F59E0B",
    cluster_id: 3,
    profile_code: "Profile B",
    profile_title: "Emerging Heat Stress",
    vulnerability_tier: "Moderate",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42754099999",
    station_name: "Indore",
    full_name: "INDORE, IN",
    latitude: 22.722,
    longitude: 75.801,
    temperature_c: 31.2,
    max_temperature_c: 34.4,
    dew_point_c: 15.3,
    relative_humidity_pct: 38.4,
    heat_index_c: 30.9,
    heat_stress_index: 44.8,
    heat_risk_score: 45,
    tier_badge: "MODERATE",
    tier_name: "Moderate Risk",
    color: "#F59E0B",
    cluster_id: 3,
    profile_code: "Profile B",
    profile_title: "Emerging Heat Stress",
    vulnerability_tier: "Moderate",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42777099999",
    station_name: "Bhopal",
    full_name: "BHOPAL BAIRAGARH, IN",
    latitude: 23.287,
    longitude: 77.337,
    temperature_c: 29.1,
    max_temperature_c: 32.9,
    dew_point_c: 16.9,
    relative_humidity_pct: 47.9,
    heat_index_c: 29.5,
    heat_stress_index: 43.8,
    heat_risk_score: 44,
    tier_badge: "MODERATE",
    tier_name: "Moderate Risk",
    color: "#F59E0B",
    cluster_id: 3,
    profile_code: "Profile B",
    profile_title: "Emerging Heat Stress",
    vulnerability_tier: "Moderate",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "43014099999",
    station_name: "Aurangabad",
    full_name: "AURANGABAD CHIKALTHANA, IN",
    latitude: 19.863,
    longitude: 75.398,
    temperature_c: 30.7,
    max_temperature_c: 34.4,
    dew_point_c: 14.2,
    relative_humidity_pct: 36.5,
    heat_index_c: 30.1,
    heat_stress_index: 42.9,
    heat_risk_score: 43,
    tier_badge: "MODERATE",
    tier_name: "Moderate Risk",
    color: "#F59E0B",
    cluster_id: 3,
    profile_code: "Profile B",
    profile_title: "Emerging Heat Stress",
    vulnerability_tier: "Moderate",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42619099999",
    station_name: "Ranchi",
    full_name: "RANCHI, IN",
    latitude: 23.314,
    longitude: 85.322,
    temperature_c: 30.1,
    max_temperature_c: 34.1,
    dew_point_c: 13.2,
    relative_humidity_pct: 35.6,
    heat_index_c: 29.3,
    heat_stress_index: 39.9,
    heat_risk_score: 40,
    tier_badge: "MODERATE",
    tier_name: "Moderate Risk",
    color: "#F59E0B",
    cluster_id: 3,
    profile_code: "Profile B",
    profile_title: "Emerging Heat Stress",
    vulnerability_tier: "Moderate",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "43295099999",
    station_name: "Bangalore",
    full_name: "BANGALORE AIRPORT, IN",
    latitude: 13.198,
    longitude: 77.706,
    temperature_c: 27.0,
    max_temperature_c: 30.2,
    dew_point_c: 17.9,
    relative_humidity_pct: 57.7,
    heat_index_c: 27.9,
    heat_stress_index: 39.1,
    heat_risk_score: 39,
    tier_badge: "MODERATE",
    tier_name: "Moderate Risk",
    color: "#F59E0B",
    cluster_id: 3,
    profile_code: "Profile B",
    profile_title: "Emerging Heat Stress",
    vulnerability_tier: "Moderate",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42027099999",
    station_name: "Srinagar",
    full_name: "SRINAGAR AIRPORT, IN",
    latitude: 34.0,
    longitude: 74.774,
    temperature_c: 20.2,
    max_temperature_c: 24.1,
    dew_point_c: 4.6,
    relative_humidity_pct: 36.0,
    heat_index_c: 19.2,
    heat_stress_index: 11.8,
    heat_risk_score: 12,
    tier_badge: "LOW",
    tier_name: "Low Risk",
    color: "#10B981",
    cluster_id: 0,
    profile_code: "Profile A",
    profile_title: "Lower Heat Stress",
    vulnerability_tier: "Low",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42103099999",
    station_name: "Shimla",
    full_name: "SHIMLA, IN",
    latitude: 31.105,
    longitude: 77.173,
    temperature_c: 18.7,
    max_temperature_c: 21.6,
    dew_point_c: 4.8,
    relative_humidity_pct: 39.8,
    heat_index_c: 17.7,
    heat_stress_index: 8.4,
    heat_risk_score: 8,
    tier_badge: "LOW",
    tier_name: "Low Risk",
    color: "#10B981",
    cluster_id: 0,
    profile_code: "Profile A",
    profile_title: "Lower Heat Stress",
    vulnerability_tier: "Low",
    peak_danger_window: "12:30 PM – 3:00 PM"
  },
  {
    station_id: "42034099999",
    station_name: "Leh",
    full_name: "LEH AIRPORT, IN",
    latitude: 34.136,
    longitude: 77.546,
    temperature_c: 8.7,
    max_temperature_c: 13.0,
    dew_point_c: -0.3,
    relative_humidity_pct: 53.2,
    heat_index_c: 7.0,
    heat_stress_index: 0.0,
    heat_risk_score: 5,
    tier_badge: "LOW",
    tier_name: "Low Risk",
    color: "#10B981",
    cluster_id: 0,
    profile_code: "Profile A",
    profile_title: "Lower Heat Stress",
    vulnerability_tier: "Low",
    peak_danger_window: "12:30 PM – 3:00 PM"
  }
];

export function findNearestStationOffline(userLat: number, userLon: number): NearestStationResponse {
  let nearest = OFFLINE_STATIONS[0];
  let minDistance = Infinity;

  for (const st of OFFLINE_STATIONS) {
    const dist = haversineDistanceKm(userLat, userLon, st.latitude, st.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = st;
    }
  }

  const assessment = getOfflineSafetyAssessment(nearest.station_id);

  return {
    nearest_station_id: nearest.station_id,
    nearest_station_name: nearest.full_name,
    distance_km: minDistance,
    user_coordinates: { latitude: userLat, longitude: userLon },
    station_coordinates: { latitude: nearest.latitude, longitude: nearest.longitude },
    risk_assessment: assessment,
    is_live_gps: true
  };
}

export function getOfflineSafetyAssessment(stationId: string): SafetyRiskAssessment {
  const st = OFFLINE_STATIONS.find(s => s.station_id === stationId) || OFFLINE_STATIONS[0];
  const risk = st.heat_risk_score;

  let urgency: 'normal' | 'caution' | 'warning' | 'alert' | 'emergency' = 'normal';
  let bg_light = 'bg-emerald-500/10';
  let border_color = 'border-emerald-500/30';
  let summary = 'Comfortable seasonal temperatures. Safe outdoor activity.';

  if (risk > 90) {
    urgency = 'emergency';
    bg_light = 'bg-purple-500/10';
    border_color = 'border-purple-500/30';
    summary = 'Extreme heat emergency! Imminent danger of heatstroke.';
  } else if (risk > 75) {
    urgency = 'alert';
    bg_light = 'bg-red-500/10';
    border_color = 'border-red-500/30';
    summary = 'Severe heat hazard. Sunstroke likely during prolonged physical exertion.';
  } else if (risk > 50) {
    urgency = 'warning';
    bg_light = 'bg-orange-500/10';
    border_color = 'border-orange-500/30';
    summary = 'Dangerous heat stress levels. Heat cramps and fatigue probable.';
  } else if (risk > 25) {
    urgency = 'caution';
    bg_light = 'bg-amber-500/10';
    border_color = 'border-amber-500/30';
    summary = 'Moderate heat discomfort. Precautions recommended for vulnerable groups.';
  }

  return {
    station_id: st.station_id,
    station_name: st.full_name,
    latitude: st.latitude,
    longitude: st.longitude,
    heat_risk_score: st.heat_risk_score,
    tier_name: st.tier_name,
    tier_badge: st.tier_badge,
    urgency_level: urgency,
    color: st.color,
    bg_light,
    border_color,
    summary_headline: summary,
    danger_explanation: `Thermal conditions in ${st.station_name} are driven by ambient temperature of ${st.temperature_c}°C, peak daytime radiation up to ${st.max_temperature_c}°C, and relative humidity of ${st.relative_humidity_pct}%. ${st.relative_humidity_pct > 55 ? 'High moisture suppresses sweat evaporation, triggering wet-bulb fatigue.' : 'Direct radiant solar heating causes rapid dehydration.'}`,
    peak_danger_window: st.peak_danger_window,
    current_weather: {
      temperature_c: st.temperature_c,
      max_temperature_c: st.max_temperature_c,
      dew_point_c: st.dew_point_c,
      relative_humidity_pct: st.relative_humidity_pct,
      heat_index_c: st.heat_index_c,
      wind_speed_kmh: 12.0
    },
    immediate_actions: [
      { id: 'act-1', text: 'Drink at least 2.5 to 3.5 liters of clean water and electrolyte solution today.', done: false },
      { id: 'act-2', text: `Stay in shaded or ventilated indoor areas during the peak danger hours (${st.peak_danger_window}).`, done: false },
      { id: 'act-3', text: 'Wear loose-fitting, light-colored cotton clothing and cover head with a damp cloth outdoors.', done: false },
      { id: 'act-4', text: 'Check on elderly family members, young children, and outdoor workers regularly.', done: false },
      { id: 'act-5', text: 'Never leave children, elderly persons, or pets in a parked vehicle.', done: false }
    ],
    persona_advice: [
      {
        persona_id: 'outdoor_worker',
        title: 'Outdoor & Farm Workers',
        icon: '🧑‍🌾',
        vulnerability_reason: 'Continuous direct solar radiation and physical exertion.',
        tailored_steps: [
          'Shift heavy digging and field labor to early morning (before 9:00 AM).',
          'Enforce mandatory 15-minute shaded rest breaks for every 45 minutes of work.',
          'Keep an earthen pot (matka) with cool water and oral rehydration salts nearby.'
        ]
      },
      {
        persona_id: 'elderly',
        title: 'Senior Citizens (65+)',
        icon: '👴',
        vulnerability_reason: 'Reduced physiological thirst perception and cardiovascular reserve.',
        tailored_steps: [
          'Stay in the coolest, most ventilated room; use wet towels or misting fans.',
          'Drink half a glass of water every hour on a strict schedule.',
          'Review medications with healthcare providers (blood pressure pills, diuretics).'
        ]
      },
      {
        persona_id: 'child',
        title: 'Infants & Children',
        icon: '👶',
        vulnerability_reason: 'Immature thermoregulatory mechanisms and rapid dehydration.',
        tailored_steps: [
          'Do not schedule outdoor school play or sports during peak hours.',
          'Dress in single-layer loose cotton; keep strollers well ventilated.',
          'Offer frequent breast milk, formula, or water sips throughout the day.'
        ]
      },
      {
        persona_id: 'delivery_worker',
        title: 'Delivery & Gig Riders',
        icon: '🛵',
        vulnerability_reason: 'Urban asphalt radiates up to 10°C higher than ambient air.',
        tailored_steps: [
          'Wear a damp cotton bandana under the helmet to cool neck arteries.',
          'Rest under overpass bridges or air-conditioned shopping malls between deliveries.',
          'Carry an insulated water bottle with salt and lemon.'
        ]
      },
      {
        persona_id: 'construction_worker',
        title: 'Construction Laborers',
        icon: '🏗️',
        vulnerability_reason: 'Heavy PPE and reflective concrete surfaces trap thermal energy.',
        tailored_steps: [
          'Mandate shaded rest shelters with active air circulation on all job sites.',
          'Implement a buddy system to spot signs of slurred speech or dizziness.',
          'Cease high-altitude scaffolding work between 12:00 PM and 3:30 PM.'
        ]
      },
      {
        persona_id: 'athlete',
        title: 'Runners & Athletes',
        icon: '🏃',
        vulnerability_reason: 'High metabolic heat generation exceeding evaporative sweat limits.',
        tailored_steps: [
          'Complete all outdoor runs before 7:30 AM or after 7:30 PM.',
          'Consume 500ml of electrolyte fluid 30 minutes prior to training.',
          'Immediately stop training if experiencing nausea, headache, or chills.'
        ]
      },
      {
        persona_id: 'no_cooling',
        title: 'Homes Without AC',
        icon: '🏠',
        vulnerability_reason: 'Heat builds up under tin, asbestos, or uninsulated roofs.',
        tailored_steps: [
          'Hang wet bedsheets across open windows and doorways to produce evaporative cooling.',
          'Spend the hottest afternoon hours in public libraries, malls, or cooling centers.',
          'Sleep on lower floors or well-ventilated open terraces at night.'
        ]
      }
    ],
    emergency_numbers: [
      { label: 'Medical Ambulance Helpline', number: '108' },
      { label: 'National Emergency Service', number: '112' },
      { label: 'Disaster Management Authority', number: '1078' }
    ]
  };
}

export function getOfflineDailyBrief(stationId: string): DailyHeatBrief {
  const st = OFFLINE_STATIONS.find(s => s.station_id === stationId) || OFFLINE_STATIONS[0];
  const hsi = st.heat_stress_index;

  return {
    station_name: st.full_name,
    headline: `Daily Heat Brief for ${st.station_name}`,
    trend_summary: hsi >= 70
      ? 'Today thermal stress is significantly elevated. Severe heat precautions in effect.'
      : 'Moderate to high pre-monsoon heat peak expected today. Hydration precautions advised.',
    peak_risk_window: st.peak_danger_window,
    best_outdoor_window: '6:30 AM – 8:30 AM or after 6:30 PM',
    max_temperature_c: st.max_temperature_c,
    humidity_pct: st.relative_humidity_pct,
    feels_like_c: st.heat_index_c,
    target_hydration_liters: st.heat_risk_score > 65 ? 3.5 : 2.5,
    morning_reminder: 'Drink 2 full glasses of water before leaving home. Reapply sunscreen and carry an umbrella.'
  };
}

export function getOfflineCoolingCenters(stationId: string): CoolingCenter[] {
  const st = OFFLINE_STATIONS.find(s => s.station_id === stationId) || OFFLINE_STATIONS[0];
  return [
    {
      name: `District Red Cross Heat Shelter & Hydration Hub (${st.station_name})`,
      type: 'cooling_shelter',
      address: 'Civil Lines, Near Collectorate Office',
      hours: '9:00 AM – 7:30 PM',
      distance_km: 1.4,
      has_ac: true,
      has_water: true,
      has_meds: true,
      status: 'open',
      capacity_current: 34,
      capacity_total: 80,
      is_verified_today: true,
      water_refill_available: true,
      last_updated_time: '12 mins ago'
    },
    {
      name: `Central Bus Stand Air-Cooled Passenger Concourse`,
      type: 'transit_hub',
      address: 'Main Transport Terminus',
      hours: '24 Hours',
      distance_km: 1.1,
      has_ac: true,
      has_water: true,
      has_meds: false,
      status: 'crowded',
      capacity_current: 92,
      capacity_total: 100,
      is_verified_today: true,
      water_refill_available: true,
      last_updated_time: '25 mins ago'
    },
    {
      name: `Municipal Pyaau (Free Chilled Water Station)`,
      type: 'water_point',
      address: 'Clock Tower Market Square',
      hours: '7:00 AM – 9:00 PM',
      distance_km: 0.7,
      has_ac: false,
      has_water: true,
      has_meds: false,
      status: 'open',
      capacity_current: 12,
      capacity_total: 50,
      is_verified_today: true,
      water_refill_available: true,
      last_updated_time: '5 mins ago'
    },
    {
      name: `Civil Hospital - Emergency Heat Ward`,
      type: 'hospital',
      address: 'Hospital Road, Civil Lines',
      hours: '24 Hours Emergency',
      distance_km: 2.2,
      has_ac: true,
      has_water: true,
      has_meds: true,
      status: 'open',
      capacity_current: 18,
      capacity_total: 40,
      is_verified_today: true,
      water_refill_available: true,
      last_updated_time: 'Just now'
    }
  ];
}

export function getOfflineAllStationsLive(): AllStationsLiveResponse {
  const tier_counts = {
    extreme: 0,
    very_high: 0,
    high: 0,
    moderate: 0,
    low: 0
  };

  let totalTemp = 0;
  for (const st of OFFLINE_STATIONS) {
    totalTemp += st.temperature_c;
    if (st.tier_badge === 'EXTREME') tier_counts.extreme++;
    else if (st.tier_badge === 'VERY HIGH') tier_counts.very_high++;
    else if (st.tier_badge === 'HIGH') tier_counts.high++;
    else if (st.tier_badge === 'MODERATE') tier_counts.moderate++;
    else tier_counts.low++;
  }

  const meanTemp = Math.round((totalTemp / OFFLINE_STATIONS.length) * 10) / 10;
  const sorted = [...OFFLINE_STATIONS].sort((a, b) => b.heat_risk_score - a.heat_risk_score);

  return {
    total_stations: OFFLINE_STATIONS.length,
    stations: sorted,
    tier_counts,
    mean_temperature_c: meanTemp,
    hottest_station: sorted[0].station_name
  };
}

export function evaluateOfflineActivity(data: ActivityEvaluationRequest): ActivityEvaluationResult {
  const st = OFFLINE_STATIONS.find(s => s.station_id === data.station_id) || OFFLINE_STATIONS[0];
  const isPeak = data.planned_hour >= 11 && data.planned_hour <= 16;
  const isStrenuous = ['run', 'jog', 'cricket', 'football', 'labor', 'construction'].some(k =>
    data.activity.toLowerCase().includes(k)
  );

  if (isPeak && (st.heat_risk_score > 50 || isStrenuous)) {
    return {
      activity: data.activity,
      planned_time: `${data.planned_hour}:00`,
      duration_mins: data.duration_mins,
      verdict: 'DANGEROUS',
      badge: 'HIGH EXPOSURE HAZARD',
      color: '#EF4444',
      explanation: `Planning '${data.activity}' at ${data.planned_hour}:00 overlaps directly with peak solar radiation and simulated temperatures near ${st.max_temperature_c}°C in ${st.station_name}. Acute risk of heat exhaustion.`,
      recommended_action: `Reschedule '${data.activity}' to early morning (before 8:30 AM) or after sunset.`,
      safer_alternatives: [
        { slot: '06:30 AM – 08:00 AM', expected_temp: `${st.temperature_c - 4}°C`, rating: 'Optimal (Low Thermal Strain)' },
        { slot: '07:00 PM – 08:30 PM', expected_temp: `${st.temperature_c - 1}°C`, rating: 'Safer (Post-Sunset Recovery)' }
      ]
    };
  }

  return {
    activity: data.activity,
    planned_time: `${data.planned_hour}:00`,
    duration_mins: data.duration_mins,
    verdict: 'SAFE',
    badge: 'FAVORABLE WINDOW',
    color: '#10B981',
    explanation: `Conditions at ${data.planned_hour}:00 in ${st.station_name} are manageable. Solar radiation is moderate.`,
    recommended_action: 'Safe to proceed. Drink 500ml of water before starting.',
    safer_alternatives: []
  };
}

export function checkOfflineSymptoms(symptoms: string[]): SymptomCheckResult {
  const symSet = new Set(symptoms.map(s => s.toLowerCase()));

  if (symSet.has('confused_faint') || symSet.has('fainting') || symSet.has('confusion') || symSet.has('vomiting')) {
    return {
      triage_tier: 'EMERGENCY',
      badge: '🚨 IMMEDIATE MEDICAL ALERT',
      color: '#DC2626',
      urgency: 'critical',
      primary_directive: 'Potential Heat Stroke! Call 108 immediately.',
      action_steps: [
        'Move person into air-conditioned room or dense shade immediately.',
        'Strip outer clothing and sponge body with cold water.',
        'Fan vigorously to accelerate evaporative heat loss.',
        'Place ice packs or cold wet towels on neck, armpits, and groin.',
        'DO NOT give liquids if the person is semi-conscious.'
      ],
      emergency_call_number: '108'
    };
  }

  if (symSet.has('dizzy') || symSet.has('headache') || symSet.has('very_hot')) {
    return {
      triage_tier: 'WARNING',
      badge: '⚠️ HEAT EXHAUSTION WARNING',
      color: '#F97316',
      urgency: 'high',
      primary_directive: 'Stop all exertion immediately. Rest in cool shade and rehydrate.',
      action_steps: [
        'Sit or lie down in an air-conditioned room or breezy shade.',
        'Sip cool water mixed with Oral Rehydration Salts (ORS) or electrolytes.',
        'Elevate feet slightly to promote cardiovascular venous return.',
        'If dizziness does not improve within 30 minutes, seek emergency medical care.'
      ],
      emergency_call_number: '108'
    };
  }

  return {
    triage_tier: 'NORMAL',
    badge: '✅ STABLE / MILD STRAIN',
    color: '#10B981',
    urgency: 'low',
    primary_directive: 'Body is handling thermal conditions normally. Maintain baseline hydration.',
    action_steps: [
      'Drink 1 full glass of water.',
      'Take a 10-minute shaded break if working outside.',
      'Continue monitoring for fatigue or thirst.'
    ],
    emergency_call_number: '108'
  };
}

export function getOfflineFamilyStatus(members: FamilyMemberRecord[]): FamilyMemberStatus[] {
  return members.map((m, idx) => {
    const st = OFFLINE_STATIONS.find(s => s.station_id === m.station_id) || OFFLINE_STATIONS[0];
    const risk = st.heat_risk_score;
    const tier = risk >= 85 ? 'Extreme' : risk >= 70 ? 'Very High' : risk >= 50 ? 'High' : 'Moderate';
    const badge_color = risk >= 85 ? '#7C3AED' : risk >= 70 ? '#EF4444' : risk >= 50 ? '#F97316' : '#F59E0B';

    return {
      id: m.id || `fam-${idx + 1}`,
      name: m.name,
      relationship: m.relationship,
      station_id: st.station_id,
      city_name: st.station_name,
      phone_number: m.phone_number,
      heat_risk_score: risk,
      tier,
      badge_color,
      temperature_c: st.temperature_c,
      feels_like_c: st.heat_index_c,
      humidity_pct: st.relative_humidity_pct,
      status_note: risk >= 70 ? 'Dangerous afternoon heat. Remind to stay indoors and drink fluids.' : 'Normal seasonal warmth.',
      needs_attention: risk >= 70
    };
  });
}

export function getOfflineAssistantChat(stationId: string, query: string): AssistantChatResponse {
  const st = OFFLINE_STATIONS.find(s => s.station_id === stationId) || OFFLINE_STATIONS[0];
  const qLower = query.toLowerCase();
  let answer = "";
  if (qLower.includes("water") || qLower.includes("drink") || qLower.includes("hydrat")) {
    answer = `[Offline GPS Mode] For ${st.station_name} with feels-like temperature of ${st.heat_index_c}°C, drink at least 250-300 ml of water every 30 minutes. Add electrolytes or ORS if sweating heavily.`;
  } else if (qLower.includes("outdoor") || qLower.includes("run") || qLower.includes("walk") || qLower.includes("work")) {
    answer = `[Offline GPS Mode] In ${st.station_name}, peak risk hours are ${st.peak_danger_window}. Avoid intense outdoor exertion during these hours. Shift heavy physical activity to before 10:00 AM or after 5:30 PM.`;
  } else if (qLower.includes("symptom") || qLower.includes("dizzy") || qLower.includes("faint") || qLower.includes("stroke")) {
    answer = `[Offline GPS Mode] Dizziness, cessation of sweating, confusion, and vomiting indicate emergency heat strain. Move to a cool area, loosen clothing, apply cold water to neck/underarms, and call 108 immediately.`;
  } else {
    answer = `[Offline GPS Mode] HeatShield AI for ${st.station_name}: Current Heat Index is ${st.heat_index_c}°C (${st.tier_name}). Risk score is ${st.heat_risk_score}/100. Stay shaded, maintain continuous hydration, and check on vulnerable family members.`;
  }
  return {
    query,
    answer,
    risk_tier: st.tier_name,
    action_suggestion: `Peak hazard window: ${st.peak_danger_window}. Stay protected.`
  };
}

export function interpolateLocationFeaturesOffline(
  userLat: number,
  userLon: number,
  accuracyM: number = 18,
  k: number = 4,
  p: number = 2.0
): LocationPredictionResponse {
  const distances = OFFLINE_STATIONS.map(st => ({
    station: st,
    distanceKm: haversineDistanceKm(userLat, userLon, st.latitude, st.longitude)
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  const topK = distances.slice(0, Math.min(k, distances.length));

  // Compute IDW weights: w_i = 1 / (d_i + eps)^p
  const eps = 0.05;
  const rawWeights = topK.map(item => 1.0 / Math.pow(item.distanceKm + eps, p));
  const sumWeights = rawWeights.reduce((a, b) => a + b, 0);
  const normWeights = rawWeights.map(w => w / sumWeights);

  const stationsUsed: StationUsed[] = topK.map((item, idx) => ({
    station_id: item.station.station_id,
    name: item.station.station_name,
    distance_km: item.distanceKm,
    weight_pct: Math.round(normWeights[idx] * 1000) / 10,
    temperature_c: item.station.temperature_c,
    heat_index_c: item.station.heat_index_c
  }));

  // Interpolated thermal variables
  const interpTemp = Math.round(topK.reduce((acc, item, idx) => acc + item.station.temperature_c * normWeights[idx], 0) * 10) / 10;
  const interpMaxTemp = Math.round(topK.reduce((acc, item, idx) => acc + item.station.max_temperature_c * normWeights[idx], 0) * 10) / 10;
  const interpDewPoint = Math.round(topK.reduce((acc, item, idx) => acc + item.station.dew_point_c * normWeights[idx], 0) * 10) / 10;
  const interpRh = Math.round(topK.reduce((acc, item, idx) => acc + item.station.relative_humidity_pct * normWeights[idx], 0) * 10) / 10;

  // Calculate Rothfusz Heat Index
  const tf = interpTemp * 1.8 + 32.0;
  const hiF =
    -42.379 +
    2.04901523 * tf +
    10.14333127 * interpRh -
    0.22475541 * tf * interpRh -
    0.00683783 * tf * tf -
    0.05481717 * interpRh * interpRh +
    0.00122874 * tf * tf * interpRh +
    0.00085282 * tf * interpRh * interpRh -
    0.00000199 * tf * tf * interpRh * interpRh;
  const heatIndexC = Math.round(((hiF - 32.0) / 1.8) * 10) / 10;

  // Continuous HSI
  const hsi = Math.round((0.5 * interpTemp + 0.4 * heatIndexC + 0.1 * interpMaxTemp - 0.05 * 12.0) * 10) / 10;
  const riskScore = Math.max(5, Math.min(99, Math.round(hsi)));

  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'EXTREME';
  if (riskScore <= 25) riskLevel = 'LOW';
  else if (riskScore <= 50) riskLevel = 'MODERATE';
  else if (riskScore <= 75) riskLevel = 'HIGH';
  else if (riskScore <= 90) riskLevel = 'VERY HIGH';
  else riskLevel = 'EXTREME';

  const dominantStation = topK[0].station;
  const clusterId = dominantStation.cluster_id;
  const profile = dominantStation.profile_code;
  const profileTitle = dominantStation.profile_title;

  const minD = topK[0].distanceKm;
  const temps = topK.map(t => t.station.temperature_c);
  const meanT = temps.reduce((a, b) => a + b, 0) / temps.length;
  const tempSpread = Math.sqrt(temps.reduce((acc, t) => acc + Math.pow(t - meanT, 2), 0) / temps.length);
  const confidenceScore = Math.max(60, Math.min(98, Math.round(96.0 - 0.12 * minD - 1.2 * tempSpread)));

  const peakWindow = riskScore >= 60 ? "11:30 AM – 4:00 PM" : "12:30 PM – 3:00 PM";

  const companionAssessment = getOfflineSafetyAssessment(dominantStation.station_id);

  return {
    location: {
      latitude: Math.round(userLat * 10000) / 10000,
      longitude: Math.round(userLon * 10000) / 10000,
      accuracy_m: accuracyM
    },
    location_source: 'GPS',
    data_source: {
      mode: 'offline',
      stations_used: stationsUsed,
      interpolation: `Inverse Distance Weighting (IDW, p=${p})`,
      provider_note: 'Local NOAA GSOD 2022–2025 multi-station IDW spatial interpolation (100% On-Device)'
    },
    weather: {
      temperature: interpTemp,
      dew_point: interpDewPoint,
      humidity: interpRh,
      wind_speed: 12.0,
      pressure: 1008.0,
      max_temperature: interpMaxTemp,
      feels_like: heatIndexC
    },
    prediction: {
      risk_score: riskScore,
      risk_level: riskLevel,
      profile,
      profile_title: profileTitle,
      cluster_id: clusterId,
      peak_window: peakWindow,
      confidence_score: confidenceScore,
      recommendations: [
        `Peak hazard window is ${peakWindow}. Minimize strenuous outdoor activities during these hours.`,
        `Current feels-like heat index is ${heatIndexC}°C. Maintain hydration rate of at least 250ml per 30 minutes of exertion.`,
        `Multi-station IDW interpolation computed from ${stationsUsed.map(s => `${s.name} (${s.weight_pct}%)`).join(', ')}.`,
        'Keep vulnerable family members and pets hydrated in well-ventilated shade.'
      ]
    },
    risk_assessment: companionAssessment
  };
}

export function getOfflineHourlyForecast(
  userLat: number,
  userLon: number,
  stationId?: string
): HourlyForecastResponse {
  let station = stationId ? OFFLINE_STATIONS.find(s => s.station_id === stationId) : undefined;
  if (!station) {
    let minDistance = Infinity;
    station = OFFLINE_STATIONS[0];
    for (const st of OFFLINE_STATIONS) {
      const dist = haversineDistanceKm(userLat, userLon, st.latitude, st.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        station = st;
      }
    }
  }

  const baseTemp = station.temperature_c;
  const maxTemp = station.max_temperature_c ?? (baseTemp + 5.5);
  const minTemp = (station as any).min_temperature_c ?? (baseTemp - 6.0);
  const baseRh = station.relative_humidity_pct;

  const hoursList = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const hourly: HourlyForecastItem[] = [];

  let peakHeatIndex = -999;
  let peakHourNum = 14;

  for (const h of hoursList) {
    const solarFactor = Math.sin(Math.max(0, Math.min(Math.PI, ((h - 6) / 9.5) * (Math.PI / 2))));
    const curTemp = Math.round((minTemp + (maxTemp - minTemp) * Math.pow(solarFactor, 1.2)) * 10) / 10;
    const curRh = Math.max(15, Math.min(95, Math.round(baseRh - (solarFactor * 22.0))));
    
    // Rothfusz Heat Index calculation
    const T = curTemp;
    const R = curRh;
    let hi = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094));
    if (hi >= 80) {
      hi = -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R
        - 6.837651e-3 * T * T - 5.481717e-2 * R * R + 1.22874e-3 * T * T * R
        + 8.5282e-4 * T * R * R - 1.99e-6 * T * T * R * R;
    }
    const heatIndexC = Math.round((T >= 27 ? Math.max(T, hi) : T) * 10) / 10;

    let tier: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
    let advice = "Safe for general outdoor activities.";
    if (heatIndexC <= 29) {
      tier = 'Low';
      advice = "Coolest part of the day. Ideal for outdoor chores.";
    } else if (heatIndexC <= 37) {
      tier = 'Moderate';
      advice = "Drink 250ml water per hour; light shade advised.";
    } else if (heatIndexC <= 44) {
      tier = 'High';
      advice = "Laborers take 15-min rest in shade per hour.";
    } else if (heatIndexC <= 53) {
      tier = 'Very High';
      advice = "Danger of heat cramps & exhaustion. Avoid direct sun.";
    } else {
      tier = 'Extreme';
      advice = "Extreme heatstroke danger. Halt outdoor exertion.";
    }

    if (heatIndexC > peakHeatIndex) {
      peakHeatIndex = heatIndexC;
      peakHourNum = h;
    }

    const formattedHour = `${h.toString().padStart(2, '0')}:00`;
    hourly.push({
      hour: formattedHour,
      hour_num: h,
      temp_c: curTemp,
      heat_index_c: heatIndexC,
      humidity_pct: curRh,
      risk_tier: tier,
      is_peak: false,
      uv_index: Math.max(1, Math.min(11, Math.round(solarFactor * 10))),
      advice
    });
  }

  for (const item of hourly) {
    if (item.hour_num === peakHourNum || item.hour_num === peakHourNum + 1) {
      item.is_peak = true;
    }
  }

  const peakStartHour = peakHourNum > 12 ? `${peakHourNum - 12}:00 PM` : `${peakHourNum}:00 AM`;
  const peakEndHour = (peakHourNum + 2) > 12 ? `${(peakHourNum + 2) - 12}:00 PM` : `${peakHourNum + 2}:00 AM`;

  let peakTier: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme' = 'Low';
  if (peakHeatIndex <= 29) peakTier = 'Low';
  else if (peakHeatIndex <= 37) peakTier = 'Moderate';
  else if (peakHeatIndex <= 44) peakTier = 'High';
  else if (peakHeatIndex <= 53) peakTier = 'Very High';
  else peakTier = 'Extreme';

  return {
    station_id: station.station_id,
    station_name: station.station_name,
    latitude: userLat,
    longitude: userLon,
    peak_window: `${peakStartHour} – ${peakEndHour}`,
    peak_heat_index_c: peakHeatIndex,
    peak_tier: peakTier,
    generated_at: new Date().toISOString(),
    hourly
  };
}

