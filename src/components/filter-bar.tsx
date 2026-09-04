"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { createTag, listTags } from "@/lib/clips-api";
import {
  CLIP_TYPES,
  CLIP_TYPE_LABEL,
  TIME_FILTERS,
  TIME_FILTER_LABEL,
  type LibrarySearch,
} from "@/lib/clip-types";
import { cn } from "@/lib/utils";
import { TypeIcon } from "@/components/type-badge";
import { Input } from "@/components/ui/input";

type FilterBarProps = {
  search: LibrarySearch;
  onChange: (patch: Partial<LibrarySearch>) => void;
};

export function FilterBar({ search, onChange }: FilterBarProps) {
  const qc = useQueryClient();
  const [q, setQ] = useState(search.q);
  const [tagName, setTagName] = useState("");
  const tagsQuery = useQuery({ queryKey: ["tags"], queryFn: () => listTags() });

  useEffect(() => {
    setQ(search.q);
  }, [search.q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (q !== search.q) onChange({ q });
    }, 250);
    return () => clearTimeout(timer);
  }, [q, search.q, onChange]);

  const create = useMutation({
    mutationFn: (name: string) => createTag({ data: { name } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTagName("");
      qc.invalidateQueries({ queryKey: ["tags"] });
      onChange({ tag: result.tag.name });
    },
  });

  function onCreateTag(event: FormEvent) {
    event.preventDefault();
    const next = tagName.trim();
    if (!next) return;
    create.mutate(next);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="搜索资料库"
          className="pl-10"
          aria-label="搜索资料库"
        />
      </div>

      <FilterRow label="时间">
        <div className="inline-flex max-w-full overflow-x-auto rounded-full bg-fill p-1">
          {TIME_FILTERS.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => onChange({ time })}
              className={cn(
                "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
                search.time === time
                  ? "bg-surface text-fg shadow-sm"
                  : "text-muted hover:text-fg",
              )}
            >
              {TIME_FILTER_LABEL[time]}
            </button>
          ))}
        </div>
      </FilterRow>

      <FilterRow label="类型">
        <div className="flex flex-wrap gap-2">
          <Chip
            active={search.type === "all"}
            onClick={() => onChange({ type: "all" })}
          >
            全部
          </Chip>
          {CLIP_TYPES.map((type) => (
            <Chip
              key={type}
              active={search.type === type}
              onClick={() =>
                onChange({ type: search.type === type ? "all" : type })
              }
            >
              <TypeIcon type={type} className="size-3.5" />
              {CLIP_TYPE_LABEL[type]}
            </Chip>
          ))}
        </div>
      </FilterRow>

      <FilterRow label="标签">
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={!search.tag} onClick={() => onChange({ tag: "" })}>
            全部
          </Chip>
          {(tagsQuery.data ?? []).map((tag) => (
            <Chip
              key={tag.id}
              active={search.tag === tag.name}
              onClick={() =>
                onChange({ tag: search.tag === tag.name ? "" : tag.name })
              }
            >
              {tag.name}
            </Chip>
          ))}
          <form onSubmit={onCreateTag} className="flex">
            <input
              value={tagName}
              onChange={(event) => setTagName(event.target.value)}
              placeholder="写标签，回车保存"
              maxLength={20}
              className="h-9 w-[148px] rounded-full bg-fill px-3 text-sm text-fg outline-none placeholder:text-subtle focus:bg-surface focus:shadow-[0_0_0_4px_rgba(0,113,227,0.18)]"
            />
          </form>
        </div>
      </FilterRow>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium tracking-wide text-subtle">{label}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-150",
        active ? "bg-fg text-bg" : "bg-fill text-muted hover:bg-fill-2 hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
