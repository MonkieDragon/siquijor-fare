import geometriesRaw from "../../data/officialRouteGeometries.json";

import { directedLegKey, type LatLonPolyline } from "./routeGeometrySimilarity";

export type OfficialRouteGeometries = Record<string, LatLonPolyline>;

const geometries = geometriesRaw as unknown as OfficialRouteGeometries;

export function getOfficialRouteGeometry(
  fromZoneId: string,
  toZoneId: string,
): LatLonPolyline | undefined {
  return geometries[directedLegKey(fromZoneId, toZoneId)];
}

export { geometries as officialRouteGeometries };
