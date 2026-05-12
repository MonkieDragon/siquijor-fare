import { describe, expect, it } from "vitest";

import { resolveFarePlaceName } from "./resolveFarePlaceName";

import type { Location } from "../../types/location";

function loc(partial: Partial<Location> & Pick<Location, "lat" | "lon">): Location {
  return {
    name: partial.name ?? "X",

    lat: partial.lat,

    lon: partial.lon,

    displayName: partial.displayName,
  };
}

describe("resolveFarePlaceName", () => {
  it("matches anchor name as substring in name", () => {
    expect(
      resolveFarePlaceName(
        loc({
          name: "San Juan Integrated School",

          lat: 9,

          lon: 123,
        }),
      ),
    ).toBe("San Juan");
  });

  it("matches anchor name as substring in displayName when name has no hit", () => {
    expect(
      resolveFarePlaceName(
        loc({
          name: "School",

          displayName: "Larena Port, Larena, Philippines",

          lat: 9,

          lon: 123,
        }),
      ),
    ).toBe("Larena");
  });

  it("prefers municipality over province when displayName contains both", () => {
    expect(
      resolveFarePlaceName(
        loc({
          name: "School",

          displayName: "Larena Port, Larena, Siquijor, Philippines",

          lat: 9.2488946,

          lon: 123.5910019,
        }),
      ),
    ).toBe("Larena");
  });

  it("falls back to nearest anchor by coordinates near Lazi", () => {
    expect(
      resolveFarePlaceName(
        loc({
          name: "Dropped pin",

          lat: 9.128,

          lon: 123.634,
        }),
      ),
    ).toBe("Lazi");
  });

  it("falls back to nearest anchor by coordinates near San Juan", () => {
    expect(
      resolveFarePlaceName(
        loc({
          name: "Paliton Beach",

          lat: 9.1783615,

          lon: 123.4612927,
        }),
      ),
    ).toBe("San Juan");
  });
});
