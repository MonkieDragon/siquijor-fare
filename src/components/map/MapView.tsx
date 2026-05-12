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
import { DEFAULT_ZOOM, SIQUIJOR_CENTER } from "../../services/map/mapConfig";
import type { Location } from "../../types/location";
import type { RouteResult } from "../../types/route";
import { calculateFare } from "../../services/fare/fareEngine";
import { resolveFarePlaceName } from "../../services/fare/resolveFarePlaceName";
import { calculateRoute } from "../../services/routing/router";
import TripSheet from "../trip/TripSheet";
import FitRouteBounds from "./FitRouteBounds";
import MapClickHandler from "./MapClickHandler";
import MapFlyToBridge from "./MapFlyToBridge";
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

  useEffect(() => {
    if (isDesktop) {
      return;
    }

    if (!position) {
      return;
    }

    queueMicrotask(() => {
      setOrigin((prev) => {
        if (prev) {
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

    if (!isDesktop && position) {
      return [position.lat, position.lng];
    }

    return SIQUIJOR_CENTER;
  }, [origin, position, isDesktop]);

  const handleMapPick = useCallback(
    (loc: Location) => {
      if (activeField === "pickup") {
        setOrigin(loc);
      } else {
        setDestination(loc);
      }
    },

    [activeField],
  );

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

    void pickLocationAtCoordinates(ll.lat, ll.lng, ac.signal, setOrigin);
  }, []);

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

    const startName = resolveFarePlaceName(origin);

    const endName = resolveFarePlaceName(destination);

    return calculateFare(startName, endName, distanceKm);
  }, [route, origin, destination]);

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
        style={{
          position: "absolute",

          inset: 0,

          width: "100%",

          height: "100%",
        }}
        scrollWheelZoom
      >
        <MapFlyToBridge flyToRef={flyToRef} />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onPickLocation={handleMapPick} />

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

        {route && <FitRouteBounds coordinates={route.coordinates} />}
      </MapContainer>

      <TripSheet
        origin={origin}
        destination={destination}
        activeField={activeField}
        onActiveFieldChange={setActiveField}
        onOriginSelect={setOrigin}
        onDestinationSelect={setDestination}
        onZoomToPickup={handleZoomToPickup}
        onZoomToDestination={handleZoomToDestination}
        route={route}
        fareEstimate={fareEstimate}
      />
    </div>
  );
}
