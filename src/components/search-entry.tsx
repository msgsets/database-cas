"use client";

import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { DEFAULT_LIBRARY_SEARCH } from "@/lib/clip-types";
import { cn } from "@/lib/utils";

export function SearchEntry({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function go(event?: FormEvent) {
    event?.preventDefault();
    void navigate({
      to: "/library",
      search: { ...DEFAULT_LIBRARY_SEARCH, q: q.trim() },
    });
  }

  return (
    <form
      onSubmit={go}
      className={cn(
        "lift flex h-11 items-center rounded-2xl bg-surface px-4 shadow-card",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-subtle" />
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="查找"
        aria-label="查找"
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-body text-fg outline-none placeholder:text-subtle"
      />
    </form>
  );
}
