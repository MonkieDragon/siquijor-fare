import fareAnchorPoints from "../../data/fareAnchorPoints.json";

import type { Location } from "../../types/location";

type AnchorRecord = Record<string, { lat: number; lon: number }>;

const anchors = fareAnchorPoints as AnchorRecord;

/** Province appears in most Nominatim strings; prefer a municipality when both match. */
const PROVINCE_ANCHOR = "Siquijor";

const ANCHOR_KEYS = Object.keys(anchors).sort((a, b) => b.length - a.length);

const EARTH_RADIUS_KM = 6371;

function haversineKm(
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

function collectSubstringAnchors(text: string): string[] {
  const lower = text.toLowerCase();

  const matches: string[] = [];

  for (const key of ANCHOR_KEYS) {
    if (lower.includes(key.toLowerCase())) {
      matches.push(key);
    }
  }

  return matches;
}

function pickBestSubstringMatch(
  matches: string[],
  lat: number,
  lon: number,
): string | null {
  if (matches.length === 0) {
    return null;
  }

  const unique = [...new Set(matches)];

  const withoutProvince = unique.filter((k) => k !== PROVINCE_ANCHOR);

  const pool =
    withoutProvince.length > 0 ? withoutProvince : unique;

  pool.sort((a, b) => {
    const lenDiff = b.length - a.length;

    if (lenDiff !== 0) {
      return lenDiff;
    }

    const da = haversineKm(lat, lon, anchors[a]!.lat, anchors[a]!.lon);

    const db = haversineKm(lat, lon, anchors[b]!.lat, anchors[b]!.lon);

    return da - db;
  });

  return pool[0] ?? null;
}

function findSubstringAnchor(
  text: string,
  lat: number,
  lon: number,
): string | null {
  return pickBestSubstringMatch(collectSubstringAnchors(text), lat, lon);
}

function nearestAnchorKey(lat: number, lon: number): string {
  let bestKey = ANCHOR_KEYS[0]!;

  let bestDist = Number.POSITIVE_INFINITY;

  for (const key of ANCHOR_KEYS) {
    const p = anchors[key];

    if (!p) {
      continue;
    }

    const d = haversineKm(lat, lon, p.lat, p.lon);

    if (d < bestDist || (d === bestDist && key.localeCompare(bestKey) < 0)) {
      bestDist = d;

      bestKey = key;
    }
  }

  return bestKey;
}

/**
 * Maps a user-selected place to the closest official fare anchor name
 * (substring match on name/displayName, else haversine to fareAnchorPoints).
 */
export function resolveFarePlaceName(location: Location): string {
  const { lat, lon } = location;

  const fromName = findSubstringAnchor(location.name, lat, lon);

  if (fromName) {
    return fromName;
  }

  if (location.displayName) {
    const fromDisplay = findSubstringAnchor(location.displayName, lat, lon);

    if (fromDisplay) {
      return fromDisplay;
    }
  }

  return nearestAnchorKey(lat, lon);
}
