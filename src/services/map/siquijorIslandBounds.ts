import { getAppLocationOrDefault, isLatLonInBounds } from "../../locations";

const siquijor = getAppLocationOrDefault("siquijor");

export const SIQUIJOR_ISLAND_MIN_LAT = siquijor.map.bounds.minLat;

export const SIQUIJOR_ISLAND_MAX_LAT = siquijor.map.bounds.maxLat;

export const SIQUIJOR_ISLAND_MIN_LON = siquijor.map.bounds.minLon;

export const SIQUIJOR_ISLAND_MAX_LON = siquijor.map.bounds.maxLon;

export function isLatLonOnSiquijorIsland(lat: number, lon: number): boolean {
  return isLatLonInBounds(lat, lon, siquijor.map.bounds);
}
