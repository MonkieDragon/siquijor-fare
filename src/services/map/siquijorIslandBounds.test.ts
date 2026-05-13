import { describe, expect, it } from "vitest";

import { isLatLonOnSiquijorIsland } from "./siquijorIslandBounds";

import { SIQUIJOR_CENTER } from "./mapConfig";

describe("isLatLonOnSiquijorIsland", () => {
  it("returns true for a point near the configured island center", () => {
    expect(
      isLatLonOnSiquijorIsland(SIQUIJOR_CENTER[0]!, SIQUIJOR_CENTER[1]!),
    ).toBe(true);
  });

  it("returns false for Manila", () => {
    expect(isLatLonOnSiquijorIsland(14.5995, 120.9842)).toBe(false);
  });

  it("returns false for a point well east of the island", () => {
    expect(isLatLonOnSiquijorIsland(9.18, 124.2)).toBe(false);
  });
});
