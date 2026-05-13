import { describe, expect, it } from "vitest";

import { FARE_ZONE_DEFINITIONS } from "../../data/fareZonesData";

import { resolveFareZone } from "./resolveFareZone";

import type { Location } from "../../types/location";

function loc(partial: Partial<Location> & Pick<Location, "lat" | "lon">): Location {
  return {
    name: partial.name ?? "X",

    lat: partial.lat,

    lon: partial.lon,

    displayName: partial.displayName,
  };
}

describe("resolveFareZone", () => {
  it("resolves a point inside Maite polygon to maite", () => {
    expect(
      resolveFareZone(
        loc({
          name: "Guesthouse",

          lat: 9.1507,

          lon: 123.5004,
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        zoneId: "maite",

        tier: "polygon",
      }),
    );
  });

  it("resolves Paliton Beach coordinates to paliton", () => {
    expect(
      resolveFareZone(
        loc({
          name: "Paliton Beach",

          lat: 9.1783615,

          lon: 123.4612927,
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        zoneId: "paliton",

        tier: "polygon",
      }),
    );
  });

  it("resolves Siquijor port anchor area to siquijor_port", () => {
    expect(
      resolveFareZone(
        loc({
          name: "Port",

          lat: 9.2155864,

          lon: 123.5138212,
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        zoneId: "siquijor_port",

        tier: "radius",
      }),
    );
  });

  it("maps coarse San Juan text without polygon hit to Poblacion default", () => {
    expect(
      resolveFareZone(
        loc({
          name: "San Juan",

          lat: 9,

          lon: 123,
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        zoneId: "san_juan_poblacion",

        tier: "default_poblacion",
      }),
    );
  });

  it("does not map Maria municipality text to Poblacion", () => {
    expect(
      resolveFareZone(
        loc({
          name: "Maria",

          displayName: "Maria, Siquijor, Philippines",

          lat: 9.1965253,

          lon: 123.6558136,
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        zoneId: null,

        tier: "unknown",
      }),
    );
  });

  it("returns unknown for ambiguous coordinates with no zone match and no coarse San Juan text", () => {
    expect(
      resolveFareZone(
        loc({
          name: "Dropped pin",

          lat: 9.05,

          lon: 123.4,
        }),
      ),
    ).toEqual({ zoneId: null, tier: "unknown" });
  });

  it("uses injected zone list for deterministic ordering tests", () => {
    const tiny = FARE_ZONE_DEFINITIONS.filter((z) => z.id === "maite");

    expect(
      resolveFareZone(
        loc({ name: "Inside", lat: 9.1507263, lon: 123.5004033 }),

        tiny,
      ).zoneId,
    ).toBe("maite");
  });
});
