"""
Shared biometeorological physics helpers for HeatShield AI.
Single source of truth for scalar Rothfusz NOAA Heat Index (°C),
Heat Stress Index (HSI), and risk tier thresholds across live and offline paths.
"""

import math


def compute_heat_index_c(temp_c: float, rh_pct: float) -> float:
    """
    Computes the official NOAA National Weather Service Heat Index in Celsius
    using Steadman screening followed by Rothfusz regression and RH boundary adjustments.
    """
    t_c = float(temp_c)
    rh = max(0.0, min(100.0, float(rh_pct)))

    t_f = t_c * 9.0 / 5.0 + 32.0
    hi_simple = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (rh * 0.094))

    if hi_simple < 80.0:
        hi_f = hi_simple
    else:
        hi_f = (
            -42.379
            + 2.04901523 * t_f
            + 10.14333127 * rh
            - 0.22475541 * t_f * rh
            - 0.00683783 * (t_f ** 2)
            - 0.05481717 * (rh ** 2)
            + 0.00122874 * (t_f ** 2) * rh
            + 0.00085282 * t_f * (rh ** 2)
            - 0.00000199 * (t_f ** 2) * (rh ** 2)
        )

        if rh < 13.0 and 80.0 <= t_f <= 112.0:
            adj_low = ((13.0 - rh) / 4.0) * math.sqrt(
                max(0.0, (17.0 - abs(t_f - 95.0)) / 17.0)
            )
            hi_f -= adj_low
        elif rh > 85.0 and 80.0 <= t_f <= 87.0:
            adj_high = ((rh - 85.0) / 10.0) * ((87.0 - t_f) / 5.0)
            hi_f += adj_high

    hi_c = (hi_f - 32.0) * 5.0 / 9.0
    return round(hi_c, 1)


def classify_heat_index_tier(heat_index_c: float) -> str:
    """Maps scalar Heat Index (°C) to the 5-tier HeatShield operational risk label."""
    if heat_index_c <= 29.0:
        return "Low"
    if heat_index_c <= 37.0:
        return "Moderate"
    if heat_index_c <= 44.0:
        return "High"
    if heat_index_c <= 53.0:
        return "Very High"
    return "Extreme"


def compute_live_hsi(
    temp_c: float,
    heat_index_c: float,
    max_temp_c: float,
    wind_kmh: float,
) -> int:
    """Computes clamped continuous Heat Stress Index (5..99) matching safety engine calibration."""
    hsi = 0.5 * temp_c + 0.4 * heat_index_c + 0.1 * max_temp_c - 0.05 * wind_kmh
    return int(max(5, min(99, round(hsi))))
