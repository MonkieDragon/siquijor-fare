import { describe, expect, it } from "vitest";

import {
  calibrateFlatPerKmFromRoutes,
  FALLBACK_PER_KM,
} from "./calibratedDistanceTariff";

import type { FareRoute } from "./fareTypes";

describe("calibrateFlatPerKmFromRoutes", () => {
  it("uses fallback per-km when fewer than two legs with positive distance", () => {
    expect(calibrateFlatPerKmFromRoutes([])).toBe(FALLBACK_PER_KM);

    expect(
      calibrateFlatPerKmFromRoutes([
        {
          from: "A",

          to: "B",

          fare: 300,

          approximateDistanceKm: 10,
        },
      ]),
    ).toBe(FALLBACK_PER_KM);
  });

  it("returns median implied rate for two legs", () => {
    const routes: FareRoute[] = [
      { from: "A", to: "B", fare: 300, approximateDistanceKm: 10 },

      { from: "A", to: "C", fare: 600, approximateDistanceKm: 20 },
    ];

    expect(calibrateFlatPerKmFromRoutes(routes)).toBe(30);
  });

  it("clamps low median to PER_KM_MIN (10)", () => {
    const routes: FareRoute[] = [
      { from: "A", to: "B", fare: 100, approximateDistanceKm: 10 },

      { from: "A", to: "C", fare: 100, approximateDistanceKm: 10 },
    ];

    expect(calibrateFlatPerKmFromRoutes(routes)).toBe(10);
  });

  it("clamps high median to PER_KM_MAX (40)", () => {
    const routes: FareRoute[] = [
      { from: "A", to: "B", fare: 500, approximateDistanceKm: 10 },

      { from: "A", to: "C", fare: 500, approximateDistanceKm: 10 },
    ];

    expect(calibrateFlatPerKmFromRoutes(routes)).toBe(40);
  });

  it("median of four distinct rates", () => {
    const routes: FareRoute[] = [
      { from: "A", to: "B", fare: 100, approximateDistanceKm: 10 },

      { from: "A", to: "C", fare: 200, approximateDistanceKm: 10 },

      { from: "A", to: "D", fare: 150, approximateDistanceKm: 10 },

      { from: "A", to: "E", fare: 250, approximateDistanceKm: 10 },
    ];

    expect(calibrateFlatPerKmFromRoutes(routes)).toBe(17.5);
  });
});
