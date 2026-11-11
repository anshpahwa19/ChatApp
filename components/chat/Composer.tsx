"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { glassPress } from "@/lib/useGlassPress";
import { Keyboard } from "./Keyboard";
import styles from "./Composer.module.css";

type Props = {
  onSend: (text: string) => void;
  onAttach: () => void;
  onAssist: () => void;
  /** Called with true while the on-screen keyboard is up (so the chat can make room). */
  onKeyboard: (up: boolean) => void;
  hidden?: boolean;
};

export type ComposerHandle = {
  plusButton: HTMLButtonElement | null;
  aiButton: HTMLButtonElement | null;
};

/** Software keyboard only where there is no system one (mouse/trackpad devices). */
function wantsOnScreenKeyboard() {
  return typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
}

/**
 * Message composer (Figma "Message Composer", nodes 41:2612 and 41:3154): a glass + button,
 * a glass field and the AI button. While typing, the AI button melts into the field as it
 * widens and the mic pill morphs into the send button — one glass surface reshaping, like
 * SwiftUI's GlassEffectContainer with matching glassEffectIDs.
 */
export const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  { onSend, onAttach, onAssist, onKeyboard, hidden },
  ref,
) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [onScreen] = useState(wantsOnScreenKeyboard);
  // The keyboard is up while the field has focus; tapping the conversation blurs it (and so
  // dismisses the keyboard), as in Messages.
  const keyboard = focused && onScreen;
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const plusRef = useRef<HTMLButtonElement>(null);
  const aiRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({ plusButton: plusRef.current, aiButton: aiRef.current }), []);

  // Make the bar unreachable while a sheet covers it.
  useEffect(() => {
    formRef.current?.toggleAttribute("inert", Boolean(hidden));
    if (hidden) inputRef.current?.blur();
  }, [hidden]);

  useEffect(() => {
    onKeyboard(keyboard);
  }, [keyboard, onKeyboard]);

  const typing = focused || keyboard;
  const hasText = text.trim().length > 0;

  function send() {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  }

  return (
    <>
      <form
        ref={formRef}
        className={`${styles.bar} ${typing ? styles.typing : ""} ${hidden ? styles.hidden : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <button
          ref={plusRef}
          type="button"
          className={`${styles.plus} liquid-glass glass-press`}
          aria-label="Attach"
          onClick={onAttach}
          {...glassPress}
        >
          <PlusGlyph />
        </button>

        <label className={`${styles.field} liquid-glass`}>
          <span className="visually-hidden">Message</span>
          <input
            ref={inputRef}
            className={styles.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Start typing.."
            enterKeyHint="send"
            autoComplete="off"
          />
          <button type="button" className={styles.sticker} aria-label="Stickers" tabIndex={-1}>
            <img src="/figma/sticker-dark.svg" width={22} height={22} alt="" />
          </button>
          {/* Mic pill (48 x 29) and send button (28) are one shape that morphs between the two. */}
          <button
            type={hasText ? "submit" : "button"}
            className={`${styles.action} ${hasText ? styles.send : ""}`}
            aria-label={hasText ? "Send message" : "Record voice note"}
            onMouseDown={(e) => e.preventDefault()}
          >
            <img className={styles.mic} src="/figma/mic-dark.svg" width={20} height={20} alt="" />
            <ArrowUpGlyph className={styles.arrow} />
          </button>
        </label>

        <button
          ref={aiRef}
          type="button"
          className={`${styles.ai} glass-press`}
          aria-label="AI Chat Assistant"
          onClick={onAssist}
          tabIndex={typing ? -1 : 0}
          {...glassPress}
        >
          <img src="/figma/ai-button.svg" width={45} height={45} alt="" />
        </button>
      </form>

      <Keyboard
        open={keyboard}
        hasText={hasText}
        onKey={(key) => {
          setText((t) => {
            if (key === "delete") return t.slice(0, -1);
            if (key === "space") return `${t} `;
            return t + key;
          });
          inputRef.current?.focus();
        }}
        onSuggestion={(word) => {
          setText((t) => `${t.replace(/\S*$/, "")}${word} `);
          inputRef.current?.focus();
        }}
        onReturn={send}
        onDismiss={() => inputRef.current?.blur()}
        text={text}
      />
    </>
  );
});

/** SF Symbol "plus" (17pt regular). */
function PlusGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden>
      <path d="M9 2.2v13.6M2.2 9h13.6" stroke="#000" strokeWidth={1.7} strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** SF Symbol "arrow.up" (15pt regular). */
function ArrowUpGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 16 16" aria-hidden>
      <path d="M8 13.5V2.8M3.2 7.4 8 2.6l4.8 4.8" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
