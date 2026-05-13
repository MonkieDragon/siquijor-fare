import type { OfficialFareLeg } from "./fareTypes";

export type ExactOfficialMatch = {
  leg: OfficialFareLeg;

  /** True when user direction matches leg.fromZoneId → leg.toZoneId. */
  isForward: boolean;
};

export function findExactOfficialLeg(
  legs: OfficialFareLeg[],
  startZoneId: string,
  endZoneId: string,
): ExactOfficialMatch | null {
  for (const leg of legs) {
    if (leg.fromZoneId === startZoneId && leg.toZoneId === endZoneId) {
      return { leg, isForward: true };
    }

    if (
      leg.symmetric !== false &&
      leg.fromZoneId === endZoneId &&
      leg.toZoneId === startZoneId
    ) {
      return { leg, isForward: false };
    }
  }

  return null;
}
