import { useEffect } from "react";

import { useMap } from "react-leaflet";

import L from "leaflet";

import type { GeoBounds } from "../../locations";
import {
  ISLAND_FIT_PADDING_SCALE,
  ISLAND_OVERVIEW_MAX_ZOOM,
  ISLAND_OVERVIEW_ZOOM_INSET,
} from "../../services/map/mapConfig";

function boundsFromConfig(config: GeoBounds): L.LatLngBounds {
  return L.latLngBounds(
    [config.minLat, config.minLon],
    [config.maxLat, config.maxLon],
  );
}

export type MapChromePadding = {
  top: number;

  bottom: number;

  left: number;

  right: number;
};

type Props = {
  /** When false, no fit (e.g. route layer owns framing). */
  enabled: boolean;

  padding: MapChromePadding;

  bounds: GeoBounds;
};

function scalePadding(p: MapChromePadding): MapChromePadding {
  const s = ISLAND_FIT_PADDING_SCALE;

  return {
    top: p.top * s,

    bottom: p.bottom * s,

    left: p.left * s,

    right: p.right * s,
  };
}

/**
 * Frames the whole service area inside the unobstructed map pane.
 */
export default function FitIslandBounds({ enabled, padding, bounds }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const latLngBounds = boundsFromConfig(bounds);

    const pad = scalePadding(padding);

    function applyFit() {
      map.invalidateSize({ animate: false });

      map.fitBounds(latLngBounds, {
        paddingTopLeft: L.point(pad.left, pad.top),

        paddingBottomRight: L.point(pad.right, pad.bottom),

        maxZoom: ISLAND_OVERVIEW_MAX_ZOOM,
      });

      const nudged = Math.min(
        map.getZoom() + ISLAND_OVERVIEW_ZOOM_INSET,

        ISLAND_OVERVIEW_MAX_ZOOM,
      );

      map.setZoom(nudged, { animate: false });
    }

    function runWhenSized() {
      // Wait for layout + map container size (chrome ResizeObserver, safe areas).
      requestAnimationFrame(() => {
        requestAnimationFrame(applyFit);
      });
    }

    if (map.getSize().x === 0 || map.getSize().y === 0) {
      map.whenReady(runWhenSized);
    } else {
      runWhenSized();
    }
  }, [enabled, map, padding, bounds]);

  return null;
}
