"use client";

import { useEffect, useRef, useState } from "react";
import type { Conversation, Message } from "@/lib/data";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { AttachmentSheet } from "./AttachmentSheet";
import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { MessageBubble } from "./MessageBubble";
import styles from "./ChatScreen.module.css";

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ChatScreen({ conversation }: { conversation: Conversation }) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [sheetOpen, setSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  function send(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, kind: "text", from: "me", text, time: nowTime(), ticks: "delivered" },
    ]);
  }

  return (
    <PhoneFrame className={styles.device}>
      <img className={styles.wallpaper} src="/figma/chat-wallpaper.png" alt="" aria-hidden />

      <div ref={scrollRef} className={styles.scroller}>
        <ol className={styles.messages} aria-label={`Conversation with ${conversation.name}`}>
          {messages.map((m) => (
            <li
              key={m.id}
              className={m.kind === "date" ? styles.dateItem : undefined}
              data-from={m.kind === "date" ? undefined : m.from}
            >
              {m.kind === "date" ? <span className={styles.date}>{m.label}</span> : <MessageBubble message={m} />}
            </li>
          ))}
        </ol>
      </div>

      <ChatHeader conversation={conversation} />
      <Composer onSend={send} onAttach={() => setSheetOpen(true)} hidden={sheetOpen} />
      <AttachmentSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </PhoneFrame>
  );
}
