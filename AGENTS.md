# AGENTS.md

This repository contains a mobile-first tourist fare estimation app for tricycles in Siquijor, Philippines.

AI agents working on this repository must understand:

- this is NOT a generic mapping application
- this is NOT a generic ride-hailing clone
- this is a geographically constrained transport estimation tool

The architecture intentionally prioritizes:

- modularity
- replaceable services
- lightweight infrastructure
- low operational cost

---

# Core Product Goal

Help tourists estimate fair tricycle pricing BEFORE entering a tricycle.

Primary user flow:

```txt
Open website
↓
Allow location access
↓
Enter destination naturally
↓
View route
↓
View realistic fare estimate
↓
Negotiate with confidence
```

---

# Technical Philosophy

## Keep Systems Decoupled

The following systems should remain isolated:

### Geocoding

Destination search only.

### Routing

Road path + route distance only.

### Fare Engine

Pricing logic only.

### UI

Presentation only.

AI agents should avoid introducing cross-layer coupling.

---

# Search Methodology

The app intentionally uses:

- local searchable datasets
- Fuse.js fuzzy search

rather than:

- generic live geocoding APIs

Reason:

- avoids API costs
- avoids rate limits
- better mobile UX
- Siquijor is geographically finite

---

# Routing Methodology

The app uses:

- OSRM routing

All fare calculations should be based on:

- road distance
  NOT:
- straight-line distance

---

# Fare Methodology

The fare engine follows confidence layers:

```txt
1. Exact official fare match
2. Reverse route match
3. Nearby official route interpolation
4. Distance fallback estimate
```

This hierarchy is intentional.

AI agents should preserve this layered approach.

---

# Official Fare Data

Authoritative LGU tricycle fares and OSRM reference leg distances live in:

```txt
src/data/officialFareLegs.json
```

Canonical lat/lon per **zone id** (for OSRM `referenceDistanceKm` batching and alignment with fare zones) live in:

```txt
src/data/fareZoneCanonicals.json
```

Keep `fareZoneCanonicals.json` in sync with zone ids used in `officialFareLegs.json` and [`fareZonesData.ts`](src/data/fareZonesData.ts). Run `npm run build:fare-distances` after changing legs or canonical coordinates.

This data is incomplete and sparse.

AI agents should NOT assume:

- all routes exist
- pricing is perfectly consistent
- tourists always pay official rates

---

# Product Philosophy

This project values:

- believable estimates
- transparency
- confidence scoring

over:

- fake precision

Preferred UX:

```txt
Estimated Fare
Official Fare
Approximate Tourist Fare
```

rather than pretending every route has a perfectly accurate value.

---

# Important Constraints

## No paid APIs

Avoid:

- Google Maps APIs
- commercial routing APIs
- usage-billed services

Preferred stack:

- OpenStreetMap
- OSRM
- local datasets

---

# Current Known Technical Debt

- no route caching
- no offline support
- no route distance attached to official fares
- no destination aliases
- no ranking metadata
- no interpolation calibration

---

# Important Future Work

## Critical

- attach real distances to official fare routes
- calibrate interpolation logic
- add fare confidence UI
- improve destination normalization

## Medium

- PWA support
- offline route fallback
- crowd sourced fare reports
- search categories

---

# Coding Expectations

AI agents should:

- prefer service layers
- avoid giant components
- avoid duplicated logic
- keep mobile performance in mind
- preserve TypeScript typing discipline

Avoid:

- premature optimization
- heavy dependencies
- unnecessary backend complexity
