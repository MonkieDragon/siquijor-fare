import { describe, expect, it } from "vitest";

import {
  routeOverlapFraction,
  tripEndpointsNearReference,
} from "./routeGeometrySimilarity";

/** Rough parallel track ~0.3 km apart near Siquijor. */
function parallelTrack(offsetKm = 0.003): [number, number][] {
  const base: [number, number][] = [
    [9.16, 123.49],
    [9.18, 123.5],
    [9.2, 123.51],
    [9.22, 123.52],
  ];
  return base.map(([lat, lon]) => [lat + offsetKm, lon + offsetKm]);
}

describe("routeGeometrySimilarity", () => {
  it("reports high overlap for nearly identical polylines", () => {
    const ref = parallelTrack(0);
    const trip = parallelTrack(0.001);
    expect(routeOverlapFraction(trip, ref, 1.5)).toBeGreaterThanOrEqual(0.75);
  });

  it("reports low overlap for divergent polylines", () => {
    const ref: [number, number][] = [
      [9.21, 123.51],
      [9.22, 123.52],
    ];
    const trip: [number, number][] = [
      [9.02, 123.25],
      [9.03, 123.26],
    ];
    expect(routeOverlapFraction(trip, ref, 1.5)).toBeLessThan(0.5);
  });

  it("requires trip endpoints near reference endpoints", () => {
    const ref: [number, number][] = [
      [9.0, 123.0],
      [9.1, 123.1],
    ];
    const trip: [number, number][] = [
      [9.0, 123.0],
      [9.5, 123.5],
    ];
    expect(tripEndpointsNearReference(trip, ref, 2)).toBe(false);
  });
});
