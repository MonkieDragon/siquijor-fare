export type OfficialFareTable = "special_trip" | "drop_off";

export type FareMethod =
  | "exact"
  | "reverse_exact"
  | "scaled_official"
  | "blended_official_distance"
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

export type FareEstimate = {
  fare: number;

  method: FareMethod;

  confidence: number;

  explanation: string;

  officialTable?: OfficialFareTable;
};

export type FareRoute = {
  from: string;

  to: string;

  fare: number;

  approximateDistanceKm?: number;
};
