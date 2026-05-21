import siquijorLocations from "../data/siquijorLocations.json";

import { FARE_ZONE_DEFINITIONS } from "../data/fareZonesData";

import type { Location } from "../types/location";

import { allOfficialLegsOrdered } from "../services/fare/officialFareLegs";

import { resolveFareZone } from "../services/fare/resolveFareZone";

import type { AppLocationDefinition } from "./types";

const SIQUIJOR_BOUNDS = {
  minLat: 9.02,

  maxLat: 9.35,

  minLon: 123.42,

  maxLon: 123.75,
} as const;

export const siquijorAppLocation: AppLocationDefinition = {
  id: "siquijor",

  label: "Siquijor",

  map: {
    center: [9.18367, 123.592717],

    defaultZoom: 12.4,

    bounds: SIQUIJOR_BOUNDS,
  },

  geocoding: {
    remoteSearchSuffix: "Siquijor, Philippines",

    searchableLocations: siquijorLocations as Location[],
  },

  fare: {
    zoneDefinitions: FARE_ZONE_DEFINITIONS,

    officialLegs: allOfficialLegsOrdered,

    resolveZone: (location) => resolveFareZone(location, FARE_ZONE_DEFINITIONS),

    showOfficialHubMarkers: true,
  },
};
