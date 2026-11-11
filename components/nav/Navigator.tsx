"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { chatHref, useAppRoute } from "@/lib/router";
import { getConversation } from "@/lib/data";
import { project, prefersReducedMotion, rubberband, Spring, springs } from "@/lib/spring";
import { ChatList } from "@/components/chat-list/ChatList";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import styles from "./Navigator.module.css";

type Nav = {
  open: (chatId: string) => void;
  back: () => void;
  hrefFor: (chatId: string) => string;
};

const NavContext = createContext<Nav>({ open: () => {}, back: () => {}, hrefFor: chatHref });

export function useNav() {
  return useContext(NavContext);
}

/** How far the outgoing screen travels left, as a fraction of the width (UIKit uses ~30%). */
const PARALLAX = 0.3;
/** Dimming over the outgoing screen at full push. */
const DIM = 0.1;
/** Touches that start this close to the left edge begin the interactive pop. */
const EDGE = 24;

/**
 * UINavigationController-style stack: the chat list underneath and, when a chat is open,
 * the chat pushed on top. Push slides the chat in from the right while the list shifts
 * left under a dim; pop reverses it. Both are one critically damped spring that a back
 * swipe can grab mid-flight, follow with the finger, and release with its velocity.
 */
export function Navigator() {
  const { chatId, push, back } = useAppRoute();
  const [top, setTop] = useState<string | null>(chatId);
  const deviceRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const popping = useRef(false);
  const progress = useRef<Spring | null>(null);

  // 0 = list only, 1 = chat fully pushed. Written straight to the DOM every frame.
  const apply = useCallback((p: number) => {
    const width = deviceRef.current?.offsetWidth ?? 393;
    const reduce = prefersReducedMotion();
    const list = listRef.current;
    const chat = chatRef.current;
    if (list) list.style.transform = reduce ? "" : `translate3d(${-PARALLAX * width * Math.min(p, 1)}px, 0, 0)`;
    if (dimRef.current) dimRef.current.style.opacity = String(DIM * Math.min(Math.max(p, 0), 1));
    if (chat) {
      if (reduce) {
        chat.style.opacity = String(p);
        chat.style.transform = "";
      } else {
        chat.style.opacity = "";
        chat.style.transform = `translate3d(${(1 - p) * width}px, 0, 0)`;
      }
      chat.style.setProperty("--edge-shadow", String(Math.min(Math.max(p, 0), 1)));
    }
  }, []);

  if (!progress.current && typeof window !== "undefined") {
    progress.current = new Spring(chatId ? 1 : 0, (v) => apply(v));
  }

  // Route changes (taps, the back button, browser history) drive the spring.
  useLayoutEffect(() => {
    const p = progress.current!;
    if (chatId) {
      popping.current = false;
      if (chatId !== top) setTop(chatId);
      return;
    }
    if (top && !popping.current) {
      popping.current = true;
      p.to(0, springs.navigation).then(() => {
        if (popping.current) {
          popping.current = false;
          setTop(null);
        }
      });
    }
  }, [chatId, top]);

  // A freshly mounted chat starts off-screen and springs in (unless it was a deep link).
  const firstRender = useRef(true);
  useLayoutEffect(() => {
    const p = progress.current!;
    if (!top) {
      apply(p.value);
      return;
    }
    if (firstRender.current && p.value === 1) {
      apply(1);
    } else if (!popping.current) {
      if (p.value >= 1) p.set(0);
      apply(p.value);
      p.to(1, springs.navigation);
    }
    firstRender.current = false;
  }, [top, apply]);

  useEffect(() => {
    firstRender.current = false;
  }, []);

  // While a chat covers the list, the list is out of reach for keyboard and assistive tech.
  useEffect(() => {
    listRef.current?.toggleAttribute("inert", top !== null && !popping.current);
  });

  // ---- Interactive pop (edge swipe) ----------------------------------------
  const drag = useRef<{
    id: number;
    x0: number;
    y0: number;
    engaged: boolean;
    samples: { x: number; t: number }[];
  } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    if (!top || e.button !== 0) return;
    const rect = chatRef.current!.getBoundingClientRect();
    const fromEdge = e.clientX - rect.left < EDGE;
    // Touch can swipe back from anywhere on the content (iOS 26+); a mouse needs the edge.
    if (!fromEdge && e.pointerType !== "touch") return;
    if ((e.target as HTMLElement).closest("input, textarea, [data-no-swipe]")) return;
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, engaged: false, samples: [{ x: e.clientX, t: e.timeStamp }] };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.engaged) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // a vertical scroll, not a swipe
        return;
      }
      if (dx < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      d.engaged = true;
      chatRef.current!.setPointerCapture(e.pointerId);
      progress.current!.stop();
      popping.current = false;
    }
    const width = deviceRef.current!.offsetWidth;
    const travel = dx < 0 ? rubberband(dx, width, 0.3) : dx;
    progress.current!.set(1 - travel / width);
    d.samples.push({ x: e.clientX, t: e.timeStamp });
    if (d.samples.length > 6) d.samples.shift();
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.engaged) return;
    const width = deviceRef.current!.offsetWidth;
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const vx = last.t > first.t ? ((last.x - first.x) / (last.t - first.t)) * 1000 : 0; // px/s
    const dx = e.clientX - d.x0;
    const p = progress.current!;
    // Like UIKit: complete if the flick would carry the screen past the midpoint.
    if (dx + project(vx) > width / 2 && vx > -200) {
      popping.current = true;
      p.to(0, springs.navigation, -vx / width).then(() => {
        if (popping.current) {
          popping.current = false;
          setTop(null);
        }
      });
      back();
    } else {
      p.to(1, springs.navigation, -vx / width);
    }
  }

  const nav: Nav = { open: push, back, hrefFor: chatHref };
  const conversation = top ? getConversation(top) : null;

  return (
    <NavContext.Provider value={nav}>
      <PhoneFrame ref={deviceRef} className={styles.device}>
        <div ref={listRef} className={styles.layer} aria-hidden={top !== null ? true : undefined}>
          <ChatList />
        </div>
        <div ref={dimRef} className={styles.dim} aria-hidden />
        {conversation && (
          <div
            ref={chatRef}
            className={`${styles.layer} ${styles.pushed}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <ChatScreen key={conversation.id} conversation={conversation} />
          </div>
        )}
      </PhoneFrame>
    </NavContext.Provider>
  );
}
