/**
 * Builds src/data/officialFareDistances.json using the same OSRM contract as
 * src/services/routing/router.ts (public Project OSRM, driving profile).
 *
 * Anchor coordinates live in src/data/fareAnchorPoints.json — one canonical
 * point per place name used in official fares (town / barangay representative
 * from OSM-derived data, not arbitrary map clicks).
 *
 * When you add official routes or rename anchors, update fareAnchorPoints.json
 * and the OFFICIAL_LEGS list below, then re-run:
 *   node scripts/buildOfficialFareDistances.mjs
 *
 * If the public OSRM host is unreachable, set OSRM_BASE_URL to another OSRM
 * deployment that exposes the same /route/v1/driving API shape.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_OSRM_BASE =
  process.env.OSRM_BASE_URL ??
  "https://router.project-osrm.org/route/v1/driving";

/** Directed legs that appear in official fare data (keep in sync with fareData.ts). */
const OFFICIAL_LEGS = [
  { from: "San Juan", to: "Siquijor" },
  { from: "San Juan", to: "Larena" },
  { from: "San Juan", to: "Campalanas" },
  { from: "San Juan", to: "Lazi" },
];

const ANCHORS_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "fareAnchorPoints.json",
);

const OUT_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "officialFareDistances.json",
);

function legKey(from, to) {
  return `${from}|${to}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRouteKm(start, end) {
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
  return route.distance / 1000;
}

async function main() {
  const anchors = JSON.parse(fs.readFileSync(ANCHORS_PATH, "utf-8"));

  /** @type {Record<string, number>} */
  const distancesKm = {};

  for (const leg of OFFICIAL_LEGS) {
    const start = anchors[leg.from];
    const end = anchors[leg.to];

    if (!start || !end) {
      throw new Error(
        `Missing anchor for leg ${leg.from} → ${leg.to}. Check fareAnchorPoints.json.`,
      );
    }

    const km = await fetchRouteKm(start, end);
    const rounded = Math.round(km * 100) / 100;
    distancesKm[legKey(leg.from, leg.to)] = rounded;

    console.log(`${leg.from} → ${leg.to}: ${rounded} km`);

    await sleep(600);
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(distancesKm, null, 2) + "\n");
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
