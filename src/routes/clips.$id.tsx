"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { TagEditor } from "@/components/tag-editor";
import { TypeIcon } from "@/components/type-badge";
import { Button } from "@/components/ui/button";
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
  component: ClipDetailPage,
});

function ClipDetailPage() {
  const { id } = Route.useParams();
  const clipId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);

  const clipQuery = useQuery({
    queryKey: ["clip", clipId],
    queryFn: () => getClip({ data: { id: clipId } }),
    enabled: Number.isFinite(clipId),
  });

  const clip = clipQuery.data ?? null;

  useEffect(() => {
    if (clip) setTitle(clip.title);
    setImageBroken(false);
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
      qc.invalidateQueries({ queryKey: ["clip", clipId] });
      qc.invalidateQueries({ queryKey: ["clips"] });
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteClip({ data: { id: clipId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clips"] });
      toast.success("已从资料库移除");
      void navigate({ to: "/library", search: DEFAULT_LIBRARY_SEARCH });
    },
  });

  const image = safeHttpUrl(clip?.image_url);
  const url = safeHttpUrl(clip?.url);

  return (
    <AppShell>
      <main className="w-full min-w-0 pb-28 lg:pb-12">
        <Link
          to="/library"
          search={DEFAULT_LIBRARY_SEARCH}
          className="inline-flex h-11 items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          资料库
        </Link>

        {clipQuery.isPending ? (
          <div className="mt-8 h-80 rounded-2xl bg-fill" />
        ) : !clip ? (
          <div className="mt-8 rounded-2xl bg-surface px-6 py-16 text-center shadow-card">
            <p className="text-[17px] font-medium text-fg">这条已经不在了</p>
          </div>
        ) : (
          <article className="mt-6 space-y-6">
            {image && !imageBroken ? (
              <div className="overflow-hidden rounded-2xl bg-fill shadow-card">
                <img
                  src={image}
                  alt=""
                  className="w-full object-cover"
                  onError={() => setImageBroken(true)}
                />
              </div>
            ) : null}

            <div className="rounded-2xl bg-surface p-6 shadow-card sm:p-8">
              <p className="text-sm text-subtle">{formatDateTime(clip.created_at)}</p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => {
                  if (title.trim() && title.trim() !== clip.title) {
                    saveTitle.mutate(title.trim());
                  }
                }}
                className="mt-3 w-full bg-transparent text-3xl font-semibold tracking-tight text-fg outline-none"
              />
              {clip.site_name ? (
                <p className="mt-2 text-sm text-muted">{clip.site_name}</p>
              ) : null}

              <div className="mt-6">
                <p className="mb-2 text-xs font-medium tracking-wide text-subtle">
                  类型
                </p>
                <div className="flex flex-wrap gap-2">
                  {CLIP_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => saveType.mutate(type)}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-150",
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

              {clip.excerpt ? (
                <p className="mt-6 text-[15px] leading-relaxed text-muted">
                  {clip.excerpt}
                </p>
              ) : null}

              {clip.kind === "text" && clip.content ? (
                <div className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-fg">
                  {clip.content}
                </div>
              ) : null}

              <div className="mt-8">
                <TagEditor clip={clip} />
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-fill px-4 text-sm font-medium text-fg transition-colors hover:bg-fill-2"
                  >
                    打开原链接
                    <ArrowUpRight className="size-4" />
                  </a>
                ) : (
                  <span />
                )}
                {confirming ? (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setConfirming(false)}>
                      取消
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => remove.mutate()}
                      disabled={remove.isPending}
                    >
                      确认删除
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => setConfirming(true)}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                    删除
                  </Button>
                )}
              </div>
            </div>
          </article>
        )}
      </main>
    </AppShell>
  );
}
