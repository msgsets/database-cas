"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { TypeBadge } from "@/components/type-badge";
import { haptic } from "@/lib/apple-motion";
import { captureInput } from "@/lib/clips-api";
import type { Clip } from "@/lib/clip-types";

export function CaptureCard() {
  const qc = useQueryClient();
  const [value, setValue] = useState("");
  const [last, setLast] = useState<Clip | null>(null);

  const mutation = useMutation({
    mutationFn: (input: string) => captureInput({ data: { input } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      haptic(12);
      qc.invalidateQueries({ queryKey: ["clips"] });
      setLast(result.clip);
      setValue("");
      toast.success("已收进资料库");
    },
    onError: () => toast.error("没能保存，再试一次"),
  });

  function submit() {
    const next = value.trim();
    if (!next || mutation.isPending) return;
    mutation.mutate(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }

  const canSave = Boolean(value.trim()) && !mutation.isPending;

  return (
    <section className="lift rounded-2xl bg-surface p-5 shadow-card sm:p-6">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="粘贴链接，或写一段文字…"
        rows={5}
        className="min-h-[140px] w-full resize-none bg-transparent text-body leading-relaxed text-fg outline-none placeholder:text-subtle"
      />
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={!canSave}
          className="font-en inline-flex h-11 items-center justify-center rounded-full bg-fg px-5 text-[17px] leading-none text-bg transition-opacity duration-100 disabled:opacity-30"
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "save"
          )}
        </button>
      </div>
      {last ? (
        <Link
          to="/clips/$id"
          params={{ id: String(last.id) }}
          className="pressable mt-4 flex items-center gap-3 rounded-xl bg-fill px-4 py-3"
        >
          <TypeBadge type={last.type} />
          <span className="min-w-0 flex-1 truncate text-subhead font-medium text-fg">
            {last.title}
          </span>
          <ArrowUpRight className="size-4 text-muted" />
        </Link>
      ) : null}
    </section>
  );
}
