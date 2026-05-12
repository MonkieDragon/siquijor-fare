import type { FareRoute } from "./fareTypes";

export const DEFAULT_FARE_HUB = "San Juan";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

export function findInterpolationReference(
  routes: FareRoute[],
  startName: string,
  endName: string,
  defaultHub: string = DEFAULT_FARE_HUB,
): FareRoute | null {
  const endN = norm(endName);

  const startN = norm(startName);

  const candidates = routes.filter(
    (r) =>
      norm(r.to) === endN &&
      r.approximateDistanceKm != null &&
      r.approximateDistanceKm > 0,
  );

  if (candidates.length === 0) {
    return null;
  }

  const direct = candidates.find((r) => norm(r.from) === startN);

  if (direct) {
    return direct;
  }

  return (
    candidates.find((r) => norm(r.from) === norm(defaultHub)) ?? null
  );
}
