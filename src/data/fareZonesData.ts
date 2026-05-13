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
 * Hybrid fare zones: tight polygons along San Juan west / interior anchors from
 * the local dataset; hub municipalities as point+radius. Poblacion uses the
 * Poblacion barangay centroid (LGU "San Juan" special-trip column = poblacion).
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
    id: "paliton",
    label: "Paliton",
    checkOrder: 12,
    match: { type: "polygon" as const, exteriorRing: ringBox(9.1793078, 123.4692115, 0.014, 0.016) },
    canonical: { lat: 9.1793078, lon: 123.4692115 },
  },
  {
    id: "solangon",
    label: "Solangon",
    checkOrder: 13,
    match: { type: "polygon" as const, exteriorRing: ringBox(9.171046, 123.4783689) },
    canonical: { lat: 9.171046, lon: 123.4783689 },
  },
  {
    id: "tag_ibo",
    label: "Tag-ibo",
    checkOrder: 14,
    match: { type: "polygon" as const, exteriorRing: ringBox(9.1345392, 123.531493) },
    canonical: { lat: 9.1345392, lon: 123.531493 },
  },
  {
    id: "candanay_norte",
    label: "Candanay Norte",
    checkOrder: 15,
    match: { type: "polygon" as const, exteriorRing: ringBox(9.2226085, 123.5401084) },
    canonical: { lat: 9.2226085, lon: 123.5401084 },
  },
  {
    id: "calalinan",
    label: "Calalinan",
    checkOrder: 16,
    match: { type: "polygon" as const, exteriorRing: ringBox(9.2135341, 123.5002874) },
    canonical: { lat: 9.2135341, lon: 123.5002874 },
  },
  {
    id: "tambisan_san_juan",
    label: "Tambisan (San Juan)",
    checkOrder: 17,
    match: {
      type: "polygon" as const,
      exteriorRing: ringBox(9.1932979, 123.4616505, 0.011, 0.012),
    },
    canonical: { lat: 9.1932979, lon: 123.4616505 },
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
    id: "san_juan_poblacion",
    label: "Poblacion (San Juan)",
    checkOrder: 40,
    match: {
      type: "point_radius" as const,
      lat: 9.1610894,
      lon: 123.4925811,
      maxRadiusKm: 2.8,
    },
    canonical: { lat: 9.1610894, lon: 123.4925811 },
  },
  {
    id: "siquijor_port",
    label: "Siquijor (port / town)",
    checkOrder: 41,
    match: {
      type: "point_radius" as const,
      lat: 9.2155864,
      lon: 123.5138212,
      maxRadiusKm: 2.6,
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
      maxRadiusKm: 4.5,
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
      maxRadiusKm: 5,
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
      maxRadiusKm: 4,
    },
    canonical: { lat: 9.1211273, lon: 123.5780727 },
  },
].sort((a, b) => a.checkOrder - b.checkOrder);

export const POBLACION_ZONE_ID = "san_juan_poblacion";

export const SIQUIJOR_PORT_ZONE_ID = "siquijor_port";
