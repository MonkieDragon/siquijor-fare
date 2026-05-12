/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";

import L from "leaflet";

import { routeStopIcon, userLocationIcon } from "./mapIcons";

describe("mapIcons", () => {
  it("exports usable Leaflet icons (bundler-safe markers)", () => {
    for (const icon of [userLocationIcon, routeStopIcon]) {
      expect(icon).toBeInstanceOf(L.Icon);
      expect(icon.options.iconUrl).toBeTruthy();
      expect(typeof icon.options.iconUrl).toBe("string");
      expect(icon.createIcon()).toBeInstanceOf(HTMLElement);
    }
  });
});
