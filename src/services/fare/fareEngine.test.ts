import { describe, expect, it } from "vitest";

import { getFlatPerKmRate } from "./calibratedDistanceTariff";

import { calculateFare } from "./fareEngine";

import { roundFareUpToTen } from "./fareRounding";

import { getOfficialRouteGeometry } from "./officialRouteGeometries";

describe("calculateFare", () => {
  it("returns exact special trip for poblacion to Lazi", () => {
    const est = calculateFare(
      { zoneId: "san_juan_poblacion", tier: "radius" },

      { zoneId: "lazi", tier: "radius" },

      20,
    );

    expect(est.method).toBe("exact");

    expect(est.fare).toBe(600);

    expect(est.officialTable).toBe("special_trip");
  });

  it("returns exact drop-off for Maite to port", () => {
    const est = calculateFare(
      { zoneId: "maite", tier: "polygon" },

      { zoneId: "siquijor_port", tier: "radius" },

      8,
    );

    expect(est.method).toBe("exact");

    expect(est.fare).toBe(350);

    expect(est.officialTable).toBe("drop_off");
  });

  it("uses distance estimate when a zone is unknown", () => {
    const est = calculateFare(
      { zoneId: null, tier: "unknown" },

      { zoneId: "lazi", tier: "radius" },

      12,
    );

    expect(est.method).toBe("distance_estimate");
  });

  const portLatLon: [number, number] = [9.2155864, 123.5138212];

  const routeThroughPort: [number, number][] = [portLatLon, [9.23, 123.55]];

  const routeAwayFromPort: [number, number][] = [
    [9.02, 123.25],

    [9.03, 123.26],
  ];

  /** Inside Campalanas fare zone (triggers south_via_port corridor). */
  const campalanasLatLon: [number, number] = [9.1211273, 123.5780727];

  const routeThroughPortAndCampalanas: [number, number][] = [
    portLatLon,

    campalanasLatLon,
  ];

  it("corridor interpolates poblacion to unknown when route passes Siquijor port", () => {
    const est = calculateFare(
      { zoneId: "san_juan_poblacion", tier: "radius" },

      { zoneId: null, tier: "unknown" },

      14.5,

      { routeCoordinates: routeThroughPort },
    );

    expect(est.method).toBe("corridor_interpolated");

    expect(est.fare).toBe(540);

    expect(est.officialTable).toBe("special_trip");

    expect(est.explanation).toContain("Siquijor port");

    expect(est.explanation).toContain("Larena");

    expect(est.explanation).toContain("Not an official LGU fare");

    expect(est.explanation).not.toContain("Campalanas");
  });

  it("corridor uses southern chain when route passes Campalanas zone", () => {
    const est = calculateFare(
      { zoneId: "san_juan_poblacion", tier: "radius" },

      { zoneId: null, tier: "unknown" },

      14.5,

      { routeCoordinates: routeThroughPortAndCampalanas },
    );

    expect(est.method).toBe("corridor_interpolated");

    expect(est.fare).toBe(380);

    expect(est.explanation).toMatch(/Campalanas|Lazi/i);

    expect(est.explanation).toContain("Not an official LGU fare");
  });

  it("corridor works when unknown pickup and poblacion drop-off", () => {
    const est = calculateFare(
      { zoneId: null, tier: "unknown" },

      { zoneId: "san_juan_poblacion", tier: "radius" },

      14.5,

      { routeCoordinates: routeThroughPort },
    );

    expect(est.method).toBe("corridor_interpolated");

    expect(est.fare).toBe(540);
  });

  it("skips corridor when route does not pass near Siquijor port", () => {
    const est = calculateFare(
      { zoneId: "san_juan_poblacion", tier: "radius" },

      { zoneId: null, tier: "unknown" },

      14.5,

      { routeCoordinates: routeAwayFromPort },
    );

    expect(est.method).toBe("distance_estimate");
  });

  it("extrapolates from furthest passed LGU hub when trip exceeds corridor max reference", () => {
    const laziLatLon: [number, number] = [9.1284365, 123.6338696];

    const routeThroughPortAndLazi: [number, number][] = [
      portLatLon,

      laziLatLon,

      [9.18, 123.68],
    ];

    const rate = getFlatPerKmRate();

    const est = calculateFare(
      { zoneId: "san_juan_poblacion", tier: "radius" },

      { zoneId: null, tier: "unknown" },

      35,

      { routeCoordinates: routeThroughPortAndLazi },
    );

    expect(est.method).toBe("corridor_extrapolated");

    expect(est.fare).toBe(
      roundFareUpToTen(Math.round(600 + (35 - 20.14) * rate)),
    );

    expect(est.officialTable).toBe("special_trip");
  });

  it("skips corridor without route coordinates", () => {
    const est = calculateFare(
      { zoneId: "san_juan_poblacion", tier: "radius" },

      { zoneId: null, tier: "unknown" },

      14.5,
    );

    expect(est.method).toBe("distance_estimate");
  });

  it("corridor clamps fare at shortest anchor when distance is below shortest reference", () => {
    const est = calculateFare(
      { zoneId: "san_juan_poblacion", tier: "radius" },

      { zoneId: null, tier: "unknown" },

      5,

      { routeCoordinates: routeThroughPort },
    );

    expect(est.method).toBe("corridor_interpolated");

    expect(est.fare).toBe(300);
  });

  it("does not scale from poblacion → siquijor for siquijor → larena hub trip", () => {
    const route = [...getOfficialRouteGeometry("san_juan_poblacion", "larena")!].reverse() as [
      number,
      number,
    ][];

    const est = calculateFare(
      { zoneId: "siquijor_port", tier: "radius" },

      { zoneId: "larena", tier: "radius" },

      16.5,

      { routeCoordinates: route },
    );

    expect(est.method).not.toBe("scaled_official");
    expect(est.method).not.toBe("blended_official_distance");
    expect(est.explanation).not.toMatch(/san_juan_poblacion → siquijor_port/);
  });
});
