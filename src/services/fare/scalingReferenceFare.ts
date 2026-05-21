import type { OfficialFareLeg } from "./fareTypes";

import { getOfficialRouteGeometry } from "./officialRouteGeometries";

import {
  directedLegKey,
  resamplePolyline,
  reversePolyline,
  routeOverlapFraction,
  tripEndpointsNearReference,
  type LatLonPolyline,
} from "./routeGeometrySimilarity";

/** Min share of trip samples within buffer of the official polyline. */
export const MIN_OVERLAP_FRACTION = 0.75;

/** Per-sample corridor around the published route. */
export const ROUTE_BUFFER_KM = 1.5;

/** Trip start/end must be within this distance of reference endpoints. */
export const ENDPOINT_MAX_KM = 2;

/** Max relative gap between trip km and published reference km. */
export const MAX_DISTANCE_DRIFT_RATIO = 0.4;

const SAMPLE_POINTS = 48;

export type ScalingReferenceDirection = "forward" | "reverse";

export type ScalingReferenceMatch = {
  leg: OfficialFareLeg;

  direction: ScalingReferenceDirection;

  overlapFraction: number;
};

type DirectedAlignment = {
  direction: ScalingReferenceDirection;
} | null;

function alignsWithLegDirection(
  leg: OfficialFareLeg,
  startZoneId: string,
  endZoneId: string,
): DirectedAlignment {
  if (leg.fromZoneId === startZoneId && leg.toZoneId === endZoneId) {
    return { direction: "forward" };
  }

  if (
    leg.symmetric !== false &&
    leg.fromZoneId === endZoneId &&
    leg.toZoneId === startZoneId
  ) {
    return { direction: "reverse" };
  }

  return null;
}

function referencePolylineForDirection(
  leg: OfficialFareLeg,
  direction: ScalingReferenceDirection,
): LatLonPolyline | undefined {
  const forward = getOfficialRouteGeometry(leg.fromZoneId, leg.toZoneId);

  if (!forward?.length) {
    return undefined;
  }

  return direction === "forward" ? forward : reversePolyline(forward);
}

function passesDistanceSanity(
  tripDistanceKm: number,
  referenceDistanceKm: number,
): boolean {
  const drift = Math.abs(tripDistanceKm - referenceDistanceKm) / referenceDistanceKm;
  return drift <= MAX_DISTANCE_DRIFT_RATIO;
}

function scoreLeg(
  leg: OfficialFareLeg,
  direction: ScalingReferenceDirection,
  tripDistanceKm: number,
  routeCoordinates: LatLonPolyline,
): { overlapFraction: number } | null {
  const refKm = leg.referenceDistanceKm;

  if (refKm == null || refKm <= 0) {
    return null;
  }

  if (!passesDistanceSanity(tripDistanceKm, refKm)) {
    return null;
  }

  const refLine = referencePolylineForDirection(leg, direction);

  if (!refLine?.length) {
    return null;
  }

  const refSampled = resamplePolyline(refLine, SAMPLE_POINTS);

  if (!tripEndpointsNearReference(routeCoordinates, refSampled, ENDPOINT_MAX_KM)) {
    return null;
  }

  const overlapFraction = routeOverlapFraction(
    routeCoordinates,
    refSampled,
    ROUTE_BUFFER_KM,
    SAMPLE_POINTS,
  );

  if (overlapFraction < MIN_OVERLAP_FRACTION) {
    return null;
  }

  return { overlapFraction };
}

/**
 * Picks a published leg to scale only when the user trip matches that leg’s
 * directed zones and OSRM path is largely the same as the cached official route.
 */
export function findScalingReferenceLeg(
  legs: OfficialFareLeg[],
  startZoneId: string,
  endZoneId: string,
  tripDistanceKm: number,
  routeCoordinates: LatLonPolyline,
): ScalingReferenceMatch | null {
  if (routeCoordinates.length < 2 || tripDistanceKm <= 0) {
    return null;
  }

  type Candidate = ScalingReferenceMatch & {
    distanceDrift: number;
  };

  const candidates: Candidate[] = [];

  for (const leg of legs) {
    const alignment = alignsWithLegDirection(leg, startZoneId, endZoneId);

    if (!alignment) {
      continue;
    }

    const scored = scoreLeg(
      leg,
      alignment.direction,
      tripDistanceKm,
      routeCoordinates,
    );

    if (!scored) {
      continue;
    }

    const refKm = leg.referenceDistanceKm!;

    candidates.push({
      leg,
      direction: alignment.direction,
      overlapFraction: scored.overlapFraction,
      distanceDrift: Math.abs(tripDistanceKm - refKm),
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    if (b.overlapFraction !== a.overlapFraction) {
      return b.overlapFraction - a.overlapFraction;
    }

    if (a.distanceDrift !== b.distanceDrift) {
      return a.distanceDrift - b.distanceDrift;
    }

    const keyA = directedLegKey(a.leg.fromZoneId, a.leg.toZoneId);
    const keyB = directedLegKey(b.leg.fromZoneId, b.leg.toZoneId);

    return keyA.localeCompare(keyB);
  });

  const best = candidates[0]!;

  return {
    leg: best.leg,
    direction: best.direction,
    overlapFraction: best.overlapFraction,
  };
}
