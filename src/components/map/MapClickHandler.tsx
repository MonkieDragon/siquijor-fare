import { useCallback, useRef } from "react";

import { useMapEvents } from "react-leaflet";

import type { Location } from "../../types/location";

import { pickLocationAtCoordinates } from "../../services/geocoding/pickLocationAtCoordinates";

type Props = {
  /** When false, map clicks do not place pickup / destination markers. */
  enabled: boolean;

  onPickLocation: (location: Location) => void;
};

export default function MapClickHandler({ enabled, onPickLocation }: Props) {
  const reverseAbortRef = useRef<AbortController | null>(null);

  const handleClick = useCallback(
    async (e: { latlng: { lat: number; lng: number } }) => {
      if (!enabled) {
        return;
      }

      const { lat, lng } = e.latlng;

      reverseAbortRef.current?.abort();

      const ac = new AbortController();

      reverseAbortRef.current = ac;

      await pickLocationAtCoordinates(lat, lng, ac.signal, onPickLocation);
    },

    [enabled, onPickLocation],
  );

  useMapEvents({
    click: handleClick,

    dblclick: () => {
      /* Placement uses single clicks only; ignore double-click. */
    },
  });

  return null;
}
