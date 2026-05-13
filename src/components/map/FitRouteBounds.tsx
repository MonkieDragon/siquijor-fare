import { useEffect } from "react";

import { useMap } from "react-leaflet";

import L from "leaflet";

import type { MapChromePadding } from "./FitIslandBounds";

type Props = {
  coordinates: [number, number][];

  padding: MapChromePadding;
};

export default function FitRouteBounds({ coordinates, padding }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!coordinates.length) {
      return;
    }

    const bounds = L.latLngBounds(coordinates);

    map.fitBounds(bounds, {
      paddingTopLeft: L.point(padding.left, padding.top),

      paddingBottomRight: L.point(padding.right, padding.bottom),

      maxZoom: 18,
    });
  }, [coordinates, map, padding]);

  return null;
}
