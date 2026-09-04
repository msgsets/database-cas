"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { ClipCard } from "@/components/clip-card";
import { FilterBar } from "@/components/filter-bar";
import { listClips } from "@/lib/clips-api";
import {
  parseLibrarySearch,
  type LibrarySearch,
} from "@/lib/clip-types";

export const Route = createFileRoute("/library")({
  validateSearch: (raw: Record<string, unknown>) => parseLibrarySearch(raw),
  component: LibraryPage,
});

function LibraryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/library" });

  const onChange = useCallback(
    (patch: Partial<LibrarySearch>) => {
      void navigate({
        search: (prev) => ({ ...prev, ...patch }),
      });
    },
    [navigate],
  );

  const clipsQuery = useQuery({
    queryKey: ["clips", "library", search],
    queryFn: () =>
      listClips({
        data: {
          q: search.q,
          time: search.time,
          type: search.type,
          tag: search.tag,
        },
      }),
  });

  const total = clipsQuery.data?.total ?? 0;
  const items = clipsQuery.data?.items ?? [];

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8 pb-28 sm:px-6 sm:py-12 lg:pb-12">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-fg">资料库</h1>
          <p className="mt-1 text-sm text-muted">
            {clipsQuery.isPending ? "…" : `${total} 条`}
            {search.q ? ` · “${search.q}”` : ""}
          </p>
        </header>

        <div className="mb-8 rounded-2xl bg-surface p-5 shadow-card sm:p-6">
          <FilterBar search={search} onChange={onChange} />
        </div>

        {clipsQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="h-56 rounded-2xl bg-fill" />
            <div className="h-56 rounded-2xl bg-fill" />
            <div className="h-56 rounded-2xl bg-fill" />
          </div>
        ) : items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-surface px-6 py-16 text-center shadow-card">
            <p className="text-sm text-muted">没有匹配的内容</p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
