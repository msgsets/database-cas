"use client";

import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Clip } from "@/lib/clip-types";
import { relativeTime } from "@/lib/format";
import { cn, safeHttpUrl } from "@/lib/utils";
import { TypeBadge } from "@/components/type-badge";

export function ClipCard({ clip }: { clip: Clip }) {
  const image = safeHttpUrl(clip.image_url);
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(image) && !broken;

  return (
    <Link
      to="/clips/$id"
      params={{ id: String(clip.id) }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card",
        "transition-[box-shadow,transform] duration-200 ease-smooth-out",
        "hover:shadow-card-hover active:scale-[0.99]",
      )}
    >
      {showImage ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-fill">
          <img
            src={image ?? undefined}
            alt=""
            className="size-full object-cover transition-transform duration-300 ease-smooth-out group-hover:scale-[1.02]"
            onError={() => setBroken(true)}
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <TypeBadge type={clip.type} />
          <span className="text-xs tabular-nums text-subtle">
            {relativeTime(clip.created_at)}
          </span>
        </div>
        <div className="space-y-1.5">
          <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug tracking-tight text-fg">
            {clip.title}
          </h3>
          {clip.excerpt ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted">
              {clip.excerpt}
            </p>
          ) : null}
        </div>
        {clip.tags.length ? (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {clip.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-fill px-2 py-0.5 text-xs text-muted"
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
