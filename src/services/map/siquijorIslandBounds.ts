/**
 * Approximate axis-aligned bounds for Siquijor Island (province core).
 * Used only to gate mobile GPS defaults — tighten or replace with a polygon later.
 */
export const SIQUIJOR_ISLAND_MIN_LAT = 9.02;

export const SIQUIJOR_ISLAND_MAX_LAT = 9.35;

export const SIQUIJOR_ISLAND_MIN_LON = 123.42;

export const SIQUIJOR_ISLAND_MAX_LON = 123.75;

export function isLatLonOnSiquijorIsland(lat: number, lon: number): boolean {
  return (
    lat >= SIQUIJOR_ISLAND_MIN_LAT &&
    lat <= SIQUIJOR_ISLAND_MAX_LAT &&
    lon >= SIQUIJOR_ISLAND_MIN_LON &&
    lon <= SIQUIJOR_ISLAND_MAX_LON
  );
}
