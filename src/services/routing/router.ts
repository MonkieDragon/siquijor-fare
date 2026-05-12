import type { Location } from "../../types/location";
import type { RouteResult } from "../../types/route";

const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

export async function calculateRoute(
  start: Location,
  end: Location,
): Promise<RouteResult | null> {
  const coordinates = `${start.lon},${start.lat};${end.lon},${end.lat}`;

  const url =
    `${OSRM_BASE_URL}/${coordinates}` + "?overview=full&geometries=geojson";

  const response = await fetch(url);

  const data = await response.json();

  if (!data.routes?.length) {
    return null;
  }

  const route = data.routes[0];

  return {
    distanceMeters: route.distance,

    durationSeconds: route.duration,

    coordinates: route.geometry.coordinates.map(
      ([lon, lat]: [number, number]) => [lat, lon],
    ),
  };
}
