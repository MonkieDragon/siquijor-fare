import type { GeoBounds } from "./types";

export function isLatLonInBounds(
  lat: number,
  lon: number,
  bounds: GeoBounds,
): boolean {
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lon >= bounds.minLon &&
    lon <= bounds.maxLon
  );
}
