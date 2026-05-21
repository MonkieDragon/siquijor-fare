import { describe, expect, it } from "vitest";

import { getOfficialRouteGeometry } from "./officialRouteGeometries";

import { allOfficialLegsOrdered } from "./officialFareLegs";

import { findScalingReferenceLeg } from "./scalingReferenceFare";

import type { OfficialFareLeg } from "./fareTypes";

import type { LatLonPolyline } from "./routeGeometrySimilarity";

const poblacionToSiquijor = getOfficialRouteGeometry(
  "san_juan_poblacion",
  "siquijor_port",
)!;

const poblacionToLarena = getOfficialRouteGeometry(
  "san_juan_poblacion",
  "larena",
)!;

function legByKey(from: string, to: string): OfficialFareLeg {
  const leg = allOfficialLegsOrdered.find(
    (l) => l.fromZoneId === from && l.toZoneId === to,
  );
  if (!leg) {
    throw new Error(`missing leg ${from} → ${to}`);
  }
  return leg;
}

describe("findScalingReferenceLeg", () => {
  it("returns null when route coordinates are missing", () => {
    expect(
      findScalingReferenceLeg(
        allOfficialLegsOrdered,
        "san_juan_poblacion",
        "siquijor_port",
        6.8,
        [],
      ),
    ).toBeNull();
  });

  it("returns null when there is no endpoint overlap", () => {
    expect(
      findScalingReferenceLeg(allOfficialLegsOrdered, "x", "y", 10, poblacionToSiquijor),
    ).toBeNull();
  });

  it("matches poblacion → siquijor when trip follows that path", () => {
    const match = findScalingReferenceLeg(
      allOfficialLegsOrdered,
      "san_juan_poblacion",
      "siquijor_port",
      6.9,
      poblacionToSiquijor,
    );

    expect(match).not.toBeNull();
    expect(match!.leg).toEqual(legByKey("san_juan_poblacion", "siquijor_port"));
    expect(match!.direction).toBe("forward");
    expect(match!.overlapFraction).toBeGreaterThanOrEqual(0.75);
  });

  it("does not match poblacion → siquijor for siquijor → larena trip", () => {
    const siquijorToLarena = [...poblacionToLarena].reverse() as LatLonPolyline;

    expect(
      findScalingReferenceLeg(
        allOfficialLegsOrdered,
        "siquijor_port",
        "larena",
        16.5,
        siquijorToLarena,
      ),
    ).toBeNull();
  });

  it("matches poblacion → larena when trip follows that path", () => {
    const match = findScalingReferenceLeg(
      allOfficialLegsOrdered,
      "san_juan_poblacion",
      "larena",
      16.5,
      poblacionToLarena,
    );

    expect(match).not.toBeNull();
    expect(match!.leg).toEqual(legByKey("san_juan_poblacion", "larena"));
    expect(match!.direction).toBe("forward");
  });
});
