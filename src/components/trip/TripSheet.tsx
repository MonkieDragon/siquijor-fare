import type { RouteResult } from "../../types/route";

import type { FareEstimate } from "../../services/fare/fareTypes";

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
}: Props) {
  return (
    <>
      <div style={styles.topChrome}>
        <div style={styles.handle} aria-hidden />

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
        />
      </div>

      <div style={styles.bottomSummary}>
        {route && (
          <div style={styles.routeMeta}>
            <span>
              {(route.distanceMeters / 1000).toFixed(1)} km ·{" "}
              {Math.round(route.durationSeconds / 60)} min
            </span>
          </div>
        )}

        {fareEstimate && <FareEstimateCard estimate={fareEstimate} />}

        <div style={styles.hint} aria-live="polite">
          {activeField === "pickup"
            ? "Tap map to set pickup"
            : "Tap map to set destination"}
        </div>

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

    paddingTop: "calc(12px + env(safe-area-inset-top, 0px))",

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

  handle: {
    width: 36,

    height: 4,

    borderRadius: 2,

    background: "#e5e7eb",

    margin: "0 auto 12px",
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
