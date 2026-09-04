"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { CaptureCard } from "@/components/capture-card";
import { ClipCard } from "@/components/clip-card";
import { NotesPanel } from "@/components/quick-notes";
import { SearchEntry } from "@/components/search-entry";
import { listClips } from "@/lib/clips-api";
import { DEFAULT_LIBRARY_SEARCH } from "@/lib/clip-types";

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

  return (
    <AppShell>
      <main className="w-full min-w-0 pb-10">
        <div className="space-y-4">
          <CaptureCard />
          <div className="lg:hidden">
            <NotesPanel compact />
          </div>
          <SearchEntry />
        </div>

        <section className="rise-in rise-in-4 mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[15px] font-medium text-muted">最近</h2>
            <Link
              to="/library"
              search={DEFAULT_LIBRARY_SEARCH}
              className="text-sm font-medium text-fg"
            >
              DATABASE
            </Link>
          </div>
          {recent.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-48 rounded-2xl bg-fill" />
              <div className="h-48 rounded-2xl bg-fill" />
            </div>
          ) : recent.data?.items.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {recent.data.items.slice(0, 4).map((clip) => (
                <ClipCard key={clip.id} clip={clip} />
              ))}
            </div>
          ) : (
            <p className="px-1 py-8 text-sm text-muted">还没有内容</p>
          )}
        </section>
      </main>
    </AppShell>
  );
}
