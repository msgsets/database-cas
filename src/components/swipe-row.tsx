"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { Trash2 } from "lucide-react";
import { useEffect, useId, useRef, type PointerEvent, type ReactNode } from "react";
import { haptic, project, rubberband, springFlick, springUi } from "@/lib/apple-motion";

const REVEAL = { compact: 72, notes: 76 } as const;
const LOCK = 10;

type SwipeRowProps = {
  children: ReactNode;
  onDelete: () => void;
  compact?: boolean;
};

const closers = new Map<string, () => void>();

export function SwipeRow({ children, onDelete, compact = false }: SwipeRowProps) {
  const id = useId();
  const reveal = compact ? REVEAL.compact : REVEAL.notes;
  const x = useMotionValue(0);
  const origin = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef<"undecided" | "x" | "y">("undecided");
  const last = useRef<{ t: number; x: number }[]>([]);
  const width = useRef(320);
  const opened = useRef(false);
  const suppressClick = useRef(false);
  const deleting = useRef(false);
  const revealRef = useRef(reveal);
  revealRef.current = reveal;

  function velocity(): number {
    const samples = last.current;
    if (samples.length < 2) return 0;
    const a = samples[samples.length - 1];
    const b = samples[0];
    const dt = a.t - b.t;
    if (dt <= 0) return 0;
    return ((a.x - b.x) / dt) * 1000;
  }

  function close() {
    if (deleting.current) return;
    opened.current = false;
    animate(x, 0, springUi);
  }

  function open() {
    opened.current = true;
    for (const [other, fn] of closers) {
      if (other !== id) fn();
    }
    animate(x, -revealRef.current, springUi);
  }

  async function commit() {
    if (deleting.current) return;
    deleting.current = true;
    opened.current = false;
    haptic(16);
    const w = Math.max(width.current, 280);
    await animate(x, -w - 32, { ...springFlick, duration: 0.28 });
    onDelete();
  }

  useEffect(() => {
    closers.set(id, close);
    return () => {
      closers.delete(id);
    };
  });

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || deleting.current) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-swipe-ignore]")) return;
    origin.current = x.get();
    startX.current = event.clientX;
    startY.current = event.clientY;
    axis.current = "undecided";
    last.current = [{ t: performance.now(), x: event.clientX }];
    width.current = event.currentTarget.getBoundingClientRect().width || 320;
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (deleting.current) return;
    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;
    if (axis.current === "undecided") {
      if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) return;
      axis.current = Math.abs(dx) > Math.abs(dy) * 1.1 ? "x" : "y";
      if (axis.current === "x") {
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        (document.activeElement as HTMLElement | null)?.blur?.();
        haptic(8);
      }
    }
    if (axis.current !== "x") return;
    let next = origin.current + dx;
    if (next > 0) next = rubberband(next, width.current);
    else if (next < -width.current) {
      next = -width.current - rubberband(-width.current - next, width.current);
    }
    x.set(next);
    const now = performance.now();
    last.current.push({ t: now, x: event.clientX });
    last.current = last.current.filter((sample) => now - sample.t < 80);
  }

  function settle(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (axis.current !== "x") {
      axis.current = "undecided";
      return;
    }
    axis.current = "undecided";
    const v = velocity();
    const current = x.get();
    const projected = current + project(v);
    const snap = revealRef.current;
    if (projected < -width.current * 0.42 || v < -1100) {
      void commit();
      return;
    }
    if (v < -180 || projected < -snap * 0.45) open();
    else close();
  }

  return (
    <div className="relative">
      <div
        className={
          compact
            ? "absolute inset-y-0 right-0 z-0 flex w-[72px] items-stretch"
            : "absolute inset-y-0 right-0 z-0 flex items-center"
        }
      >
        {compact ? (
          <button
            type="button"
            data-swipe-ignore
            onClick={() => void commit()}
            className="flex h-full w-full items-center justify-center rounded-2xl bg-danger text-[13px] font-medium text-white active:opacity-90"
            aria-label="删除"
          >
            删除
          </button>
        ) : (
          <button
            type="button"
            data-swipe-ignore
            onClick={() => void commit()}
            className="flex w-[76px] flex-col items-center justify-center gap-1 active:scale-95"
            aria-label="删除"
          >
            <span className="flex size-[54px] items-center justify-center rounded-full bg-danger text-white">
              <Trash2 className="size-5" strokeWidth={1.8} />
            </span>
            <span className="text-[11px] font-medium leading-none text-fg">删除</span>
          </button>
        )}
      </div>
      <motion.div
        style={{ x }}
        className="relative z-10 touch-pan-y will-change-transform"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={settle}
        onPointerCancel={settle}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
            return;
          }
          if (opened.current || x.get() < -12) {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
