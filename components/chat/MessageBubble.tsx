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
      style={message.textWidth ? { maxWidth: message.textWidth + 24 } : undefined}
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
  const [runs, setRuns] = useState(0);
  const [done, setDone] = useState(false);
  const mine = message.from === "me";
  const [min, sec] = message.duration.split(":").map(Number);
  const seconds = (min || 0) * 60 + (sec || 0);

  function toggle() {
    // First play, or replay after the clip finished: start a fresh fill.
    if (!playing && (runs === 0 || done)) {
      setRuns((r) => r + 1);
      setDone(false);
    }
    setPlaying((p) => !p);
  }

  return (
    <div className={`${styles.line} ${mine ? styles.lineMine : ""}`}>
      <div className={`${styles.voice} ${mine ? styles.mine : styles.theirs}`}>
        <div className={styles.voiceRow}>
          <button
            type="button"
            className={`${styles.play} ${message.listened ? styles.playLight : ""}`}
            aria-label={playing ? "Pause voice note" : "Play voice note"}
            aria-pressed={playing}
            onClick={toggle}
          >
            <img src={message.listened ? "/figma/play-navy.svg" : "/figma/play-white.svg"} width={16} height={16} alt="" />
          </button>
          <div className={styles.duration}>
            <span className={styles.durationText}>{message.duration}</span>
            <span className={styles.track}>
              <img src="/figma/progress.svg" width={92.0034} height={12} alt="" />
              {/* Playback fill: runs for the clip length (halved at 2x) and pauses with the button. */}
              <span
                key={runs}
                className={`${styles.fill} ${runs > 0 ? styles.fillRun : ""}`}
                style={{
                  animationDuration: `${seconds / (fast ? 2 : 1)}s`,
                  animationPlayState: playing ? "running" : "paused",
                }}
                onAnimationEnd={() => {
                  setPlaying(false);
                  setDone(true);
                }}
                aria-hidden
              />
            </span>
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
