import { getCalibratedDistanceTariff } from "./calibratedDistanceTariff";

export function estimateDistanceFare(distanceKm: number): number {
  const { baseFare, perKm } = getCalibratedDistanceTariff();

  return Math.round(baseFare + distanceKm * perKm);
}
