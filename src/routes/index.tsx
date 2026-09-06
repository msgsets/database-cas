"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { CaptureCard } from "@/components/capture-card";
import { ClipCard } from "@/components/clip-card";
import { NotesRail } from "@/components/notes-rail";
import { SearchEntry } from "@/components/search-entry";
import { listClips } from "@/lib/clips-api";

export const Route = createFileRoute("/")({
  loader: () => listClips({ data: { limit: 6 } }),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const recent = useQuery({
    queryKey: ["clips", "recent"],
    queryFn: () => listClips({ data: { limit: 6 } }),
    initialData: initial,
  });

  const items = recent.data?.items ?? [];

  return (
    <AppShell>
      <main className="w-full min-w-0">
        <CaptureCard />

        <div className="mt-4 lg:hidden">
          <NotesRail compact />
        </div>

        <section className="mt-4 space-y-4">
          <SearchEntry />
          {recent.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-48 rounded-2xl bg-fill" />
              <div className="h-48 rounded-2xl bg-fill" />
            </div>
          ) : items.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.slice(0, 4).map((clip) => (
                <ClipCard key={clip.id} clip={clip} />
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
