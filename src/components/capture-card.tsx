"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { captureInput } from "@/lib/clips-api";
import type { Clip } from "@/lib/clip-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TypeBadge } from "@/components/type-badge";

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
      qc.invalidateQueries({ queryKey: ["clips"] });
      setLast(result.clip);
      setValue("");
      toast.success("已收入");
    },
    onError: () => toast.error("收入失败"),
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

  return (
    <section className="rise-in rise-in-2 rounded-2xl bg-surface p-5 shadow-card sm:p-6">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="粘贴链接，或写一段文字…"
        rows={5}
        className="min-h-[140px]"
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-subtle">⌘ Enter</p>
        <Button onClick={submit} disabled={mutation.isPending || !value.trim()}>
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              解析中
            </>
          ) : (
            "收入"
          )}
        </Button>
      </div>
      {last ? (
        <Link
          to="/clips/$id"
          params={{ id: String(last.id) }}
          className="mt-4 flex items-center gap-3 rounded-xl bg-fill px-4 py-3 transition-colors duration-150 hover:bg-fill-2"
        >
          <TypeBadge type={last.type} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
            {last.title}
          </span>
          <ArrowUpRight className="size-4 text-muted" />
        </Link>
      ) : null}
    </section>
  );
}
