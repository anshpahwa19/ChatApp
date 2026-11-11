"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  children: React.ReactNode;
};

/**
 * Glass bottom sheet shared by the attachment, AI assistant and summary views
 * (Figma "Attachment Options" frames). Height follows the content.
 */
export function BottomSheet({ open, onClose, label, viewKey, minHeight = 0, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [opens, setOpens] = useState(0);

  // Remount the content on every open so its entrance animation replays.
  useEffect(() => {
    if (open) setOpens((n) => n + 1);
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

  // Track the content height so switching views animates the sheet's height.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight + 2); // + 1px border top and bottom
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <div className={`${styles.backdrop} ${open ? styles.open : ""}`} onClick={onClose} aria-hidden />
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${open ? styles.open : ""}`}
        style={{ height: height === undefined ? undefined : Math.max(height, minHeight) }}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-hidden={!open}
      >
        <div ref={innerRef} className={styles.inner}>
          <div key={`${viewKey}-${opens}`} className={styles.view}>
            {children}
          </div>
          <div className={styles.homeIndicator} aria-hidden>
            <span />
          </div>
        </div>
      </div>
    </>
  );
}
