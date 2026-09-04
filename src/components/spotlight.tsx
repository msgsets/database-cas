"use client";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { listClips } from "@/lib/clips-api";
import { DEFAULT_LIBRARY_SEARCH } from "@/lib/clip-types";
import { cn } from "@/lib/utils";
import { TypeBadge } from "@/components/type-badge";

const EVENT = "folio:spotlight";

export function openSpotlight() {
  window.dispatchEvent(new Event(EVENT));
}

export function Spotlight() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

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
    if (!open) setQ("");
  }, [open]);

  const clipsQuery = useQuery({
    queryKey: ["clips", "spotlight", q],
    queryFn: () => listClips({ data: { q, limit: 8 } }),
    enabled: open,
  });

  const items = clipsQuery.data?.items ?? [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[14vh]">
      <button
        type="button"
        className="absolute inset-0 bg-fg/30"
        aria-label="关闭查找"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-surface shadow-float">
        <div className="flex items-center gap-3 border-b border-border/70 px-4">
          <Search className="size-4 text-subtle" />
          <input
            autoFocus
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="查找资料库"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-subtle"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setOpen(false);
                void navigate({
                  to: "/library",
                  search: { ...DEFAULT_LIBRARY_SEARCH, q: q.trim() },
                });
              }
            }}
          />
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {items.map((clip) => (
            <li key={clip.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void navigate({
                    to: "/clips/$id",
                    params: { id: String(clip.id) },
                  });
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                  "transition-colors duration-150 hover:bg-fill",
                )}
              >
                <TypeBadge type={clip.type} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                  {clip.title}
                </span>
              </button>
            </li>
          ))}
          {open && !clipsQuery.isPending && items.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted">
              没有匹配的内容
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
