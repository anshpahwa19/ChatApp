"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { chats, stories, type SummaryRange } from "@/lib/data";
import { glassPress } from "@/lib/useGlassPress";
import { AiAssistant } from "@/components/ai/AiAssistant";
import { ChatSummary } from "@/components/ai/ChatSummary";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ChatRow } from "./ChatRow";
import { CompactHeader } from "./CompactHeader";
import { FilterChips, type Filter } from "./FilterChips";
import { Stories } from "./Stories";
import { TabBar } from "./TabBar";
import styles from "./ChatList.module.css";

/** Scroll distance over which the large title fades and lifts away. */
const TITLE_FADE = 110;
/** The inline title takes over once the list panel has slid up under the bar. */
const COMPACT_AT = 118;

export function ChatList() {
  const [filter, setFilter] = useState<Filter>("all");
  const [compact, setCompact] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
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
    const el = screenRef.current;
    if (el) {
      // Scroll-linked like UIKit's large title: 0 at rest, 1 once it has gone under the bar.
      el.style.setProperty("--p", String(Math.min(1, Math.max(0, top / TITLE_FADE))));
      el.style.setProperty("--scroll", String(Math.min(260, Math.max(0, top))));
      // Pulling down past the top (rubber-band overscroll) stretches the large title.
      el.style.setProperty("--pull", String(Math.max(0, -top)));
    }
    // Hysteresis keeps the inline title from flickering around the threshold.
    setCompact((was) => (was ? top > COMPACT_AT - 12 : top > COMPACT_AT));
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
    <div ref={screenRef} className={styles.screen}>
      <div ref={contentRef} className={styles.content}>
        <div className={styles.scroller} onScroll={onScroll}>
          <header className={styles.hero}>
            <div className={styles.heroInner}>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>Chats</h1>
                <div className={styles.actions}>
                  <div className={`${styles.glassPill} liquid-glass-dark`}>
                    <button type="button" className={`${styles.pillButton} glass-press`} aria-label="More options" {...glassPress}>
                      <img src="/figma/dots-three.svg" width={20} height={21} alt="" />
                    </button>
                    <button type="button" className={`${styles.pillButton} glass-press`} aria-label="Search chats" {...glassPress}>
                      <img src="/figma/search.svg" width={20} height={21} alt="" />
                    </button>
                  </div>
                  <button type="button" className={`${styles.addButton} glass-press`} aria-label="New chat" {...glassPress}>
                    <img src="/figma/plus-dark.svg" width={16} height={16} alt="" />
                  </button>
                </div>
              </div>
              <Stories stories={stories} />
            </div>
          </header>

          {/* White list panel (node 41:2131 "Frame 2147231133" parent): chips then rows. */}
          <section className={styles.panel}>
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
          </section>
        </div>

        <CompactHeader visible={compact} />

        {/* Floating AI assistant button (Figma "Group 2147227044", 58px). */}
        <button
          ref={fabRef}
          type="button"
          className={`${styles.aiFab} glass-press`}
          aria-label="AI Chat Assistant"
          onClick={() => openSheet("ai")}
          {...glassPress}
        >
          <img src="/figma/fab-ai.svg" width={58} height={58} alt="" />
        </button>

        <TabBar initial="meeting" />
      </div>

      <BottomSheet
        open={sheet !== null}
        onClose={closeSheet}
        label={view === "ai" ? "AI Chat Assistant" : "Chat Summary"}
        viewKey={view}
        minHeight={view === "ai" ? 528 : 576}
        backgroundRef={contentRef}
        sourceRef={view === "ai" ? fabRef : undefined}
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
    </div>
  );
}
