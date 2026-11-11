"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { chats, stories, type SummaryRange } from "@/lib/data";
import { AiAssistant } from "@/components/ai/AiAssistant";
import { ChatSummary } from "@/components/ai/ChatSummary";
import { BottomSheet } from "@/components/ui/BottomSheet";
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
  const [sheet, setSheet] = useState<"ai" | "summary" | null>(null);
  const [lastSheet, setLastSheet] = useState<"ai" | "summary">("ai");
  const [range, setRange] = useState<SummaryRange>("24h");
  const closeSheet = useCallback(() => setSheet(null), []);
  const view = sheet ?? lastSheet;

  function openSheet(next: "ai" | "summary") {
    setLastSheet(next);
    setSheet(next);
  }

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
                <div className={`${styles.glassPill} liquid-glass-dark`}>
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

      {/* Floating AI assistant button (Figma "Icon Container/AI", node 41:1274). */}
      <button type="button" className={styles.aiFab} aria-label="AI Chat Assistant" onClick={() => openSheet("ai")}>
        <img className={styles.aiFabGradient} src="/figma/fab-gradient.svg" width={82.8316} height={82.8316} alt="" />
        <img className={styles.aiFabIcon} src="/figma/fab-sparkle.svg" width={26.6667} height={26.6667} alt="" />
      </button>

      <TabBar />

      <BottomSheet
        open={sheet !== null}
        onClose={closeSheet}
        label={view === "ai" ? "AI Chat Assistant" : "Chat Summary"}
        viewKey={view}
        minHeight={view === "ai" ? 528 : 576}
      >
        {view === "ai" ? (
          <AiAssistant
            onSummarize={(r) => {
              setRange(r);
              openSheet("summary");
            }}
          />
        ) : (
          <ChatSummary range={range} />
        )}
      </BottomSheet>
    </PhoneFrame>
  );
}
