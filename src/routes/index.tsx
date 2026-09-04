"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StickyNote } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaptureCard } from "@/components/capture-card";
import { ClipCard } from "@/components/clip-card";
import { SearchEntry } from "@/components/search-entry";
import { listClips } from "@/lib/clips-api";
import { DEFAULT_LIBRARY_SEARCH } from "@/lib/clip-types";
import { useNotesUi } from "@/lib/notes-ui";

export const Route = createFileRoute("/")({
  loader: () => listClips({ data: { limit: 6 } }),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const setOpen = useNotesUi((state) => state.setOpen);
  const recent = useQuery({
    queryKey: ["clips", "recent"],
    queryFn: () => listClips({ data: { limit: 6 } }),
    initialData: initial,
  });

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 sm:py-10 lg:pb-10">
        <div className="space-y-4">
          <CaptureCard />
          <SearchEntry />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rise-in rise-in-4 flex w-full items-center gap-3 rounded-2xl bg-surface px-5 py-4 text-left shadow-card transition-[box-shadow,transform] duration-200 hover:shadow-card-hover active:scale-[0.99] lg:hidden"
          >
            <StickyNote className="size-5 text-fg" strokeWidth={1.75} />
            <span className="text-[17px] font-semibold tracking-tight text-fg">
              随手记
            </span>
          </button>
        </div>

        <section className="rise-in rise-in-4 mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[15px] font-medium text-muted">最近</h2>
            <Link
              to="/library"
              search={DEFAULT_LIBRARY_SEARCH}
              className="text-sm font-medium text-primary"
            >
              资料库
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
