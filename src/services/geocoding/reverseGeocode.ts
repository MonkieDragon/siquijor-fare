import { nominatimGetJson } from "./nominatimClient";

const REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<{ displayName: string; shortName: string }> {
  const url = new URL(REVERSE_URL);

  url.searchParams.set("format", "jsonv2");

  url.searchParams.set("lat", String(lat));

  url.searchParams.set("lon", String(lon));

  try {
    const data = (await nominatimGetJson(url.toString(), signal)) as {
      display_name?: string;
      name?: string;
      address?: Record<string, string>;
    };

    const displayName = data.display_name ?? "";

    const shortName =
      data.name ||
      data.address?.village ||
      data.address?.town ||
      data.address?.city ||
      "Dropped pin";

    return { displayName, shortName };
  } catch {
    return { displayName: "", shortName: "Dropped pin" };
  }
}
