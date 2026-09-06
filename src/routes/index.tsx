"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureCard } from "@/components/capture-card";
import { ClipCard } from "@/components/clip-card";
import { FilterBar } from "@/components/filter-bar";
import { NotesRail } from "@/components/notes-rail";
import { listClips } from "@/lib/clips-api";
import { DEFAULT_LIBRARY_SEARCH, type LibrarySearch } from "@/lib/clip-types";
import { readRecentClips, writeRecentClips, type RecentClips } from "@/lib/home-cache";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [cached, setCached] = useState<RecentClips | undefined>();
  const [filters, setFilters] = useState<LibrarySearch>(DEFAULT_LIBRARY_SEARCH);

  useEffect(() => {
    setCached(readRecentClips());
  }, []);

  const onChange = useCallback((patch: Partial<LibrarySearch>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const isDefault =
    !filters.q && filters.time === "all" && filters.type === "all" && !filters.tag;

  const clipsQuery = useQuery({
    queryKey: ["clips", "home", filters],
    queryFn: async () => {
      const data = await listClips({
        data: {
          q: filters.q,
          time: filters.time,
          type: filters.type,
          tag: filters.tag,
          limit: isDefault ? 6 : 12,
        },
      });
      if (isDefault) writeRecentClips(data);
      return data;
    },
    placeholderData: isDefault ? cached : undefined,
    staleTime: 30_000,
  });

  const items = clipsQuery.data?.items ?? (isDefault ? cached?.items : undefined) ?? [];
  const waiting = clipsQuery.isPending && items.length === 0;

  return (
    <AppShell>
      <main className="w-full min-w-0">
        <CaptureCard />

        <div className="mt-4 lg:hidden">
          <NotesRail compact />
        </div>

        <section className="mt-4 space-y-4">
          <div className="lift rounded-2xl bg-surface p-5 shadow-card sm:p-6">
            <FilterBar search={filters} onChange={onChange} />
          </div>
          {waiting ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-32 rounded-2xl bg-fill" />
              <div className="h-32 rounded-2xl bg-fill" />
            </div>
          ) : items.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {(isDefault ? items.slice(0, 4) : items).map((clip) => (
                <ClipCard key={clip.id} clip={clip} compact />
              ))}
            </div>
          ) : (
            <p className="px-1 py-10 text-subhead text-muted">还没有内容</p>
          )}
        </section>
      </main>
    </AppShell>
  );
}
