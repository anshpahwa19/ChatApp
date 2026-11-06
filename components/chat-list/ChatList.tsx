"use client";

import { useMemo, useRef, useState } from "react";
import { chats, stories } from "@/lib/data";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { StatusBar } from "@/components/ui/StatusBar";
import { ChatRow } from "./ChatRow";
import { CompactHeader } from "./CompactHeader";
import { FilterChips, type Filter } from "./FilterChips";
import { Stories } from "./Stories";
import { TabBar } from "./TabBar";
import styles from "./ChatList.module.css";

/** Scroll distance after which the large green header is replaced by the compact one. */
const COMPACT_HEADER_AT = 150;

export function ChatList() {
  const [filter, setFilter] = useState<Filter>("all");
  const [compact, setCompact] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const top = e.currentTarget.scrollTop;
    // 0 at rest, 1 once the hero has scrolled away; drives the hero's fade/parallax in CSS.
    heroRef.current?.style.setProperty("--p", String(Math.min(1, Math.max(0, top / COMPACT_HEADER_AT))));
    setCompact(top > COMPACT_HEADER_AT);
  }

  const unreadCount = useMemo(() => chats.filter((c) => (c.unread ?? 0) > 0).length, []);

  const visible = useMemo(() => {
    switch (filter) {
      case "individual":
        return chats.filter((c) => c.type === "individual");
      case "groups":
        return chats.filter((c) => c.type === "group");
      case "unread":
        return chats.filter((c) => (c.unread ?? 0) > 0);
      case "favourites":
        return chats.filter((c) => c.favourite);
      default:
        return chats;
    }
  }, [filter]);

  return (
    <PhoneFrame className={styles.device}>
      <div
        className={styles.scroller}
        onScroll={onScroll}
      >
        <header ref={heroRef} className={styles.hero}>
          <StatusBar tone="white" className={styles.heroStatus} />
          <div className={styles.heroInner}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>Chats</h1>
              <div className={styles.actions}>
                <div className={styles.glassPill}>
                  <button type="button" className={styles.pillButton} aria-label="More options">
                    <img src="/figma/dots-three.svg" width={20} height={21} alt="" />
                  </button>
                  <button type="button" className={styles.pillButton} aria-label="Search chats">
                    <img src="/figma/search.svg" width={20} height={21} alt="" />
                  </button>
                </div>
                <button type="button" className={styles.addButton} aria-label="New chat">
                  <img src="/figma/plus-dark.svg" width={16} height={16} alt="" />
                </button>
              </div>
            </div>
            <Stories stories={stories} />
          </div>
        </header>

        <FilterChips value={filter} onChange={setFilter} unreadCount={unreadCount} />

        {/* Keyed by filter so the rows replay their entrance when the filter changes. */}
        <ul key={filter} className={styles.list}>
          {visible.map((chat, i) => (
            <li key={chat.id} style={{ "--i": i } as React.CSSProperties}>
              {i > 0 && <div className={styles.divider} aria-hidden />}
              <ChatRow chat={chat} />
            </li>
          ))}
          {visible.length === 0 && <li className={styles.empty}>No chats here yet</li>}
        </ul>
      </div>

      <CompactHeader visible={compact} />
      <div className={styles.bottomFade} aria-hidden />
      <TabBar />
    </PhoneFrame>
  );
}
