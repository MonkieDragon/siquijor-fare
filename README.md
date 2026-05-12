# Siquijor Trike Fare Calculator

A mobile-first web app that helps tourists estimate tricycle fares in Siquijor, Philippines.

The goal is not to perfectly simulate negotiated real-world pricing, but to provide:

- official fare transparency
- realistic route distance estimates
- trustworthy fare guidance
- reduced tourist overcharging
- a future foundation for ride hailing

---

# Project Goals

## Immediate Goal

Provide a lightweight mobile-friendly website where a tourist can:

1. Allow location access
2. Enter a destination naturally
3. View:
   - route
   - road distance
   - estimated trike fare
   - confidence level
4. Use that information before negotiating with a driver

---

## Long-Term Goal

Potential future expansion into:

- crowd-sourced fare reporting
- tourist fare heatmaps
- ride hailing
- driver matching
- route optimization
- offline-first PWA
- tourist transport platform

---

# Core Design Principles

## 1. Mobile First

Users are primarily tourists using phones outdoors.

UI expectations:

- Uber-like interaction
- intuitive search
- no tutorial needed
- large touch targets
- minimal friction

---

## 2. No Paid APIs

Project intentionally avoids:

- Google Maps APIs
- paid routing/geocoding
- usage-based billing

Current stack uses:

- OpenStreetMap
- Leaflet
- OSRM
- local search index

---

## 3. Layered Architecture

Each concern is isolated.

### Geocoding

- destination search only

### Routing

- road path calculation only

### Fare Engine

- pricing only

### UI

- presentation only

This separation is critical because:

- routing providers may change
- fare logic will evolve
- crowd pricing may be added later
- local search datasets will expand

---

# Current Tech Stack

- React
- TypeScript
- Vite
- React Leaflet
- Fuse.js
- OpenStreetMap
- OSRM routing

---

# Current Architecture

```txt
src/
  components/
    map/
    search/

  hooks/

  services/
    geocoding/
    routing/
    fare/
    map/

  data/

  types/
```

---

# Geocoding Methodology

## Important Concept

This app is NOT implementing generic global geocoding.

It is implementing:

> "Siquijor destination search"

This dramatically simplifies the problem.

---

## Local Search First

The app uses a local searchable location index generated from OpenStreetMap data.

Search flow:

```txt
User Input
    ↓
Fuse.js local search
    ↓
(optional future remote fallback)
    ↓
destination result
```

Benefits:

- instant results
- offline-friendly
- minimal API usage
- avoids Nominatim rate limiting
- highly controllable

---

## Dataset Source

Locations are generated from:

- OpenStreetMap
- Overpass Turbo exports

Raw exports:

```txt
data/raw/
```

Processed frontend dataset:

```txt
src/data/siquijorLocations.json
```

---

## Search Methodology

Uses:

- Fuse.js fuzzy matching

Current matching:

- typo tolerant
- partial matching
- ranked search

Examples:

- "cambu" → Cambugahay Falls
- "palit" → Paliton Beach

---

# Routing Methodology

Uses:

- OSRM public routing server

Purpose:

- real road distance
- realistic route visualization
- route duration estimates

Important:

- NEVER use straight-line distance
- all fare calculations should be road-distance based

---

## Route Data Flow

```txt
Start Location
    ↓
Destination
    ↓
OSRM Route
    ↓
Polyline
    ↓
Distance
    ↓
Fare Engine
```

---

# Fare Engine Methodology

The fare engine intentionally uses layered confidence levels.

## Current Planned Hierarchy

```txt
1. Exact official fare match
2. Reverse route exact match
3. Nearby official route interpolation
4. Distance-based fallback estimate
```

This is important because official fare matrices are incomplete and inconsistent.

---

## Exact Match

If:

```txt
San Juan → Larena
```

exists in official data:

Use exact fare directly.

---

## Reverse Match

If:

```txt
Larena → San Juan
```

is requested:

Reuse same official fare.

---

## Interpolation

If:

```txt
San Juan → Sandugan
```

has no official fare:

Use:

- nearby known routes
- proportional distance scaling

This is far superior to naive per-km guessing.

---

## Distance Fallback

Last resort only.

Current approach:

```txt
base fare + per km
```

Values intentionally conservative.

---

# Important Product Philosophy

This app should NOT pretend to know exact real-world negotiated prices.

Instead:

- be transparent
- show confidence
- distinguish official vs estimated fares

Good UX example:

```txt
₱600
Official LGU Fare
```

vs

```txt
₱350–450
Estimated from nearby official routes
```

---

# Current Completed Features

## Map

- Leaflet map
- mobile rendering
- current GPS location

## Search

- local fuzzy search
- Siquijor-only destinations

## Routing

- OSRM routing
- route polyline rendering
- route distance calculation
- fit-to-route bounds

## Data Pipeline

- Overpass export processing
- lightweight searchable datasets

---

# Remaining Major Tasks

## High Priority

### Fare Engine

- attach real route distances to official fare routes
- interpolation calibration
- confidence scoring

### Fare UI

- display estimate cards
- official vs estimated labels

### Routing Improvements

- route caching
- retry handling
- offline degradation

---

## Medium Priority

### Better Search

- aliases
- categories
- ranking
- deduplication

### Dataset Enrichment

- barangays
- resorts
- tourist landmarks

### PWA

- offline shell
- installable app
- cached assets

---

## Long-Term Ideas

- crowd sourced fares
- driver reporting
- ride hailing
- trip history
- tourist hotspot pricing
- analytics
- multilingual support

---

# Development Notes

## Avoid Tight Coupling

Do NOT:

- embed fare logic in UI
- embed routing logic in search
- tie map rendering to business logic

Maintain service-layer separation.

---

## Important Constraints

### No paid APIs

Avoid Google APIs unless absolutely necessary.

### Mobile performance matters

Keep:

- datasets lightweight
- routing efficient
- rendering simple

### Tourists are primary users

UX should prioritize:

- clarity
- trust
- speed
- simplicity

---

# Running Project

```bash
npm install
npm run dev
```

---

# Processing Location Data

Raw OSM exports:

```txt
data/raw/
```

Run processing script:

```bash
node scripts/processLocations.js
```

Generated frontend dataset:

```txt
src/data/siquijorLocations.json
```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
