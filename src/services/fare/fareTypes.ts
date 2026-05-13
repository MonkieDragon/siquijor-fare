export type OfficialFareTable = "special_trip" | "drop_off";

export type FareMethod =
  | "exact"
  | "reverse_exact"
  | "scaled_official"
  | "blended_official_distance"
  | "corridor_interpolated"
  | "corridor_extrapolated"
  | "distance_estimate";

export type OfficialFareLeg = {
  table: OfficialFareTable;

  fromZoneId: string;

  toZoneId: string;

  farePhp: number;

  referenceDistanceKm?: number;

  /** When true, the published fare applies in both directions. */
  symmetric?: boolean;

  lgSourceNote?: string;
};

/** Breakdown for flat ₱/km distance fallback (`distance_estimate` only). */
export type DistanceFareDetail = {
  distanceKm: number;

  perKm: number;

  linearFarePhp: number;

  minimumFarePhp: number;

  minimumApplied: boolean;

  fare: number;
};

export type FareEstimate = {
  fare: number;

  method: FareMethod;

  confidence: number;

  explanation: string;

  officialTable?: OfficialFareTable;

  distanceDetail?: DistanceFareDetail;
};

export type FareRoute = {
  from: string;

  to: string;

  fare: number;

  approximateDistanceKm?: number;
};
