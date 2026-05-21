import { useEffect, useRef } from "react";

import type { FareEstimate } from "../../services/fare/fareTypes";

import { useMediaQuery } from "../../hooks/useMediaQuery";

import type { RouteResult } from "../../types/route";

import type { Location as GeoLocation } from "../../types/location";

import type { AppLocationDefinition } from "../../locations";

import LocationSearchField from "../search/LocationSearchField";

import LocationSelectField from "../search/LocationSelectField";

import FareEstimateCard from "./FareEstimateCard";

import AttributionFooter from "./AttributionFooter";

type ActiveField = "pickup" | "destination";

type Props = {
  appLocations: readonly AppLocationDefinition[];

  appLocationId: string;

  onAppLocationChange: (locationId: string) => void;

  origin: GeoLocation | null;

  destination: GeoLocation | null;

  activeField: ActiveField;

  onActiveFieldChange: (field: ActiveField) => void;

  /** When set, the user is placing this field via map click (see pin / cancel button). */
  mapPlacementMode: ActiveField | null;

  onToggleMapPlacement: (field: ActiveField) => void;

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

  /** Full-width header + left sidebar; map sits in a sibling grid area (wide desktop). */
  layout?: "overlay" | "split";
};

export default function TripSheet({
  appLocations,

  appLocationId,

  onAppLocationChange,

  origin,

  destination,

  activeField: _activeField,

  onActiveFieldChange,

  mapPlacementMode,

  onToggleMapPlacement,

  onOriginSelect,

  onDestinationSelect,

  onZoomToPickup,

  onZoomToDestination,

  route,

  fareEstimate,

  onClearPickup,

  onClearDestination,

  onChromeInsetsChange,

  layout = "overlay",
}: Props) {
  const topChromeRef = useRef<HTMLDivElement>(null);

  const bottomSummaryRef = useRef<HTMLDivElement>(null);

  const isSplit = layout === "split";

  const wideOverlayViewport = useMediaQuery("(min-width: 720px)");

  const sideBySideFields = !isSplit && wideOverlayViewport;

  const placementChromeStyle =
    mapPlacementMode != null ? styles.chromePlacementBackdrop : undefined;

  useEffect(() => {
    const reportChromeInsets = onChromeInsetsChange;

    if (!reportChromeInsets || isSplit) {
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
  }, [onChromeInsetsChange, isSplit]);

  const headerBlock = (
    <header
      style={
        isSplit
          ? { ...styles.splitHeader, ...placementChromeStyle }
          : sideBySideFields
            ? { ...styles.header, ...styles.headerCompact }
            : styles.header
      }
    >
      <h1
        style={
          isSplit
            ? styles.splitTitle
            : sideBySideFields
              ? { ...styles.title, ...styles.titleCompact }
              : styles.title
        }
      >
        Tricycle Fare Calculator
      </h1>
      <p style={isSplit ? styles.splitSubtitle : styles.subtitle}>
        To see official LGU rates, select San Juan or Siquijor as pickup;
        otherwise rates are estimated based on distance.
      </p>
    </header>
  );

  const locationSelector = (
    <div
      style={
        sideBySideFields
          ? { ...styles.locationSelectCell, width: "100%", flex: "0 0 100%" }
          : styles.locationSelectCell
      }
    >
      <LocationSelectField
        label="Location"
        locations={appLocations}
        value={appLocationId}
        onChange={onAppLocationChange}
      />
    </div>
  );

  const searchFields = (
    <div
      style={
        sideBySideFields ? styles.searchFieldsRow : styles.searchFieldsColumn
      }
    >
      {locationSelector}

      <div style={styles.searchFieldCell}>
        <LocationSearchField
          appLocationId={appLocationId}
          key={
            origin
              ? `pickup-${appLocationId}-${origin.lat}-${origin.lon}-${origin.name}`
              : `pickup-empty-${appLocationId}`
          }
          label="Pickup"
          placeholder="Where from?"
          selected={origin}
          onSelect={onOriginSelect}
          onFocus={() => onActiveFieldChange("pickup")}
          mapPickAriaLabel="Select pickup on map"
          cancelMapPickAriaLabel="Cancel pickup map placement"
          mapPlacementActive={mapPlacementMode === "pickup"}
          onMapPickToggle={() => onToggleMapPlacement("pickup")}
          zoomAriaLabel="Zoom map to pickup"
          onZoomClick={onZoomToPickup}
          zoomEnabled={Boolean(origin)}
          onClear={onClearPickup}
        />
      </div>

      <div style={styles.searchFieldCell}>
        <LocationSearchField
          appLocationId={appLocationId}
          key={
            destination
              ? `dest-${appLocationId}-${destination.lat}-${destination.lon}-${destination.name}`
              : `dest-empty-${appLocationId}`
          }
          label="Destination"
          placeholder="Where to?"
          selected={destination}
          onSelect={onDestinationSelect}
          onFocus={() => onActiveFieldChange("destination")}
          mapPickAriaLabel="Select destination on map"
          cancelMapPickAriaLabel="Cancel destination map placement"
          mapPlacementActive={mapPlacementMode === "destination"}
          onMapPickToggle={() => onToggleMapPlacement("destination")}
          zoomAriaLabel="Zoom map to destination"
          onZoomClick={onZoomToDestination}
          zoomEnabled={Boolean(destination)}
          onClear={onClearDestination}
        />
      </div>
    </div>
  );

  const fareBlock = (
    <>
      {route && (
        <div style={isSplit ? styles.splitRouteMeta : styles.routeMeta}>
          <span>
            {(route.distanceMeters / 1000).toFixed(1)} km ·{" "}
            {Math.round(route.durationSeconds / 60)} min
          </span>
        </div>
      )}

      {fareEstimate && (
        <FareEstimateCard estimate={fareEstimate} compact={!isSplit} />
      )}

      {mapPlacementMode && (
        <div
          style={isSplit ? styles.splitHintPlacement : styles.hintPlacement}
          aria-live="polite"
        >
          Click the map to select{" "}
          {mapPlacementMode === "pickup" ? "pickup" : "destination"}
        </div>
      )}
    </>
  );

  if (isSplit) {
    return (
      <div style={styles.splitChromeRoot}>
        <div style={styles.splitHeaderArea}>{headerBlock}</div>

        <aside style={{ ...styles.splitSidebar, ...placementChromeStyle }}>
          {searchFields}

          <div style={styles.splitMiddle}>{fareBlock}</div>

          <AttributionFooter align="left" />
        </aside>
      </div>
    );
  }

  return (
    <>
      <div
        ref={topChromeRef}
        style={{ ...styles.topChrome, ...placementChromeStyle }}
      >
        {headerBlock}

        {searchFields}
      </div>

      <div
        ref={bottomSummaryRef}
        style={{ ...styles.bottomSummary, ...placementChromeStyle }}
      >
        {fareBlock}

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

    paddingBottom: 10,

    background: "white",

    transition: "background-color 0.22s ease",

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

    paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",

    paddingTop: 8,

    background: "white",

    transition: "background-color 0.22s ease",

    borderTopLeftRadius: 16,

    borderTopRightRadius: 16,

    boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",

    overflow: "visible",
  },

  header: {
    marginBottom: 20,

    textAlign: "center",
  },

  headerCompact: {
    marginBottom: 12,
  },

  title: {
    margin: "0 0 9px",

    fontSize: 22,

    lineHeight: 1.15,

    fontWeight: 700,

    letterSpacing: "-0.02em",

    color: "#111827",
  },

  titleCompact: {
    margin: "0 0 6px",

    fontSize: 19,

    lineHeight: 1.2,
  },

  subtitle: {
    margin: 0,

    fontSize: 12,

    lineHeight: 1.4,

    color: "#6b7280",
  },

  searchFieldsRow: {
    display: "flex",

    flexDirection: "row",

    alignItems: "flex-start",

    gap: 12,
  },

  searchFieldsColumn: {
    display: "flex",

    flexDirection: "column",

    gap: 12,
  },

  locationSelectCell: {
    minWidth: 0,
  },

  searchFieldCell: {
    flex: 1,

    minWidth: 0,
  },

  routeMeta: {
    marginTop: 0,

    paddingTop: 0,

    marginBottom: 4,

    fontSize: 13,

    fontWeight: 600,

    color: "#111827",

    textAlign: "center",
  },

  hint: {
    marginTop: 4,

    fontSize: 12,

    color: "#9ca3af",

    textAlign: "center",
  },

  hintPlacement: {
    marginTop: 4,

    fontSize: 13,

    fontWeight: 600,

    color: "#111827",

    textAlign: "center",

    width: "100%",
  },

  splitChromeRoot: {
    display: "contents",
  },

  splitHeaderArea: {
    gridArea: "header",
  },

  chromePlacementBackdrop: {
    background: "#d1d5db",
  },

  splitHeader: {
    margin: 0,

    padding: "18px 24px 16px",

    textAlign: "center",

    borderBottom: "1px solid #e5e7eb",

    background: "white",

    transition: "background-color 0.22s ease",
  },

  splitTitle: {
    margin: "0 0 8px",

    fontSize: 22,

    lineHeight: 1.2,

    fontWeight: 700,

    letterSpacing: "-0.02em",

    color: "#111827",
  },

  splitSubtitle: {
    margin: "0 auto",

    fontSize: 13,

    lineHeight: 1.45,

    color: "#6b7280",

    maxWidth: 520,

    textAlign: "center",
  },

  splitSidebar: {
    gridArea: "sidebar",

    display: "flex",

    flexDirection: "column",

    gap: 16,

    minHeight: 0,

    height: "100%",

    overflow: "hidden",

    padding: "20px 20px 24px",

    background: "white",

    transition: "background-color 0.22s ease",
  },

  splitMiddle: {
    flex: 1,

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    gap: 8,

    minHeight: 0,

    overflowY: "auto",

    paddingTop: 8,

    paddingBottom: 8,
  },

  splitRouteMeta: {
    marginTop: 0,

    paddingTop: 0,

    borderTop: "none",

    fontSize: 14,

    fontWeight: 600,

    color: "#111827",

    textAlign: "left",
  },

  splitHint: {
    marginTop: 0,

    fontSize: 13,

    color: "#9ca3af",

    textAlign: "left",
  },

  splitHintPlacement: {
    marginTop: 0,

    fontSize: 14,

    fontWeight: 600,

    color: "#111827",

    textAlign: "center",

    width: "100%",
  },
};
