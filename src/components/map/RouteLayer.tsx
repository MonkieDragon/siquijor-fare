import { Polyline } from "react-leaflet";

type Props = {
  coordinates: [number, number][];
};

export default function RouteLayer({ coordinates }: Props) {
  if (!coordinates.length) {
    return null;
  }

  return (
    <Polyline
      positions={coordinates}
      pathOptions={{
        weight: 5,
        opacity: 0.8,
      }}
    />
  );
}
