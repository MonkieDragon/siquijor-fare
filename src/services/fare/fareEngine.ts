import { estimateDistanceFare } from "./distanceFare";

import { findExactOfficialLeg } from "./exactOfficialFare";

import { allOfficialLegsOrdered } from "./officialFareLegs";

import { findScalingReferenceLeg } from "./scalingReferenceFare";

import type { FareEstimate } from "./fareTypes";

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

export function calculateFare(
  start: FareZoneResolution,
  end: FareZoneResolution,
  distanceKm: number,
): FareEstimate {
  const startId = start.zoneId;

  const endId = end.zoneId;

  if (startId && endId) {
    const exact = findExactOfficialLeg(allOfficialLegsOrdered, startId, endId);

    if (exact) {
      return {
        fare: exact.leg.farePhp,

        method: exact.isForward ? "exact" : "reverse_exact",

        confidence: 1,

        explanation: exactExplanation(exact),

        officialTable: exact.leg.table,
      };
    }
  }

  if (distanceKm > 0 && startId && endId) {
    const refLeg = findScalingReferenceLeg(
      allOfficialLegsOrdered,

      startId,

      endId,

      distanceKm,
    );

    if (
      refLeg != null &&
      refLeg.referenceDistanceKm != null &&
      refLeg.referenceDistanceKm > 0
    ) {
      const ratio = clamp(
        distanceKm / refLeg.referenceDistanceKm,

        RATIO_MIN,

        RATIO_MAX,
      );

      const scaled = Math.round(refLeg.farePhp * ratio);

      const tariff = estimateDistanceFare(distanceKm);

      if (shouldUsePureScaledOfficial(start, end)) {
        return {
          fare: scaled,

          method: "scaled_official",

          confidence: 0.72,

          explanation: `Estimated from official ${refLeg.table === "drop_off" ? "drop-off" : "special trip"} ${refLeg.fromZoneId} → ${refLeg.toZoneId} fare, scaled by road distance`,

          officialTable: refLeg.table,
        };
      }

      const w = blendWeight(start, end);

      const blended = Math.round(w * scaled + (1 - w) * tariff);

      return {
        fare: blended,

        method: "blended_official_distance",

        confidence: 0.58,

        explanation: `Blend of distance-scaled official ${refLeg.fromZoneId} → ${refLeg.toZoneId} fare and distance-based estimate (weight ${Math.round(w * 100)}% official)`,

        officialTable: refLeg.table,
      };
    }
  }

  return {
    fare: estimateDistanceFare(distanceKm),

    method: "distance_estimate",

    confidence: startId && endId ? 0.45 : 0.35,

    explanation:
      startId && endId
        ? "No matching official route for these zones — estimated using route distance"
        : "One or both places are outside mapped fare zones — estimated using route distance",
  };
}
