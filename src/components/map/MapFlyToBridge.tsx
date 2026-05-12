import { useEffect } from "react";

import type { MutableRefObject } from "react";

import { useMap } from "react-leaflet";

import { DEFAULT_ZOOM } from "../../services/map/mapConfig";

type Props = {
  flyToRef: MutableRefObject<((lat: number, lon: number) => void) | null>;
};

/**
 * Registers map.flyTo on a ref so overlays outside MapContainer can zoom.
 */
export default function MapFlyToBridge({ flyToRef }: Props) {
  const map = useMap();

  useEffect(() => {
    flyToRef.current = (lat: number, lon: number) => {
      map.flyTo([lat, lon], Math.max(map.getZoom(), DEFAULT_ZOOM), {
        duration: 0.6,
      });
    };

    return () => {
      flyToRef.current = null;
    };
  }, [map, flyToRef]);

  return null;
}
