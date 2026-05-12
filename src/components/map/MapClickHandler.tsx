import { useCallback, useRef } from "react";

import { useMapEvents } from "react-leaflet";

import type { Location } from "../../types/location";

import { pickLocationAtCoordinates } from "../../services/geocoding/pickLocationAtCoordinates";

type Props = {
  onPickLocation: (location: Location) => void;
};

export default function MapClickHandler({ onPickLocation }: Props) {
  const reverseAbortRef = useRef<AbortController | null>(null);

  const handleClick = useCallback(
    async (e: { latlng: { lat: number; lng: number } }) => {
      const { lat, lng } = e.latlng;

      reverseAbortRef.current?.abort();

      const ac = new AbortController();

      reverseAbortRef.current = ac;

      await pickLocationAtCoordinates(lat, lng, ac.signal, onPickLocation);
    },

    [onPickLocation],
  );

  useMapEvents({
    click: handleClick,
  });

  return null;
}
