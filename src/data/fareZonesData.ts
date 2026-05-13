import type { FareZoneDefinition } from "../services/fare/zoneTypes";

/** ~±1.35 km at this latitude (rough bbox for barangay-level matching). */
function ringBox(
  lat: number,
  lon: number,
  dLat = 0.0122,
  dLon = 0.0124,
): [number, number][] {
  return [
    [lon - dLon, lat - dLat],
    [lon + dLon, lat - dLat],
    [lon + dLon, lat + dLat],
    [lon - dLon, lat + dLat],
    [lon - dLon, lat - dLat],
  ] as [number, number][];
}

/**
 * Poblacion hub is matched separately in resolveFareZone (core then extended ring)
 * so it wins over overlapping barangay bbox polygons (e.g. Maite) for LGU special trips.
 */
export const SAN_JUAN_POBLACION_GEOMETRY = {
  lat: 9.1610894,

  lon: 123.4925811,

  /** Inside this radius: treat as LGU Poblacion before any barangay polygon. */
  coreRadiusKm: 1.35,

  /** Outer San Juan town area when no barangay polygon matched. */
  extendedRadiusKm: 2.8,
} as const;

/** Upper bound for point_radius hubs tied to official LGU legs (tighter match for town pins). */
export const OFFICIAL_HUB_MAX_RADIUS_KM = 2.5;

/**
 * Fare zones aligned with zone ids in officialFareLegs.json (special trip + drop-off).
 * Poblacion is not listed here — see SAN_JUAN_POBLACION_GEOMETRY and resolveFareZone.
 */
export const FARE_ZONE_DEFINITIONS: FareZoneDefinition[] = [
  {
    id: "maite",
    label: "Maite",
    checkOrder: 10,
    match: {
      type: "polygon" as const,
      exteriorRing: ringBox(9.1507263, 123.5004033),
    },
    canonical: { lat: 9.1507263, lon: 123.5004033 },
  },
  {
    id: "tubod",
    label: "Tubod",
    checkOrder: 11,
    match: { type: "polygon" as const, exteriorRing: ringBox(9.1450092, 123.5082504) },
    canonical: { lat: 9.1450092, lon: 123.5082504 },
  },
  {
    id: "catulayan",
    label: "Catulayan",
    checkOrder: 12,
    match: { type: "polygon" as const, exteriorRing: ringBox(9.1254591, 123.5374752) },
    canonical: { lat: 9.1254591, lon: 123.5374752 },
  },
  {
    id: "timbaon",
    label: "Timbaon",
    checkOrder: 13,
    match: { type: "polygon" as const, exteriorRing: ringBox(9.1160008, 123.5555211) },
    canonical: { lat: 9.1160008, lon: 123.5555211 },
  },
  {
    id: "cangmunag",
    label: "Cangmunag",
    checkOrder: 14,
    match: { type: "polygon" as const, exteriorRing: ringBox(9.112535, 123.5545296) },
    canonical: { lat: 9.112535, lon: 123.5545296 },
  },
  {
    id: "tag_ibo",
    label: "Tag-ibo",
    checkOrder: 15,
    match: { type: "polygon" as const, exteriorRing: ringBox(9.1345392, 123.531493) },
    canonical: { lat: 9.1345392, lon: 123.531493 },
  },
  {
    id: "kawayan_holiday",
    label: "Kawayan Holiday area",
    checkOrder: 18,
    match: {
      type: "point_radius" as const,
      lat: 9.1022492,
      lon: 123.5593848,
      maxRadiusKm: 1.2,
    },
    canonical: { lat: 9.1022492, lon: 123.5593848 },
  },
  {
    id: "siquijor_port",
    label: "Siquijor Town",
    checkOrder: 41,
    match: {
      type: "point_radius" as const,
      lat: 9.2155864,
      lon: 123.5138212,
      maxRadiusKm: OFFICIAL_HUB_MAX_RADIUS_KM,
    },
    canonical: { lat: 9.2155864, lon: 123.5138212 },
  },
  {
    id: "larena",
    label: "Larena",
    checkOrder: 50,
    match: {
      type: "point_radius" as const,
      lat: 9.2488946,
      lon: 123.5910019,
      maxRadiusKm: OFFICIAL_HUB_MAX_RADIUS_KM,
    },
    canonical: { lat: 9.2488946, lon: 123.5910019 },
  },
  {
    id: "lazi",
    label: "Lazi",
    checkOrder: 51,
    match: {
      type: "point_radius" as const,
      lat: 9.1284365,
      lon: 123.6338696,
      maxRadiusKm: OFFICIAL_HUB_MAX_RADIUS_KM,
    },
    canonical: { lat: 9.1284365, lon: 123.6338696 },
  },
  {
    id: "campalanas",
    label: "Campalanas",
    checkOrder: 52,
    match: {
      type: "point_radius" as const,
      lat: 9.1211273,
      lon: 123.5780727,
      maxRadiusKm: OFFICIAL_HUB_MAX_RADIUS_KM,
    },
    canonical: { lat: 9.1211273, lon: 123.5780727 },
  },
].sort((a, b) => a.checkOrder - b.checkOrder);

export const POBLACION_ZONE_ID = "san_juan_poblacion";

export const SIQUIJOR_PORT_ZONE_ID = "siquijor_port";
