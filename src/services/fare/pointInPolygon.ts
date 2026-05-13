/**
 * Ray-cast point-in-polygon test. Ring is closed GeoJSON exterior: [lon, lat][].
 */
export function pointInPolygon(
  lon: number,
  lat: number,
  ring: [number, number][],
): boolean {
  if (ring.length < 3) {
    return false;
  }

  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0];

    const yi = ring[i]![1];

    const xj = ring[j]![0];

    const yj = ring[j]![1];

    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}
