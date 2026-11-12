"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Story } from "@/lib/data";
import { StatusBar } from "@/components/ui/StatusBar";
import { CheckIcon, DotsThreeIcon, HeartFillIcon, HeartIcon, PaperPlaneRightIcon, XIcon } from "@/components/ui/Icons";
import styles from "./StatusViewer.module.css";

/** How long each status stays on screen. */
const ITEM_MS = 5000;
/** A press longer than this pauses instead of skipping. */
const HOLD_MS = 180;
/** Dragging down further than this closes the viewer. */
const DISMISS_PX = 110;

type Props = {
  stories: Story[];
  startId: string;
  /** Centre of the tapped avatar inside the device, used for the zoom in and out. */
  origin: { x: number; y: number };
  onSeen: (id: string) => void;
  onClose: () => void;
};

/** Full-screen "View Status" viewer opened from the stories row. */
export function StatusViewer({ stories, startId, origin, onSeen, onClose }: Props) {
  const people = stories.filter((s) => s.items?.length);
  const [person, setPerson] = useState(() => Math.max(0, people.findIndex((s) => s.id === startId)));
  const [item, setItem] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [held, setHeld] = useState(false);
  const [typing, setTyping] = useState(false);
  const [reply, setReply] = useState("");
  const [toast, setToast] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState(0);
  const [restart, setRestart] = useState(0);
  const press = useRef<{ x: number; y: number; t: number; timer?: number; moved: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const story = people[person];
  const items = story.items ?? [];
  const current = items[item];
  const paused = held || typing || toast || closing || drag > 0;

  useEffect(() => {
    onSeen(story.id);
  }, [story.id, onSeen]);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 260);
  }, [onClose]);

  const next = useCallback(() => {
    setDirection(1);
    if (item < items.length - 1) {
      setItem(item + 1);
    } else if (person < people.length - 1) {
      setPerson(person + 1);
      setItem(0);
    } else {
      close();
    }
  }, [item, items.length, person, people.length, close]);

  const prev = useCallback(() => {
    setDirection(-1);
    if (item > 0) {
      setItem(item - 1);
    } else if (person > 0) {
      setPerson(person - 1);
      setItem(0);
    } else {
      setRestart((n) => n + 1); // first status: start it over
    }
  }, [item, person]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, next, prev]);

  // Tap left third = back, elsewhere = forward, hold = pause, drag down = close.
  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button, input, form")) return;
    press.current = {
      x: e.clientX,
      y: e.clientY,
      t: Date.now(),
      moved: false,
      timer: window.setTimeout(() => setHeld(true), HOLD_MS),
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = press.current;
    if (!p) return;
    const dy = e.clientY - p.y;
    if (Math.abs(dy) > 8 || Math.abs(e.clientX - p.x) > 8) p.moved = true;
    setDrag(Math.max(0, dy));
  }

  function onPointerUp(e: React.PointerEvent) {
    const p = press.current;
    press.current = null;
    if (!p) return;
    window.clearTimeout(p.timer);
    const wasHold = Date.now() - p.t >= HOLD_MS;
    setHeld(false);
    if (drag > DISMISS_PX) {
      close();
      return;
    }
    setDrag(0);
    if (p.moved || wasHold) return;
    const box = rootRef.current!.getBoundingClientRect();
    if (e.clientX - box.left < box.width / 3) prev();
    else next();
  }

  function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setReply("");
    (document.activeElement as HTMLElement | null)?.blur();
    setTyping(false);
    setToast(true);
    window.setTimeout(() => setToast(false), 1600);
  }

  const isLiked = current ? liked.has(current.id) : false;

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${closing ? styles.closing : ""}`}
      style={
        {
          "--ox": `${origin.x}px`,
          "--oy": `${origin.y}px`,
          "--drag": `${drag}px`,
          "--dragScale": `${1 - Math.min(drag, 300) / 1500}`,
          "--fade": `${1 - Math.min(drag, 300) / 600}`,
        } as React.CSSProperties
      }
      role="dialog"
      aria-modal="true"
      aria-label={`${story.name}'s status`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className={`${styles.sheet} ${drag ? styles.dragging : ""}`}>
        {/* Status content; re-keyed per person so switching people slides in. */}
        <div
          key={`${story.id}-${item}`}
          className={`${styles.stage} ${direction === 1 ? styles.fromRight : styles.fromLeft}`}
        >
          {current.kind === "photo" ? (
            <>
              <img className={styles.backdrop} src={current.image} alt="" aria-hidden draggable={false} />
              <figure className={styles.photoCard}>
                <img src={current.image} alt={current.caption ?? `${story.name}'s photo`} draggable={false} />
                {current.caption && <figcaption>{current.caption}</figcaption>}
              </figure>
            </>
          ) : (
            <div className={`${styles.textStatus} ${current.tone === "plum" ? styles.plum : styles.brand}`}>
              <p>{current.text}</p>
            </div>
          )}
        </div>

        <div className={styles.topScrim} aria-hidden />
        <div className={styles.top}>
          <StatusBar tone="white" />
          <div className={styles.progress} role="progressbar" aria-label="Status progress" aria-valuemin={1} aria-valuemax={items.length} aria-valuenow={item + 1}>
            {items.map((it, i) => (
              <span key={it.id} className={styles.track}>
                <span
                  key={i === item ? `${story.id}-${i}-${restart}` : undefined}
                  className={`${styles.fill} ${i < item ? styles.done : ""} ${i === item ? styles.running : ""}`}
                  style={i === item ? { animationDuration: `${ITEM_MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
                  onAnimationEnd={i === item ? next : undefined}
                />
              </span>
            ))}
          </div>
          <div className={styles.header}>
            <img className={styles.avatar} src={story.image} alt="" draggable={false} />
            <div className={styles.who}>
              <span className={styles.name}>{story.name}</span>
              <span className={styles.time}>{current.time}</span>
            </div>
            <button type="button" className={`${styles.iconButton} liquid-glass-dark`} aria-label="More options">
              <DotsThreeIcon size={20} />
            </button>
            <button type="button" className={`${styles.iconButton} liquid-glass-dark`} aria-label="Close status" onClick={close}>
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {toast && (
          <div className={`${styles.toast} liquid-glass-dark`} role="status">
            <CheckIcon size={16} />
            Reply sent
          </div>
        )}

        <form className={styles.reply} onSubmit={sendReply}>
          <label className={`${styles.replyField} liquid-glass-dark`}>
            <span className="visually-hidden">Reply</span>
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
              placeholder={`Reply to ${story.name}…`}
              enterKeyHint="send"
            />
          </label>
          {reply.trim() ? (
            <button type="submit" className={styles.send} aria-label="Send reply">
              <PaperPlaneRightIcon size={20} />
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.iconButton} ${styles.like} liquid-glass-dark ${isLiked ? styles.liked : ""}`}
              aria-label={isLiked ? "Unlike status" : "Like status"}
              aria-pressed={isLiked}
              onClick={() =>
                setLiked((prev) => {
                  const nextSet = new Set(prev);
                  if (nextSet.has(current.id)) nextSet.delete(current.id);
                  else nextSet.add(current.id);
                  return nextSet;
                })
              }
            >
              {isLiked ? <HeartFillIcon size={22} /> : <HeartIcon size={22} />}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
