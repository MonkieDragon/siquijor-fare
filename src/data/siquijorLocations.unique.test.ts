import { describe, expect, it } from "vitest";

import locations from "./siquijorLocations.json";

describe("siquijorLocations.json", () => {
  it("has unique name for every row", () => {
    const counts = new Map<string, number>();

    for (const row of locations) {
      counts.set(row.name, (counts.get(row.name) ?? 0) + 1);
    }

    const duplicates = [...counts.entries()].filter(([, n]) => n > 1);

    expect(duplicates).toEqual([]);
    expect(locations.length).toBe(counts.size);
  });
});
