import { useMemo } from "react";

import { Marker } from "react-leaflet";

import L from "leaflet";

import {
  FARE_ZONE_DEFINITIONS,
  POBLACION_ZONE_ID,
} from "../../data/fareZonesData";

import { allOfficialLegsOrdered } from "../../services/fare/officialFareLegs";

import type { Location } from "../../types/location";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fareDivIcon(farePhp: number, zoneLabel: string): L.DivIcon {
  const width = Math.min(148, Math.max(64, zoneLabel.length * 6 + 34));
  const height = 38;

  return L.divIcon({
    className: "official-hub-fare-marker",

    html: `<div style="font-size:11px;font-weight:700;background:#fff;color:#111827;padding:4px 5px;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,.12);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;line-height:1.2"><div>${escapeHtml(zoneLabel)}</div><div>₱${farePhp}</div></div>`,

    iconSize: [width, height],

    iconAnchor: [width / 2, height],
  });
}

type HubEntry = {
  location: Location;

  farePhp: number;

  zoneLabel: string;
};

type Props = {
  visible: boolean;

  /** Resolved pickup fare zone; hubs whose LGU destination is this zone are hidden. */
  originFareZoneId: string | null;

  onPickDestination: (loc: Location) => void;
};

export default function OfficialHubMarkers({
  visible,

  originFareZoneId,

  onPickDestination,
}: Props) {
  const hubs = useMemo((): HubEntry[] => {
    const out: HubEntry[] = [];

    for (const leg of allOfficialLegsOrdered) {
      if (
        leg.table !== "special_trip" ||
        leg.fromZoneId !== POBLACION_ZONE_ID ||
        leg.referenceDistanceKm == null
      ) {
        continue;
      }

      if (originFareZoneId != null && leg.toZoneId === originFareZoneId) {
        continue;
      }

      const zone = FARE_ZONE_DEFINITIONS.find((z) => z.id === leg.toZoneId);

      if (!zone) {
        continue;
      }

      out.push({
        location: {
          name: zone.label,

          lat: zone.canonical.lat,

          lon: zone.canonical.lon,

          displayName: `${zone.label} (LGU special trip)`,
        },

        farePhp: leg.farePhp,

        zoneLabel: zone.label,
      });
    }

    return out;
  }, [originFareZoneId]);

  if (!visible || hubs.length === 0) {
    return null;
  }

  return (
    <>
      {hubs.map((h) => (
        <Marker
          key={h.location.name + h.farePhp}

          position={[h.location.lat, h.location.lon]}

          icon={fareDivIcon(h.farePhp, h.zoneLabel)}

          eventHandlers={{
            click: () => {
              onPickDestination(h.location);
            },
          }}
        />
      ))}
    </>
  );
}
