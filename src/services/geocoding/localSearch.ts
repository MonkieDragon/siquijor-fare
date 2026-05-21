import Fuse from "fuse.js";

import {
  DEFAULT_APP_LOCATION_ID,
  getAppLocationOrDefault,
} from "../../locations";
import type { Location } from "../../types/location";

const fuseByLocationId = new Map<string, Fuse<Location>>();

function fuseForLocation(locationId: string): Fuse<Location> {
  const cached = fuseByLocationId.get(locationId);

  if (cached) {
    return cached;
  }

  const appLocation = getAppLocationOrDefault(locationId);

  const fuse = new Fuse(appLocation.geocoding.searchableLocations, {
    keys: ["name", "displayName"],

    threshold: 0.35,

    ignoreLocation: true,

    minMatchCharLength: 2,
  });

  fuseByLocationId.set(locationId, fuse);

  return fuse;
}

export function localSearch(
  query: string,
  locationId: string = DEFAULT_APP_LOCATION_ID,
): Location[] {
  const normalized = query.trim();

  if (normalized.length < 2) {
    return [];
  }

  const results = fuseForLocation(locationId).search(normalized);

  return results.slice(0, 8).map((result) => result.item);
}
