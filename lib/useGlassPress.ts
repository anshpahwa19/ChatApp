"use client";

// Press feedback for interactive Liquid Glass (`.glassEffect(.regular.interactive())`):
// the element swells while touched, a highlight blooms from the contact point, and it
// springs back on release. Pair with the global `.glass-press` class.

function setPoint(el: HTMLElement, e: React.PointerEvent) {
  const r = el.getBoundingClientRect();
  el.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
  el.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
}

export const glassPress = {
  onPointerDown(e: React.PointerEvent<HTMLElement>) {
    if (e.button !== 0) return;
    setPoint(e.currentTarget, e);
    e.currentTarget.setAttribute("data-pressed", "");
  },
  onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (e.currentTarget.hasAttribute("data-pressed")) setPoint(e.currentTarget, e);
  },
  onPointerUp(e: React.PointerEvent<HTMLElement>) {
    e.currentTarget.removeAttribute("data-pressed");
  },
  onPointerLeave(e: React.PointerEvent<HTMLElement>) {
    e.currentTarget.removeAttribute("data-pressed");
  },
  onPointerCancel(e: React.PointerEvent<HTMLElement>) {
    e.currentTarget.removeAttribute("data-pressed");
  },
};
