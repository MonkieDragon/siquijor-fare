import type { FareRoute } from "./fareTypes";

export function findExactFare(
  routes: FareRoute[],
  start: string,
  end: string,
): FareRoute | null {
  const normalizedStart = start.toLowerCase();
  const normalizedEnd = end.toLowerCase();

  const direct = routes.find((route) => {
    return (
      route.from.toLowerCase() === normalizedStart &&
      route.to.toLowerCase() === normalizedEnd
    );
  });

  if (direct) {
    return direct;
  }

  const reverse = routes.find((route) => {
    return (
      route.from.toLowerCase() === normalizedEnd &&
      route.to.toLowerCase() === normalizedStart
    );
  });

  if (reverse) {
    return reverse;
  }

  return null;
}
