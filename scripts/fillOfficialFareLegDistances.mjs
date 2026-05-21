/**
 * Fills referenceDistanceKm on every leg in src/data/officialFareLegs.json and
 * caches OSRM driving polylines in src/data/officialRouteGeometries.json.
 *
 *   node scripts/fillOfficialFareLegDistances.mjs
 *
 * Same OSRM contract as src/services/routing/router.ts.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_OSRM_BASE =
  process.env.OSRM_BASE_URL ??
  "https://router.project-osrm.org/route/v1/driving";

const CANON_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "fareZoneCanonicals.json",
);

const LEGS_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "officialFareLegs.json",
);

const GEOM_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "officialRouteGeometries.json",
);

const MAX_POLYLINE_POINTS = 64;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function directedKey(fromId, toId) {
  return `${fromId}→${toId}`;
}

function simplifyPolylineLatLon(coordinatesLonLat, maxPoints) {
  const latLon = coordinatesLonLat.map(([lon, lat]) => [lat, lon]);
  const n = latLon.length;
  if (n <= maxPoints) {
    return latLon;
  }
  const step = Math.max(1, Math.ceil(n / maxPoints));
  const indices = new Set([0, n - 1]);
  for (let i = 0; i < n; i += step) {
    indices.add(i);
  }
  return [...indices]
    .sort((a, b) => a - b)
    .map((i) => latLon[i]);
}

async function fetchRoute(start, end) {
  const coordinates = `${start.lon},${start.lat};${end.lon},${end.lat}`;
  const url =
    `${DEFAULT_OSRM_BASE}/${coordinates}` + "?overview=full&geometries=geojson";

  const response = await fetch(url, { signal: AbortSignal.timeout(90_000) });

  if (!response.ok) {
    throw new Error(`OSRM HTTP ${response.status} for ${url}`);
  }

  const data = await response.json();

  if (!data.routes?.length) {
    throw new Error(`OSRM returned no routes for ${coordinates}`);
  }

  const route = data.routes[0];
  const km = route.distance / 1000;
  const polyline = simplifyPolylineLatLon(route.geometry.coordinates, MAX_POLYLINE_POINTS);
  return { km, polyline };
}

async function main() {
  const canonical = JSON.parse(fs.readFileSync(CANON_PATH, "utf-8"));
  const data = JSON.parse(fs.readFileSync(LEGS_PATH, "utf-8"));

  /** @type {Set<string>} */
  const seen = new Set();

  const allLegs = [...data.specialTripLegs, ...data.dropOffLegs];

  for (const leg of allLegs) {
    const forward = directedKey(leg.fromZoneId, leg.toZoneId);
    const reverse = directedKey(leg.toZoneId, leg.fromZoneId);

    if (seen.has(forward) || seen.has(reverse)) {
      throw new Error(`Duplicate leg ${leg.fromZoneId} ↔ ${leg.toZoneId}`);
    }

    seen.add(forward);
    if (leg.symmetric) {
      seen.add(reverse);
    }
  }

  /** @type {Record<string, [number, number][]>} */
  const geometries = {};

  for (const leg of allLegs) {
    const a = canonical[leg.fromZoneId];
    const b = canonical[leg.toZoneId];

    if (!a || !b) {
      throw new Error(
        `Missing canonical for leg ${leg.fromZoneId} → ${leg.toZoneId}`,
      );
    }

    const { km, polyline } = await fetchRoute(a, b);
    leg.referenceDistanceKm = Math.round(km * 100) / 100;
    geometries[directedKey(leg.fromZoneId, leg.toZoneId)] = polyline;

    console.log(
      `${leg.table} ${leg.fromZoneId} → ${leg.toZoneId}: ${leg.referenceDistanceKm} km, ${polyline.length} pts`,
    );

    await sleep(600);
  }

  fs.writeFileSync(LEGS_PATH, JSON.stringify(data, null, 2) + "\n");
  fs.writeFileSync(GEOM_PATH, JSON.stringify(geometries, null, 2) + "\n");
  console.log(`Updated ${LEGS_PATH}`);
  console.log(`Updated ${GEOM_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
