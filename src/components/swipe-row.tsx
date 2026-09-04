"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { project, rubberband, springFlick, springUi } from "@/lib/apple-motion";

const REVEAL = 88;
const THRESHOLD = 10;

type SwipeRowProps = {
  children: ReactNode;
  action: ReactNode;
};

export function SwipeRow({ children, action }: SwipeRowProps) {
  const x = useMotionValue(0);
  const origin = useRef(0);
  const startX = useRef(0);
  const last = useRef<{ t: number; x: number }[]>([]);
  const dragging = useRef(false);
  const width = useRef(320);

  function velocity(): number {
    const samples = last.current;
    if (samples.length < 2) return 0;
    const a = samples[samples.length - 1];
    const b = samples[0];
    const dt = a.t - b.t;
    if (dt <= 0) return 0;
    return ((a.x - b.x) / dt) * 1000;
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea")) return;
    origin.current = x.get();
    startX.current = event.clientX;
    last.current = [{ t: performance.now(), x: event.clientX }];
    dragging.current = false;
    width.current = event.currentTarget.getBoundingClientRect().width || 320;
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const dx = event.clientX - startX.current;
    if (!dragging.current) {
      if (Math.abs(dx) < THRESHOLD) return;
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    let next = origin.current + dx;
    if (next > 0) next = rubberband(next, width.current);
    else if (next < -REVEAL) {
      const extra = -REVEAL - next;
      next = -REVEAL - rubberband(extra, width.current);
    }
    x.set(next);
    const now = performance.now();
    last.current.push({ t: now, x: event.clientX });
    last.current = last.current.filter((s) => now - s.t < 80);
  }

  function settle(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!dragging.current) return;
    dragging.current = false;
    const v = velocity();
    const current = x.get();
    const projected = current + project(v);
    const open = v < -200 || projected < -REVEAL / 2;
    const target = open ? -REVEAL : 0;
    const momentum = Math.abs(v) > 180;
    animate(x, target, {
      ...(momentum ? springFlick : springUi),
      velocity: v,
    });
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex w-[88px] items-stretch">
        {action}
      </div>
      <motion.div
        style={{ x }}
        className="relative bg-inherit will-change-transform"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={settle}
        onPointerCancel={settle}
      >
        {children}
      </motion.div>
    </div>
  );
}
