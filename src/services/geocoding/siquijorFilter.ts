type LatLng = {
  lat: number;
  lon: number;
};

// Rough bounding box for Siquijor (tight enough for MVP)
const SIQUIJOR_BOUNDS = {
  minLat: 9.05,
  maxLat: 9.3,
  minLon: 123.45,
  maxLon: 123.7,
};

export function isInSiquijor({ lat, lon }: LatLng): boolean {
  return (
    lat >= SIQUIJOR_BOUNDS.minLat &&
    lat <= SIQUIJOR_BOUNDS.maxLat &&
    lon >= SIQUIJOR_BOUNDS.minLon &&
    lon <= SIQUIJOR_BOUNDS.maxLon
  );
}
