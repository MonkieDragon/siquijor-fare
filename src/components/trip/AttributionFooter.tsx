type Props = {
  align?: "left" | "center";
};

export default function AttributionFooter({ align = "center" }: Props) {
  return (
    <footer
      style={{
        ...styles.footer,

        textAlign: align,

        ...(align === "left" ? styles.footerFlush : {}),
      }}
    >
      <span style={styles.line}>
        Map tiles{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          style={styles.link}
        >
          OpenStreetMap
        </a>
        . Search uses{" "}
        <a
          href="https://nominatim.openstreetmap.org/"
          target="_blank"
          rel="noreferrer"
          style={styles.link}
        >
          Nominatim
        </a>{" "}
        (
        <a
          href="https://operations.osmfoundation.org/policies/nominatim/"
          target="_blank"
          rel="noreferrer"
          style={styles.link}
        >
          usage policy
        </a>
        ).
      </span>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    marginTop: 6,

    paddingTop: 6,

    borderTop: "1px solid #f3f4f6",

    fontSize: 10,

    lineHeight: 1.4,

    color: "#9ca3af",

    textAlign: "center",
  },

  line: {
    display: "block",
  },

  link: {
    color: "#6b7280",

    textDecoration: "underline",

    textUnderlineOffset: 2,
  },

  footerFlush: {
    marginTop: 0,

    paddingTop: 0,

    borderTop: "none",
  },
};
