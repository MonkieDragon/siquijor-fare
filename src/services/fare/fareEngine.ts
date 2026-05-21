import { computeDistanceFareDetails, estimateDistanceFare } from "./distanceFare";

import { findExactOfficialLeg } from "./exactOfficialFare";

import { allOfficialLegsOrdered } from "./officialFareLegs";

import {
  tryCorridorExtrapolatedFare,
  tryCorridorInterpolatedFare,
} from "./poblacionCorridorInterpolation";

import { findScalingReferenceLeg } from "./scalingReferenceFare";

import type { FareEstimate, OfficialFareLeg } from "./fareTypes";

import { applyFareRounding } from "./fareRounding";

import type { FareZoneResolution } from "./zoneTypes";

const RATIO_MIN = 0.88;

const RATIO_MAX = 1.28;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function blendWeight(a: FareZoneResolution, b: FareZoneResolution): number {
  const tiers = [a.tier, b.tier];

  if (tiers.includes("unknown")) {
    return 0.22;
  }

  if (tiers.includes("default_poblacion")) {
    return 0.38;
  }

  if (tiers.every((t) => t === "polygon")) {
    return 0.58;
  }

  return 0.42;
}

function shouldUsePureScaledOfficial(
  a: FareZoneResolution,
  b: FareZoneResolution,
): boolean {
  return (
    a.tier !== "unknown" &&
    b.tier !== "unknown" &&
    a.tier !== "default_poblacion" &&
    b.tier !== "default_poblacion"
  );
}

function exactExplanation(match: {
  leg: { table: string; toZoneId: string; fromZoneId: string };

  isForward: boolean;
}): string {
  const tableLabel =
    match.leg.table === "drop_off" ? "drop-off" : "special trip";

  if (match.isForward) {
    return `Official LGU ${tableLabel} fare match`;
  }

  return `Official LGU ${tableLabel} fare match (reverse direction)`;
}

export type CalculateFareOptions = {
  /** OSRM route as `[lat, lon][]` (see `RouteResult.coordinates`). */
  routeCoordinates?: [number, number][];

  /** Official LGU legs for the active app location; defaults to Siquijor bundle. */
  officialLegs?: OfficialFareLeg[];
};

function finalizeEstimate(estimate: FareEstimate): FareEstimate {
  return applyFareRounding(estimate);
}

export function calculateFare(
  start: FareZoneResolution,
  end: FareZoneResolution,
  distanceKm: number,
  options?: CalculateFareOptions,
): FareEstimate {
  const officialLegs = options?.officialLegs ?? allOfficialLegsOrdered;

  const startId = start.zoneId;

  const endId = end.zoneId;

  if (startId && endId) {
    const exact = findExactOfficialLeg(officialLegs, startId, endId);

    if (exact) {
      return finalizeEstimate({
        fare: exact.leg.farePhp,

        method: exact.isForward ? "exact" : "reverse_exact",

        confidence: 1,

        explanation: exactExplanation(exact),

        officialTable: exact.leg.table,
      });
    }
  }

  const routeCoordinates = options?.routeCoordinates ?? [];

  if (distanceKm > 0 && startId && endId && routeCoordinates.length >= 2) {
    const scaling = findScalingReferenceLeg(
      officialLegs,

      startId,

      endId,

      distanceKm,

      routeCoordinates,
    );

    if (scaling != null) {
      const refLeg = scaling.leg;

      const refKm = refLeg.referenceDistanceKm;

      if (refKm != null && refKm > 0) {
        const ratio = clamp(distanceKm / refKm, RATIO_MIN, RATIO_MAX);

        const scaled = Math.round(refLeg.farePhp * ratio);

        const tariff = estimateDistanceFare(distanceKm);

        const tableLabel =
          refLeg.table === "drop_off" ? "drop-off" : "special trip";

        const routeLabel =
          scaling.direction === "forward"
            ? `${refLeg.fromZoneId} → ${refLeg.toZoneId}`
            : `${refLeg.toZoneId} → ${refLeg.fromZoneId}`;

        const overlapPct = Math.round(scaling.overlapFraction * 100);

        const pathNote = `your route closely follows the published ${tableLabel} path (${overlapPct}% overlap)`;

        if (shouldUsePureScaledOfficial(start, end)) {
          return finalizeEstimate({
            fare: scaled,

            method: "scaled_official",

            confidence: scaling.overlapFraction >= 0.85 ? 0.72 : 0.65,

            explanation: `Estimated from official ${routeLabel} fare, scaled by road distance — ${pathNote}`,

            officialTable: refLeg.table,
          });
        }

        const w = blendWeight(start, end);

        const blended = Math.round(w * scaled + (1 - w) * tariff);

        return finalizeEstimate({
          fare: blended,

          method: "blended_official_distance",

          confidence: scaling.overlapFraction >= 0.85 ? 0.58 : 0.52,

          explanation: `Blend of distance-scaled official ${routeLabel} fare and distance-based estimate (weight ${Math.round(w * 100)}% official) — ${pathNote}`,

          officialTable: refLeg.table,
        });
      }
    }
  }

  const corridor = tryCorridorInterpolatedFare(
    start,

    end,

    distanceKm,

    options?.routeCoordinates ?? [],

    officialLegs,
  );

  if (corridor) {
    return finalizeEstimate(corridor);
  }

  const extrapolated = tryCorridorExtrapolatedFare(
    start,

    end,

    distanceKm,

    options?.routeCoordinates ?? [],

    officialLegs,
  );

  if (extrapolated) {
    return finalizeEstimate(extrapolated);
  }

  const distanceDetail = computeDistanceFareDetails(distanceKm);

  return finalizeEstimate({
    fare: distanceDetail.fare,

    method: "distance_estimate",

    confidence: startId && endId ? 0.45 : 0.35,

    explanation:
      startId && endId
        ? "No matching official route for these zones — estimated using trip distance × median ₱/km from LGU reference routes"
        : "Estimated using trip distance × median ₱/km from LGU reference routes",

    distanceDetail,
  });
}
