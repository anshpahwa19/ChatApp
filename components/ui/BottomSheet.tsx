"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { prefersReducedMotion, project, rubberband, Spring, springs } from "@/lib/spring";
import styles from "./BottomSheet.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the current view. */
  label: string;
  /** Changing this swaps the content with an entrance animation and a smooth height change. */
  viewKey: string;
  /** Height of the matching Figma frame; the sheet grows past it only if the content needs more room. */
  minHeight?: number;
  /** The screen behind the sheet: it is scaled back and rounded at the large detent. */
  backgroundRef?: React.RefObject<HTMLElement | null>;
  /** The control that presented the sheet. If given, the sheet morphs out of it (and back). */
  sourceRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
};

/** Floating insets of the medium detent (Figma "Attachment Options" at x=6, 5px from the bottom). */
const INSET = { left: 6, right: 5, bottom: 5 };
/** Distance from the top of the screen to the large detent (below the status bar). */
const LARGE_TOP = 58;
/** Dim behind the sheet (Figma "Rectangle 161124780": black at 30%). */
const DIM = 0.3;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * iOS sheet. Two detents: the content-height floating sheet from the Figma frames and a
 * large one that fills the screen and pushes the content behind it back. One spring (`h`,
 * the visible height) drives presentation, dragging and detents, so a sheet can be grabbed
 * mid-animation and flicked; a second (`m`) morphs it out of its source button.
 */
export function BottomSheet({ open, onClose, label, viewKey, minHeight = 0, backgroundRef, sourceRef, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const tintRef = useRef<HTMLDivElement>(null);
  const [opens, setOpens] = useState(0);
  const [shown, setShown] = useState(false);
  const medium = useRef(minHeight);
  const detent = useRef<"medium" | "large">("medium");
  const dragDismiss = useRef(false);
  const h = useRef<Spring | null>(null);
  const m = useRef<Spring | null>(null);
  const source = useRef<DOMRect | null>(null);

  const deviceHeight = () => rootRef.current?.parentElement?.clientHeight ?? 856;
  const largeHeight = () => deviceHeight() - LARGE_TOP;

  const apply = useCallback(() => {
    const sheet = sheetRef.current;
    const root = rootRef.current;
    if (!sheet || !root || !h.current || !m.current) return;
    const H = h.current.value;
    const M = m.current.value;
    const large = largeHeight();
    const med = medium.current;
    // 0 at the medium detent, 1 at the large one.
    const L = clamp01((H - med) / Math.max(1, large - med));
    const left = INSET.left * (1 - L);
    const right = INSET.right * (1 - L);
    const bottom = INSET.bottom * (1 - L);

    sheet.style.left = `${left}px`;
    sheet.style.right = `${right}px`;
    sheet.style.bottom = `${bottom}px`;
    sheet.style.height = `${large}px`;
    sheet.style.transform = `translate3d(0, ${large - Math.max(H, 0)}px, 0)`;
    sheet.style.borderTopLeftRadius = sheet.style.borderTopRightRadius = `${lerp(32, 38, L)}px`;
    root.style.setProperty("--large", L.toFixed(3));

    // Liquid Glass morph from the source control: clip the sheet down to the control's shape.
    const src = source.current;
    if (src && M < 1) {
      const deviceRect = root.parentElement!.getBoundingClientRect();
      const width = deviceRect.width - left - right;
      const sx = src.left - deviceRect.left - left;
      const sy = src.top - deviceRect.top - (deviceRect.height - bottom - H);
      const t = M;
      const top = lerp(sy, 0, t);
      const l = lerp(sx, 0, t);
      const r = lerp(width - (sx + src.width), 0, t);
      const b = lerp(large - (sy + src.height), large - H, t);
      const radius = lerp(src.width / 2, 32, t);
      sheet.style.clipPath = `inset(${top}px ${r}px ${b}px ${l}px round ${radius}px)`;
    } else {
      sheet.style.clipPath = "";
    }
    if (tintRef.current) tintRef.current.style.opacity = src ? String((1 - M) ** 1.5) : "0";
    sheet.style.setProperty("--content-in", String(src ? clamp01((M - 0.3) / 0.5) : 1));

    const presented = Math.min(M, clamp01(H / Math.max(1, med)));
    if (dimRef.current) dimRef.current.style.opacity = String(DIM * presented + 0.1 * L);

    const bg = backgroundRef?.current;
    if (bg) {
      if (L > 0.001) {
        bg.style.transform = `translate3d(0, ${12 * L}px, 0) scale(${1 - 0.07 * L})`;
        bg.style.borderRadius = `${38 * L}px`;
      } else {
        bg.style.transform = "";
        bg.style.borderRadius = "";
      }
    }
  }, [backgroundRef]);

  if (!h.current && typeof window !== "undefined") {
    h.current = new Spring(0, apply);
    m.current = new Spring(1, apply);
  }

  // Track the content height: it is the medium detent, and switching views animates to it.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => {
      const next = Math.max(el.offsetHeight + 2, minHeight); // + 1px border top and bottom
      const changed = next !== medium.current;
      medium.current = next;
      if (changed && open && detent.current === "medium" && !dragDismiss.current) {
        h.current!.to(next, springs.snappy);
      } else {
        apply();
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minHeight, open, apply]);

  // Present / dismiss.
  useEffect(() => {
    const H = h.current!;
    const M = m.current!;
    if (open) {
      setOpens((n) => n + 1);
      setShown(true);
      detent.current = "medium";
      dragDismiss.current = false;
      const src = sourceRef?.current;
      source.current = src && !prefersReducedMotion() ? src.getBoundingClientRect() : null;
      if (source.current) {
        // Grow out of the button: full height at once, revealed by the morph.
        H.set(medium.current);
        M.set(0);
        M.to(1, springs.glass);
      } else {
        M.set(1);
        H.to(medium.current, springs.sheet);
      }
      return;
    }
    if (!shown) return;
    const finish = () => setShown(false);
    if (dragDismiss.current || !source.current) {
      H.to(0, springs.sheet, undefined, finish);
    } else {
      // Shrink back into the button it came from (at the medium detent).
      detent.current = "medium";
      H.to(medium.current, springs.snappy);
      M.to(0, springs.glass, undefined, finish);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A closed sheet is unreachable by keyboard and assistive tech.
  useEffect(() => {
    sheetRef.current?.toggleAttribute("inert", !open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => () => {
    h.current?.stop();
    m.current?.stop();
    const bg = backgroundRef?.current;
    if (bg) {
      bg.style.transform = "";
      bg.style.borderRadius = "";
    }
  }, [backgroundRef]);

  // ---- Dragging between detents / to dismiss -------------------------------
  const drag = useRef<{ id: number; y0: number; x0: number; h0: number; engaged: boolean; samples: { y: number; t: number }[] } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    if (!open || e.button !== 0) return;
    drag.current = { id: e.pointerId, y0: e.clientY, x0: e.clientX, h0: h.current!.value, engaged: false, samples: [{ y: e.clientY, t: e.timeStamp }] };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dy = e.clientY - d.y0;
    if (!d.engaged) {
      if (Math.abs(e.clientX - d.x0) > 10 && Math.abs(e.clientX - d.x0) > Math.abs(dy)) {
        drag.current = null;
        return;
      }
      if (Math.abs(dy) < 6) return;
      d.engaged = true;
      sheetRef.current!.setPointerCapture(e.pointerId);
      h.current!.stop();
      m.current!.set(1);
      source.current = null; // once grabbed, it behaves as a plain sheet
    }
    const large = largeHeight();
    let next = d.h0 - dy;
    if (next > large) next = large + rubberband(next - large, deviceHeight(), 0.4);
    h.current!.set(next);
    d.samples.push({ y: e.clientY, t: e.timeStamp });
    if (d.samples.length > 6) d.samples.shift();
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.engaged) return;
    // Swallow the click that follows a drag so it doesn't press a button inside.
    window.addEventListener("click", (ev) => ev.stopPropagation(), { capture: true, once: true });
    setTimeout(() => window.dispatchEvent(new Event("click")), 0);

    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const vy = last.t > first.t ? ((last.y - first.y) / (last.t - first.t)) * 1000 : 0; // px/s, + is down
    const H = h.current!;
    const projected = H.value - project(vy);
    const med = medium.current;
    const large = largeHeight();
    // Snap to whichever resting point the flick would carry the sheet nearest to.
    const options: [number, "dismiss" | "medium" | "large"][] = [
      [0, "dismiss"],
      [med, "medium"],
      [large, "large"],
    ];
    const [, target] = options.reduce((best, o) => (Math.abs(o[0] - projected) < Math.abs(best[0] - projected) ? o : best));
    if (target === "dismiss") {
      dragDismiss.current = true;
      H.to(0, springs.sheet, -vy);
      onClose();
    } else {
      detent.current = target;
      H.to(target === "large" ? large : med, springs.sheet, -vy);
    }
  }

  return (
    <div ref={rootRef} className={styles.root} data-shown={shown || undefined}>
      <div ref={dimRef} className={styles.backdrop} onClick={onClose} aria-hidden />
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-hidden={!open}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div ref={tintRef} className={styles.tint} aria-hidden />
        <div ref={innerRef} className={styles.inner}>
          <div key={`${viewKey}-${opens}`} className={styles.view}>
            {children}
          </div>
          <div className={styles.homeIndicatorInline} aria-hidden>
            <span />
          </div>
        </div>
      </div>
      <div className={styles.homeIndicator} aria-hidden>
        <span />
      </div>
    </div>
  );
}
