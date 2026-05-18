import { useSyncExternalStore } from "react";

function canUseMatchMedia(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

/**
 * Subscribes to `window.matchMedia(query)`. Server / test snapshot is false.
 * If `matchMedia` is unavailable, always false (column layout).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (!canUseMatchMedia()) {
        return () => {};
      }

      const mq = window.matchMedia(query);

      mq.addEventListener("change", onStoreChange);

      return () => mq.removeEventListener("change", onStoreChange);
    },

    () => (canUseMatchMedia() ? window.matchMedia(query).matches : false),

    () => false,
  );
}
