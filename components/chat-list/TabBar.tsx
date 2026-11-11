"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Spring, springs } from "@/lib/spring";
import styles from "./TabBar.module.css";

const TABS = [
  { id: "meeting", label: "Meeting", icon: "/figma/tab-meeting.svg" },
  { id: "calls", label: "Calls", icon: "/figma/tab-calls.svg" },
  { id: "community", label: "Community", icon: "/figma/tab-community.svg" },
  { id: "chats", label: "Chats", icon: "/figma/tab-chats.svg" },
  { id: "notes", label: "Notes", icon: "/figma/tab-notes.svg" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Floating glass tab bar. The selection is a Liquid Glass "lens": it springs from tab to
 * tab, stretching along its direction of travel with speed; while a finger is down it lifts
 * and swells into a clear magnifying lens that can be dragged across the bar, then drops
 * onto the nearest tab when released (iOS 26+ tab bar behaviour).
 */
export function TabBar({ initial = "chats" }: { initial?: TabId }) {
  const [active, setActive] = useState<TabId>(initial);
  const [taps, setTaps] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);
  const geometry = useRef({ start: 6, step: 66.6, width: 79 });
  const x = useRef<Spring | null>(null);
  const lift = useRef<Spring | null>(null);
  const dragging = useRef<{ id: number; x0: number; moved: boolean } | null>(null);

  const render = useCallback(() => {
    const lens = lensRef.current;
    if (!lens || !x.current || !lift.current) return;
    const l = Math.max(0, lift.current.value);
    // Speed stretches the glass along the motion and thins it, like a drop of liquid.
    const stretch = Math.min(Math.abs(x.current.velocity) / 4500, 0.2);
    const sx = 1 + 0.16 * l + stretch;
    const sy = 1 + 0.16 * l - stretch * 0.45;
    lens.style.transform = `translate3d(${x.current.value}px, 0, 0) scale(${sx}, ${sy})`;
    lens.style.setProperty("--lift", l.toFixed(3));
  }, []);

  if (!x.current && typeof window !== "undefined") {
    x.current = new Spring(0, render);
    lift.current = new Spring(0, render);
  }

  const tabX = useCallback((index: number) => geometry.current.start + index * geometry.current.step - 2, []);

  // Measure the tabs (equal width, overlapping by 8px) from layout values, not the
  // entrance-transformed rects. Figma "Selection": 79 x 50, 2px past the tab on the left
  // and 2.4px on the right.
  useLayoutEffect(() => {
    const measure = () => {
      const bar = barRef.current;
      const first = bar?.querySelector("button");
      if (!bar || !first) return;
      const w = parseFloat(getComputedStyle(first).width);
      geometry.current = { start: parseFloat(getComputedStyle(bar).paddingLeft), step: w - 8, width: w + 4.4 };
      if (lensRef.current) lensRef.current.style.width = `${w + 4.4}px`;
      const index = TABS.findIndex((t) => t.id === active);
      if (!x.current!.animating) x.current!.set(tabX(index));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // Only on mount; selection changes animate below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(id: TabId) {
    const index = TABS.findIndex((t) => t.id === id);
    x.current!.to(tabX(index), springs.glass);
    if (id !== active) {
      setActive(id);
      setTaps((t) => t + 1);
    }
  }

  function indexAt(clientX: number) {
    const bar = barRef.current!.getBoundingClientRect();
    const { start, step } = geometry.current;
    const i = Math.floor((clientX - bar.left - start + 4) / step);
    return Math.min(TABS.length - 1, Math.max(0, i));
  }

  function lensTargetFor(clientX: number) {
    const bar = barRef.current!;
    const rect = bar.getBoundingClientRect();
    const { width, start } = geometry.current;
    const min = start - 2;
    const max = bar.clientWidth - start - width + 2.4;
    return Math.min(max, Math.max(min, clientX - rect.left - width / 2));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    dragging.current = { id: e.pointerId, x0: e.clientX, moved: false };
    barRef.current!.setPointerCapture(e.pointerId);
    lift.current!.to(1, springs.glass);
    // The lens slides under the finger right away when the press lands on another tab.
    x.current!.to(lensTargetFor(e.clientX), springs.glass);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragging.current;
    if (!d || d.id !== e.pointerId) return;
    if (Math.abs(e.clientX - d.x0) > 4) d.moved = true;
    x.current!.to(lensTargetFor(e.clientX), springs.interactive);
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = dragging.current;
    if (!d || d.id !== e.pointerId) return;
    dragging.current = null;
    lift.current!.to(0, springs.glass);
    select(TABS[indexAt(e.clientX)].id);
  }

  // A cancelled press (scroll, system gesture) drops the lens back where it was.
  function onPointerCancel() {
    dragging.current = null;
    lift.current!.to(0, springs.glass);
    x.current!.to(tabX(TABS.findIndex((t) => t.id === active)), springs.glass);
  }

  useEffect(() => () => {
    x.current?.stop();
    lift.current?.stop();
  }, []);

  return (
    <nav className={styles.wrap} aria-label="Main">
      <div
        ref={barRef}
        className={`${styles.bar} liquid-glass`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <span ref={lensRef} className={styles.selection} aria-hidden />
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={styles.tab}
            aria-current={active === tab.id ? "page" : undefined}
            // Pointer input is handled by the bar (so the lens can be dragged); this covers the keyboard.
            onClick={(e) => {
              if (e.detail === 0) select(tab.id);
            }}
          >
            <img
              // Re-keying the active icon replays its bounce on every selection.
              key={active === tab.id ? `on-${taps}` : "off"}
              className={`${styles.icon} ${active === tab.id && taps > 0 ? styles.bounce : ""}`}
              src={tab.icon}
              width={24}
              height={24}
              alt=""
            />
            <span className={styles.label}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
