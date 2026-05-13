import officialRaw from "../../data/officialFareLegs.json";

import type { OfficialFareLeg } from "./fareTypes";

type OfficialFareBundle = {
  specialTripLegs: OfficialFareLeg[];

  dropOffLegs: OfficialFareLeg[];
};

const bundle = officialRaw as OfficialFareBundle;

/** Drop-off rows first so exact lookup prefers them on rare collisions. */
export const allOfficialLegsOrdered: OfficialFareLeg[] = [
  ...bundle.dropOffLegs,

  ...bundle.specialTripLegs,
];
