"use client";

import { useEffect, useRef, useState } from "react";
import { glassPress } from "@/lib/useGlassPress";
import styles from "./VoiceRecorder.module.css";

const BARS = 34;

type Props = {
  onCancel: () => void;
  onSend: (seconds: number) => void;
};

/**
 * Voice-note recording UI ("speaking" state of the composer). The composer's glass pieces
 * morph into: a trash button, a live waveform with the elapsed time, and a send button. A
 * floating glass orb above the composer swells with the speaker's voice. Uses the real
 * microphone when the browser allows it, otherwise a simulated voice level.
 */
export function VoiceRecorder({ onCancel, onSend }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.06));
  const [live, setLive] = useState(false);
  const orbRef = useRef<HTMLDivElement>(null);
  const level = useRef(0);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  // Microphone (optional): RMS level from an analyser; falls back to a speech-like simulation.
  useEffect(() => {
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        ctx = new AudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(s).connect(analyser);
        setLive(true);
      })
      .catch(() => {});

    const data = new Uint8Array(512);
    let frame = 0;
    let t = 0;
    let smoothed = 0;
    const tick = () => {
      t += 1 / 60;
      let target: number;
      if (analyser) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        target = Math.min(1, Math.sqrt(sum / data.length) * 5);
      } else {
        // Syllables (~5 Hz) inside phrases (~0.4 Hz) with small pauses between words.
        const phrase = Math.max(0, Math.sin(t * 2.4) * 0.6 + 0.5);
        const syllable = Math.abs(Math.sin(t * 15 + Math.sin(t * 3) * 2));
        target = Math.min(1, phrase * (0.25 + syllable * 0.75) * (0.7 + Math.random() * 0.3));
      }
      if (pausedRef.current) target = 0;
      smoothed += (target - smoothed) * 0.25;
      level.current = smoothed;
      orbRef.current?.style.setProperty("--level", smoothed.toFixed(3));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((tr) => tr.stop());
      (ctx as AudioContext | null)?.close();
    };
  }, []);

  // Waveform scrolls left ~12 bars a second; the timer counts while not paused.
  useEffect(() => {
    if (paused) return;
    const wave = setInterval(() => setLevels((l) => [...l.slice(1), Math.max(0.06, level.current)]), 85);
    const clock = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(wave);
      clearInterval(clock);
    };
  }, [paused]);

  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <>
      {/* Floating "speaking" orb above the composer. */}
      <div ref={orbRef} className={`${styles.speaking} ${paused ? styles.idle : ""}`} aria-live="polite">
        <div className={styles.orb}>
          <span className={styles.ring} />
          <span className={`${styles.ring} ${styles.ring2}`} />
          <span className={styles.core}>
            <MicGlyph />
          </span>
        </div>
        <span className={styles.label}>{paused ? "Paused" : live ? "Listening…" : "Recording…"}</span>
      </div>

      <div className={styles.row}>
        <button type="button" className={`${styles.trash} liquid-glass glass-press`} aria-label="Delete recording" onClick={onCancel} {...glassPress}>
          <TrashGlyph />
        </button>
        <div className={`${styles.strip} liquid-glass`}>
          <span className={`${styles.dot} ${paused ? styles.dotPaused : ""}`} aria-hidden />
          <span className={styles.time} aria-label={`Recording, ${seconds} seconds`}>
            {time}
          </span>
          <span className={styles.wave} aria-hidden>
            {levels.map((v, i) => (
              <span key={i} style={{ transform: `scaleY(${v})` }} />
            ))}
          </span>
          <button type="button" className={styles.pause} aria-label={paused ? "Resume recording" : "Pause recording"} onClick={() => setPaused((p) => !p)}>
            {paused ? <MicGlyph small /> : <PauseGlyph />}
          </button>
        </div>
        <button type="button" className={`${styles.send} glass-press`} aria-label="Send voice note" onClick={() => onSend(Math.max(1, seconds))} {...glassPress}>
          <svg width={18} height={18} viewBox="0 0 16 16" aria-hidden>
            <path d="M8 13.5V2.8M3.2 7.4 8 2.6l4.8 4.8" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </button>
      </div>
    </>
  );
}

function MicGlyph({ small }: { small?: boolean }) {
  const s = small ? 16 : 26;
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden>
      <rect x={6.5} y={1.5} width={7} height={11} rx={3.5} fill="currentColor" />
      <path d="M3.8 9.6a6.2 6.2 0 0 0 12.4 0M10 15.8v2.6" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden>
      <path d="M4.5 2.5v9M9.5 2.5v9" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  );
}

function TrashGlyph() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden>
      <path
        d="M3.5 5.5h13M8 5.5V3.8c0-.4.3-.8.8-.8h2.4c.5 0 .8.4.8.8v1.7M5 5.5l.8 10.6c0 .5.5.9 1 .9h6.4c.5 0 1-.4 1-.9L15 5.5M8.3 8.6v5.2M11.7 8.6v5.2"
        fill="none"
        stroke="#d4373d"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
