"use client";

import { useLayoutEffect, useRef, useState } from "react";
import styles from "./TabBar.module.css";

const TABS = [
  { id: "meeting", label: "Meeting", icon: "/figma/tab-meeting.svg" },
  { id: "calls", label: "Calls", icon: "/figma/tab-calls.svg" },
  { id: "community", label: "Community", icon: "/figma/tab-community.svg" },
  { id: "chats", label: "Chats", icon: "/figma/tab-chats.svg" },
  { id: "notes", label: "Notes", icon: "/figma/tab-notes.svg" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Floating glass tab bar at the bottom of the chat list. */
export function TabBar({ initial = "chats" }: { initial?: TabId }) {
  const [active, setActive] = useState<TabId>(initial);
  const [taps, setTaps] = useState(0);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const [animatePill, setAnimatePill] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Measure the active tab so a single selection pill can glide between tabs.
  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[active];
      if (el) setPill({ x: el.offsetLeft - 2, w: el.offsetWidth + 4.4 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  return (
    <nav className={styles.wrap} aria-label="Main">
      <div className={styles.bar}>
        <div className={`${styles.glass} liquid-glass`} aria-hidden />
        {pill && (
          <span
            className={`${styles.selection} ${animatePill ? styles.gliding : ""}`}
            style={{ transform: `translateX(${pill.x}px)`, width: pill.w }}
            aria-hidden
          />
        )}
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            type="button"
            className={styles.tab}
            aria-current={active === tab.id ? "page" : undefined}
            onClick={() => {
              setAnimatePill(true);
              setActive(tab.id);
              setTaps((t) => t + 1);
            }}
          >
            <img
              // Re-keying the active icon replays its bounce on every tap.
              key={active === tab.id ? `on-${taps}` : "off"}
              className={`${styles.icon} ${active === tab.id && taps > 0 ? styles.bounce : ""}`}
              src={tab.icon}
              width={24}
              height={24}
              alt=""
            />
            <span className={styles.label}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
