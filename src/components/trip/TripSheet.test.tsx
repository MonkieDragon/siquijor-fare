/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";

import { render, screen, within } from "@testing-library/react";

import {
  DEFAULT_APP_LOCATION_ID,
  listAppLocations,
} from "../../locations";

import TripSheet from "./TripSheet";

import type { FareEstimate } from "../../services/fare/fareTypes";

const route = {
  distanceMeters: 10000,

  durationSeconds: 900,

  coordinates: [] as [number, number][],
};

const placementProps = {
  appLocations: listAppLocations(),

  appLocationId: DEFAULT_APP_LOCATION_ID,

  onAppLocationChange: vi.fn(),

  mapPlacementMode: null,

  onToggleMapPlacement: vi.fn(),
};

const officialFare: FareEstimate = {
  fare: 300,

  method: "exact",

  confidence: 1,

  explanation: "Official LGU special trip fare match",

  officialTable: "special_trip",
};

describe("TripSheet", () => {
  it("shows route distance and duration", () => {
    render(
      <TripSheet
        {...placementProps}
        origin={{ name: "A", lat: 1, lon: 2 }}
        destination={{ name: "B", lat: 3, lon: 4 }}
        activeField="destination"
        onActiveFieldChange={vi.fn()}
        onOriginSelect={vi.fn()}
        onDestinationSelect={vi.fn()}
        onZoomToPickup={vi.fn()}
        onZoomToDestination={vi.fn()}
        route={route}
        fareEstimate={null}
      />,
    );

    expect(screen.getByText(/10\.0 km/)).toBeInTheDocument();

    expect(screen.getByText(/15 min/)).toBeInTheDocument();
  });

  it("shows official fare label and amount", () => {
    render(
      <TripSheet
        {...placementProps}
        origin={{ name: "San Juan", lat: 9, lon: 123 }}
        destination={{ name: "Lazi", lat: 9.1, lon: 123.1 }}
        activeField="pickup"
        onActiveFieldChange={vi.fn()}
        onOriginSelect={vi.fn()}
        onDestinationSelect={vi.fn()}
        onZoomToPickup={vi.fn()}
        onZoomToDestination={vi.fn()}
        route={route}
        fareEstimate={officialFare}
      />,
    );

    expect(screen.getByText("Official fare")).toBeInTheDocument();

    expect(screen.getByText(/300/)).toBeInTheDocument();

    expect(
      screen.getByText(/Official LGU (special trip|drop-off) fare match/),
    ).toBeInTheDocument();
  });

  it("pickup zoom button is disabled without origin and enables when origin is set", () => {
    const common = {
      ...placementProps,

      destination: null,

      activeField: "destination" as const,

      onActiveFieldChange: vi.fn(),

      onOriginSelect: vi.fn(),

      onDestinationSelect: vi.fn(),

      onZoomToPickup: vi.fn(),

      onZoomToDestination: vi.fn(),

      route: null,

      fareEstimate: null,
    };

    const { rerender, container } = render(
      <TripSheet {...common} origin={null} destination={null} />,
    );

    expect(
      within(container).getByRole("button", { name: /zoom map to pickup/i }),
    ).toBeDisabled();

    rerender(
      <TripSheet
        {...common}
        origin={{ name: "San Juan", lat: 9, lon: 123 }}
        destination={null}
      />,
    );

    expect(
      within(container).getByRole("button", { name: /zoom map to pickup/i }),
    ).not.toBeDisabled();
  });

  it("shows placement hint when map placement mode is active", () => {
    render(
      <TripSheet
        {...placementProps}
        mapPlacementMode="destination"
        origin={null}
        destination={null}
        activeField="destination"
        onActiveFieldChange={vi.fn()}
        onOriginSelect={vi.fn()}
        onDestinationSelect={vi.fn()}
        onZoomToPickup={vi.fn()}
        onZoomToDestination={vi.fn()}
        route={null}
        fareEstimate={null}
      />,
    );

    expect(
      screen.getByText(/Click the map to select destination/i),
    ).toBeInTheDocument();
  });
});
