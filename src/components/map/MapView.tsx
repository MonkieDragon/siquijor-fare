import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import type { LeafletEvent, Marker as LeafletMarker } from "leaflet";

import { useDesktopSession } from "../../hooks/useDesktopSession";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useGeolocation } from "../../hooks/useGeolocation";
import {
  DEFAULT_APP_LOCATION_ID,
  getAppLocationOrDefault,
  isLatLonInBounds,
  listAppLocations,
} from "../../locations";
import { pickLocationAtCoordinates } from "../../services/geocoding/pickLocationAtCoordinates";
import { routeStopIcon, userLocationIcon } from "../../services/map/mapIcons";
import { ISLAND_OVERVIEW_MAX_ZOOM } from "../../services/map/mapConfig";
import type { Location } from "../../types/location";
import type { RouteResult } from "../../types/route";
import {
  POBLACION_ZONE_ID,
  SIQUIJOR_PORT_ZONE_ID,
} from "../../data/fareZonesData";
import { calculateFare } from "../../services/fare/fareEngine";
import { calculateRoute } from "../../services/routing/router";
import TripSheet from "../trip/TripSheet";
import FitIslandBounds, {
  type MapChromePadding,
} from "./FitIslandBounds";
import FitRouteBounds from "./FitRouteBounds";
import MapClickHandler from "./MapClickHandler";
import MapFlyToBridge from "./MapFlyToBridge";
import OfficialHubMarkers from "./OfficialHubMarkers";
import RouteLayer from "./RouteLayer";

type ActiveField = "pickup" | "destination";

/** Wide viewport: header + left sidebar + map (no overlapping chrome). */
const SPLIT_LAYOUT_QUERY = "(min-width: 960px)";

const MAP_EDGE_PADDING = 16;

/** White gutter around the map (parent background shows through). */
const MAP_SURROUND_GUTTER_PX = 12;

const PLACEMENT_BACKDROP_TRANSITION = "background-color 0.22s ease";

function approxSameCoords(
  a: { lat: number; lon: number },
  b: { lat: number; lng: number },
): boolean {
  return (
    Math.abs(a.lat - b.lat) < 0.0001 && Math.abs(a.lon - b.lng) < 0.0001
  );
}

export default function MapView() {
  const isDesktop = useDesktopSession();

  const useSplitLayout = useMediaQuery(SPLIT_LAYOUT_QUERY);

  const geoEnabled = !isDesktop;

  const { position } = useGeolocation({ enabled: geoEnabled });

  const appLocations = useMemo(() => listAppLocations(), []);

  const [appLocationId, setAppLocationId] = useState(DEFAULT_APP_LOCATION_ID);

  const appLocation = useMemo(
    () => getAppLocationOrDefault(appLocationId),
    [appLocationId],
  );

  const [origin, setOrigin] = useState<Location | null>(null);

  const [destination, setDestination] = useState<Location | null>(null);

  const [activeField, setActiveField] =
    useState<ActiveField>("destination");

  const [mapPlacementMode, setMapPlacementMode] =
    useState<ActiveField | null>(null);

  const [route, setRoute] = useState<RouteResult | null>(null);

  const mapPaneRef = useRef<HTMLDivElement>(null);

  const flyToRef = useRef<((lat: number, lon: number) => void) | null>(null);

  const markerReverseAbortRef = useRef<AbortController | null>(null);

  /** After explicit pickup clear, do not immediately refill from GPS until user picks again. */
  const suppressAutoOriginUntilPickRef = useRef(false);

  const [chromeOverlayHeights, setChromeOverlayHeights] = useState({
    top: 220,

    bottom: 118,
  });

  const mapChromePadding = useMemo((): MapChromePadding => {
    if (useSplitLayout) {
      return {
        top: MAP_EDGE_PADDING,

        bottom: MAP_EDGE_PADDING,

        left: MAP_EDGE_PADDING,

        right: MAP_EDGE_PADDING,
      };
    }

    return {
      top: chromeOverlayHeights.top,

      bottom: chromeOverlayHeights.bottom,

      left: MAP_EDGE_PADDING,

      right: MAP_EDGE_PADDING,
    };
  }, [
    useSplitLayout,
    chromeOverlayHeights.top,
    chromeOverlayHeights.bottom,
  ]);

  const commitOrigin = useCallback((loc: Location | null) => {
    if (loc) {
      suppressAutoOriginUntilPickRef.current = false;
    }

    setOrigin(loc);
  }, []);

  const handleAppLocationChange = useCallback((nextId: string) => {
    setAppLocationId(nextId);

    setOrigin(null);

    setDestination(null);

    setRoute(null);

    setMapPlacementMode(null);

    suppressAutoOriginUntilPickRef.current = true;
  }, []);

  useEffect(() => {
    if (isDesktop) {
      return;
    }

    if (!position) {
      return;
    }

    if (!isLatLonInBounds(position.lat, position.lng, appLocation.map.bounds)) {
      return;
    }

    queueMicrotask(() => {
      setOrigin((prev) => {
        if (prev) {
          return prev;
        }

        if (suppressAutoOriginUntilPickRef.current) {
          return prev;
        }

        return {
          name: "Current location",

          lat: position.lat,

          lon: position.lng,
        };
      });
    });
  }, [isDesktop, position, appLocation.map.bounds]);

  useEffect(() => {
    async function loadRoute() {
      if (!origin || !destination) {
        setRoute(null);

        return;
      }

      const result = await calculateRoute(origin, destination);

      setRoute(result);
    }

    loadRoute();
  }, [origin, destination]);

  const mapCenter = useMemo((): [number, number] => {
    if (origin) {
      return [origin.lat, origin.lon];
    }

    if (
      !isDesktop &&
      position &&
      isLatLonInBounds(position.lat, position.lng, appLocation.map.bounds)
    ) {
      return [position.lat, position.lng];
    }

    return appLocation.map.center;
  }, [origin, position, isDesktop, appLocation.map.bounds, appLocation.map.center]);

  const handleToggleMapPlacement = useCallback((field: ActiveField) => {
    setActiveField(field);

    setMapPlacementMode((prev) => (prev === field ? null : field));
  }, []);

  useEffect(() => {
    if (mapPlacementMode == null) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (mapPaneRef.current?.contains(target)) {
        return;
      }

      if (
        target instanceof Element &&
        target.closest("[data-map-placement-control]")
      ) {
        return;
      }

      setMapPlacementMode(null);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [mapPlacementMode]);

  const handleMapPick = useCallback(
    (loc: Location) => {
      const field = mapPlacementMode;

      if (field == null) {
        return;
      }

      if (field === "pickup") {
        commitOrigin(loc);
      } else {
        setDestination(loc);
      }

      setMapPlacementMode(null);
    },

    [mapPlacementMode, commitOrigin],
  );

  const handleClearPickup = useCallback(() => {
    suppressAutoOriginUntilPickRef.current = true;

    commitOrigin(null);
  }, [commitOrigin]);

  const handleClearDestination = useCallback(() => {
    setDestination(null);
  }, []);

  const handleZoomToPickup = useCallback(() => {
    if (!origin) {
      return;
    }

    flyToRef.current?.(origin.lat, origin.lon);
  }, [origin]);

  const handleZoomToDestination = useCallback(() => {
    if (!destination) {
      return;
    }

    flyToRef.current?.(destination.lat, destination.lon);
  }, [destination]);

  const handleOriginDragEnd = useCallback((e: LeafletEvent) => {
    const ll = (e.target as LeafletMarker).getLatLng();

    markerReverseAbortRef.current?.abort();

    const ac = new AbortController();

    markerReverseAbortRef.current = ac;

    void pickLocationAtCoordinates(ll.lat, ll.lng, ac.signal, commitOrigin);
  }, [commitOrigin]);

  const handleDestinationDragEnd = useCallback((e: LeafletEvent) => {
    const ll = (e.target as LeafletMarker).getLatLng();

    markerReverseAbortRef.current?.abort();

    const ac = new AbortController();

    markerReverseAbortRef.current = ac;

    void pickLocationAtCoordinates(ll.lat, ll.lng, ac.signal, setDestination);
  }, []);

  const showDeviceMarker =
    Boolean(position) &&
    !isDesktop &&
    (!origin || !approxSameCoords(origin, position!));

  const pickupDraggable =
    Boolean(origin) && origin!.name.toLowerCase() !== "current location";

  const fareEstimate = useMemo(() => {
    if (!route || !origin || !destination || !appLocation.fare) {
      return null;
    }

    const distanceKm = route.distanceMeters / 1000;

    const { resolveZone, officialLegs } = appLocation.fare;

    const startZone = resolveZone(origin);

    const endZone = resolveZone(destination);

    return calculateFare(startZone, endZone, distanceKm, {
      routeCoordinates: route.coordinates,

      officialLegs,
    });
  }, [route, origin, destination, appLocation.fare]);

  const showOfficialHubMarkers = useMemo(() => {
    if (!origin || !appLocation.fare?.showOfficialHubMarkers) {
      return false;
    }

    const z = appLocation.fare.resolveZone(origin).zoneId;

    return z === POBLACION_ZONE_ID || z === SIQUIJOR_PORT_ZONE_ID;
  }, [origin, appLocation.fare]);

  const originFareZoneId = useMemo(() => {
    if (!origin || !appLocation.fare) {
      return null;
    }

    return appLocation.fare.resolveZone(origin).zoneId;
  }, [origin, appLocation.fare]);

  const mapPanePlacementActive = mapPlacementMode != null;

  const placementSurroundStyle = useMemo((): CSSProperties => {
    return mapPanePlacementActive
      ? { background: "#d1d5db" }
      : { background: "#ffffff" };
  }, [mapPanePlacementActive]);

  const overlayMapGutterStyle = useMemo((): CSSProperties => {
    return {
      ...styles.overlayMapGutterHost,

      top: chromeOverlayHeights.top + MAP_SURROUND_GUTTER_PX,

      right: MAP_SURROUND_GUTTER_PX,

      bottom: chromeOverlayHeights.bottom + MAP_SURROUND_GUTTER_PX,

      left: MAP_SURROUND_GUTTER_PX,
    };
  }, [chromeOverlayHeights.top, chromeOverlayHeights.bottom]);

  const mapFrameStyle = {
    ...styles.mapFrame,

    ...(mapPanePlacementActive ? styles.mapFramePlacementActive : {}),
  };

  const mapGutterHostStyle: CSSProperties = useSplitLayout
    ? { ...styles.splitMapGutterHost, ...placementSurroundStyle }
    : overlayMapGutterStyle;

  const mapContainer = (
    <div style={mapGutterHostStyle}>
      <div ref={mapPaneRef} style={mapFrameStyle}>
      <MapContainer
        key={appLocationId}
        center={mapCenter}
        zoom={appLocation.map.defaultZoom}
        maxZoom={ISLAND_OVERVIEW_MAX_ZOOM}
        style={{
          position: "absolute",

          inset: 0,

          width: "100%",

          height: "100%",
        }}
        scrollWheelZoom
        doubleClickZoom={false}
      >
        <MapFlyToBridge
          flyToRef={flyToRef}
          chromePadding={mapChromePadding}
        />

        <FitIslandBounds
          enabled={!route}
          padding={mapChromePadding}
          bounds={appLocation.map.bounds}
        />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={ISLAND_OVERVIEW_MAX_ZOOM}
          maxNativeZoom={ISLAND_OVERVIEW_MAX_ZOOM}
        />

        <MapClickHandler
          enabled={mapPlacementMode != null}
          onPickLocation={handleMapPick}
        />

        <OfficialHubMarkers
          visible={showOfficialHubMarkers}
          originFareZoneId={originFareZoneId}
          onPickDestination={(loc) => {
            setDestination(loc);

            setActiveField("destination");

            setMapPlacementMode(null);
          }}
        />

        {showDeviceMarker && (
          <Marker
            position={[position!.lat, position!.lng]}
            icon={userLocationIcon}
          >
            <Popup>Your device location</Popup>
          </Marker>
        )}

        {origin && (
          <Marker
            position={[origin.lat, origin.lon]}
            icon={
              origin.name.toLowerCase() === "current location"
                ? userLocationIcon
                : routeStopIcon
            }
            draggable={pickupDraggable}
            eventHandlers={
              pickupDraggable ? { dragend: handleOriginDragEnd } : {}
            }
          >
            <Popup>{origin.displayName ?? origin.name}</Popup>
          </Marker>
        )}

        {destination && (
          <Marker
            position={[destination.lat, destination.lon]}
            icon={routeStopIcon}
            draggable
            eventHandlers={{ dragend: handleDestinationDragEnd }}
          >
            <Popup>{destination.displayName ?? destination.name}</Popup>
          </Marker>
        )}

        {route && <RouteLayer coordinates={route.coordinates} />}

        {route && (
          <FitRouteBounds
            coordinates={route.coordinates}
            padding={mapChromePadding}
          />
        )}
      </MapContainer>
      </div>
    </div>
  );

  const tripSheetProps = {
    appLocations,

    appLocationId,

    onAppLocationChange: handleAppLocationChange,

    origin,

    destination,

    activeField,

    onActiveFieldChange: setActiveField,

    mapPlacementMode,

    onToggleMapPlacement: handleToggleMapPlacement,

    onOriginSelect: commitOrigin,

    onDestinationSelect: setDestination,

    onZoomToPickup: handleZoomToPickup,

    onZoomToDestination: handleZoomToDestination,

    route,

    fareEstimate,

    onClearPickup: handleClearPickup,

    onClearDestination: handleClearDestination,

    onChromeInsetsChange: setChromeOverlayHeights,
  };

  const tripSheetOverlay = (
    <TripSheet {...tripSheetProps} layout="overlay" />
  );

  const mapPane = useSplitLayout ? (
    mapContainer
  ) : (
    <div style={{ ...styles.overlayMapPane, ...placementSurroundStyle }}>
      {mapContainer}

      {tripSheetOverlay}
    </div>
  );

  if (useSplitLayout) {
    return (
      <div
        style={{
          ...styles.splitShell,
          ...(mapPanePlacementActive
            ? { background: "#d1d5db", transition: PLACEMENT_BACKDROP_TRANSITION }
            : { transition: PLACEMENT_BACKDROP_TRANSITION }),
        }}
      >
        <TripSheet {...tripSheetProps} layout="split" />

        {mapPane}
      </div>
    );
  }

  return mapPane;
}

const styles: Record<string, React.CSSProperties> = {
  splitShell: {
    display: "grid",

    width: "100%",

    height: "100%",

    minHeight: 0,

    flex: 1,

    gridTemplateAreas: '"header header" "sidebar map"',

    gridTemplateColumns: "min(400px, 38vw) 1fr",

    gridTemplateRows: "auto 1fr",

    overflow: "hidden",

    background: "white",

    transition: PLACEMENT_BACKDROP_TRANSITION,
  },

  splitMapGutterHost: {
    gridArea: "map",

    display: "flex",

    flexDirection: "column",

    minHeight: 0,

    minWidth: 0,

    padding: MAP_SURROUND_GUTTER_PX,

    boxSizing: "border-box",

    background: "#ffffff",

    transition: PLACEMENT_BACKDROP_TRANSITION,
  },

  overlayMapPane: {
    position: "relative",

    flex: 1,

    minHeight: 0,

    width: "100%",

    height: "100%",

    background: "#ffffff",

    transition: PLACEMENT_BACKDROP_TRANSITION,
  },

  overlayMapGutterHost: {
    position: "absolute",

    display: "flex",

    flexDirection: "column",

    minHeight: 0,

    boxSizing: "border-box",
  },

  mapFrame: {
    position: "relative",

    flex: 1,

    minHeight: 0,

    overflow: "hidden",

    borderRadius: 16,
  },

  mapFramePlacementActive: {
    cursor: "crosshair",

    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.18)",
  },
};
