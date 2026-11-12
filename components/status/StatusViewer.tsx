"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Story } from "@/lib/data";
import { prefersReducedMotion, project, Spring, springs } from "@/lib/spring";
import { glassPress } from "@/lib/useGlassPress";
import { StatusBar } from "@/components/ui/StatusBar";
import styles from "./StatusViewer.module.css";

/** How long each status stays up before advancing. */
const DURATION = 5000;
/** A press longer than this pauses instead of tapping through. */
const HOLD = 220;

type Props = {
  stories: Story[];
  startIndex: number;
  /** Screen rect of the tapped story ring: the viewer zooms out of it and back into it. */
  origin: DOMRect | null;
  /** Device element the rect is measured against. */
  frame: HTMLElement | null;
  onClose: () => void;
  onSeen: (id: string) => void;
};

/**
 * Full-screen status viewer (iOS-style story player). Zooms out of the tapped ring, plays
 * each status with segmented progress bars, taps left/right to step, press-and-hold to
 * pause, swipe down to dismiss (it follows the finger and shrinks back into the ring).
 */
export function StatusViewer({ stories, startIndex, origin, frame, onClose, onSeen }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [reply, setReply] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const elapsed = useRef(0);
  const open = useRef<Spring | null>(null);
  const dragY = useRef<Spring | null>(null);
  const closing = useRef(false);
  const story = stories[index];

  // ---- Presentation: zoom out of the ring (clip-path circle) ------------------------
  const apply = useCallback(() => {
    const root = rootRef.current;
    if (!root || !open.current || !dragY.current) return;
    const p = open.current.value;
    const y = dragY.current.value;
    const w = root.offsetWidth;
    const h = root.offsetHeight;
    const f = frame?.getBoundingClientRect();
    const cx = origin && f ? origin.left - f.left + origin.width / 2 : w / 2;
    const cy = origin && f ? origin.top - f.top + origin.height / 2 : h / 2;
    const r0 = origin ? origin.width / 2 : 0;
    const r1 = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
    const r = r0 + (r1 - r0) * Math.max(0, p);
    root.style.clipPath = p >= 0.999 && y === 0 ? "none" : `circle(${r}px at ${cx}px ${cy}px)`;
    // Dragging down shrinks the viewer towards the finger, like dismissing a photo.
    const drag = Math.max(0, y);
    const scale = 1 - Math.min(drag / h, 0.4) * 0.35;
    root.style.transform = `translate3d(0, ${drag * 0.85}px, 0) scale(${scale})`;
    root.style.borderRadius = drag > 0 ? `${Math.min(36, drag / 4)}px` : "";
    root.style.setProperty("--fade", String(Math.min(1, Math.max(0, p)) * (1 - Math.min(drag / 400, 0.6))));
  }, [origin, frame]);

  if (!open.current && typeof window !== "undefined") {
    open.current = new Spring(0, apply);
    dragY.current = new Spring(0, apply);
  }

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    dragY.current!.to(0, springs.snappy);
    open.current!.to(0, prefersReducedMotion() ? springs.smooth : springs.glass).then(onClose);
  }, [onClose]);

  useEffect(() => {
    open.current!.to(1, springs.glass);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      open.current?.stop();
      dragY.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Playback ---------------------------------------------------------------------
  const step = useCallback(
    (dir: 1 | -1) => {
      elapsed.current = 0;
      setIndex((i) => {
        const next = i + dir;
        if (next >= stories.length) {
          close();
          return i;
        }
        return Math.max(0, next);
      });
    },
    [stories.length, close],
  );

  useEffect(() => {
    onSeen(story.id);
    elapsed.current = 0;
  }, [story.id, onSeen]);

  const holding = paused || reply.length > 0;
  useEffect(() => {
    if (holding) return;
    let last = performance.now();
    let frameId = 0;
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${Math.min(1, elapsed.current / DURATION)})`;
      if (elapsed.current >= DURATION) {
        step(1);
        return;
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [index, holding, step]);

  // ---- Gestures: tap zones, hold to pause, swipe down to close ------------------------
  const press = useRef<{ id: number; x: number; y: number; t: number; drag: boolean; samples: { y: number; t: number }[] } | null>(null);
  const holdTimer = useRef(0);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button, input")) return;
    press.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, drag: false, samples: [{ y: e.clientY, t: e.timeStamp }] };
    holdTimer.current = window.setTimeout(() => setPaused(true), HOLD);
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    const dy = e.clientY - p.y;
    if (!p.drag && dy > 10 && dy > Math.abs(e.clientX - p.x)) {
      p.drag = true;
      setPaused(true);
      clearTimeout(holdTimer.current);
      rootRef.current!.setPointerCapture(e.pointerId);
    }
    if (p.drag) {
      dragY.current!.set(Math.max(0, dy));
      p.samples.push({ y: e.clientY, t: e.timeStamp });
      if (p.samples.length > 6) p.samples.shift();
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    press.current = null;
    clearTimeout(holdTimer.current);
    if (p.drag) {
      const a = p.samples[0];
      const b = p.samples[p.samples.length - 1];
      const vy = b.t > a.t ? ((b.y - a.y) / (b.t - a.t)) * 1000 : 0;
      if (dragY.current!.value + project(vy) > 220) {
        close();
      } else {
        dragY.current!.to(0, springs.snappy, vy);
        setPaused(false);
      }
      return;
    }
    const held = e.timeStamp - p.t > HOLD;
    setPaused(false);
    if (held) return;
    const rect = rootRef.current!.getBoundingClientRect();
    step(e.clientX - rect.left < rect.width * 0.3 ? -1 : 1);
  }

  return (
    <div
      ref={rootRef}
      className={`${styles.viewer} ${holding ? styles.paused : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${story.name}'s status`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Blurred full-bleed copy behind the sharp card (the source images are small). */}
      <img key={`bg-${story.id}`} className={styles.backdrop} src={story.image} alt="" aria-hidden />
      <div className={styles.shade} aria-hidden />

      <figure key={story.id} className={styles.card}>
        <img className={styles.media} src={story.image} alt={story.caption ?? `${story.name}'s status`} />
        {story.caption && <figcaption className={styles.caption}>{story.caption}</figcaption>}
      </figure>

      <div className={styles.chrome}>
        <StatusBar tone="white" />
        <div className={styles.bars} aria-hidden>
          {stories.map((s, i) => (
            <span key={s.id} className={styles.track}>
              <span
                ref={i === index ? fillRef : undefined}
                className={styles.fill}
                style={{ transform: `scaleX(${i < index ? 1 : 0})` }}
              />
            </span>
          ))}
        </div>
        <div className={styles.header}>
          <img className={styles.avatar} src={story.image} alt="" />
          <div className={styles.who}>
            <span className={styles.name}>{story.name}</span>
            <span className={styles.time}>{story.time ?? "Just now"}</span>
          </div>
          <button type="button" className={`${styles.round} glass-press`} aria-label={holding ? "Play" : "Pause"} onClick={() => setPaused((v) => !v)} {...glassPress}>
            {holding ? <PlayGlyph /> : <PauseGlyph />}
          </button>
          <button type="button" className={`${styles.round} glass-press`} aria-label="Close" onClick={close} {...glassPress}>
            <CloseGlyph />
          </button>
        </div>
      </div>

      <form
        className={styles.footer}
        onSubmit={(e) => {
          e.preventDefault();
          setReply("");
          (document.activeElement as HTMLElement | null)?.blur();
        }}
      >
        <label className={styles.reply}>
          <span className="visually-hidden">Reply</span>
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${story.name}…`} enterKeyHint="send" />
        </label>
        <button
          type="button"
          className={`${styles.round} ${styles.heart} ${liked[story.id] ? styles.liked : ""} glass-press`}
          aria-label={liked[story.id] ? "Unlike" : "Like"}
          aria-pressed={Boolean(liked[story.id])}
          onClick={() => setLiked((l) => ({ ...l, [story.id]: !l[story.id] }))}
          {...glassPress}
        >
          <HeartGlyph />
        </button>
      </form>
    </div>
  );
}

function CloseGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden>
      <path d="m2 2 10 10M12 2 2 12" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden>
      <path d="M4 2v10M10 2v10" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden>
      <path d="M4 2.2v9.6c0 .5.5.8.9.5l7.4-4.8a.6.6 0 0 0 0-1L4.9 1.7c-.4-.3-.9 0-.9.5Z" fill="#fff" />
    </svg>
  );
}

function HeartGlyph() {
  return (
    <svg width={22} height={20} viewBox="0 0 22 20" aria-hidden>
      <path
        d="M11 18.6S1.6 13.2 1.6 6.8A4.8 4.8 0 0 1 11 4.9a4.8 4.8 0 0 1 9.4 1.9c0 6.4-9.4 11.8-9.4 11.8Z"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}
