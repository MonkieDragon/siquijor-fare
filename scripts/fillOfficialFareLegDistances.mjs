/**
 * Fills referenceDistanceKm on every leg in src/data/officialFareLegs.json using
 * OSRM driving distance between zone canonical coordinates (see fareZoneCanonicals.json).
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRouteKm(start, end) {
  const coordinates = `${start.lon},${start.lat};${end.lon},${end.lat}`;
  const url =
    `${DEFAULT_OSRM_BASE}/${coordinates}` + "?overview=false&geometries=geojson";

  const response = await fetch(url, { signal: AbortSignal.timeout(90_000) });

  if (!response.ok) {
    throw new Error(`OSRM HTTP ${response.status} for ${url}`);
  }

  const data = await response.json();

  if (!data.routes?.length) {
    throw new Error(`OSRM returned no routes for ${coordinates}`);
  }

  const route = data.routes[0];
  return route.distance / 1000;
}

function directedKey(fromId, toId) {
  return `${fromId}→${toId}`;
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

  for (const leg of allLegs) {
    const a = canonical[leg.fromZoneId];
    const b = canonical[leg.toZoneId];

    if (!a || !b) {
      throw new Error(
        `Missing canonical for leg ${leg.fromZoneId} → ${leg.toZoneId}`,
      );
    }

    const km = await fetchRouteKm(a, b);
    leg.referenceDistanceKm = Math.round(km * 100) / 100;

    console.log(
      `${leg.table} ${leg.fromZoneId} → ${leg.toZoneId}: ${leg.referenceDistanceKm} km`,
    );

    await sleep(600);
  }

  fs.writeFileSync(LEGS_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`Updated ${LEGS_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
