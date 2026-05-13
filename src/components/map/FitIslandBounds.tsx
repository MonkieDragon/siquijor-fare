import { useEffect } from "react";

import { useMap } from "react-leaflet";

import L from "leaflet";

import {
  SIQUIJOR_ISLAND_MAX_LAT,
  SIQUIJOR_ISLAND_MAX_LON,
  SIQUIJOR_ISLAND_MIN_LAT,
  SIQUIJOR_ISLAND_MIN_LON,
} from "../../services/map/siquijorIslandBounds";
import {
  ISLAND_FIT_PADDING_SCALE,
  ISLAND_OVERVIEW_MAX_ZOOM,
  ISLAND_OVERVIEW_ZOOM_INSET,
} from "../../services/map/mapConfig";

function islandOverviewBounds(): L.LatLngBounds {
  return L.latLngBounds(
    [SIQUIJOR_ISLAND_MIN_LAT, SIQUIJOR_ISLAND_MIN_LON],
    [SIQUIJOR_ISLAND_MAX_LAT, SIQUIJOR_ISLAND_MAX_LON],
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
 * Frames the whole island inside the unobstructed map pane (below top / above bottom chrome).
 */
export default function FitIslandBounds({ enabled, padding }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const bounds = islandOverviewBounds();

    const pad = scalePadding(padding);

    function applyFit() {
      map.invalidateSize({ animate: false });

      map.fitBounds(bounds, {
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
  }, [enabled, map, padding]);

  return null;
}
