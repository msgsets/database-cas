"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ClipViewer } from "@/components/media-viewer";
import { TagEditor } from "@/components/tag-editor";
import { TypeIcon } from "@/components/type-badge";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/apple-motion";
import { deleteClip, getClip, updateClip } from "@/lib/clips-api";
import {
  CLIP_TYPES,
  CLIP_TYPE_LABEL,
  DEFAULT_LIBRARY_SEARCH,
  type ClipType,
} from "@/lib/clip-types";
import { formatDateTime } from "@/lib/format";
import { cn, safeHttpUrl } from "@/lib/utils";

export const Route = createFileRoute("/clips/$id")({
  loader: ({ params }) => getClip({ data: { id: Number(params.id) } }),
  component: ClipDetailPage,
});

function ClipDetailPage() {
  const { id } = Route.useParams();
  const clipId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [confirming, setConfirming] = useState(false);

  const initial = Route.useLoaderData();
  const clipQuery = useQuery({
    queryKey: ["clip", clipId],
    queryFn: () => getClip({ data: { id: clipId } }),
    enabled: Number.isFinite(clipId),
    initialData: initial ?? undefined,
  });

  const clip = clipQuery.data ?? null;

  useEffect(() => {
    if (clip) setTitle(clip.title);
  }, [clip?.id, clip?.title]);

  const saveTitle = useMutation({
    mutationFn: (next: string) =>
      updateClip({ data: { id: clipId, title: next } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      qc.invalidateQueries({ queryKey: ["clip", clipId] });
      qc.invalidateQueries({ queryKey: ["clips"] });
    },
  });

  const saveType = useMutation({
    mutationFn: (type: ClipType) => updateClip({ data: { id: clipId, type } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      haptic(8);
      qc.invalidateQueries({ queryKey: ["clip", clipId] });
      qc.invalidateQueries({ queryKey: ["clips"] });
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteClip({ data: { id: clipId } }),
    onSuccess: () => {
      haptic(16);
      qc.invalidateQueries({ queryKey: ["clips"] });
      toast.success("已从资料库移除");
      void navigate({ to: "/library", search: DEFAULT_LIBRARY_SEARCH });
    },
  });

  const url = safeHttpUrl(clip?.url);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-3xl min-w-0">
        <Link
          to="/library"
          search={DEFAULT_LIBRARY_SEARCH}
          className="font-en inline-flex h-11 items-center gap-1 -ml-2 pr-3 text-[15px] text-primary"
        >
          <ChevronLeft className="size-5" strokeWidth={2} />
          DATABASE
        </Link>

        {clipQuery.isPending ? (
          <div className="mt-6 h-80 rounded-2xl bg-fill" />
        ) : !clip ? (
          <div className="mt-6 rounded-2xl bg-surface px-6 py-16 text-center shadow-card">
            <p className="text-title3 text-fg">这条已经不在了</p>
          </div>
        ) : (
          <article className="mt-4 space-y-5">
            <section className="rounded-2xl bg-surface px-5 py-6 shadow-card sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-footnote tracking-wide text-subtle">
                  {formatDateTime(clip.created_at)}
                </p>
                <div className="flex items-center gap-2">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-fill px-3 text-sm font-medium text-fg"
                    >
                      打开原链接
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  ) : null}
                  {confirming ? (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                        取消
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => remove.mutate()}
                        disabled={remove.isPending}
                      >
                        确认删除
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      className="h-9 px-3 text-sm font-medium text-danger"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => {
                  if (title.trim() && title.trim() !== clip.title) {
                    saveTitle.mutate(title.trim());
                  }
                }}
                className="title-1 mt-3 w-full bg-transparent text-fg outline-none"
              />
            </section>

            <section className="overflow-hidden rounded-2xl bg-surface shadow-card">
              <div className="px-5 py-4">
                <p className="mb-3 text-caption font-medium tracking-wide text-subtle">
                  类型
                </p>
                <div className="flex flex-wrap gap-2">
                  {CLIP_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => saveType.mutate(type)}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-100",
                        clip.type === type
                          ? "bg-fg text-bg"
                          : "bg-fill text-muted hover:bg-fill-2 hover:text-fg",
                      )}
                    >
                      <TypeIcon type={type} className="size-3.5" />
                      {CLIP_TYPE_LABEL[type]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-px bg-border/70" />
              <div className="px-5 py-4">
                <p className="mb-3 text-caption font-medium tracking-wide text-subtle">
                  标签
                </p>
                <TagEditor clip={clip} />
              </div>
            </section>

            <ClipViewer clip={clip} />
          </article>
        )}
      </main>
    </AppShell>
  );
}
