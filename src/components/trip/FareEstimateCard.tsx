import type { FareEstimate } from "../../services/fare/fareTypes";

function formatKm(km: number): string {
  return `${km.toFixed(1)} km`;
}

function formatPhp(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",

    currency: "PHP",

    maximumFractionDigits: 0,
  }).format(amount);
}

type Props = {
  estimate: FareEstimate;

  /** Tighter padding and type for the map overlay sheet. */
  compact?: boolean;
};

export default function FareEstimateCard({ estimate, compact }: Props) {
  const isOfficial =
    estimate.method === "exact" || estimate.method === "reverse_exact";

  const cardStyle = compact ? { ...styles.card, ...styles.cardCompact } : styles.card;

  const labelStyle = compact ? { ...styles.label, ...styles.labelCompact } : styles.label;

  const amountStyle = compact
    ? { ...styles.amount, ...styles.amountCompact }
    : styles.amount;

  const explanationStyle = compact
    ? { ...styles.explanation, ...styles.explanationCompact }
    : styles.explanation;

  const breakdownStyle = compact
    ? { ...styles.breakdown, ...styles.breakdownCompact }
    : styles.breakdown;

  const hintStyle = compact ? { ...styles.hint, ...styles.hintCompact } : styles.hint;

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>
        {isOfficial ? "Official fare" : "Estimated fare"}
      </div>

      <div style={amountStyle}>{formatPhp(estimate.fare)}</div>

      <div style={explanationStyle}>{estimate.explanation}</div>

      {estimate.method === "distance_estimate" && estimate.distanceDetail && (
        <div style={breakdownStyle}>
          {formatKm(estimate.distanceDetail.distanceKm)} × ₱
          {estimate.distanceDetail.perKm}/km → {formatPhp(estimate.distanceDetail.linearFarePhp)}
          {estimate.distanceDetail.minimumApplied && (
            <span style={styles.breakdownNote}>
              {" "}
              (minimum {formatPhp(estimate.distanceDetail.minimumFarePhp)} applied)
            </span>
          )}
        </div>
      )}

      {(estimate.method === "scaled_official" ||
        estimate.method === "blended_official_distance") && (
        <div style={hintStyle}>
          {estimate.method === "scaled_official"
            ? "Scaled from a published LGU route using your trip road distance."
            : "Combines a scaled LGU reference fare with a distance-based estimate."}
        </div>
      )}

      {estimate.method === "corridor_interpolated" && (
        <div style={hintStyle}>
          Uses published LGU trips only as anchors — your destination may not be listed.
        </div>
      )}

      {estimate.method === "corridor_extrapolated" && (
        <div style={hintStyle}>
          Adds median ₱/km for distance beyond the furthest published hub your route passed
          through.
        </div>
      )}

      {estimate.method === "distance_estimate" && (
        <div style={hintStyle}>
          Rate is the median implied ₱/km from published LGU routes that include reference
          distances — not a negotiated quote.
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    marginTop: 14,

    padding: "14px 16px",

    borderRadius: 12,

    background: "#f9fafb",

    border: "1px solid #e5e7eb",

    textAlign: "center",
  },

  label: {
    fontSize: 11,

    fontWeight: 600,

    letterSpacing: 0.4,

    textTransform: "uppercase",

    color: "#6b7280",
  },

  amount: {
    marginTop: 6,

    fontSize: 28,

    fontWeight: 700,

    letterSpacing: -0.5,

    color: "#111827",
  },

  explanation: {
    marginTop: 8,

    fontSize: 13,

    lineHeight: 1.4,

    color: "#4b5563",
  },

  breakdown: {
    marginTop: 6,

    fontSize: 13,

    fontWeight: 500,

    color: "#374151",

    lineHeight: 1.45,
  },

  breakdownNote: {
    fontWeight: 400,

    color: "#6b7280",
  },

  hint: {
    marginTop: 6,

    fontSize: 12,

    color: "#9ca3af",

    lineHeight: 1.35,
  },

  cardCompact: {
    marginTop: 8,

    padding: "10px 12px",

    borderRadius: 10,
  },

  labelCompact: {
    fontSize: 10,

    letterSpacing: 0.35,
  },

  amountCompact: {
    marginTop: 4,

    fontSize: 24,

    letterSpacing: -0.35,
  },

  explanationCompact: {
    marginTop: 6,

    fontSize: 12,

    lineHeight: 1.35,
  },

  breakdownCompact: {
    marginTop: 4,

    fontSize: 12,

    lineHeight: 1.4,
  },

  hintCompact: {
    marginTop: 4,

    fontSize: 11,

    lineHeight: 1.3,
  },
};
