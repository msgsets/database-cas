"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureCard } from "@/components/capture-card";
import { ClipCard } from "@/components/clip-card";
import { NotesRail } from "@/components/notes-rail";
import { SearchEntry } from "@/components/search-entry";
import { listClips } from "@/lib/clips-api";
import { readRecentClips, writeRecentClips, type RecentClips } from "@/lib/home-cache";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [cached, setCached] = useState<RecentClips | undefined>();

  useEffect(() => {
    setCached(readRecentClips());
  }, []);

  const recent = useQuery({
    queryKey: ["clips", "recent"],
    queryFn: async () => {
      const data = await listClips({ data: { limit: 6 } });
      writeRecentClips(data);
      return data;
    },
    placeholderData: cached,
    staleTime: 30_000,
  });

  const items = recent.data?.items ?? cached?.items ?? [];
  const waiting = recent.isPending && items.length === 0;

  return (
    <AppShell>
      <main className="w-full min-w-0">
        <CaptureCard />

        <div className="mt-4 lg:hidden">
          <NotesRail compact />
        </div>

        <section className="mt-4 space-y-4">
          <SearchEntry />
          {waiting ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-32 rounded-2xl bg-fill" />
              <div className="h-32 rounded-2xl bg-fill" />
            </div>
          ) : items.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.slice(0, 4).map((clip) => (
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
