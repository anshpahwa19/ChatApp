"use client";

import { useEffect, useState } from "react";

// Set once the user has moved between screens (tapped a link or used back/forward).
let navigated = false;

/**
 * Screen entrance animations play only for the first screen of a page load. Screens
 * reached by opening a chat or going back to the list appear instantly.
 * Returns true when the current screen should skip its entrance animation.
 */
export function useInstantEntrance(): boolean {
  const [instant] = useState(() => navigated);

  useEffect(() => {
    const mark = () => {
      navigated = true;
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("a[href]")) mark();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", mark);
    window.addEventListener("hashchange", mark);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", mark);
      window.removeEventListener("hashchange", mark);
    };
  }, []);

  return instant;
}
