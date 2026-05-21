import { describe, expect, it } from "vitest";

import { roundFareUpToTen } from "./fareRounding";

describe("roundFareUpToTen", () => {
  it("rounds up to the nearest ten pesos", () => {
    expect(roundFareUpToTen(1)).toBe(10);

    expect(roundFareUpToTen(10)).toBe(10);

    expect(roundFareUpToTen(11)).toBe(20);

    expect(roundFareUpToTen(377)).toBe(380);

    expect(roundFareUpToTen(538)).toBe(540);
  });
});
