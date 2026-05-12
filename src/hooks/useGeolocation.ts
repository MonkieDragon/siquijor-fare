import { useEffect, useState } from "react";

type Position = {
  lat: number;
  lng: number;
} | null;

type Options = {
  enabled?: boolean;
};

export function useGeolocation(options?: Options) {
  const enabled = options?.enabled ?? true;

  const [position, setPosition] = useState<Position>(null);

  const [loading, setLoading] = useState(
    () =>
      enabled &&
      typeof navigator !== "undefined" &&
      Boolean(navigator.geolocation),
  );

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => {
        setPosition(null);

        setLoading(false);
      });

      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      queueMicrotask(() => {
        setLoading(false);
      });

      return;
    }

    queueMicrotask(() => {
      setLoading(true);
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });

        setLoading(false);
      },
      () => {
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
      },
    );
  }, [enabled]);

  return { position, loading };
}
