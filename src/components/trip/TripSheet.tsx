import { useEffect, useRef } from "react";

import type { FareEstimate } from "../../services/fare/fareTypes";

import type { RouteResult } from "../../types/route";

import type { Location as GeoLocation } from "../../types/location";

import LocationSearchField from "../search/LocationSearchField";

import FareEstimateCard from "./FareEstimateCard";

import AttributionFooter from "./AttributionFooter";

type ActiveField = "pickup" | "destination";

type Props = {
  origin: GeoLocation | null;

  destination: GeoLocation | null;

  activeField: ActiveField;

  onActiveFieldChange: (field: ActiveField) => void;

  onOriginSelect: (location: GeoLocation) => void;

  onDestinationSelect: (location: GeoLocation) => void;

  onZoomToPickup: () => void;

  onZoomToDestination: () => void;

  route: RouteResult | null;

  fareEstimate: FareEstimate | null;

  onClearPickup?: () => void;

  onClearDestination?: () => void;

  /** Reports measured overlay heights so the map can fit bounds to the visible pane. */
  onChromeInsetsChange?: (sizes: { top: number; bottom: number }) => void;
};

export default function TripSheet({
  origin,

  destination,

  activeField,

  onActiveFieldChange,

  onOriginSelect,

  onDestinationSelect,

  onZoomToPickup,

  onZoomToDestination,

  route,

  fareEstimate,

  onClearPickup,

  onClearDestination,

  onChromeInsetsChange,
}: Props) {
  const topChromeRef = useRef<HTMLDivElement>(null);

  const bottomSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reportChromeInsets = onChromeInsetsChange;

    if (!reportChromeInsets) {
      return;
    }

    function report() {
      const top = topChromeRef.current?.offsetHeight ?? 0;

      const bottom = bottomSummaryRef.current?.offsetHeight ?? 0;

      reportChromeInsets?.({ top, bottom });
    }

    report();

    const ro = new ResizeObserver(report);

    const topEl = topChromeRef.current;

    const bottomEl = bottomSummaryRef.current;

    if (topEl) {
      ro.observe(topEl);
    }

    if (bottomEl) {
      ro.observe(bottomEl);
    }

    return () => {
      ro.disconnect();
    };
  }, [onChromeInsetsChange]);

  return (
    <>
      <div ref={topChromeRef} style={styles.topChrome}>
        <header style={styles.header}>
          <h1 style={styles.title}>Siquijor Tricycle Fare Calculator</h1>
          <p style={styles.subtitle}>
            To see official LGU rates, select San Juan or Siquijor as pickup;
            otherwise rates are estimated based on distance.
          </p>
        </header>

        <LocationSearchField
          key={
            origin
              ? `pickup-${origin.lat}-${origin.lon}-${origin.name}`
              : "pickup-empty"
          }
          label="Pickup"
          placeholder="Where from?"
          selected={origin}
          onSelect={onOriginSelect}
          onFocus={() => onActiveFieldChange("pickup")}
          mapPickAriaLabel="Select pickup on map"
          onMapPickClick={() => onActiveFieldChange("pickup")}
          zoomAriaLabel="Zoom map to pickup"
          onZoomClick={onZoomToPickup}
          zoomEnabled={Boolean(origin)}
          onClear={onClearPickup}
        />

        <div style={{ height: 12 }} />

        <LocationSearchField
          key={
            destination
              ? `dest-${destination.lat}-${destination.lon}-${destination.name}`
              : "dest-empty"
          }
          label="Destination"
          placeholder="Where to?"
          selected={destination}
          onSelect={onDestinationSelect}
          onFocus={() => onActiveFieldChange("destination")}
          mapPickAriaLabel="Select destination on map"
          onMapPickClick={() => onActiveFieldChange("destination")}
          zoomAriaLabel="Zoom map to destination"
          onZoomClick={onZoomToDestination}
          zoomEnabled={Boolean(destination)}
          onClear={onClearDestination}
        />
      </div>

      <div ref={bottomSummaryRef} style={styles.bottomSummary}>
        {route && (
          <div style={styles.routeMeta}>
            <span>
              {(route.distanceMeters / 1000).toFixed(1)} km ·{" "}
              {Math.round(route.durationSeconds / 60)} min
            </span>
          </div>
        )}

        {fareEstimate && <FareEstimateCard estimate={fareEstimate} />}

        {!fareEstimate && (
          <div style={styles.hint} aria-live="polite">
            {activeField === "pickup"
              ? "Tap map to set pickup"
              : "Tap map to set destination"}
          </div>
        )}

        <AttributionFooter />
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topChrome: {
    position: "absolute",

    left: 0,

    right: 0,

    top: 0,

    zIndex: 1200,

    paddingLeft: 16,

    paddingRight: 16,

    paddingTop: "calc(22px + env(safe-area-inset-top, 0px))",

    paddingBottom: 12,

    background: "white",

    borderBottomLeftRadius: 16,

    borderBottomRightRadius: 16,

    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",

    overflow: "visible",
  },

  bottomSummary: {
    position: "absolute",

    left: 0,

    right: 0,

    bottom: 0,

    zIndex: 1100,

    paddingLeft: 16,

    paddingRight: 16,

    paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",

    paddingTop: 12,

    background: "white",

    borderTopLeftRadius: 16,

    borderTopRightRadius: 16,

    boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",

    overflow: "visible",
  },

  header: {
    marginBottom: 20,

    textAlign: "center",
  },

  title: {
    margin: "0 0 9px",

    fontSize: 22,

    lineHeight: 1.15,

    fontWeight: 700,

    letterSpacing: "-0.02em",

    color: "#111827",
  },

  subtitle: {
    margin: 0,

    fontSize: 12,

    lineHeight: 1.4,

    color: "#6b7280",
  },

  routeMeta: {
    marginTop: 0,

    paddingTop: 0,

    marginBottom: 8,

    fontSize: 14,

    fontWeight: 600,

    color: "#111827",

    textAlign: "center",
  },

  hint: {
    marginTop: 8,

    fontSize: 12,

    color: "#9ca3af",

    textAlign: "center",
  },
};
