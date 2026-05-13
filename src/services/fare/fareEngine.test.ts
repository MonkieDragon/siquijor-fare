import { describe, expect, it } from "vitest";

import { calculateFare } from "./fareEngine";

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

    expect(est.fare).toBe(60);

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
});
