import { describe, expect, it } from "vitest";

import { interpolateFare } from "./interpolateFare";

import type { FareRoute } from "./fareTypes";

const route = (fare: number): FareRoute => ({
  from: "A",
  to: "B",
  fare,
});

describe("interpolateFare", () => {
  it("scales fare by distance ratio (doubling distance doubles fare)", () => {
    expect(interpolateFare(route(300), 14, 7)).toBe(600);
  });

  it("rounds to nearest peso", () => {
    expect(interpolateFare(route(300), 10, 7)).toBe(429);
  });

  it("documentWhenOfficialDistanceIsZero yields Infinity (callers must guard)", () => {
    expect(interpolateFare(route(100), 5, 0)).toBe(Infinity);
  });
});
