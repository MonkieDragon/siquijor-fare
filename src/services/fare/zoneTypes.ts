export type FareZoneMatch =
  | {
      type: "polygon";

      /** Exterior ring closed (first point === last), [lon, lat] */
      exteriorRing: [number, number][];
    }
  | {
      type: "point_radius";

      lat: number;

      lon: number;

      maxRadiusKm: number;
    };

export type FareZoneDefinition = {
  id: string;

  label: string;

  /** Smaller numbers are evaluated first (more specific zones). */
  checkOrder: number;

  match: FareZoneMatch;

  /** Representative point for OSRM reference legs and distance tooling. */
  canonical: { lat: number; lon: number };
};

export type FareZoneResolutionTier =
  | "polygon"
  | "radius"
  | "default_poblacion"
  | "unknown";

export type FareZoneResolution = {
  zoneId: string | null;

  tier: FareZoneResolutionTier;

  /** Haversine distance to zone canonical point when tier is radius or polygon (0 if inside). */
  distanceToCanonicalKm?: number;
};
