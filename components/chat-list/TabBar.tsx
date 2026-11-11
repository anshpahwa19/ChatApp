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
      const bar = el?.parentElement;
      if (!el || !bar) return;
      // Layout values (unrounded and unaffected by the bar's entrance transform):
      // tabs are equal width and overlap by 8px, starting after the bar's left padding.
      const w = parseFloat(getComputedStyle(el).width);
      const start = parseFloat(getComputedStyle(bar).paddingLeft);
      const index = TABS.findIndex((t) => t.id === active);
      // Figma "Selection": 2px past the tab on the left, 2.4px on the right (79 x 50 on a 74.6px tab).
      setPill({ x: start + index * (w - 8) - 2, w: w + 4.4 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  return (
    <nav className={styles.wrap} aria-label="Main">
      <div className={`${styles.bar} liquid-glass`}>
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
