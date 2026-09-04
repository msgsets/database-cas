"use client";

import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { DEFAULT_LIBRARY_SEARCH } from "@/lib/clip-types";
import { Button } from "@/components/ui/button";
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
    <section className="rise-in rise-in-3 rounded-2xl bg-surface p-6 shadow-card sm:p-8">
      <p className="text-sm font-medium text-primary">02</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-fg">查找</h2>
      <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-muted">
        打开资料库，按时间、标签、类型筛选。
      </p>
      <form onSubmit={go} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="搜索标题、链接或正文"
            className="pl-10"
            aria-label="查找"
          />
        </div>
        <Button type="submit" variant="secondary">
          打开资料库
        </Button>
      </form>
      <p className="mt-3 text-xs text-subtle">也可以按 ⌘K 随时查找</p>
    </section>
  );
}
