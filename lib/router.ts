"use client";

// Routing for the app shell. The navigation stack (components/nav/Navigator) only needs the
// open chat id and push/back, so this is the one place that talks to Next's router.
// The single-file prototype build swaps this module for prototype/router.ts (hash routing).

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

export type AppRoute = {
  /** The chat on top of the stack, or null for the chat list. */
  chatId: string | null;
  push: (chatId: string) => void;
  back: () => void;
};

// True once this session has pushed a chat itself, so "back" can pop the browser history
// instead of replacing it (a chat opened from a shared link has nothing to go back to).
let pushedInApp = false;

export function useAppRoute(): AppRoute {
  const pathname = usePathname();
  const router = useRouter();
  const match = /^\/chat\/([^/]+)/.exec(pathname ?? "/");
  const chatId = match ? decodeURIComponent(match[1]) : null;

  const push = useCallback(
    (id: string) => {
      pushedInApp = true;
      router.push(`/chat/${encodeURIComponent(id)}`, { scroll: false });
    },
    [router],
  );

  const back = useCallback(() => {
    if (pushedInApp) {
      pushedInApp = false;
      router.back();
    } else {
      router.replace("/", { scroll: false });
    }
  }, [router]);

  return { chatId, push, back };
}

export function chatHref(id: string) {
  return `/chat/${encodeURIComponent(id)}`;
}
