import styles from "./FilterChips.module.css";

export type Filter = "all" | "individual" | "groups" | "unread" | "favourites";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "individual", label: "Individual" },
  { id: "groups", label: "Groups" },
  { id: "unread", label: "Unread" },
  { id: "favourites", label: "Favourites" },
];

type Props = { value: Filter; onChange: (f: Filter) => void; unreadCount: number };

export function FilterChips({ value, onChange, unreadCount }: Props) {
  return (
    <div className={styles.row} role="tablist" aria-label="Filter chats">
      {FILTERS.map((f, i) => (
        <button
          key={f.id}
          style={{ "--i": i } as React.CSSProperties}
          type="button"
          role="tab"
          aria-selected={value === f.id}
          className={`${styles.chip} ${value === f.id ? styles.active : ""}`}
          onClick={() => onChange(f.id)}
        >
          {f.label}
          {f.id === "unread" && unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </button>
      ))}
    </div>
  );
}
