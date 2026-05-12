export type FareMethod =
  | "exact"
  | "reverse_exact"
  | "interpolated"
  | "distance_estimate";

export type FareEstimate = {
  fare: number;

  method: FareMethod;

  confidence: number;

  explanation: string;
};

export type FareRoute = {
  from: string;

  to: string;

  fare: number;

  approximateDistanceKm?: number;
};
