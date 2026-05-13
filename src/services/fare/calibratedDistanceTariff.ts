import { calibrationOfficialFareRoutes } from "./fareData";

import type { FareRoute } from "./fareTypes";

/** When fewer than two published reference legs exist, or calibration fails. */
export const FALLBACK_PER_KM = 18;

const PER_KM_MIN = 10;

const PER_KM_MAX = 40;

/**
 * Optional floor: `fare = max(MINIMUM_FARE_PHP, round(km * perKm))`.
 * Set to 0 for pure distance-only pricing.
 */
export const MINIMUM_FARE_PHP = 0;

function median(numbers: number[]): number {
  if (numbers.length === 0) {
    return FALLBACK_PER_KM;
  }

  const s = [...numbers].sort((a, b) => a - b);

  const mid = Math.floor(s.length / 2);

  return s.length % 2 === 1
    ? s[mid]!
    : (s[mid - 1]! + s[mid]!) / 2;
}

/**
 * Median implied ₱/km from official (fare, referenceDistanceKm) pairs — no intercept.
 */
export function calibrateFlatPerKmFromRoutes(routes: FareRoute[]): number {
  const impliedRates = routes
    .filter(
      (r) =>
        r.approximateDistanceKm != null &&
        r.approximateDistanceKm > 0,
    )
    .map((r) => r.fare / r.approximateDistanceKm!)
    .filter((r) => Number.isFinite(r));

  if (impliedRates.length < 2) {
    return FALLBACK_PER_KM;
  }

  const raw = median(impliedRates);

  const clamped = Math.min(
    PER_KM_MAX,

    Math.max(PER_KM_MIN, raw),
  );

  return Math.round(clamped * 100) / 100;
}

const calibratedPerKm = calibrateFlatPerKmFromRoutes(
  calibrationOfficialFareRoutes,
);

export function getFlatPerKmRate(): number {
  return calibratedPerKm;
}

export function getFlatDistanceParams(): {
  perKm: number;

  minimumFarePhp: number;
} {
  return {
    perKm: calibratedPerKm,

    minimumFarePhp: MINIMUM_FARE_PHP,
  };
}
