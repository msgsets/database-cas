"use client";

import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { DEFAULT_LIBRARY_SEARCH } from "@/lib/clip-types";
import { Input } from "@/components/ui/input";

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
    <form
      onSubmit={go}
      className="rise-in rise-in-3 rounded-2xl bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="查找"
          className="pl-10"
          aria-label="查找"
        />
      </div>
    </form>
  );
}
