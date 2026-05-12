import MapView from "./components/map/MapView";

export default function App() {
  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        maxHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <MapView />
    </div>
  );
}
