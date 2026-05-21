/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import LocationSearchField from "./LocationSearchField";

const { geocodeMock } = vi.hoisted(() => ({
  geocodeMock: vi.fn(),
}));

vi.mock("../../services/geocoding/geocode", () => ({
  geocode: geocodeMock,
}));

describe("LocationSearchField", () => {
  beforeEach(() => {
    geocodeMock.mockReset();

    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads geocode results after debounce", async () => {
    geocodeMock.mockResolvedValue([
      {
        name: "Paliton Beach",

        lat: 9.17,

        lon: 123.46,

        displayName: "Paliton, Philippines",
      },
    ]);

    render(
      <LocationSearchField
        appLocationId="siquijor"
        label="Destination"
        placeholder="Where to?"
        selected={null}
        onSelect={vi.fn()}
        onFocus={vi.fn()}
        mapPickAriaLabel="Select destination on map"
        onMapPickToggle={vi.fn()}
        zoomAriaLabel="Zoom map to destination"
        onZoomClick={vi.fn()}
        zoomEnabled={false}
      />,
    );

    const input = screen.getByRole("textbox", { name: /destination/i });

    fireEvent.change(input, { target: { value: "pal" } });

    await act(async () => {
      vi.advanceTimersByTime(450);
    });

    await waitFor(() => {
      expect(geocodeMock).toHaveBeenCalled();
    });

    expect(await screen.findByText("Paliton Beach")).toBeInTheDocument();
  });

  it("does not refetch or reopen suggestions after pick until the query is edited", async () => {
    geocodeMock.mockResolvedValue([
      {
        name: "Paliton Beach",

        lat: 9.17,

        lon: 123.46,

        displayName: "Paliton, Philippines",
      },
    ]);

    const onSelect = vi.fn();

    render(
      <LocationSearchField
        appLocationId="siquijor"
        label="Destination"
        placeholder="Where to?"
        selected={null}
        onSelect={onSelect}
        onFocus={vi.fn()}
        mapPickAriaLabel="Select destination on map"
        onMapPickToggle={vi.fn()}
        zoomAriaLabel="Zoom map to destination"
        onZoomClick={vi.fn()}
        zoomEnabled={false}
      />,
    );

    const inputs = screen.getAllByRole("textbox", { name: /destination/i });

    const input = inputs.at(-1)!;

    fireEvent.change(input, { target: { value: "pal" } });

    await act(async () => {
      vi.advanceTimersByTime(450);
    });

    await waitFor(() => {
      expect(geocodeMock).toHaveBeenCalled();
    });

    const callsAfterFirstSearch = geocodeMock.mock.calls.length;

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /Paliton Beach/i }).length,
      ).toBeGreaterThan(0);
    });

    await act(async () => {
      fireEvent.click(
        screen.getAllByRole("button", { name: /Paliton Beach/i }).at(-1)!,
      );
    });

    expect(onSelect).toHaveBeenCalled();

    expect(
      screen.getAllByRole("textbox", { name: /destination/i }).at(-1),
    ).toHaveValue("Paliton Beach");

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(geocodeMock.mock.calls.length).toBe(callsAfterFirstSearch);

    geocodeMock.mockResolvedValue([]);

    fireEvent.change(input, { target: { value: "Palito" } });

    await act(async () => {
      vi.advanceTimersByTime(450);
    });

    expect(geocodeMock.mock.calls.length).toBeGreaterThan(callsAfterFirstSearch);
  });
});
