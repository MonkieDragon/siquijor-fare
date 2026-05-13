import { getFlatDistanceParams } from "./calibratedDistanceTariff";

import type { DistanceFareDetail } from "./fareTypes";

export function computeDistanceFareDetails(
  distanceKm: number,
): DistanceFareDetail {
  const { perKm, minimumFarePhp } = getFlatDistanceParams();

  const linearFarePhp = Math.round(distanceKm * perKm);

  const fare = Math.max(minimumFarePhp, linearFarePhp);

  return {
    distanceKm,

    perKm,

    linearFarePhp,

    minimumFarePhp,

    minimumApplied: fare !== linearFarePhp,

    fare,
  };
}

export function estimateDistanceFare(distanceKm: number): number {
  return computeDistanceFareDetails(distanceKm).fare;
}
