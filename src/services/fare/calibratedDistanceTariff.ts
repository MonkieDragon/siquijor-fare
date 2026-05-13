import { calibrationOfficialFareRoutes } from "./fareData";

import type { FareRoute } from "./fareTypes";

const FALLBACK_BASE = 80;

const FALLBACK_PER_KM = 18;

const PER_KM_MIN = 10;

const PER_KM_MAX = 40;

type Point = { d: number; f: number };

function computeOls(points: Point[]): { base: number; perKm: number } | null {
  const n = points.length;

  if (n < 2) {
    return null;
  }

  let sD = 0;

  let sF = 0;

  let sD2 = 0;

  let sDF = 0;

  for (const { d, f } of points) {
    sD += d;

    sF += f;

    sD2 += d * d;

    sDF += d * f;
  }

  const denom = n * sD2 - sD * sD;

  if (Math.abs(denom) < 1e-9) {
    return null;
  }

  const perKm = (n * sDF - sD * sF) / denom;

  const base = (sF - perKm * sD) / n;

  return { base, perKm };
}

function medianImpliedPerKm(
  points: Point[],
  fixedBase: number,
): number | null {
  const rates = points
    .map(({ d, f }) => (f - fixedBase) / d)
    .filter((r) => Number.isFinite(r));

  if (rates.length === 0) {
    return null;
  }

  rates.sort((a, b) => a - b);

  return rates[Math.floor(rates.length / 2)]!;
}

export function calibrateTariffFromRoutes(
  routes: FareRoute[],
): { baseFare: number; perKm: number } {
  const points: Point[] = routes
    .filter(
      (r) =>
        r.approximateDistanceKm != null && r.approximateDistanceKm > 0,
    )
    .map((r) => ({ d: r.approximateDistanceKm!, f: r.fare }));

  if (points.length < 2) {
    return { baseFare: FALLBACK_BASE, perKm: FALLBACK_PER_KM };
  }

  const ols = computeOls(points);

  if (ols && ols.base >= 0 && ols.perKm > 0) {
    const perKm = Math.min(
      PER_KM_MAX,

      Math.max(PER_KM_MIN, ols.perKm),
    );

    return {
      baseFare: Math.round(ols.base * 100) / 100,

      perKm: Math.round(perKm * 100) / 100,
    };
  }

  const medianRate =
    medianImpliedPerKm(points, FALLBACK_BASE) ?? FALLBACK_PER_KM;

  const perKm = Math.min(
    PER_KM_MAX,

    Math.max(PER_KM_MIN, medianRate),
  );

  return {
    baseFare: FALLBACK_BASE,

    perKm: Math.round(perKm * 100) / 100,
  };
}

const tariff = calibrateTariffFromRoutes(calibrationOfficialFareRoutes);

export function getCalibratedDistanceTariff(): {
  baseFare: number;

  perKm: number;
} {
  return tariff;
}
