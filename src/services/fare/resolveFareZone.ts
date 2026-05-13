import type { Location } from "../../types/location";

import {
  FARE_ZONE_DEFINITIONS,
  POBLACION_ZONE_ID,
  SAN_JUAN_POBLACION_GEOMETRY,
} from "../../data/fareZonesData";

import { pointInPolygon } from "./pointInPolygon";

import type {
  FareZoneDefinition,
  FareZoneResolution,
} from "./zoneTypes";

const EARTH_RADIUS_KM = 6371;

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

function distanceToZoneCanonicalKm(
  lat: number,
  lon: number,
  zone: FareZoneDefinition,
): number {
  const { lat: zLat, lon: zLon } = zone.canonical;

  return haversineKm(lat, lon, zLat, zLon);
}

function matchZone(
  lat: number,
  lon: number,
  zone: FareZoneDefinition,
): FareZoneResolution | null {
  if (zone.match.type === "polygon") {
    if (pointInPolygon(lon, lat, zone.match.exteriorRing)) {
      return {
        zoneId: zone.id,

        tier: "polygon",

        distanceToCanonicalKm: distanceToZoneCanonicalKm(lat, lon, zone),
      };
    }

    return null;
  }

  const d = haversineKm(lat, lon, zone.match.lat, zone.match.lon);

  if (d <= zone.match.maxRadiusKm) {
    return {
      zoneId: zone.id,

      tier: "radius",

      distanceToCanonicalKm: d,
    };
  }

  return null;
}

/** If present, user text refers to another municipality — not San Juan poblacion. */
const OTHER_MUNICIPALITY_MARKERS = [
  ", maria,",
  "maria ·",
  ", larena,",
  "larena ·",
  ", lazi,",
  "lazi ·",
  "enrique villanueva",
] as const;

function textSuggestsCoarseSanJuan(location: Location): boolean {
  const blob = `${location.name} ${location.displayName ?? ""}`.toLowerCase();

  if (!blob.includes("san juan")) {
    return false;
  }

  for (const marker of OTHER_MUNICIPALITY_MARKERS) {
    if (blob.includes(marker)) {
      return false;
    }
  }

  return true;
}

/**
 * Resolves a map/search location to a fare zone. Does not use global nearest-hub
 * snapping: unmatched pins stay unknown unless coarse "San Juan" text maps to
 * Poblacion per LGU special-trip semantics.
 */
export function resolveFareZone(
  location: Location,
  zones: FareZoneDefinition[] = FARE_ZONE_DEFINITIONS,
): FareZoneResolution {
  const { lat, lon } = location;

  const dPobl = haversineKm(
    lat,

    lon,

    SAN_JUAN_POBLACION_GEOMETRY.lat,

    SAN_JUAN_POBLACION_GEOMETRY.lon,
  );

  if (dPobl <= SAN_JUAN_POBLACION_GEOMETRY.coreRadiusKm) {
    return {
      zoneId: POBLACION_ZONE_ID,

      tier: "radius",

      distanceToCanonicalKm: dPobl,
    };
  }

  for (const zone of zones) {
    const hit = matchZone(lat, lon, zone);

    if (hit) {
      return hit;
    }
  }

  if (dPobl <= SAN_JUAN_POBLACION_GEOMETRY.extendedRadiusKm) {
    return {
      zoneId: POBLACION_ZONE_ID,

      tier: "radius",

      distanceToCanonicalKm: dPobl,
    };
  }

  if (textSuggestsCoarseSanJuan(location)) {
    return {
      zoneId: POBLACION_ZONE_ID,

      tier: "default_poblacion",

      distanceToCanonicalKm: haversineKm(
        lat,

        lon,

        SAN_JUAN_POBLACION_GEOMETRY.lat,

        SAN_JUAN_POBLACION_GEOMETRY.lon,
      ),
    };
  }

  return { zoneId: null, tier: "unknown" };
}
