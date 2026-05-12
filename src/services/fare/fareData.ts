import officialFareDistances from "../../data/officialFareDistances.json";

import type { FareRoute } from "./fareTypes";

function distanceKey(from: string, to: string): string {
  return `${from}|${to}`;
}

const distances = officialFareDistances as Record<string, number>;

const baseRoutes: FareRoute[] = [
  {
    from: "San Juan",
    to: "Siquijor",
    fare: 300,
  },

  {
    from: "San Juan",
    to: "Larena",
    fare: 600,
  },

  {
    from: "San Juan",
    to: "Campalanas",
    fare: 300,
  },

  {
    from: "San Juan",
    to: "Lazi",
    fare: 600,
  },
];

export const officialFareRoutes: FareRoute[] = baseRoutes.map((route) => {
  const key = distanceKey(route.from, route.to);
  const approximateDistanceKm = distances[key];

  return approximateDistanceKm != null
    ? { ...route, approximateDistanceKm }
    : route;
});
