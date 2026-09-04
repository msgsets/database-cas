"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Clip } from "@/lib/clip-types";
import { readSource } from "@/lib/clips-api";
import { videoEmbed } from "@/lib/embed";
import { safeHttpUrl } from "@/lib/utils";

export function ClipViewer({ clip }: { clip: Clip }) {
  const url = safeHttpUrl(clip.url);

  if (clip.type === "video" && url) {
    return <VideoPlayer url={url} fallbackImage={safeHttpUrl(clip.image_url)} />;
  }

  if (clip.type === "image") {
    const image = safeHttpUrl(clip.image_url) || url;
    if (!image) return null;
    return (
      <div className="overflow-hidden rounded-2xl bg-fill shadow-card">
        <img src={image} alt="" className="w-full object-cover" />
      </div>
    );
  }

  if (clip.kind === "text") {
    return clip.content ? (
      <section className="rounded-2xl bg-surface px-5 py-6 shadow-card sm:px-7">
        <div className="whitespace-pre-wrap text-[17px] leading-relaxed text-fg">
          {clip.content}
        </div>
      </section>
    ) : null;
  }

  if (clip.type === "article" || clip.type === "link") {
    return <ArticleReader clip={clip} />;
  }

  return null;
}

function VideoPlayer({ url, fallbackImage }: { url: string; fallbackImage: string | null }) {
  const embed = videoEmbed(url);
  if (embed?.kind === "file") {
    return (
      <div className="overflow-hidden rounded-2xl bg-fg shadow-card">
        <video src={embed.src} controls playsInline className="w-full" poster={fallbackImage ?? undefined} />
      </div>
    );
  }
  if (embed?.kind === "iframe") {
    return (
      <div className="overflow-hidden rounded-2xl bg-fg shadow-card">
        <div className="relative aspect-video w-full">
          <iframe
            src={embed.src}
            title={embed.title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    );
  }
  if (fallbackImage) {
    return (
      <div className="overflow-hidden rounded-2xl bg-fill shadow-card">
        <img src={fallbackImage} alt="" className="w-full object-cover" />
      </div>
    );
  }
  return null;
}

function ArticleReader({ clip }: { clip: Clip }) {
  const [frameFailed, setFrameFailed] = useState(false);
  const source = useQuery({
    queryKey: ["clip-source", clip.id],
    queryFn: () => readSource({ data: { id: clip.id } }),
  });
  const data = source.data?.ok ? source.data.clip : clip;
  const body = (data.content || data.excerpt || "").trim();
  const thin = body.length < 280;
  const url = safeHttpUrl(data.url);
  const paragraphs = body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

  return (
    <section className="overflow-hidden rounded-2xl bg-surface shadow-card">
      {source.isPending && thin ? (
        <p className="px-5 py-8 text-subhead text-muted sm:px-7">正在载入正文…</p>
      ) : null}

      {paragraphs.length ? (
        <div className="space-y-4 px-5 py-6 sm:px-7">
          {paragraphs.map((para, index) => (
            <p key={index} className="text-[17px] leading-[1.7] text-fg">
              {para}
            </p>
          ))}
        </div>
      ) : null}

      {thin && url && !frameFailed && paragraphs.length === 0 ? (
        <div className="border-t border-border/70">
          <iframe
            src={url}
            title={clip.title}
            className="h-[70vh] w-full bg-surface"
            sandbox="allow-scripts allow-popups allow-forms allow-presentation"
            referrerPolicy="no-referrer"
            onError={() => setFrameFailed(true)}
          />
        </div>
      ) : null}

      {thin && !source.isPending && paragraphs.length === 0 ? (
        <p className="px-5 py-10 text-center text-subhead text-muted">
          这篇暂时读不进来，用下面的原链接打开。
        </p>
      ) : null}
    </section>
  );
}
