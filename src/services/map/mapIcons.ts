import L from "leaflet";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

const markerIconOptions = {
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
};

/** GPS / “Current location” pickup */
export const userLocationIcon = L.icon(markerIconOptions);

/** Pickup (named place) and destination — required under Vite (default Leaflet icon URLs break bundlers). */
export const routeStopIcon = L.icon(markerIconOptions);
