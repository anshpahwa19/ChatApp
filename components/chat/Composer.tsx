"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Composer.module.css";

type Props = { onSend: (text: string) => void; onAttach: () => void; hidden?: boolean };

export function Composer({ onSend, onAttach, hidden }: Props) {
  const [text, setText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Make the bar unreachable while the attachment sheet covers it.
  useEffect(() => {
    formRef.current?.toggleAttribute("inert", Boolean(hidden));
  }, [hidden]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  }

  return (
    <form ref={formRef} className={`${styles.bar} ${hidden ? styles.hidden : ""}`} onSubmit={submit}>
      <div className={styles.inner}>
        <div className={styles.inputArea}>
          <button type="button" className={styles.circle36} aria-label="Attach" onClick={onAttach}>
            <img src="/figma/paperclip.svg" width={20} height={20} alt="" />
          </button>
          <label className={styles.field}>
            <span className="visually-hidden">Message</span>
            <input
              className={styles.input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message..."
              enterKeyHint="send"
            />
            <button type="button" className={styles.sticker} aria-label="Stickers">
              <img src="/figma/sticker.svg" width={22} height={22} alt="" />
            </button>
          </label>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.ai} aria-label="AI assist">
            <img className={styles.aiGradient} src="/figma/ai-gradient.svg" width={66.2653} height={66.2653} alt="" />
            <img className={styles.aiIcon} src="/figma/ai-sparkle.svg" width={25.707} height={25.707} alt="" />
          </button>
          <button type="submit" className={styles.circle40} aria-label={text.trim() ? "Send message" : "Record voice note"}>
            <img src="/figma/mic.svg" width={20} height={20} alt="" />
          </button>
        </div>
      </div>
    </form>
  );
}
