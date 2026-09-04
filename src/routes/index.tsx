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
      <main className="mx-auto max-w-3xl px-4 py-10 pb-28 sm:px-6 sm:py-16 lg:pb-16">
        <header className="rise-in mb-10 sm:mb-14">
          <p className="text-sm font-medium text-muted">Folio</p>
          <h1 className="mt-3 max-w-xl text-[40px] leading-[1.08] font-semibold tracking-tight text-fg sm:text-[56px]">
            把看到的，留下来。
          </h1>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted">
            粘贴一段文字或一个链接，自动解析收入资料库。随时查找，右侧随时记。
          </p>
        </header>

        <div className="space-y-5">
          <CaptureCard />
          <SearchEntry />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rise-in rise-in-4 flex w-full items-start gap-4 rounded-2xl bg-surface p-6 text-left shadow-card transition-[box-shadow,transform] duration-200 hover:shadow-card-hover active:scale-[0.99] sm:p-8 lg:hidden"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-fill">
              <StickyNote className="size-5 text-fg" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-sm font-medium text-primary">03</span>
              <span className="mt-1 block text-2xl font-semibold tracking-tight text-fg">
                随手记
              </span>
              <span className="mt-1.5 block text-[15px] leading-relaxed text-muted">
                写下一句就好，悬浮在右边，随时打开。
              </span>
            </span>
          </button>
        </div>

        <section className="rise-in rise-in-4 mt-14">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-fg">最近收入</h2>
            <Link
              to="/library"
              search={DEFAULT_LIBRARY_SEARCH}
              className="text-sm font-medium text-primary"
            >
              查看资料库
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
            <p className="rounded-2xl bg-surface px-5 py-10 text-center text-sm text-muted shadow-card">
              资料库还是空的。从上面收入第一条。
            </p>
          )}
        </section>
      </main>
    </AppShell>
  );
}
