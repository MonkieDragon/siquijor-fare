import { useEffect, useRef } from "react";

import type { MutableRefObject } from "react";

import { useMap } from "react-leaflet";

import { DEFAULT_ZOOM } from "../../services/map/mapConfig";

import type { MapChromePadding } from "./FitIslandBounds";

const FLY_DURATION_MS = 600;

type Props = {
  flyToRef: MutableRefObject<((lat: number, lon: number) => void) | null>;

  /** After flying, pan so the target sits in the center of the visible map (between overlays). */
  chromePadding: MapChromePadding;
};

/**
 * Registers map.flyTo on a ref so overlays outside MapContainer can zoom.
 * Alignment uses a short timeout so concurrent fitBounds moveend events do not steal the handler.
 */
export default function MapFlyToBridge({ flyToRef, chromePadding }: Props) {
  const map = useMap();

  const alignPanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    flyToRef.current = (lat: number, lon: number) => {
      if (alignPanTimeoutRef.current !== null) {
        clearTimeout(alignPanTimeoutRef.current);

        alignPanTimeoutRef.current = null;
      }

      const targetZoom = Math.max(map.getZoom(), DEFAULT_ZOOM);

      map.flyTo([lat, lon], targetZoom, {
        duration: FLY_DURATION_MS / 1000,
      });

      alignPanTimeoutRef.current = setTimeout(() => {
        alignPanTimeoutRef.current = null;

        const size = map.getSize();

        const visualCx =
          chromePadding.left +
          (size.x - chromePadding.left - chromePadding.right) / 2;

        const visualCy =
          chromePadding.top +
          (size.y - chromePadding.top - chromePadding.bottom) / 2;

        const cx = size.x / 2;

        const cy = size.y / 2;

        map.panBy([visualCx - cx, visualCy - cy], { animate: false });
      }, FLY_DURATION_MS + 20);
    };

    return () => {
      if (alignPanTimeoutRef.current !== null) {
        clearTimeout(alignPanTimeoutRef.current);

        alignPanTimeoutRef.current = null;
      }

      flyToRef.current = null;
    };
  }, [map, flyToRef, chromePadding]);

  return null;
}
