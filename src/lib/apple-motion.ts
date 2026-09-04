import { useEffect, useState } from "react";

/** Critically damped UI spring — menus, chrome, spotlight. */
export const springUi = { type: "spring" as const, bounce: 0, duration: 0.35 };

/** Slightly snappier settle for small chrome. */
export const springQuick = { type: "spring" as const, bounce: 0, duration: 0.28 };

/** Under-damped — only after a flick / drag release. */
export const springFlick = { type: "spring" as const, bounce: 0.2, duration: 0.35 };

export const springSheet = { type: "spring" as const, bounce: 0.18, duration: 0.32 };

/** Apple Designing Fluid Interfaces projection (px/s). */
export function project(velocity: number, decelerationRate = 0.998) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function haptic(ms = 10) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
