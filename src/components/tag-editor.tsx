"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { addClipTag, listTags, removeClipTag } from "@/lib/clips-api";
import type { Clip } from "@/lib/clip-types";
import { cn } from "@/lib/utils";

export function TagEditor({ clip }: { clip: Clip }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const tagsQuery = useQuery({ queryKey: ["tags"], queryFn: () => listTags() });
  const assigned = new Set(clip.tags.map((tag) => tag.id));

  const add = useMutation({
    mutationFn: (value: string) =>
      addClipTag({ data: { clipId: clip.id, name: value } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setName("");
      qc.invalidateQueries({ queryKey: ["clips"] });
      qc.invalidateQueries({ queryKey: ["clip", clip.id] });
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const remove = useMutation({
    mutationFn: (tagId: number) =>
      removeClipTag({ data: { clipId: clip.id, tagId } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      qc.invalidateQueries({ queryKey: ["clips"] });
      qc.invalidateQueries({ queryKey: ["clip", clip.id] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = name.trim();
    if (!next) return;
    add.mutate(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(tagsQuery.data ?? clip.tags).map((tag) => {
          const isOn = assigned.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() =>
                isOn ? remove.mutate(tag.id) : add.mutate(tag.name)
              }
              className={cn(
                "inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium transition-colors duration-100",
                isOn
                  ? "bg-fg text-bg"
                  : "bg-fill text-muted hover:bg-fill-2 hover:text-fg",
              )}
            >
              {tag.name}
              {isOn ? <X className="size-3.5" /> : null}
            </button>
          );
        })}
      </div>
      <form onSubmit={onSubmit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="写一个新标签，回车保存"
          maxLength={20}
          className="h-11 w-full rounded-xl bg-fill px-4 text-base text-fg outline-none placeholder:text-subtle focus:bg-surface focus:shadow-[0_0_0_4px_rgb(0_113_227_/_0.18)]"
        />
      </form>
    </div>
  );
}
