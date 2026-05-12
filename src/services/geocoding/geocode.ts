import type { Location } from "../../types/location";
import { localSearch } from "./localSearch";
import { remoteGeocode } from "./remoteGeocode";

export async function geocode(
  query: string,
  signal?: AbortSignal,
): Promise<Location[]> {
  const localResults = localSearch(query);

  // If we already have strong local matches,
  // avoid remote requests entirely
  if (localResults.length >= 3) {
    return localResults;
  }

  const remoteResults = await remoteGeocode(query, signal);

  return [...localResults, ...remoteResults];
}
