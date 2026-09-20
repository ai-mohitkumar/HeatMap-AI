"""
HeatShield AI Vulnerability Profiling and Decision Support Engine
Transforms mathematical cluster centroids into data-derived profiles:
- Profile A — Lower Heat Stress
- Profile B — Emerging Heat Stress
- Profile C — High Thermal Stress
- Profile D — Extreme Heat & Moisture
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any

class VulnerabilityProfiler:
    """
    Computes data-derived cluster biometeorological profiles and maps them to
    standardized heat-stress vulnerability categories with civil defense protocols.
    """

    PROFILE_CONFIG = {
        "A": {
            "tier": "Low",
            "title_suffix": "Profile A — Lower Heat Stress",
            "color": "#10B981", # Emerald Green
            "priority": "Low Priority"
        },
        "B": {
            "tier": "Moderate",
            "title_suffix": "Profile B — Emerging Heat Stress",
            "color": "#F59E0B", # Amber
            "priority": "Moderate Priority"
        },
        "C": {
            "tier": "High",
            "title_suffix": "Profile C — High Thermal Stress",
            "color": "#EF4444", # Coral Red
            "priority": "High Priority"
        },
        "D": {
            "tier": "Extreme",
            "title_suffix": "Profile D — Extreme Heat & Moisture",
            "color": "#7C3AED", # Deep Violet / Crimson
            "priority": "Extreme Priority"
        }
    }

    PROFILE_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"]

    @classmethod
    def generate_profiles(cls, df_with_clusters: pd.DataFrame, cluster_col: str = "cluster") -> List[Dict[str, Any]]:
        """
        Calculates cluster centroids in unscaled physical units, sorts them by empirical severity,
        and assigns data-derived Profile A..D classifications.
        """
        clusters = sorted(df_with_clusters[cluster_col].unique())
        total_records = len(df_with_clusters)
        raw_profiles = []

        for c in clusters:
            subset = df_with_clusters[df_with_clusters[cluster_col] == c]
            count = len(subset)
            pct = round((count / total_records) * 100, 1)

            avg_temp = float(subset["mean_temp_c"].mean()) if "mean_temp_c" in subset else 0.0
            max_temp = float(subset["max_temp_c"].mean()) if "max_temp_c" in subset else 0.0
            min_temp = float(subset["min_temp_c"].mean()) if "min_temp_c" in subset else 0.0
            dew_point = float(subset["dew_point_c"].mean()) if "dew_point_c" in subset else 0.0
            rh = float(subset["relative_humidity"].mean()) if "relative_humidity" in subset else 0.0
            heat_index = float(subset["heat_index_c"].mean()) if "heat_index_c" in subset else 0.0
            dtr = float(subset["temperature_range"].mean()) if "temperature_range" in subset else 0.0
            wind = float(subset["wind_speed_kmh"].mean()) if "wind_speed_kmh" in subset else 0.0
            pressure = float(subset["pressure_hpa"].mean()) if "pressure_hpa" in subset else 0.0
            hsi = float(subset["heat_stress_index"].mean()) if "heat_stress_index" in subset.columns else 50.0

            # Composite empirical heat severity index
            severity_index = (0.45 * heat_index) + (0.30 * max_temp) + (0.15 * dew_point) + (0.10 * hsi)

            raw_profiles.append({
                "cluster_id": int(c),
                "count": count,
                "percentage": pct,
                "avg_temp_c": round(avg_temp, 1),
                "max_temp_c": round(max_temp, 1),
                "min_temp_c": round(min_temp, 1),
                "dew_point_c": round(dew_point, 1),
                "relative_humidity_pct": round(rh, 1),
                "heat_index_c": round(heat_index, 1),
                "dtr_c": round(dtr, 1),
                "wind_speed_kmh": round(wind, 1),
                "pressure_hpa": round(pressure, 1),
                "mean_heat_stress_index": round(hsi, 1),
                "severity_index": severity_index
            })

        # Sort raw profiles from lowest severity to highest severity
        raw_profiles.sort(key=lambda x: x["severity_index"])
        k = len(raw_profiles)

        final_profiles = []
        for rank, p in enumerate(raw_profiles):
            letter = cls.PROFILE_LETTERS[min(rank, len(cls.PROFILE_LETTERS) - 1)]

            if k == 2:
                tier = "Low" if rank == 0 else "High"
                letter = "A" if rank == 0 else "D"
            elif k == 3:
                tier = ["Low", "Moderate", "High"][rank]
                letter = ["A", "B", "D"][rank]
            elif k == 4:
                tier = ["Low", "Moderate", "High", "Extreme"][rank]
                letter = ["A", "B", "C", "D"][rank]
            else:
                ratio = rank / (k - 1)
                if ratio <= 0.25:
                    tier = "Low"
                    letter = "A"
                elif ratio <= 0.55:
                    tier = "Moderate"
                    letter = "B"
                elif ratio <= 0.85:
                    tier = "High"
                    letter = "C"
                else:
                    tier = "Extreme"
                    letter = "D"

            cfg = cls.PROFILE_CONFIG.get(letter, cls.PROFILE_CONFIG["B"])
            desc, actions = cls._get_mitigation_plan(tier, letter, p)

            p_enriched = {
                **p,
                "rank": rank + 1,
                "profile_code": f"Profile {letter}",
                "vulnerability_tier": tier,
                "priority_level": cfg["priority"],
                "color_code": cfg["color"],
                "title": f"Cluster {p['cluster_id']} — {cfg['title_suffix']}",
                "description": desc,
                "actionable_recommendations": actions
            }
            final_profiles.append(p_enriched)

        final_profiles.sort(key=lambda x: x["cluster_id"])
        return final_profiles

    @staticmethod
    def _get_mitigation_plan(tier: str, letter: str, stats: Dict[str, Any]) -> tuple:
        avg_t = stats["avg_temp_c"]
        max_t = stats["max_temp_c"]
        hi = stats["heat_index_c"]
        dewp = stats["dew_point_c"]
        rh = stats["relative_humidity_pct"]
        wind = stats["wind_speed_kmh"]
        hsi = stats.get("mean_heat_stress_index", 50.0)

        if letter == "A" or tier == "Low":
            desc = (
                f"Profile A (Lower Heat Stress): Moderate temperatures (mean {avg_t}°C, peak {max_t}°C) "
                f"accompanied by active boundary-layer ventilation ({wind} km/h). Heat Stress Index averages {hsi:.1f}/100. "
                f"Presents minimal physiological heat strain."
            )
            actions = [
                "Routine baseline meteorological surveillance.",
                "Maintain standard public water access points.",
                "Standard workplace safety without mandatory work-hour restrictions."
            ]
        elif letter == "B" or tier == "Moderate":
            desc = (
                f"Profile B (Emerging Heat Stress): Elevated temperature conditions (mean {avg_t}°C, highs {max_t}°C) "
                f"with moderate humidity (dew point {dewp}°C). Heat Stress Index stands at {hsi:.1f}/100. "
                f"Early heat stress caution required during peak midday hours."
            )
            actions = [
                "Issue yellow heat advisories for outdoor labor and vulnerable populations.",
                "Enforce mandatory shade breaks and water distribution between 12:00–15:00.",
                "Inspect emergency department oral rehydration supply reserves."
            ]
        elif letter == "C" or tier == "High":
            desc = (
                f"Profile C (High Thermal Stress): Persistent severe daytime heat (afternoon maximums averaging {max_t}°C) "
                f"with wide diurnal swings and apparent Heat Index of {hi}°C (HSI: {hsi:.1f}/100). High risk of dehydration and heat exhaustion."
            )
            actions = [
                "Issue municipal orange heat alerts.",
                "Open designated air-conditioned public cooling shelters.",
                "Restrict heavy outdoor construction and field labor from 11:00 to 16:30.",
                "Alert electrical grid dispatchers for surging cooling loads."
            ]
        else: # Profile D / Extreme
            desc = (
                f"Profile D (Extreme Heat & Moisture): COMPOUND HEAT-STRESS PROFILE. Elevated afternoon temperatures ({max_t}°C) "
                f"combined with high dew points ({dewp}°C, RH {rh}%) and suppressed ventilation ({wind} km/h). "
                f"Apparent Heat Index reaches {hi}°C (HSI: {hsi:.1f}/100), creating conditions of high environmental thermal burden."
            )
            actions = [
                "Recommended Mitigation Considerations: Profile D indicates conditions warranting enhanced regional heat-safety measures.",
                "Consider shorter work/rest cycles and continuous access to potable hydration for outdoor workforce.",
                "Provide shaded recovery areas and active ventilation to facilitate human evaporative cooling.",
                "Encourage worker acclimatization and schedule strenuous field tasks during cooler early-morning hours.",
                "Establish public cooling centers and inspect emergency oral rehydration reserves across vulnerable districts."
            ]

        return desc, actions
