"use client";

import { useEffect, useRef, useState } from "react";
import { MicrophoneIcon, PauseIcon, PaperPlaneRightIcon, TrashIcon } from "@/components/ui/Icons";
import styles from "./VoiceRecorder.module.css";

/** Number of bars in the scrolling waveform. */
const BARS = 52;
/** How often a new waveform bar is added. */
const TICK_MS = 90;

type Props = {
  onCancel: () => void;
  onSend: (seconds: number) => void;
};

/**
 * "Speaking" UI shown while recording a voice note: live waveform, timer, a mic orb that
 * pulses with the voice (tap to pause/resume), delete and send.
 * Uses the real microphone level when the browser allows it; otherwise a natural-looking
 * simulated voice so the UI still behaves the same.
 */
export function VoiceRecorder({ onCancel, onSend }: Props) {
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [bars, setBars] = useState<number[]>(() => Array(BARS).fill(0));
  const [leaving, setLeaving] = useState(false);
  const level = useRef(0);
  const orbRef = useRef<HTMLButtonElement>(null);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  // Voice level: microphone when available, simulated otherwise.
  useEffect(() => {
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let data: Uint8Array<ArrayBuffer> | null = null;
    const start = performance.now();

    navigator.mediaDevices
      ?.getUserMedia?.({ audio: true })
      .then((s) => {
        stream = s;
        ctx = new AudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        data = new Uint8Array(analyser.fftSize);
        ctx.createMediaStreamSource(s).connect(analyser);
      })
      .catch(() => {
        /* No microphone access: keep the simulated voice. */
      });

    const frame = (now: number) => {
      let target: number;
      if (analyser && data) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        target = Math.min(1, Math.sqrt(sum / data.length) * 5);
      } else {
        const t = (now - start) / 1000;
        const syllables = Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.9 + 1.2));
        const phrase = Math.sin(t * 0.9) < -0.55 ? 0.15 : 1; // short pauses between phrases
        target = (0.18 + 0.75 * syllables + Math.random() * 0.18) * phrase;
      }
      if (pausedRef.current) target = 0;
      level.current += (target - level.current) * 0.35;
      orbRef.current?.style.setProperty("--level", level.current.toFixed(3));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      (ctx as AudioContext | null)?.close();
    };
  }, []);

  // Timer and scrolling waveform (frozen while paused).
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setElapsed((e) => e + TICK_MS / 1000);
      setBars((b) => [...b.slice(1), Math.max(0.06, level.current)]);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  function leave(then: () => void) {
    setLeaving(true);
    window.setTimeout(then, 220);
  }

  const secs = Math.floor(elapsed);
  const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className={`${styles.panel} ${leaving ? styles.leaving : ""}`} role="group" aria-label="Recording voice note">
      <div className={styles.status}>
        <span className={`${styles.state} ${paused ? styles.statePaused : ""}`}>
          <span className={styles.dot} aria-hidden />
          {paused ? "Paused" : "Recording"}
        </span>
        <span className={styles.timer} aria-label={`Recorded ${time}`}>
          {time}
        </span>
      </div>

      <div className={styles.wave} aria-hidden>
        {bars.map((v, i) => (
          <span key={i} style={{ height: `${6 + v * 40}px`, opacity: v < 0.07 ? 0.35 : 1 }} />
        ))}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.delete}
          aria-label="Delete recording"
          onClick={() => leave(onCancel)}
        >
          <TrashIcon size={22} />
        </button>
        <button
          ref={orbRef}
          type="button"
          className={`${styles.orb} ${paused ? styles.orbPaused : ""}`}
          aria-label={paused ? "Resume recording" : "Pause recording"}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <MicrophoneIcon size={28} /> : <PauseIcon size={26} />}
        </button>
        <button
          type="button"
          className={styles.send}
          aria-label="Send voice note"
          onClick={() => leave(() => onSend(Math.max(1, Math.round(elapsed))))}
        >
          <PaperPlaneRightIcon size={20} />
        </button>
      </div>
    </div>
  );
}
