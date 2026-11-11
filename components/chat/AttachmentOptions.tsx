import styles from "./AttachmentOptions.module.css";

const OPTIONS = [
  { id: "gallery", label: "Gallery", icon: "/figma/att-gallery.svg", bg: "#d0d9ff", border: "#cdd6f2" },
  { id: "camera", label: "Camera", icon: "/figma/att-camera.svg", bg: "#f3d5d5", border: "#d9b9b9" },
  { id: "location", label: "Location", icon: "/figma/att-location.svg", bg: "#eecbe8", border: "#d4adcd" },
  { id: "contact", label: "Contact", icon: "/figma/att-contact.svg", bg: "#bbd7e6", border: "#a6c4d4" },
  { id: "document", label: "Document", icon: "/figma/att-document.svg", bg: "#debff4", border: "#d1b2e7" },
  { id: "audio", label: "Audio", icon: "/figma/att-audio.svg", bg: "rgba(187, 215, 230, 0.92)", border: "#b0cede" },
  { id: "poll", label: "Poll", icon: "/figma/att-poll.svg", bg: "rgba(238, 227, 161, 0.72)", border: "#d7cd8e" },
  { id: "checkin", label: "Check in", icon: "/figma/att-checkin.svg", bg: "rgba(191, 202, 244, 0.78)", border: "#aab5e0" },
];

/** Attachment grid shown in the bottom sheet (Figma "Attachment Options", node 41:1825). */
export function AttachmentOptions({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className={styles.grid}>
      {OPTIONS.map((o, i) => {
        const size = o.id === "poll" || o.id === "checkin" ? 24 : 23.9887;
        return (
          <button
            key={o.id}
            style={{ "--i": i } as React.CSSProperties}
            type="button"
            className={styles.option}
            onClick={() => onSelect(o.id)}
          >
            <span className={styles.circle} style={{ background: o.bg, borderColor: o.border }}>
              <img src={o.icon} width={size} height={size} alt="" />
            </span>
            <span className={styles.label}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
