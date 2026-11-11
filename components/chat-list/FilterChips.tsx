"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  const [glide, setGlide] = useState(false);

  // One selection fill that morphs from chip to chip (like a shared glassEffectID).
  useLayoutEffect(() => {
    const el = chipRefs.current[value];
    if (el) setBox({ x: el.offsetLeft, w: el.offsetWidth });
  }, [value]);

  return (
    <div className={styles.row} role="tablist" aria-label="Filter chats">
      {box && (
        <span
          className={`${styles.indicator} ${glide ? styles.gliding : ""}`}
          style={{ transform: `translateX(${box.x}px)`, width: box.w }}
          aria-hidden
        />
      )}
      {FILTERS.map((f, i) => (
        <button
          key={f.id}
          ref={(el) => {
            chipRefs.current[f.id] = el;
          }}
          style={{ "--i": i } as React.CSSProperties}
          type="button"
          role="tab"
          aria-selected={value === f.id}
          className={`${styles.chip} ${value === f.id ? styles.active : ""}`}
          onClick={(e) => {
            setGlide(true);
            onChange(f.id);
            e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
          }}
        >
          <span className={styles.label}>{f.label}</span>
          {f.id === "unread" && unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </button>
      ))}
    </div>
  );
}
