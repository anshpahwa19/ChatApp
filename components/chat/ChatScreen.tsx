"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, Message, SummaryRange } from "@/lib/data";
import { Spring, springs } from "@/lib/spring";
import { AiAssistant } from "@/components/ai/AiAssistant";
import { ChatSummary } from "@/components/ai/ChatSummary";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { AttachmentOptions } from "./AttachmentOptions";
import { ChatHeader } from "./ChatHeader";
import { Composer, type ComposerHandle } from "./Composer";
import { MessageBubble } from "./MessageBubble";
import styles from "./ChatScreen.module.css";

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type SheetView = "attach" | "ai" | "summary";

/** Heights of the Figma frames for each sheet view. */
const SHEET_HEIGHT: Record<SheetView, number> = { attach: 292, ai: 528, summary: 576 };

const SHEET_LABEL: Record<SheetView, string> = {
  attach: "Attach",
  ai: "AI Chat Assistant",
  summary: "Chat Summary",
};

/** How far the composer rises with the keyboard (Figma: y 785 -> 475 minus 1px). */
const KEYBOARD_LIFT = 311;

export function ChatScreen({ conversation }: { conversation: Conversation }) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [sheet, setSheet] = useState<SheetView | null>(null);
  // Keeps the last view mounted while the sheet slides away.
  const [lastSheet, setLastSheet] = useState<SheetView>("attach");
  const [range, setRange] = useState<SummaryRange>("24h");
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const plusRef = useRef<HTMLElement | null>(null);
  const aiRef = useRef<HTMLElement | null>(null);
  const initialCount = useRef(conversation.messages.length);
  const keyboard = useRef<Spring | null>(null);

  // The keyboard spring moves the composer, the keyboard and the bottom of the message
  // list together, keeping the newest message pinned just above the composer.
  if (!keyboard.current && typeof window !== "undefined") {
    keyboard.current = new Spring(0, (v) => {
      const content = contentRef.current;
      const scroller = scrollRef.current;
      if (!content || !scroller) return;
      content.style.setProperty("--kb", v.toFixed(4));
      const atBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 40;
      // Like UIKit's keyboard layout guide: the scroll view's bottom edge rises with the keyboard.
      scroller.style.bottom = `${KEYBOARD_LIFT * Math.max(0, v)}px`;
      if (atBottom || v > 0) scroller.scrollTop = scroller.scrollHeight;
    });
  }

  const keyboardUp = useRef(false);
  const onKeyboard = useCallback((up: boolean) => {
    keyboardUp.current = up;
    keyboard.current?.to(up ? 1 : 0, springs.keyboard);
  }, []);

  // Whenever the visible message area shrinks for the keyboard, keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    const ro = new ResizeObserver(() => {
      if (keyboardUp.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      keyboard.current?.stop();
    };
  }, []);

  // New messages: keep the conversation scrolled to the latest.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || messages.length === initialCount.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  function openSheet(view: SheetView) {
    plusRef.current = composerRef.current?.plusButton ?? null;
    aiRef.current = composerRef.current?.aiButton ?? null;
    setLastSheet(view);
    setSheet(view);
  }

  const closeSheet = useCallback(() => setSheet(null), []);
  const view = sheet ?? lastSheet;

  function send(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, kind: "text", from: "me", text, time: nowTime(), ticks: "delivered" },
    ]);
  }

  return (
    <div className={styles.screen}>
      <div ref={contentRef} className={styles.content}>
        <img className={styles.wallpaper} src="/figma/chat-wallpaper.webp" alt="" aria-hidden />

        <div
          ref={scrollRef}
          className={styles.scroller}
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
          onPointerDown={() => {
            // Tapping the conversation dismisses the keyboard, as in Messages.
            const active = document.activeElement as HTMLElement | null;
            if (active?.tagName === "INPUT") active.blur();
          }}
        >
          <ol className={styles.messages} aria-label={`Conversation with ${conversation.name}`}>
            {messages.map((m, i) => (
              <li
                key={m.id}
                className={`${m.kind === "date" ? styles.dateItem : ""} ${i >= initialCount.current ? styles.sent : ""}`}
                data-from={m.kind === "date" ? undefined : m.from}
              >
                {m.kind === "date" ? <span className={styles.date}>{m.label}</span> : <MessageBubble message={m} />}
              </li>
            ))}
          </ol>
        </div>

        {/* Soft scroll-edge effects where content meets the floating header and composer. */}
        <div className={`${styles.topEdge} ${scrolled ? styles.topEdgeOn : ""}`} aria-hidden />
        <div className={styles.bottomEdge} aria-hidden />
        <ChatHeader conversation={conversation} />
        <Composer
          ref={composerRef}
          onSend={send}
          onAttach={() => openSheet("attach")}
          onAssist={() => openSheet("ai")}
          onKeyboard={onKeyboard}
          hidden={sheet !== null}
        />
      </div>

      <BottomSheet
        open={sheet !== null}
        onClose={closeSheet}
        label={SHEET_LABEL[view]}
        viewKey={view}
        minHeight={SHEET_HEIGHT[view]}
        backgroundRef={contentRef}
        sourceRef={view === "attach" ? plusRef : view === "ai" ? aiRef : undefined}
      >
        {view === "attach" && <AttachmentOptions onSelect={closeSheet} />}
        {view === "ai" && (
          <AiAssistant
            onSummarize={(r) => {
              setRange(r);
              openSheet("summary");
            }}
          />
        )}
        {view === "summary" && <ChatSummary range={range} />}
      </BottomSheet>
    </div>
  );
}
