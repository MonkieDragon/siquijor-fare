import { useEffect, useState } from "react";

function queryDesktopSession(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return (
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(min-width: 768px)").matches
  );
}

/**
 * True when the session is treated as "desktop": fine pointer and wide viewport.
 * Geolocation must not auto-run in this mode.
 */
export function useDesktopSession(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => queryDesktopSession());

  useEffect(() => {
    const mqFine = window.matchMedia("(pointer: fine)");
    const mqWide = window.matchMedia("(min-width: 768px)");

    function update() {
      setIsDesktop(mqFine.matches && mqWide.matches);
    }

    update();

    mqFine.addEventListener("change", update);

    mqWide.addEventListener("change", update);

    return () => {
      mqFine.removeEventListener("change", update);

      mqWide.removeEventListener("change", update);
    };
  }, []);

  return isDesktop;
}
