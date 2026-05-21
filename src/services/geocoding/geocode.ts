import { DEFAULT_APP_LOCATION_ID } from "../../locations";
import type { Location } from "../../types/location";
import { localSearch } from "./localSearch";
import { remoteGeocode } from "./remoteGeocode";

export async function geocode(
  query: string,
  signal?: AbortSignal,
  locationId: string = DEFAULT_APP_LOCATION_ID,
): Promise<Location[]> {
  const localResults = localSearch(query, locationId);

  // If we already have strong local matches,
  // avoid remote requests entirely
  if (localResults.length >= 3) {
    return localResults;
  }

  const remoteResults = await remoteGeocode(query, signal, locationId);

  return [...localResults, ...remoteResults];
}
