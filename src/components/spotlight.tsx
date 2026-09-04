"use client";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { listClips } from "@/lib/clips-api";
import { DEFAULT_LIBRARY_SEARCH } from "@/lib/clip-types";
import { springQuick, springUi, usePrefersReducedMotion } from "@/lib/apple-motion";
import { cn } from "@/lib/utils";
import { TypeBadge } from "@/components/type-badge";

const EVENT = "folio:spotlight";

export function openSpotlight() {
  window.dispatchEvent(new Event(EVENT));
}

export function Spotlight() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const clipsQuery = useQuery({
    queryKey: ["clips", "spotlight", q],
    queryFn: () => listClips({ data: { q, limit: 8 } }),
    enabled: open,
  });

  const items = clipsQuery.data?.items ?? [];

  useEffect(() => {
    setActive(0);
  }, [q]);

  function goLibrary() {
    setOpen(false);
    void navigate({
      to: "/library",
      search: { ...DEFAULT_LIBRARY_SEARCH, q: q.trim() },
    });
  }

  function goClip(id: number) {
    setOpen(false);
    void navigate({ to: "/clips/$id", params: { id: String(id) } });
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]">
          <motion.button
            type="button"
            aria-label="关闭查找"
            className="absolute inset-0 bg-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0.15 } : springQuick}
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="查找资料库"
            className="material relative w-full max-w-xl overflow-hidden rounded-2xl shadow-float"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10, filter: "blur(8px)" }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 6, filter: "blur(4px)" }}
            transition={reduced ? { duration: 0.16 } : springUi}
          >
            <div className="flex items-center gap-3 px-4 hairline-b">
              <Search className="size-4 text-subtle" strokeWidth={1.75} />
              <input
                autoFocus
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="查找资料库"
                className="h-14 min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-subtle"
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActive((i) => Math.max(i - 1, 0));
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    const clip = items[active];
                    if (clip) goClip(clip.id);
                    else goLibrary();
                  }
                }}
              />
              <kbd className="hidden rounded-md bg-fill px-1.5 py-0.5 text-caption tracking-wide text-subtle sm:inline">
                esc
              </kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {items.map((clip, index) => (
                <li key={clip.id}>
                  <button
                    type="button"
                    onPointerDown={() => setActive(index)}
                    onClick={() => goClip(clip.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                      index === active ? "bg-fill" : "hover:bg-fill/70",
                    )}
                  >
                    <TypeBadge type={clip.type} />
                    <span className="min-w-0 flex-1 truncate text-subhead font-medium text-fg">
                      {clip.title}
                    </span>
                  </button>
                </li>
              ))}
              {open && !clipsQuery.isPending && items.length === 0 ? (
                <li className="px-3 py-10 text-center text-subhead text-muted">
                  没有匹配的内容
                </li>
              ) : null}
            </ul>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
