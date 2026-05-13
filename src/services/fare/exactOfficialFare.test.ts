import { describe, expect, it } from "vitest";

import { findExactOfficialLeg } from "./exactOfficialFare";

import { allOfficialLegsOrdered } from "./officialFareLegs";

describe("findExactOfficialLeg", () => {
  it("matches special trip Poblacion to Lazi forward", () => {
    const hit = findExactOfficialLeg(
      allOfficialLegsOrdered,

      "san_juan_poblacion",

      "lazi",
    );

    expect(hit?.leg.farePhp).toBe(600);

    expect(hit?.leg.table).toBe("special_trip");

    expect(hit?.isForward).toBe(true);
  });

  it("matches symmetric special trip in reverse", () => {
    const hit = findExactOfficialLeg(
      allOfficialLegsOrdered,

      "lazi",

      "san_juan_poblacion",
    );

    expect(hit?.leg.farePhp).toBe(600);

    expect(hit?.isForward).toBe(false);
  });

  it("prefers drop-off over special trip when both exist (no collision today)", () => {
    const hit = findExactOfficialLeg(
      allOfficialLegsOrdered,

      "maite",

      "siquijor_port",
    );

    expect(hit?.leg.table).toBe("drop_off");

    expect(hit?.leg.farePhp).toBe(60);
  });
});
