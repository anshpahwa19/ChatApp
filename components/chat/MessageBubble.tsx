"use client";

import { useState } from "react";
import type { Message } from "@/lib/data";
import { ReadTicks } from "@/components/ui/ReadTicks";
import styles from "./MessageBubble.module.css";

type BubbleMessage = Exclude<Message, { kind: "date" }>;

export function MessageBubble({ message }: { message: BubbleMessage }) {
  if (message.kind === "voice") return <VoiceNote message={message} />;

  const mine = message.from === "me";
  const meta = (
    <span className={`${styles.meta} ${mine ? styles.metaLight : ""} ${message.replyable ? styles.metaPlain : ""}`}>
      {message.forwarded && <img src="/figma/forwarded.svg" width={10} height={8} alt="Forwarded" />}
      <span className={styles.time}>{message.time}</span>
      {mine && message.ticks && <ReadTicks variant={message.ticks} />}
    </span>
  );

  const bubble = (
    <div
      className={`${styles.bubble} ${mine ? styles.mine : styles.theirs} ${message.replyable ? styles.bordered : ""} ${
        message.highlight ? styles.compact : ""
      }`}
    >
      {message.timeBelow ? (
        <>
          <p className={styles.text}>{message.text}</p>
          <div className={styles.metaRow}>{meta}</div>
        </>
      ) : (
        <p className={styles.text}>
          {message.text}
          {/* Reserves room so the floating timestamp never overlaps the last line. */}
          <span className={`${styles.spacer} ${message.forwarded ? styles.spacerWide : ""}`} aria-hidden />
          <span className={styles.inlineMeta}>{meta}</span>
        </p>
      )}
    </div>
  );

  return (
    <div className={`${styles.line} ${mine ? styles.lineMine : ""}`}>
      {message.replyable && (
        <button type="button" className={styles.reply} aria-label="Reply">
          <img src="/figma/reply.svg" width={16} height={16} alt="" />
        </button>
      )}
      {bubble}
    </div>
  );
}

function VoiceNote({ message }: { message: Extract<Message, { kind: "voice" }> }) {
  const [playing, setPlaying] = useState(false);
  const [fast, setFast] = useState(false);
  const mine = message.from === "me";

  return (
    <div className={`${styles.line} ${mine ? styles.lineMine : ""}`}>
      <div className={`${styles.voice} ${mine ? styles.mine : styles.theirs}`}>
        <div className={styles.voiceRow}>
          <button
            type="button"
            className={`${styles.play} ${message.listened ? styles.playLight : ""}`}
            aria-label={playing ? "Pause voice note" : "Play voice note"}
            aria-pressed={playing}
            onClick={() => setPlaying((p) => !p)}
          >
            <img src={message.listened ? "/figma/play-dark.svg" : "/figma/play-white.svg"} width={16} height={16} alt="" />
          </button>
          <div className={styles.duration}>
            <span className={styles.durationText}>{message.duration}</span>
            <img src="/figma/progress.svg" width={92.0034} height={12} alt="" />
          </div>
          <button
            type="button"
            className={`${styles.speed} ${fast ? styles.speedOn : ""}`}
            aria-label="Playback speed 2x"
            aria-pressed={fast}
            onClick={() => setFast((f) => !f)}
          >
            <img src="/figma/speed-2x.svg" width={20} height={20} alt="" />
          </button>
        </div>
        <div className={styles.metaRow}>
          <span className={`${styles.meta} ${styles.metaLight}`}>
            <span className={styles.time}>{message.time}</span>
            <ReadTicks variant="seen" />
          </span>
        </div>
      </div>
    </div>
  );
}
