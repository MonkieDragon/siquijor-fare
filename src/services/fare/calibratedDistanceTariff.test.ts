import { describe, expect, it } from "vitest";

import { calibrateTariffFromRoutes } from "./calibratedDistanceTariff";

import type { FareRoute } from "./fareTypes";

describe("calibrateTariffFromRoutes", () => {
  it("uses fallback when fewer than two routes have positive distances", () => {
    expect(calibrateTariffFromRoutes([])).toEqual({
      baseFare: 80,
      perKm: 18,
    });

    expect(
      calibrateTariffFromRoutes([
        {
          from: "A",
          to: "B",
          fare: 300,
          approximateDistanceKm: 10,
        },
      ]),
    ).toEqual({
      baseFare: 80,
      perKm: 18,
    });
  });

  it("fits two clean points with OLS when base is non-negative and slope positive", () => {
    const routes: FareRoute[] = [
      { from: "A", to: "B", fare: 300, approximateDistanceKm: 10 },
      { from: "A", to: "C", fare: 600, approximateDistanceKm: 20 },
    ];

    expect(calibrateTariffFromRoutes(routes)).toEqual({
      baseFare: 0,
      perKm: 30,
    });
  });

  it("uses median implied rate when OLS slope is non-positive", () => {
    const routes: FareRoute[] = [
      { from: "A", to: "B", fare: 500, approximateDistanceKm: 10 },
      { from: "A", to: "C", fare: 400, approximateDistanceKm: 20 },
    ];

    expect(calibrateTariffFromRoutes(routes)).toEqual({
      baseFare: 80,
      perKm: 40,
    });
  });

  it("uses median path when distances are identical (degenerate OLS) and clamps low median rate to 10", () => {
    const routes: FareRoute[] = [
      { from: "A", to: "B", fare: 100, approximateDistanceKm: 10 },
      { from: "A", to: "C", fare: 150, approximateDistanceKm: 10 },
    ];

    expect(calibrateTariffFromRoutes(routes)).toEqual({
      baseFare: 80,
      perKm: 10,
    });
  });

  it("clamps OLS perKm to configured bounds when fit is otherwise valid", () => {
    const routes: FareRoute[] = [
      { from: "A", to: "B", fare: 100, approximateDistanceKm: 10 },
      { from: "A", to: "C", fare: 160, approximateDistanceKm: 30 },
    ];

    expect(calibrateTariffFromRoutes(routes)).toEqual({
      baseFare: 70,

      perKm: 10,
    });
  });
});
