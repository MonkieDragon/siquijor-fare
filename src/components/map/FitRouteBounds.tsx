import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

type Props = {
  coordinates: [number, number][];
};

export default function FitRouteBounds({ coordinates }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!coordinates.length) {
      return;
    }

    const bounds = L.latLngBounds(coordinates);

    map.fitBounds(bounds, {
      padding: [100, 48],
    });
  }, [coordinates, map]);

  return null;
}
