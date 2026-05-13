import { describe, expect, it } from "vitest";

import { allOfficialLegsOrdered } from "./officialFareLegs";

import { findScalingReferenceLeg } from "./scalingReferenceFare";

describe("findScalingReferenceLeg", () => {
  it("prefers a leg that shares the trip start when distances tie-break", () => {
    const leg = findScalingReferenceLeg(
      allOfficialLegsOrdered,

      "maite",

      "lazi",

      15,
    );

    expect(leg?.fromZoneId === "maite" || leg?.toZoneId === "maite").toBe(true);
  });

  it("returns null when there is no endpoint overlap", () => {
    expect(
      findScalingReferenceLeg(allOfficialLegsOrdered, "x", "y", 10),
    ).toBeNull();
  });
});
