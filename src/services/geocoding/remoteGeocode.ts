import type { Location } from "../../types/location";
import { isInSiquijor } from "./siquijorFilter";
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
): Promise<Location[]> {
  const url = new URL(NOMINATIM_URL);

  url.searchParams.set("q", `${query}, Siquijor, Philippines`);

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
    .filter(isInSiquijor);
}
