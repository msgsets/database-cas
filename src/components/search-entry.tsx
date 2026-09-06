"use client";

import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { DEFAULT_LIBRARY_SEARCH } from "@/lib/clip-types";

export function SearchEntry() {
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
    <form onSubmit={go} className="lift rounded-2xl bg-surface px-5 py-4 shadow-card sm:px-6">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-subtle" />
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="查找"
          aria-label="查找"
          className="h-11 w-full bg-transparent pl-8 text-body text-fg outline-none placeholder:text-subtle"
        />
      </div>
    </form>
  );
}
