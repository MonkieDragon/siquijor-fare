import fs from "fs";

const raw = JSON.parse(fs.readFileSync("./data/raw/siquijorRaw.json", "utf-8"));

/** @param {[number, number]} c */
function coords(c) {
  return { lon: c[0], lat: c[1] };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isProvinceFeature(p) {
  return (
    p["admin_level"] === "4" &&
    p["admin_type:PH"] === "province"
  );
}

function isMunicipalityTown(p) {
  return (
    p.place === "town" &&
    p["admin_level"] === "6" &&
    p["admin_type:PH"] === "municipality" &&
    typeof p.name === "string"
  );
}

function isFerryMatchingMunicipality(p, municipalityNames) {
  const n = (p.name ?? "").trim();
  if (!n || !municipalityNames.has(n)) {
    return false;
  }
  if (p.amenity === "ferry_terminal") {
    return true;
  }
  if (p.ferry === "yes" && p.public_transport) {
    return true;
  }
  return false;
}

function stableFeatureId(f) {
  return String(f.properties?.["@id"] ?? f.id ?? "");
}

function primaryLabel(feature, municipalityNames) {
  const p = feature.properties;
  const base = (p.name ?? "").trim();
  if (!base) {
    return base;
  }
  if (isFerryMatchingMunicipality(p, municipalityNames)) {
    return `${base} Ferry Terminal`;
  }
  return base;
}

function nearestTownLabel(lat, lon, towns) {
  if (!towns.length) {
    return "";
  }
  let best = towns[0];
  let bestD = Infinity;
  for (const t of towns) {
    const d = haversineKm(lat, lon, t.lat, t.lon);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best.name;
}

function addrSubtitle(p) {
  const village = p["addr:village"]?.trim();
  const town = p["addr:town"]?.trim();
  const street = p["addr:street"]?.trim();
  const parts = [];
  if (village) {
    parts.push(village);
  }
  if (town) {
    parts.push(town);
  }
  if (parts.length > 0) {
    return parts.join(" · ");
  }
  if (street) {
    return street.length > 42 ? `${street.slice(0, 39)}…` : street;
  }
  return "";
}

const features = raw.features.filter((f) => {
  const p = f.properties;
  return (
    p?.name &&
    f.geometry?.coordinates &&
    Array.isArray(f.geometry.coordinates) &&
    !isProvinceFeature(p)
  );
});

const municipalityTowns = features
  .filter((f) => isMunicipalityTown(f.properties))
  .map((f) => {
    const p = f.properties;
    const { lon, lat } = coords(f.geometry.coordinates);
    return { name: p.name.trim(), lat, lon };
  });

const municipalityNames = new Set(municipalityTowns.map((t) => t.name));

/** @type {Array<{ feature: typeof features[0], baseName: string, primary: string, nearestTown: string, addrLine: string, osmId: string }>} */
const candidates = features.map((f) => {
  const p = f.properties;
  const { lon, lat } = coords(f.geometry.coordinates);
  const baseName = (p.name ?? "").trim();
  const nearestTown = nearestTownLabel(lat, lon, municipalityTowns);
  return {
    feature: f,
    baseName,
    primary: primaryLabel(f, municipalityNames),
    nearestTown,
    addrLine: addrSubtitle(p),
    osmId: stableFeatureId(f),
  };
});

candidates.sort((a, b) => a.osmId.localeCompare(b.osmId));

const usedNames = new Set();

/**
 * @param {typeof candidates[0]} c
 */
function assignUniqueName(c) {
  const p = c.feature.properties;
  const base = c.primary || c.baseName;
  const village = p["addr:village"]?.trim();

  /** @type {string[]} */
  const attempts = [];

  attempts.push(base);
  if (c.addrLine) {
    attempts.push(`${base} · ${c.addrLine}`);
  }
  attempts.push(`${base} — ${c.nearestTown}`);
  if (village) {
    attempts.push(`${base} — ${c.nearestTown} · ${village}`);
  }

  for (const cand of attempts) {
    if (!usedNames.has(cand)) {
      usedNames.add(cand);
      return cand;
    }
  }

  let k = 2;
  while (true) {
    const cand = `${base} — ${c.nearestTown} (${k})`;
    if (!usedNames.has(cand)) {
      usedNames.add(cand);
      return cand;
    }
    k++;
  }
}

/** @type {Array<{ name: string, lon: number, lat: number, displayName?: string }>} */
const cleaned = [];

for (const c of candidates) {
  const p = c.feature.properties;

  const displayFromAddr =
    [p["addr:village"], p["addr:town"]].filter(Boolean).join(" · ") ||
    undefined;

  const final = assignUniqueName(c);

  const row = {
    name: final,
    lon: coords(c.feature.geometry.coordinates).lon,
    lat: coords(c.feature.geometry.coordinates).lat,
  };

  if (displayFromAddr) {
    row.displayName = displayFromAddr;
  }

  cleaned.push(row);
}

const nameCounts = new Map();
for (const row of cleaned) {
  nameCounts.set(row.name, (nameCounts.get(row.name) ?? 0) + 1);
}
const dupes = [...nameCounts.entries()].filter(([, count]) => count > 1);
if (dupes.length > 0) {
  console.error("Duplicate names after processing:", dupes.slice(0, 20));
  process.exit(1);
}

fs.writeFileSync(
  "./src/data/siquijorLocations.json",
  JSON.stringify(cleaned, null, 2),
);

console.log(`Processed ${cleaned.length} locations (unique names enforced)`);
