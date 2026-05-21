import {
  DEFAULT_APP_LOCATION_ID,
  getAppLocationOrDefault,
  isLatLonInBounds,
} from "../../locations";

type LatLng = {
  lat: number;
  lon: number;
};

export function isInAppLocationBounds(
  { lat, lon }: LatLng,
  locationId: string = DEFAULT_APP_LOCATION_ID,
): boolean {
  const appLocation = getAppLocationOrDefault(locationId);

  return isLatLonInBounds(lat, lon, appLocation.map.bounds);
}

/** @deprecated Use `isInAppLocationBounds` with a location id. */
export function isInSiquijor(coords: LatLng): boolean {
  return isInAppLocationBounds(coords, DEFAULT_APP_LOCATION_ID);
}
