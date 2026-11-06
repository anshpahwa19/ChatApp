"use client";

import { useState } from "react";
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

  return (
    <nav className={styles.wrap} aria-label="Main">
      <div className={styles.bar}>
        <div className={styles.glass} aria-hidden />
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={styles.tab}
            aria-current={active === tab.id ? "page" : undefined}
            onClick={() => setActive(tab.id)}
          >
            {active === tab.id && <span className={styles.selection} aria-hidden />}
            <img className={styles.icon} src={tab.icon} width={24} height={24} alt="" />
            <span className={styles.label}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
