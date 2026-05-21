import type { Location } from "../types/location";

import type { OfficialFareLeg } from "../services/fare/fareTypes";

import type {
  FareZoneDefinition,
  FareZoneResolution,
} from "../services/fare/zoneTypes";

export type GeoBounds = {
  minLat: number;

  maxLat: number;

  minLon: number;

  maxLon: number;
};

export type AppLocationMapConfig = {
  center: [number, number];

  defaultZoom: number;

  bounds: GeoBounds;
};

export type AppLocationGeocodingConfig = {
  /** Appended to Nominatim queries, e.g. "Siquijor, Philippines". */
  remoteSearchSuffix: string;

  searchableLocations: Location[];
};

export type AppLocationFareConfig = {
  zoneDefinitions: FareZoneDefinition[];

  officialLegs: OfficialFareLeg[];

  resolveZone: (location: Location) => FareZoneResolution;

  /** Poblacion / port hub markers on the map (Siquijor LGU special trips). */
  showOfficialHubMarkers: boolean;
};

/**
 * One deployable area (island, town cluster, etc.).
 * Add a module under `src/locations/` and register it in `registry.ts`.
 */
export type AppLocationDefinition = {
  id: string;

  label: string;

  map: AppLocationMapConfig;

  geocoding: AppLocationGeocodingConfig;

  fare?: AppLocationFareConfig;
};
