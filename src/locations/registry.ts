import { siquijorAppLocation } from "./siquijor";

import type { AppLocationDefinition } from "./types";

export const DEFAULT_APP_LOCATION_ID = "siquijor";

const APP_LOCATIONS: AppLocationDefinition[] = [siquijorAppLocation];

const byId = new Map(APP_LOCATIONS.map((loc) => [loc.id, loc]));

export function listAppLocations(): readonly AppLocationDefinition[] {
  return APP_LOCATIONS;
}

export function getAppLocation(id: string): AppLocationDefinition | undefined {
  return byId.get(id);
}

export function getAppLocationOrDefault(id: string): AppLocationDefinition {
  return byId.get(id) ?? siquijorAppLocation;
}
