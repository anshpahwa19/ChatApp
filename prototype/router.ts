"use client";

// Hash-routing stand-in for lib/router.ts, used by the single-file prototype build
// (the published artifact has no server routes). Routes: "" for the list, "#chat-<id>".

import { useCallback, useSyncExternalStore } from "react";
import type { AppRoute } from "../lib/router";

function read(): string | null {
  const m = /^#chat-(.+)$/.exec(window.location.hash);
  return m ? decodeURIComponent(m[1]) : null;
}

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

let pushedInApp = false;

export function useAppRoute(): AppRoute {
  const chatId = useSyncExternalStore(subscribe, read, () => null);

  const push = useCallback((id: string) => {
    pushedInApp = true;
    window.location.hash = `chat-${encodeURIComponent(id)}`;
  }, []);

  const back = useCallback(() => {
    if (pushedInApp) {
      pushedInApp = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  }, []);

  return { chatId, push, back };
}

export function chatHref(id: string) {
  return `#chat-${encodeURIComponent(id)}`;
}
