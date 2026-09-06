"use client";

import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
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
        "group lift flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card",
        "pressable",
      )}
    >
      {showImage ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-fill">
          <img
            src={image ?? undefined}
            alt=""
            className="size-full object-cover"
            onError={() => setBroken(true)}
          />
          {clip.type === "video" ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-fg/72 text-bg backdrop-blur-sm">
                <Play className="size-5 ml-0.5" fill="currentColor" />
              </span>
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-3">
          <TypeBadge type={clip.type} />
          <span className="text-caption tabular-nums tracking-wide text-subtle">
            {relativeTime(clip.created_at)}
          </span>
        </div>
        <div className="space-y-1">
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
                className="rounded-full bg-fill px-2 py-0.5 text-caption text-muted"
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
