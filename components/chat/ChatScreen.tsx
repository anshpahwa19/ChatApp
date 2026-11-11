"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, Message, SummaryRange } from "@/lib/data";
import { AiAssistant } from "@/components/ai/AiAssistant";
import { ChatSummary } from "@/components/ai/ChatSummary";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { AttachmentOptions } from "./AttachmentOptions";
import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
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

export function ChatScreen({ conversation }: { conversation: Conversation }) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [sheet, setSheet] = useState<SheetView | null>(null);
  // Keeps the last view mounted while the sheet slides away.
  const [lastSheet, setLastSheet] = useState<SheetView>("attach");
  const [range, setRange] = useState<SummaryRange>("24h");
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const initialCount = useRef(conversation.messages.length);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // While a sheet is open, make room under the messages and bring the latest ones into view above it.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || sheet === null) return;
    el.style.paddingBottom = `${SHEET_HEIGHT[sheet] + 16}px`;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    return () => {
      el.style.paddingBottom = "";
    };
  }, [sheet]);

  function openSheet(view: SheetView) {
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
    <PhoneFrame className={styles.device}>
      <img className={styles.wallpaper} src="/figma/chat-wallpaper.png" alt="" aria-hidden />

      <div
        ref={scrollRef}
        className={styles.scroller}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <ol className={styles.messages} aria-label={`Conversation with ${conversation.name}`}>
          {messages.map((m, i) => (
            <li
              key={m.id}
              className={m.kind === "date" ? styles.dateItem : undefined}
              data-from={m.kind === "date" ? undefined : m.from}
              // Initial history cascades in; messages sent later appear immediately.
              style={{ "--d": i < initialCount.current ? `${160 + i * 55}ms` : "0ms" } as React.CSSProperties}
            >
              {m.kind === "date" ? <span className={styles.date}>{m.label}</span> : <MessageBubble message={m} />}
            </li>
          ))}
        </ol>
      </div>

      {/* Hairline where scrolled messages tuck under the floating header. */}
      <div className={`${styles.edge} ${scrolled ? styles.edgeOn : ""}`} aria-hidden />
      <ChatHeader conversation={conversation} />
      <Composer
        onSend={send}
        onAttach={() => openSheet("attach")}
        onAssist={() => openSheet("ai")}
        hidden={sheet !== null}
      />
      <BottomSheet
        open={sheet !== null}
        onClose={closeSheet}
        label={SHEET_LABEL[view]}
        viewKey={view}
        minHeight={SHEET_HEIGHT[view]}
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
    </PhoneFrame>
  );
}
