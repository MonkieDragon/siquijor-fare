import type { OfficialFareLeg } from "./fareTypes";

function endpointOverlapCount(
  leg: OfficialFareLeg,
  startZoneId: string,
  endZoneId: string,
): number {
  const a = startZoneId === leg.fromZoneId || startZoneId === leg.toZoneId;

  const b = endZoneId === leg.fromZoneId || endZoneId === leg.toZoneId;

  return (a ? 1 : 0) + (b ? 1 : 0);
}

function legTouchesStart(leg: OfficialFareLeg, startZoneId: string): boolean {
  return leg.fromZoneId === startZoneId || leg.toZoneId === startZoneId;
}

function legTouchesEnd(leg: OfficialFareLeg, endZoneId: string): boolean {
  return leg.fromZoneId === endZoneId || leg.toZoneId === endZoneId;
}

/**
 * Picks a published leg to scale when there is no exact zone pair match.
 * Prefers legs that share the trip start, then end, then closest reference distance.
 */
export function findScalingReferenceLeg(
  legs: OfficialFareLeg[],
  startZoneId: string,
  endZoneId: string,
  actualDistanceKm: number,
): OfficialFareLeg | null {
  type Ranked = {
    leg: OfficialFareLeg;

    overlap: number;

    startHit: number;

    endHit: number;

    diff: number;
  };

  const ranked: Ranked[] = [];

  for (const leg of legs) {
    const ref = leg.referenceDistanceKm;

    if (ref == null || ref <= 0) {
      continue;
    }

    const overlap = endpointOverlapCount(leg, startZoneId, endZoneId);

    if (overlap === 0) {
      continue;
    }

    if (overlap === 2) {
      continue;
    }

    ranked.push({
      leg,

      overlap,

      startHit: legTouchesStart(leg, startZoneId) ? 1 : 0,

      endHit: legTouchesEnd(leg, endZoneId) ? 1 : 0,

      diff: Math.abs(ref - actualDistanceKm),
    });
  }

  if (ranked.length === 0) {
    return null;
  }

  ranked.sort((x, y) => {
    if (y.startHit !== x.startHit) {
      return y.startHit - x.startHit;
    }

    if (y.endHit !== x.endHit) {
      return y.endHit - x.endHit;
    }

    if (x.diff !== y.diff) {
      return x.diff - y.diff;
    }

    if (x.leg.table !== y.leg.table) {
      return x.leg.table === "drop_off" ? -1 : 1;
    }

    return x.leg.farePhp - y.leg.farePhp;
  });

  return ranked[0]!.leg;
}
