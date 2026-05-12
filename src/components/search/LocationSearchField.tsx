import { useState, useEffect, useRef } from "react";

import { useDebounce } from "../../hooks/useDebounce";
import type { Location as GeoLocation } from "../../types/location";
import { geocode } from "../../services/geocoding/geocode";

type Props = {
  label: string;

  placeholder: string;

  selected: GeoLocation | null;

  onSelect: (location: GeoLocation) => void;

  onFocus: () => void;

  mapPickAriaLabel: string;

  onMapPickClick?: () => void;

  zoomAriaLabel: string;

  onZoomClick?: () => void;

  /** False grays out the zoom control when there is nothing to fly to. */
  zoomEnabled: boolean;
};

export default function LocationSearchField({
  label,

  placeholder,

  selected,

  onSelect,

  onFocus,

  mapPickAriaLabel,

  onMapPickClick,

  zoomAriaLabel,

  onZoomClick,

  zoomEnabled,
}: Props) {
  const [query, setQuery] = useState(selected?.name ?? "");

  const [results, setResults] = useState<GeoLocation[]>([]);

  const [loading, setLoading] = useState(false);

  /** When set, skip remote search until the input text differs (after a list pick). */
  const committedSelectionRef = useRef<string | null>(
    selected ? selected.name.trim() : null,
  );

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    const ac = new AbortController();

    async function search() {
      const q = debouncedQuery.trim();

      if (q.length < 3) {
        setResults([]);

        return;
      }

      const committed = committedSelectionRef.current;

      if (committed !== null && q === committed) {
        setResults([]);

        setLoading(false);

        return;
      }

      try {
        setLoading(true);

        const res = await geocode(debouncedQuery, ac.signal);

        setResults(res);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error(err);
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    }

    search();

    return () => {
      ac.abort();
    };
  }, [debouncedQuery]);

  function handleMapPickClick() {
    setResults([]);

    setLoading(false);

    onMapPickClick?.();
  }

  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>

      <div style={styles.inputRow}>
        <input
          value={query}
          onChange={(e) => {
            const v = e.target.value;

            setQuery(v);

            const t = v.trim();

            const committed = committedSelectionRef.current;

            if (committed !== null && t !== committed) {
              committedSelectionRef.current = null;
            }
          }}
          onFocus={onFocus}
          placeholder={placeholder}
          style={styles.input}
          autoComplete="off"
          aria-label={label}
        />

        <div style={styles.trailing}>
          {onMapPickClick && (
            <button
              type="button"
              style={styles.iconBtn}
              onClick={handleMapPickClick}
              aria-label={mapPickAriaLabel}
              title={mapPickAriaLabel}
            >
              <PinGlyph />
            </button>
          )}

          <button
            type="button"
            style={{
              ...styles.iconBtn,

              ...(!zoomEnabled ? styles.iconBtnDisabled : {}),
            }}
            onClick={() => onZoomClick?.()}
            disabled={!zoomEnabled}
            aria-label={zoomAriaLabel}
            title={zoomAriaLabel}
            aria-disabled={!zoomEnabled}
          >
            <ZoomGlyph />
          </button>
        </div>
      </div>

      {loading && <div style={styles.loading}>Searching…</div>}

      {results.length > 0 && (
        <div style={styles.dropdown}>
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lon}-${i}`}
              type="button"
              style={styles.item}
              onClick={() => {
                const picked = r.name.trim();

                committedSelectionRef.current = picked;

                setQuery(r.name);

                setResults([]);

                onSelect(r);
              }}
            >
              <span style={styles.itemTitle}>{r.name}</span>

              {r.displayName && (
                <span style={styles.itemSub}>{r.displayName}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PinGlyph() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        fill="currentColor"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
      />
    </svg>
  );
}

function ZoomGlyph() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: "block" }}
    >
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M12 3v3 M12 18v3 M3 12h3 M18 12h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  field: {
    position: "relative",

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

  inputRow: {
    display: "flex",

    alignItems: "stretch",

    gap: 8,
  },

  input: {
    flex: 1,

    minWidth: 0,

    minHeight: 48,

    padding: "12px 14px",

    borderRadius: 8,

    border: "1px solid #e5e7eb",

    fontSize: 16,

    color: "#111827",

    caretColor: "#2563eb",

    background: "#ffffff",

    colorScheme: "light",

    outline: "none",
  },

  trailing: {
    display: "flex",

    flexShrink: 0,

    gap: 6,

    alignItems: "center",
  },

  iconBtn: {
    width: 44,

    height: 44,

    padding: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    borderRadius: 8,

    border: "1px solid #e5e7eb",

    background: "#ffffff",

    color: "#111827",

    cursor: "pointer",

    boxSizing: "border-box",
  },

  iconBtnDisabled: {
    opacity: 0.38,

    cursor: "not-allowed",
  },

  dropdown: {
    position: "absolute",

    left: 0,

    right: 0,

    top: "100%",

    marginTop: 4,

    maxHeight: 220,

    overflowY: "auto",

    background: "white",

    borderRadius: 10,

    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",

    zIndex: 1400,

    border: "1px solid #e5e7eb",
  },

  item: {
    display: "flex",

    flexDirection: "column",

    alignItems: "flex-start",

    gap: 2,

    width: "100%",

    padding: "12px 14px",

    border: "none",

    borderBottom: "1px solid #f3f4f6",

    background: "white",

    cursor: "pointer",

    textAlign: "left",
  },

  itemTitle: {
    fontWeight: 600,

    fontSize: 15,

    color: "#111827",
  },

  itemSub: {
    fontSize: 12,

    color: "#6b7280",

    lineHeight: 1.35,
  },

  loading: {
    marginTop: 4,

    fontSize: 12,

    color: "#9ca3af",
  },
};
