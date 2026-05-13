import type { FareRoute, OfficialFareLeg } from "./fareTypes";

import { allOfficialLegsOrdered } from "./officialFareLegs";

export function officialLegToFareRoute(leg: OfficialFareLeg): FareRoute {
  return {
    from: leg.fromZoneId,

    to: leg.toZoneId,

    fare: leg.farePhp,

    approximateDistanceKm: leg.referenceDistanceKm,
  };
}

/** All legs (drop-off first) for lookups and UI tooling. */
export const officialFareRoutes: FareRoute[] = allOfficialLegsOrdered.map(
  officialLegToFareRoute,
);

/** Legs with road reference distance — used to calibrate distance fallback. */
export const calibrationOfficialFareRoutes: FareRoute[] =
  allOfficialLegsOrdered
    .filter(
      (leg) =>
        leg.referenceDistanceKm != null && leg.referenceDistanceKm > 0,
    )
    .map(officialLegToFareRoute);
