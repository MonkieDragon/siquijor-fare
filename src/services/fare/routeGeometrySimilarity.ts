/** OSRM / app polylines as `[lat, lon][]`. */
export type LatLonPolyline = [number, number][];

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const t1 = (lat1 * Math.PI) / 180;
  const t2 = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(t1) * Math.cos(t2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function directedLegKey(fromZoneId: string, toZoneId: string): string {
  return `${fromZoneId}→${toZoneId}`;
}

/** Evenly spaced indices including first and last. */
export function resamplePolylineIndices(
  length: number,
  maxPoints: number,
): number[] {
  const n = length;
  if (n === 0) {
    return [];
  }
  if (n <= maxPoints) {
    return Array.from({ length: n }, (_, i) => i);
  }
  const step = Math.max(1, Math.ceil(n / maxPoints));
  const indices = new Set<number>([0, n - 1]);
  for (let i = 0; i < n; i += step) {
    indices.add(i);
  }
  return [...indices].sort((a, b) => a - b);
}

export function resamplePolyline(
  coords: LatLonPolyline,
  maxPoints: number,
): LatLonPolyline {
  const indices = resamplePolylineIndices(coords.length, maxPoints);
  return indices.map((i) => coords[i]!);
}

function pointToSegmentKm(
  lat: number,
  lon: number,
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const dAB = haversineKm(aLat, aLon, bLat, bLon);
  if (dAB < 1e-9) {
    return haversineKm(lat, lon, aLat, aLon);
  }
  const dAP = haversineKm(aLat, aLon, lat, lon);
  const dBP = haversineKm(bLat, bLon, lat, lon);
  const t = Math.max(0, Math.min(1, (dAP * dAP - dBP * dBP + dAB * dAB) / (2 * dAB * dAB)));
  const projLat = aLat + t * (bLat - aLat);
  const projLon = aLon + t * (bLon - aLon);
  return haversineKm(lat, lon, projLat, projLon);
}

/** Minimum distance from a point to any segment of the polyline. */
export function pointToPolylineKm(
  lat: number,
  lon: number,
  polyline: LatLonPolyline,
): number {
  if (polyline.length === 0) {
    return Infinity;
  }
  if (polyline.length === 1) {
    const [aLat, aLon] = polyline[0]!;
    return haversineKm(lat, lon, aLat, aLon);
  }
  let min = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const [aLat, aLon] = polyline[i]!;
    const [bLat, bLon] = polyline[i + 1]!;
    min = Math.min(min, pointToSegmentKm(lat, lon, aLat, aLon, bLat, bLon));
  }
  return min;
}

/**
 * Share of resampled trip points within `bufferKm` of the reference polyline.
 */
export function routeOverlapFraction(
  tripCoords: LatLonPolyline,
  refCoords: LatLonPolyline,
  bufferKm: number,
  maxSamplePoints = 48,
): number {
  if (tripCoords.length === 0 || refCoords.length === 0) {
    return 0;
  }
  const samples = resamplePolyline(tripCoords, maxSamplePoints);
  let within = 0;
  for (const [lat, lon] of samples) {
    if (pointToPolylineKm(lat, lon, refCoords) <= bufferKm) {
      within += 1;
    }
  }
  return within / samples.length;
}

export function tripEndpointsNearReference(
  tripCoords: LatLonPolyline,
  refCoords: LatLonPolyline,
  maxKmPerEnd: number,
): boolean {
  if (tripCoords.length === 0 || refCoords.length === 0) {
    return false;
  }
  const [t0Lat, t0Lon] = tripCoords[0]!;
  const [t1Lat, t1Lon] = tripCoords[tripCoords.length - 1]!;
  const [r0Lat, r0Lon] = refCoords[0]!;
  const [r1Lat, r1Lon] = refCoords[refCoords.length - 1]!;
  return (
    haversineKm(t0Lat, t0Lon, r0Lat, r0Lon) <= maxKmPerEnd &&
    haversineKm(t1Lat, t1Lon, r1Lat, r1Lon) <= maxKmPerEnd
  );
}

export function reversePolyline(coords: LatLonPolyline): LatLonPolyline {
  return [...coords].reverse();
}
