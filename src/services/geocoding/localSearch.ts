import Fuse from "fuse.js";

import rawData from "../../data/siquijorLocations.json";
import type { Location } from "../../types/location";

const locations = rawData as Location[];

const fuse = new Fuse(locations, {
  keys: ["name", "displayName"],

  threshold: 0.35,

  ignoreLocation: true,

  minMatchCharLength: 2,
});

export function localSearch(query: string): Location[] {
  const normalized = query.trim();

  if (normalized.length < 2) {
    return [];
  }

  const results = fuse.search(normalized);

  return results.slice(0, 8).map((result) => result.item);
}
