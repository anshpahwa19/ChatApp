"use client";

import { useState } from "react";
import styles from "./Keyboard.module.css";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

type Props = {
  open: boolean;
  text: string;
  hasText: boolean;
  onKey: (key: string) => void;
  onSuggestion: (word: string) => void;
  onReturn: () => void;
  onDismiss: () => void;
};

/** QuickType suggestions for the word being typed (a stand-in for the system's predictions). */
function suggestionsFor(text: string): [string, string, string] {
  const word = /(\S*)$/.exec(text)?.[1] ?? "";
  if (!word) return ["“The”", "the", "to"];
  const pool = ["the", "to", "that", "there", "then", "thanks", "tomorrow", "see", "you", "soon", "sure", "sounds", "good", "great", "at", "are"];
  const matches = pool.filter((w) => w.startsWith(word.toLowerCase()) && w !== word.toLowerCase());
  return [`“${word}”`, matches[0] ?? `${word}s`, matches[1] ?? `${word}'s`];
}

/**
 * iOS 27 keyboard (Figma "Keyboard", node 41:3162) for devices without a software keyboard
 * of their own. It types into the composer, keeps the field focused, and rides in on the
 * same spring as the composer above it.
 */
export function Keyboard({ open, text, hasText, onKey, onSuggestion, onReturn, onDismiss }: Props) {
  const [shift, setShift] = useState(false);
  // Sentence case: capitalise the first letter of the message.
  const upper = shift || text.length === 0;
  const suggestions = suggestionsFor(text);

  function press(key: string) {
    onKey(upper ? key.toUpperCase() : key);
    if (shift) setShift(false);
  }

  // Keys must not take focus from the text field.
  const keep = (e: React.SyntheticEvent) => e.preventDefault();

  return (
    <div className={`${styles.keyboard} ${open ? styles.open : ""}`} aria-hidden={!open} onMouseDown={keep} onPointerDown={keep}>
      <div className={styles.suggestions}>
        {suggestions.map((s, i) => (
          <span key={i} className={styles.suggestionSlot}>
            {i > 0 && <span className={styles.separator} />}
            <button type="button" tabIndex={-1} className={styles.suggestion} onClick={() => onSuggestion(s.replace(/[“”]/g, ""))}>
              {s}
            </button>
          </span>
        ))}
      </div>

      <div className={styles.keys}>
        <div className={styles.row}>
          {[...ROWS[0]].map((k) => (
            <Key key={k} label={upper ? k.toUpperCase() : k} onPress={() => press(k)} />
          ))}
        </div>
        <div className={`${styles.row} ${styles.row2}`}>
          {[...ROWS[1]].map((k) => (
            <Key key={k} label={upper ? k.toUpperCase() : k} onPress={() => press(k)} />
          ))}
        </div>
        <div className={`${styles.row} ${styles.row3}`}>
          <button type="button" tabIndex={-1} className={`${styles.key} ${styles.modifier}`} aria-label="Shift" aria-pressed={upper} onClick={() => setShift((s) => !s)}>
            <ShiftGlyph filled />
          </button>
          <div className={styles.letters}>
            {[...ROWS[2]].map((k) => (
              <Key key={k} label={upper ? k.toUpperCase() : k} onPress={() => press(k)} />
            ))}
          </div>
          <button type="button" tabIndex={-1} className={`${styles.key} ${styles.modifier}`} aria-label="Delete" onClick={() => onKey("delete")}>
            <DeleteGlyph />
          </button>
        </div>
        <div className={`${styles.row} ${styles.row4}`}>
          <button type="button" tabIndex={-1} className={`${styles.key} ${styles.wide} ${styles.abc}`}>
            ABC
          </button>
          <button type="button" tabIndex={-1} className={`${styles.key} ${styles.space}`} aria-label="Space" onClick={() => onKey("space")} />
          <button
            type="button"
            tabIndex={-1}
            className={`${styles.key} ${styles.wide} ${styles.return}`}
            aria-label={hasText ? "Send" : "Return"}
            onClick={onReturn}
          >
            <ReturnGlyph />
          </button>
        </div>
      </div>

      <div className={styles.bottom}>
        <button type="button" tabIndex={-1} className={styles.globe} aria-label="Emoji" onClick={onDismiss}>
          <img src="/figma/kb-emoji.svg" width={27} height={27} alt="" />
        </button>
        <button type="button" tabIndex={-1} className={styles.globe} aria-label="Dictation">
          <MicGlyph />
        </button>
      </div>
    </div>
  );
}

/** A letter key; while held, iOS shows the letter magnified in a callout above it. */
function Key({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className={`${styles.key} ${styles.letter}`}
      data-key={label}
      onClick={onPress}
      onPointerDown={(e) => e.currentTarget.setAttribute("data-pressed", "")}
      onPointerUp={(e) => e.currentTarget.removeAttribute("data-pressed")}
      onPointerLeave={(e) => e.currentTarget.removeAttribute("data-pressed")}
      onPointerCancel={(e) => e.currentTarget.removeAttribute("data-pressed")}
    >
      {label}
    </button>
  );
}

function ShiftGlyph({ filled }: { filled: boolean }) {
  return (
    <svg width={22} height={20} viewBox="0 0 22 20" aria-hidden>
      <path
        d="M11 1.6 1.9 11h4.9v6.4c0 .6.4 1 1 1h6.4c.6 0 1-.4 1-1V11h4.9L11 1.6Z"
        fill={filled ? "#000" : "none"}
        stroke="#000"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteGlyph() {
  return (
    <svg width={25} height={18} viewBox="0 0 25 18" aria-hidden>
      <path d="M8.2 1.2h13.6c1.1 0 2 .9 2 2v11.6c0 1.1-.9 2-2 2H8.2L1.4 9l6.8-7.8Z" fill="none" stroke="#000" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="m11.6 5.6 6.8 6.8m0-6.8-6.8 6.8" stroke="#000" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function ReturnGlyph() {
  return (
    <svg width={22} height={16} viewBox="0 0 22 16" aria-hidden>
      <path d="M19.6 1.4v6.2c0 1.2-1 2.2-2.2 2.2H3.2m0 0 4.6-4.6M3.2 9.8l4.6 4.6" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MicGlyph() {
  return (
    <svg width={18} height={26} viewBox="0 0 18 26" aria-hidden>
      <rect x={5.2} y={1.2} width={7.6} height={14} rx={3.8} fill="none" stroke="rgba(34,43,89,0.63)" strokeWidth={1.8} />
      <path d="M1.6 11.6a7.4 7.4 0 0 0 14.8 0M9 19v5" fill="none" stroke="rgba(34,43,89,0.63)" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}
