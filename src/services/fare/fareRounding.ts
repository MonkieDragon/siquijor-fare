import type { FareEstimate } from "./fareTypes";

/** Round up to the nearest ₱10 for display and negotiation. */
export function roundFareUpToTen(farePhp: number): number {
  return Math.ceil(farePhp / 10) * 10;
}

export function applyFareRounding(estimate: FareEstimate): FareEstimate {
  const fare = roundFareUpToTen(estimate.fare);

  if (!estimate.distanceDetail) {
    return { ...estimate, fare };
  }

  return {
    ...estimate,

    fare,

    distanceDetail: {
      ...estimate.distanceDetail,

      fare: roundFareUpToTen(estimate.distanceDetail.fare),
    },
  };
}
