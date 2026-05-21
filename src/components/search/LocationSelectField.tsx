import type { AppLocationDefinition } from "../../locations";

type Props = {
  label: string;

  locations: readonly AppLocationDefinition[];

  value: string;

  onChange: (locationId: string) => void;
};

export default function LocationSelectField({
  label,

  locations,

  value,

  onChange,
}: Props) {
  return (
    <div style={styles.field}>
      <label style={styles.label} htmlFor="app-location-select">
        {label}
      </label>

      <select
        id="app-location-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.select}
        aria-label={label}
      >
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  field: {
    textAlign: "left",
  },

  label: {
    display: "block",

    fontSize: 11,

    fontWeight: 600,

    letterSpacing: 0.4,

    textTransform: "uppercase",

    color: "#6b7280",

    marginBottom: 4,
  },

  select: {
    width: "100%",

    minHeight: 48,

    padding: "12px 14px",

    borderRadius: 8,

    border: "1px solid #e5e7eb",

    fontSize: 16,

    color: "#111827",

    background: "#ffffff",

    colorScheme: "light",

    outline: "none",

    boxSizing: "border-box",
  },
};
