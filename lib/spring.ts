// iOS-style spring physics.
//
// Springs are described the way SwiftUI describes them: `response` is the period of the
// undamped oscillation in seconds (how quickly the value gets there) and `damping` is the
// damping fraction (1 = critically damped, no overshoot; < 1 = bounce). These map onto a
// mass-spring-damper with mass 1:
//   stiffness = (2π / response)²      damping coefficient = 4π · dampingFraction / response
//
// A `Spring` keeps its velocity, so retargeting it mid-flight (an interrupted gesture, a
// second tap) carries momentum into the new animation exactly like UIKit/SwiftUI springs,
// instead of restarting from rest the way CSS transitions do.

export type SpringConfig = {
  /** Seconds. Smaller is faster. */
  response: number;
  /** Damping fraction: 1 is critically damped, lower values overshoot. */
  damping: number;
};

/** The named springs SwiftUI uses (`.smooth`, `.snappy`, `.bouncy`) plus the ones UIKit uses for system chrome. */
export const springs = {
  /** SwiftUI `.smooth`: no bounce. */
  smooth: { response: 0.5, damping: 1 },
  /** SwiftUI `.snappy`: quick with a hint of bounce. */
  snappy: { response: 0.5, damping: 0.85 },
  /** SwiftUI `.bouncy`. */
  bouncy: { response: 0.5, damping: 0.7 },
  /** Navigation push/pop (UINavigationController uses a critically damped spring). */
  navigation: { response: 0.42, damping: 1 },
  /** Sheet presentation: a soft rise that settles with a little give. */
  sheet: { response: 0.42, damping: 0.88 },
  /** Finger-tracking: fast enough to feel attached to the touch. */
  interactive: { response: 0.15, damping: 0.86 },
  /** Liquid Glass morphs and the tab bar lens. */
  glass: { response: 0.38, damping: 0.72 },
  /** The software keyboard. */
  keyboard: { response: 0.36, damping: 1 },
} satisfies Record<string, SpringConfig>;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function coefficients({ response, damping }: SpringConfig) {
  const k = (2 * Math.PI / Math.max(response, 0.01)) ** 2;
  const c = (4 * Math.PI * damping) / Math.max(response, 0.01);
  return { k, c };
}

/** Distance a flick travels before stopping, using UIScrollView's normal deceleration rate. */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** iOS rubber-banding: resistance that grows the further a value is pulled past its limit. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  const sign = Math.sign(overshoot);
  const x = Math.abs(overshoot);
  return sign * (1 - 1 / ((x * constant) / dimension + 1)) * dimension;
}

type Listener = (value: number, velocity: number) => void;

/**
 * One animatable number driven by a spring. Call `to()` to animate; call it again at any
 * time to retarget with the current velocity preserved. `set()` jumps (used while dragging).
 */
export class Spring {
  value: number;
  velocity = 0;
  target: number;
  private config: SpringConfig = springs.smooth;
  private frame = 0;
  private last = 0;
  private resolveRest: (() => void) | null = null;
  private onRest: (() => void) | null = null;

  constructor(
    initial: number,
    private listener: Listener,
  ) {
    this.value = initial;
    this.target = initial;
  }

  get animating() {
    return this.frame !== 0;
  }

  /** Jump to a value with an optional velocity (units per second), stopping any animation. */
  set(value: number, velocity = 0) {
    this.stop();
    this.value = value;
    this.target = value;
    this.velocity = velocity;
    this.listener(value, velocity);
  }

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  /**
   * Animate to `target`. Resolves when the spring settles (or immediately under Reduce Motion).
   * `velocity` overrides the current velocity, e.g. the release speed of a gesture.
   */
  to(target: number, config: SpringConfig = springs.smooth, velocity?: number, onRest?: () => void): Promise<void> {
    this.target = target;
    this.config = config;
    if (velocity !== undefined) this.velocity = velocity;
    this.onRest = onRest ?? null;
    this.resolveRest?.();

    if (prefersReducedMotion()) {
      this.set(target);
      onRest?.();
      return Promise.resolve();
    }

    const done = new Promise<void>((resolve) => {
      this.resolveRest = resolve;
    });
    if (!this.frame) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }
    return done;
  }

  private tick = (now: number) => {
    // Clamp long frames (tab in the background) so the simulation stays stable.
    let dt = Math.min((now - this.last) / 1000, 1 / 20);
    this.last = now;
    const { k, c } = coefficients(this.config);
    // Fixed sub-steps of semi-implicit Euler keep stiff springs stable.
    const step = 1 / 600;
    while (dt > 0) {
      const h = Math.min(step, dt);
      const force = -k * (this.value - this.target) - c * this.velocity;
      this.velocity += force * h;
      this.value += this.velocity * h;
      dt -= h;
    }

    const scale = Math.max(1, Math.abs(this.target));
    const settled = Math.abs(this.value - this.target) < 0.0005 * scale && Math.abs(this.velocity) < 0.01 * scale;
    if (settled) {
      this.value = this.target;
      this.velocity = 0;
      this.frame = 0;
      this.listener(this.value, 0);
      const resolve = this.resolveRest;
      const onRest = this.onRest;
      this.resolveRest = null;
      this.onRest = null;
      onRest?.();
      resolve?.();
      return;
    }
    this.listener(this.value, this.velocity);
    this.frame = requestAnimationFrame(this.tick);
  };
}

/**
 * Sample a spring from 0 to 1 as a CSS `linear()` easing plus its settle duration, so CSS
 * transitions can follow the same physics as the JS-driven animations.
 */
export function springToCss(config: SpringConfig, samples = 48): { easing: string; duration: number } {
  const { k, c } = coefficients(config);
  let x = 0;
  let v = 0;
  const h = 1 / 1000;
  const values: number[] = [0];
  let t = 0;
  let settledAt = 0;
  while (t < 3) {
    const force = -k * (x - 1) - c * v;
    v += force * h;
    x += v * h;
    t += h;
    values.push(x);
    if (Math.abs(x - 1) > 0.001 || Math.abs(v) > 0.01) settledAt = t;
  }
  const duration = Math.max(0.1, settledAt);
  const points: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const at = (i / samples) * duration;
    const value = values[Math.min(values.length - 1, Math.round(at * 1000))];
    points.push(value.toFixed(4).replace(/\.?0+$/, "") || "0");
  }
  points[points.length - 1] = "1";
  return { easing: `linear(${points.join(", ")})`, duration: Math.round(duration * 1000) };
}
