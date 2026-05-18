import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import type { LeafletEvent, Marker as LeafletMarker } from "leaflet";

import { useDesktopSession } from "../../hooks/useDesktopSession";
import { useGeolocation } from "../../hooks/useGeolocation";
import { pickLocationAtCoordinates } from "../../services/geocoding/pickLocationAtCoordinates";
import { routeStopIcon, userLocationIcon } from "../../services/map/mapIcons";
import {
  DEFAULT_ZOOM,
  ISLAND_OVERVIEW_MAX_ZOOM,
  SIQUIJOR_CENTER,
} from "../../services/map/mapConfig";
import { isLatLonOnSiquijorIsland } from "../../services/map/siquijorIslandBounds";
import type { Location } from "../../types/location";
import type { RouteResult } from "../../types/route";
import {
  POBLACION_ZONE_ID,
  SIQUIJOR_PORT_ZONE_ID,
} from "../../data/fareZonesData";
import { calculateFare } from "../../services/fare/fareEngine";
import { resolveFareZone } from "../../services/fare/resolveFareZone";
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

  const geoEnabled = !isDesktop;

  const { position } = useGeolocation({ enabled: geoEnabled });

  const [origin, setOrigin] = useState<Location | null>(null);

  const [destination, setDestination] = useState<Location | null>(null);

  const [activeField, setActiveField] =
    useState<ActiveField>("destination");

  const [route, setRoute] = useState<RouteResult | null>(null);

  const flyToRef = useRef<((lat: number, lon: number) => void) | null>(null);

  const markerReverseAbortRef = useRef<AbortController | null>(null);

  /** After explicit pickup clear, do not immediately refill from GPS until user picks again. */
  const suppressAutoOriginUntilPickRef = useRef(false);

  const [chromeOverlayHeights, setChromeOverlayHeights] = useState({
    top: 220,

    bottom: 118,
  });

  const mapChromePadding = useMemo((): MapChromePadding => {
    return {
      top: chromeOverlayHeights.top,

      bottom: chromeOverlayHeights.bottom,

      left: 16,

      right: 16,
    };
  }, [chromeOverlayHeights.top, chromeOverlayHeights.bottom]);

  const commitOrigin = useCallback((loc: Location | null) => {
    if (loc) {
      suppressAutoOriginUntilPickRef.current = false;
    }

    setOrigin(loc);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      return;
    }

    if (!position) {
      return;
    }

    if (!isLatLonOnSiquijorIsland(position.lat, position.lng)) {
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
  }, [isDesktop, position]);

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
      isLatLonOnSiquijorIsland(position.lat, position.lng)
    ) {
      return [position.lat, position.lng];
    }

    return SIQUIJOR_CENTER;
  }, [origin, position, isDesktop]);

  const handleMapPick = useCallback(
    (loc: Location) => {
      if (activeField === "pickup") {
        commitOrigin(loc);
      } else {
        setDestination(loc);
      }
    },

    [activeField, commitOrigin],
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
    if (!route || !origin || !destination) {
      return null;
    }

    const distanceKm = route.distanceMeters / 1000;

    const startZone = resolveFareZone(origin);

    const endZone = resolveFareZone(destination);

    return calculateFare(startZone, endZone, distanceKm, {
      routeCoordinates: route.coordinates,
    });
  }, [route, origin, destination]);

  const showOfficialHubMarkers = useMemo(() => {
    if (!origin) {
      return false;
    }

    const z = resolveFareZone(origin).zoneId;

    return z === POBLACION_ZONE_ID || z === SIQUIJOR_PORT_ZONE_ID;
  }, [origin]);

  const originFareZoneId = useMemo(() => {
    if (!origin) {
      return null;
    }

    return resolveFareZone(origin).zoneId;
  }, [origin]);

  return (
    <div
      style={{
        position: "relative",

        flex: 1,

        minHeight: 0,

        width: "100%",

        height: "100%",
      }}
    >
      <MapContainer
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        maxZoom={ISLAND_OVERVIEW_MAX_ZOOM}
        style={{
          position: "absolute",

          inset: 0,

          width: "100%",

          height: "100%",
        }}
        scrollWheelZoom
      >
        <MapFlyToBridge
          flyToRef={flyToRef}
          chromePadding={mapChromePadding}
        />

        <FitIslandBounds
          enabled={!route}
          padding={mapChromePadding}
        />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={ISLAND_OVERVIEW_MAX_ZOOM}
          maxNativeZoom={ISLAND_OVERVIEW_MAX_ZOOM}
        />

        <MapClickHandler onPickLocation={handleMapPick} />

        <OfficialHubMarkers
          visible={showOfficialHubMarkers}
          originFareZoneId={originFareZoneId}
          onPickDestination={(loc) => {
            setDestination(loc);

            setActiveField("destination");
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

      <TripSheet
        origin={origin}
        destination={destination}
        activeField={activeField}
        onActiveFieldChange={setActiveField}
        onOriginSelect={commitOrigin}
        onDestinationSelect={setDestination}
        onZoomToPickup={handleZoomToPickup}
        onZoomToDestination={handleZoomToDestination}
        route={route}
        fareEstimate={fareEstimate}
        onClearPickup={handleClearPickup}
        onClearDestination={handleClearDestination}
        onChromeInsetsChange={setChromeOverlayHeights}
      />
    </div>
  );
}
