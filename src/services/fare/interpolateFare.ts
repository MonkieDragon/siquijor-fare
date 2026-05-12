import type { FareRoute } from "./fareTypes";

export function interpolateFare(
  nearbyRoute: FareRoute,
  actualDistanceKm: number,
  officialDistanceKm: number,
): number {
  const ratio = actualDistanceKm / officialDistanceKm;

  return Math.round(nearbyRoute.fare * ratio);
}
