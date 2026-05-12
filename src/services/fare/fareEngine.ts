import type { FareEstimate, FareRoute } from "./fareTypes";

import { officialFareRoutes } from "./fareData";

import { findExactFare } from "./exactFareMatcher";

import { estimateDistanceFare } from "./distanceFare";

import { interpolateFare } from "./interpolateFare";

import {
  DEFAULT_FARE_HUB,
  findInterpolationReference,
} from "./interpolationReference";

function isDirectExact(
  route: FareRoute,
  startName: string,
  endName: string,
): boolean {
  return (
    route.from.toLowerCase() === startName.toLowerCase() &&
    route.to.toLowerCase() === endName.toLowerCase()
  );
}

export function calculateFare(
  startName: string,
  endName: string,
  distanceKm: number,
): FareEstimate {
  const exact = findExactFare(officialFareRoutes, startName, endName);

  if (exact) {
    const direct = isDirectExact(exact, startName, endName);

    return {
      fare: exact.fare,

      method: direct ? "exact" : "reverse_exact",

      confidence: 1,

      explanation: direct
        ? "Official LGU fare match"
        : "Official LGU fare match (reverse direction)",
    };
  }

  if (distanceKm > 0) {
    const ref = findInterpolationReference(
      officialFareRoutes,

      startName,

      endName,

      DEFAULT_FARE_HUB,
    );

    const officialDist = ref?.approximateDistanceKm;

    if (ref && officialDist != null && officialDist > 0) {
      const fare = interpolateFare(ref, distanceKm, officialDist);

      const usedHub =
        ref.from.toLowerCase() !== startName.toLowerCase() &&
        ref.from.toLowerCase() === DEFAULT_FARE_HUB.toLowerCase();

      const legLabel = `${ref.from} → ${ref.to}`;

      return {
        fare,

        method: "interpolated",

        confidence: 0.72,

        explanation: usedHub
          ? `Estimated by scaling official ${legLabel} fare to your route distance`
          : `Estimated by scaling official ${legLabel} fare using your route distance`,
      };
    }
  }

  return {
    fare: estimateDistanceFare(distanceKm),

    method: "distance_estimate",

    confidence: 0.45,

    explanation: "Estimated using route distance",
  };
}
