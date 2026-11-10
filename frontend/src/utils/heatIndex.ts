/**
 * Shared biometeorological physics helpers for HeatShield AI frontend.
 * Mirrors backend/ml/physics.py as the single source of truth for
 * Rothfusz NOAA Heat Index (°C), Heat Stress Index (HSI), and risk tier thresholds.
 */

export type HeatRiskTier = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';

/**
 * Computes the official NOAA National Weather Service Heat Index in Celsius
 * using Steadman screening followed by Rothfusz regression and RH boundary adjustments.
 */
export function computeHeatIndexC(tempC: number, rhPct: number): number {
  const tC = Number(tempC);
  const rh = Math.max(0.0, Math.min(100.0, Number(rhPct)));

  const tF = (tC * 9.0) / 5.0 + 32.0;
  const hiSimple = 0.5 * (tF + 61.0 + (tF - 68.0) * 1.2 + rh * 0.094);

  let hiF: number;
  if (hiSimple < 80.0) {
    hiF = hiSimple;
  } else {
    hiF =
      -42.379 +
      2.04901523 * tF +
      10.14333127 * rh -
      0.22475541 * tF * rh -
      0.00683783 * tF * tF -
      0.05481717 * rh * rh +
      0.00122874 * tF * tF * rh +
      0.00085282 * tF * rh * rh -
      0.00000199 * tF * tF * rh * rh;

    if (rh < 13.0 && tF >= 80.0 && tF <= 112.0) {
      const adjLow =
        ((13.0 - rh) / 4.0) * Math.sqrt(Math.max(0.0, (17.0 - Math.abs(tF - 95.0)) / 17.0));
      hiF -= adjLow;
    } else if (rh > 85.0 && tF >= 80.0 && tF <= 87.0) {
      const adjHigh = ((rh - 85.0) / 10.0) * ((87.0 - tF) / 5.0);
      hiF += adjHigh;
    }
  }

  const hiC = ((hiF - 32.0) * 5.0) / 9.0;
  return Math.round(hiC * 10) / 10;
}

/**
 * Maps scalar Heat Index (°C) to the 5-tier HeatShield operational risk label.
 */
export function classifyHeatIndexTier(heatIndexC: number): HeatRiskTier {
  if (heatIndexC <= 29.0) return 'Low';
  if (heatIndexC <= 37.0) return 'Moderate';
  if (heatIndexC <= 44.0) return 'High';
  if (heatIndexC <= 53.0) return 'Very High';
  return 'Extreme';
}

/**
 * Computes clamped continuous Heat Stress Index (5..99) matching backend calibration.
 */
export function computeLiveHsi(
  tempC: number,
  heatIndexC: number,
  maxTempC: number,
  windKmh: number
): number {
  const hsi = 0.5 * tempC + 0.4 * heatIndexC + 0.1 * maxTempC - 0.05 * windKmh;
  return Math.max(5, Math.min(99, Math.round(hsi)));
}
