import { describe, expect, it } from "vitest";

import {
  DEFAULT_FARE_HUB,
  findInterpolationReference,
} from "./interpolationReference";

import type { FareRoute } from "./fareTypes";

describe("findInterpolationReference", () => {
  const hubToLazi: FareRoute = {
    from: "San Juan",
    to: "Lazi",
    fare: 600,
    approximateDistanceKm: 19.73,
  };

  const otherHubToLazi: FareRoute = {
    from: "Maria",
    to: "Lazi",
    fare: 550,
    approximateDistanceKm: 18,
  };

  it("returns null when no route shares the destination", () => {
    expect(
      findInterpolationReference([hubToLazi], "San Juan", "Enrique Villanueva"),
    ).toBeNull();
  });

  it("returns null when destination matches but approximateDistanceKm is missing", () => {
    const noDist: FareRoute = {
      from: "San Juan",
      to: "Lazi",
      fare: 600,
    };

    expect(
      findInterpolationReference([noDist], "San Juan", "Lazi"),
    ).toBeNull();
  });

  it("returns null when approximateDistanceKm is zero", () => {
    const zeroDist: FareRoute = {
      from: "San Juan",
      to: "Lazi",
      fare: 600,
      approximateDistanceKm: 0,
    };

    expect(
      findInterpolationReference([zeroDist], "San Juan", "Lazi"),
    ).toBeNull();
  });

  it("prefers direct from match over hub when both exist for same destination", () => {
    expect(
      findInterpolationReference(
        [hubToLazi, otherHubToLazi],
        "Maria",
        "Lazi",
        DEFAULT_FARE_HUB,
      ),
    ).toEqual(otherHubToLazi);
  });

  it("falls back to default hub route when start does not match any candidate from", () => {
    expect(
      findInterpolationReference([hubToLazi], "Paliton Beach", "Lazi"),
    ).toEqual(hubToLazi);
  });

  it("normalizes case and trims whitespace on names", () => {
    expect(
      findInterpolationReference(
        [hubToLazi],
        "  san juan  ",
        "  lazi ",
      ),
    ).toEqual(hubToLazi);
  });

  it("returns null when destination matches but no hub candidate exists", () => {
    expect(
      findInterpolationReference([otherHubToLazi], "Paliton Beach", "Lazi"),
    ).toBeNull();
  });
});
