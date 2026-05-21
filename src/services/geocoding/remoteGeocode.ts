import {
  DEFAULT_APP_LOCATION_ID,
  getAppLocationOrDefault,
} from "../../locations";
import type { Location } from "../../types/location";
import { isInAppLocationBounds } from "./siquijorFilter";
import { nominatimGetJson } from "./nominatimClient";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

type NominatimSearchItem = {
  name?: string;

  display_name?: string;

  lat: string;

  lon: string;
};

export async function remoteGeocode(
  query: string,
  signal?: AbortSignal,
  locationId: string = DEFAULT_APP_LOCATION_ID,
): Promise<Location[]> {
  const appLocation = getAppLocationOrDefault(locationId);

  const url = new URL(NOMINATIM_URL);

  url.searchParams.set(
    "q",
    `${query}, ${appLocation.geocoding.remoteSearchSuffix}`,
  );

  url.searchParams.set("format", "json");

  url.searchParams.set("limit", "5");

  const data = (await nominatimGetJson(url.toString(), signal)) as NominatimSearchItem[];

  return data
    .map((item) => ({
      name: item.name ?? item.display_name ?? "",
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }))
    .filter((item) => isInAppLocationBounds(item, locationId));
}
