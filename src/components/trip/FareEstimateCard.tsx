import type { FareEstimate } from "../../services/fare/fareTypes";

function formatPhp(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",

    currency: "PHP",

    maximumFractionDigits: 0,
  }).format(amount);
}

type Props = {
  estimate: FareEstimate;
};

export default function FareEstimateCard({ estimate }: Props) {
  const isOfficial =
    estimate.method === "exact" || estimate.method === "reverse_exact";

  return (
    <div style={styles.card}>
      <div style={styles.label}>
        {isOfficial ? "Official fare" : "Estimated fare"}
      </div>

      <div style={styles.amount}>{formatPhp(estimate.fare)}</div>

      <div style={styles.explanation}>{estimate.explanation}</div>

      {(estimate.method === "interpolated" ||
        estimate.method === "distance_estimate") && (
        <div style={styles.hint}>
          {estimate.method === "interpolated"
            ? "Scaled from a nearby official route using road distance."
            : "Based on calibrated distance rates when no official route matches."}
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

  hint: {
    marginTop: 6,

    fontSize: 12,

    color: "#9ca3af",

    lineHeight: 1.35,
  },
};
