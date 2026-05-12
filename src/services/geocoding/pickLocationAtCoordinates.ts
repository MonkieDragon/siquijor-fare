import type { Location } from "../../types/location";

import { reverseGeocode } from "./reverseGeocode";

/**
 * Apply the same flow as map tap: provisional pin, then reverse geocode refinement.
 */
export async function pickLocationAtCoordinates(
  lat: number,
  lng: number,
  signal: AbortSignal,
  onPickLocation: (location: Location) => void,
): Promise<void> {
  const lon = lng;

  const provisional: Location = {
    name: "Dropped pin",

    lat,

    lon,

    displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };

  onPickLocation(provisional);

  try {
    const { displayName, shortName } = await reverseGeocode(lat, lon, signal);

    if (signal.aborted) {
      return;
    }

    if (displayName || shortName) {
      onPickLocation({
        name: shortName,

        lat,

        lon,

        displayName: displayName || undefined,
      });
    }
  } catch {
    /* keep provisional */
  }
}
