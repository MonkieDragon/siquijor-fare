import {
  FARE_ZONE_DEFINITIONS,
  POBLACION_ZONE_ID,
  SIQUIJOR_PORT_ZONE_ID,
} from "../../data/fareZonesData";

import { pointInPolygon } from "./pointInPolygon";

import { getFlatPerKmRate } from "./calibratedDistanceTariff";

import type { FareEstimate, OfficialFareLeg } from "./fareTypes";

import type { FareZoneDefinition, FareZoneResolution } from "./zoneTypes";

/** v1: require route to pass through this zone before corridor interpolation. */
const CORRIDOR_GATE_ZONE_IDS: readonly string[] = [SIQUIJOR_PORT_ZONE_ID];

const EARTH_RADIUS_KM = 6371;

const ROUTE_SAMPLE_MAX_POINTS = 48;

/** Denser sampling when detecting LGU hub polygons along long routes (fewer misses). */
const ROUTE_HUB_SAMPLE_MAX_POINTS = 160;

/** Geographic corridors (not sorted global km). Chain order matches typical branches from Poblacion via port. */
export type CorridorId = "north_via_port" | "south_via_port";

const NORTH_VIA_PORT_CHAIN: readonly string[] = ["siquijor_port", "larena"];

const SOUTH_VIA_PORT_CHAIN: readonly string[] = [
  "siquijor_port",

  "campalanas",

  "lazi",
];

/** Poblacion special-trip hubs — extrapolation picks the furthest passed hub by LGU ref km. */
const SPECIAL_TRIP_HUB_ZONE_IDS: readonly string[] = [
  SIQUIJOR_PORT_ZONE_ID,

  "larena",

  "campalanas",

  "lazi",
];

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const t1 = (lat1 * Math.PI) / 180;

  const t2 = (lat2 * Math.PI) / 180;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;

  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(t1) * Math.cos(t2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

function coordinateInZone(
  lat: number,
  lon: number,
  zone: FareZoneDefinition,
): boolean {
  if (zone.match.type === "polygon") {
    return pointInPolygon(lon, lat, zone.match.exteriorRing);
  }

  return (
    haversineKm(lat, lon, zone.match.lat, zone.match.lon) <=
    zone.match.maxRadiusKm
  );
}

function fareZoneById(id: string): FareZoneDefinition | undefined {
  return FARE_ZONE_DEFINITIONS.find((z) => z.id === id);
}

function zoneLabel(id: string): string {
  return fareZoneById(id)?.label ?? id;
}

/** Compact names for user-facing fare copy (avoid long bbox labels). */
const SHORT_PLACE_NAME: Record<string, string> = {
  siquijor_port: "Siquijor port",

  larena: "Larena",

  campalanas: "Campalanas",

  lazi: "Lazi",
};

function shortPlaceName(zoneId: string): string {
  return SHORT_PLACE_NAME[zoneId] ?? zoneLabel(zoneId);
}

function routeSampleIndices(routeLength: number): number[] {
  const n = routeLength;

  if (n === 0) {
    return [];
  }

  const step = Math.max(1, Math.ceil(n / ROUTE_SAMPLE_MAX_POINTS));

  const indices = new Set<number>([0, n - 1]);

  for (let i = 0; i < n; i += step) {
    indices.add(i);
  }

  return [...indices].sort((a, b) => a - b);
}

function routeHubSampleIndices(routeLength: number): number[] {
  const n = routeLength;

  if (n === 0) {
    return [];
  }

  const step = Math.max(1, Math.ceil(n / ROUTE_HUB_SAMPLE_MAX_POINTS));

  const indices = new Set<number>([0, n - 1]);

  for (let i = 0; i < n; i += step) {
    indices.add(i);
  }

  return [...indices].sort((a, b) => a - b);
}

/** First polyline sample index where the coordinate lies in `zoneId`, or undefined. */
export function routeFirstHitIndex(
  routeCoordinates: [number, number][],
  zoneId: string,
): number | undefined {
  const zone = fareZoneById(zoneId);

  if (!zone) {
    return undefined;
  }

  for (const i of routeSampleIndices(routeCoordinates.length)) {
    const [lat, lon] = routeCoordinates[i]!;

    if (coordinateInZone(lat, lon, zone)) {
      return i;
    }
  }

  return undefined;
}

/** Hub matching uses denser vertices so long coastal routes still register Larena/Lazi. */
function routeFirstHitIndexDenseHub(
  routeCoordinates: [number, number][],
  zoneId: string,
): number | undefined {
  const zone = fareZoneById(zoneId);

  if (!zone) {
    return undefined;
  }

  for (const i of routeHubSampleIndices(routeCoordinates.length)) {
    const [lat, lon] = routeCoordinates[i]!;

    if (coordinateInZone(lat, lon, zone)) {
      return i;
    }
  }

  return undefined;
}

function routeTouchesAnyGateZone(
  routeCoordinates: [number, number][],
): boolean {
  const gates = CORRIDOR_GATE_ZONE_IDS.map((id) => fareZoneById(id)).filter(
    (z): z is FareZoneDefinition => z != null,
  );

  if (gates.length === 0) {
    return false;
  }

  const n = routeCoordinates.length;

  if (n === 0) {
    return false;
  }

  for (const i of routeSampleIndices(n)) {
    const [lat, lon] = routeCoordinates[i]!;

    for (const zone of gates) {
      if (coordinateInZone(lat, lon, zone)) {
        return true;
      }
    }
  }

  return false;
}

export type PoblacionCorridorAnchor = {
  referenceDistanceKm: number;

  farePhp: number;

  toZoneId: string;
};

function poblacionSpecialTripLeg(
  legs: OfficialFareLeg[],
  toZoneId: string,
): OfficialFareLeg | undefined {
  return legs.find(
    (leg) =>
      leg.table === "special_trip" &&
      leg.fromZoneId === POBLACION_ZONE_ID &&
      leg.toZoneId === toZoneId &&
      leg.referenceDistanceKm != null &&
      leg.referenceDistanceKm > 0,
  );
}

export function buildAnchorsForCorridor(
  legs: OfficialFareLeg[],
  corridorId: CorridorId,
): PoblacionCorridorAnchor[] {
  const chain =
    corridorId === "north_via_port"
      ? NORTH_VIA_PORT_CHAIN
      : SOUTH_VIA_PORT_CHAIN;

  const anchors: PoblacionCorridorAnchor[] = [];

  for (const toZoneId of chain) {
    const leg = poblacionSpecialTripLeg(legs, toZoneId);

    if (!leg) {
      continue;
    }

    anchors.push({
      referenceDistanceKm: leg.referenceDistanceKm!,

      farePhp: leg.farePhp,

      toZoneId: leg.toZoneId,
    });
  }

  return anchors;
}

/**
 * Prefer south when the polyline enters Campalanas (southern branch) or when the
 * resolved destination zone is on that branch. Otherwise use the north/east Larena chain
 * (covers trips like Poblacion → Banban that pass the port but never Campalanas).
 */
export function pickCorridor(
  routeCoordinates: [number, number][],
  endResolution: FareZoneResolution,
): CorridorId {
  const endId = endResolution.zoneId;

  if (endId === "lazi" || endId === "campalanas") {
    return "south_via_port";
  }

  if (endId === "larena") {
    return "north_via_port";
  }

  const hitCampalanas = routeFirstHitIndex(routeCoordinates, "campalanas");

  if (hitCampalanas !== undefined) {
    return "south_via_port";
  }

  return "north_via_port";
}

function interpolateFarePhp(
  distanceKm: number,
  anchors: PoblacionCorridorAnchor[],
): { farePhp: number; fromZoneLabel: string; toZoneLabel: string } | null {
  if (anchors.length === 0) {
    return null;
  }

  const minRef = anchors[0]!.referenceDistanceKm;

  const maxRef = anchors[anchors.length - 1]!.referenceDistanceKm;

  if (distanceKm > maxRef) {
    return null;
  }

  if (distanceKm <= minRef) {
    return {
      farePhp: anchors[0]!.farePhp,

      fromZoneLabel: anchors[0]!.toZoneId,

      toZoneLabel: anchors[0]!.toZoneId,
    };
  }

  for (let i = 0; i < anchors.length - 1; i++) {
    const a0 = anchors[i]!;

    const a1 = anchors[i + 1]!;

    if (distanceKm >= a0.referenceDistanceKm && distanceKm <= a1.referenceDistanceKm) {
      const span = a1.referenceDistanceKm - a0.referenceDistanceKm;

      const t = span > 0 ? (distanceKm - a0.referenceDistanceKm) / span : 0;

      const farePhp = a0.farePhp + t * (a1.farePhp - a0.farePhp);

      return {
        farePhp: Math.round(farePhp),

        fromZoneLabel: a0.toZoneId,

        toZoneLabel: a1.toZoneId,
      };
    }
  }

  return null;
}

function corridorExplanationText(
  fromZoneId: string,
  toZoneId: string,
): string {
  const disclaimer = "Not an official LGU fare for this exact stop.";

  if (fromZoneId === toZoneId) {
    return `Uses the published San Juan trip to ${shortPlaceName(fromZoneId)} as the nearest match by distance. ${disclaimer}`;
  }

  return `Blended between published San Juan trips to ${shortPlaceName(fromZoneId)} and ${shortPlaceName(toZoneId)} using your trip distance on the road. ${disclaimer}`;
}

export function tryCorridorInterpolatedFare(
  start: FareZoneResolution,
  end: FareZoneResolution,
  distanceKm: number,
  routeCoordinates: [number, number][],
  legs: OfficialFareLeg[],
): FareEstimate | null {
  const startId = start.zoneId;

  const endId = end.zoneId;

  const poblacionPlusUnknown =
    (startId === POBLACION_ZONE_ID && endId === null) ||
    (endId === POBLACION_ZONE_ID && startId === null);

  if (!poblacionPlusUnknown) {
    return null;
  }

  if (distanceKm <= 0 || routeCoordinates.length === 0) {
    return null;
  }

  if (!routeTouchesAnyGateZone(routeCoordinates)) {
    return null;
  }

  const unknownEnd = startId === POBLACION_ZONE_ID ? end : start;

  const corridorId = pickCorridor(routeCoordinates, unknownEnd);

  const anchors = buildAnchorsForCorridor(legs, corridorId);

  const interp = interpolateFarePhp(distanceKm, anchors);

  if (interp == null) {
    return null;
  }

  const { farePhp, fromZoneLabel, toZoneLabel } = interp;

  return {
    fare: farePhp,

    method: "corridor_interpolated",

    confidence: 0.62,

    explanation: corridorExplanationText(fromZoneLabel, toZoneLabel),

    officialTable: "special_trip",
  };
}

/**
 * When total trip length exceeds corridor interpolation but the polyline passes published
 * special-trip hubs, extend from the furthest passed hub: LGU fare + flat ₱/km × extra km.
 */
export function tryCorridorExtrapolatedFare(
  start: FareZoneResolution,
  end: FareZoneResolution,
  distanceKm: number,
  routeCoordinates: [number, number][],
  legs: OfficialFareLeg[],
): FareEstimate | null {
  const startId = start.zoneId;

  const endId = end.zoneId;

  const poblacionPlusUnknown =
    (startId === POBLACION_ZONE_ID && endId === null) ||
    (endId === POBLACION_ZONE_ID && startId === null);

  if (!poblacionPlusUnknown) {
    return null;
  }

  if (distanceKm <= 0 || routeCoordinates.length === 0) {
    return null;
  }

  if (!routeTouchesAnyGateZone(routeCoordinates)) {
    return null;
  }

  const hitLegs: OfficialFareLeg[] = [];

  for (const id of SPECIAL_TRIP_HUB_ZONE_IDS) {
    const leg = poblacionSpecialTripLeg(legs, id);

    if (!leg) {
      continue;
    }

    if (routeFirstHitIndexDenseHub(routeCoordinates, id) === undefined) {
      continue;
    }

    hitLegs.push(leg);
  }

  const eligible = hitLegs.filter(
    (leg) => leg.referenceDistanceKm! < distanceKm,
  );

  if (eligible.length === 0) {
    return null;
  }

  eligible.sort(
    (a, b) => b.referenceDistanceKm! - a.referenceDistanceKm!,
  );

  const pivot = eligible[0]!;

  const tailKm = distanceKm - pivot.referenceDistanceKm!;

  const flat = getFlatPerKmRate();

  const fare = Math.round(pivot.farePhp + tailKm * flat);

  const hubName = shortPlaceName(pivot.toZoneId);

  const disclaimer = "Not an official LGU fare for this exact stop.";

  return {
    fare,

    method: "corridor_extrapolated",

    confidence: 0.58,

    explanation: `From published San Juan trip to ${hubName} (₱${pivot.farePhp} at ${pivot.referenceDistanceKm} km), plus ₱${flat}/km for ${tailKm.toFixed(1)} km beyond that reference — your route passes that area. ${disclaimer}`,

    officialTable: "special_trip",
  };
}
