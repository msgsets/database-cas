"use client";

import { Fragment } from "react";
import { dropTitleHeading, parseArticle, type ArticleBlock } from "@/lib/article-md";
import { cn } from "@/lib/utils";

export function ArticleBody({
  markdown,
  title,
}: {
  markdown: string;
  title?: string;
}) {
  const blocks = dropTitleHeading(parseArticle(markdown), title ?? "");
  if (!blocks.length) return null;

  return (
    <div className="px-5 py-6 sm:px-7">
      {blocks.map((block, index) => (
        <ArticleBlockView key={index} block={block} first={index === 0} />
      ))}
    </div>
  );
}

function ArticleBlockView({ block, first }: { block: ArticleBlock; first: boolean }) {
  if (block.type === "h") {
    const Tag = (`h${Math.min(block.level + 1, 4)}` as "h2" | "h3" | "h4");
    return (
      <Tag
        className={cn(
          "text-fg tracking-tight",
          first ? "mt-0" : block.level <= 2 ? "mt-9" : "mt-7",
          block.level <= 2
            ? "mb-3 text-[22px] font-semibold leading-snug"
            : "mb-2 text-[18px] font-semibold leading-snug",
        )}
      >
        <Inline text={block.text} />
      </Tag>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote
        className={cn(
          "border-l-2 border-fill-2 pl-4 text-[16px] leading-[1.75] text-muted",
          first ? "mt-0" : "mt-5",
        )}
      >
        <Inline text={block.text} />
      </blockquote>
    );
  }

  if (block.type === "ul" || block.type === "ol") {
    const Tag = block.type;
    return (
      <Tag
        className={cn(
          "space-y-2 pl-5 text-[17px] leading-[1.75] text-fg",
          block.type === "ul" ? "list-disc" : "list-decimal",
          first ? "mt-0" : "mt-4",
        )}
      >
        {block.items.map((item, index) => (
          <li key={index} className="pl-1">
            <Inline text={item} />
          </li>
        ))}
      </Tag>
    );
  }

  if (block.type === "img") {
    const caption = usableCaption(block.alt);
    return (
      <figure className={cn(first ? "mt-0" : "mt-6", "mb-2")}>
        <div className="overflow-hidden rounded-xl bg-fill">
          <img src={block.src} alt={caption || ""} className="mx-auto max-h-[720px] w-full object-contain" />
        </div>
        {caption ? (
          <figcaption className="mt-2 text-center text-[13px] leading-relaxed text-muted">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <p className={cn("text-[17px] leading-[1.8] text-fg", first ? "mt-0" : "mt-4")}>
      <Inline text={block.text} />
    </p>
  );
}

function usableCaption(alt: string): string {
  const value = alt.replace(/^Image\s*\d+\s*:?\s*/i, "").trim();
  if (!value) return "";
  if (/^(image|img|photo|图片)\s*\d*$/i.test(value)) return "";
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(value)) return "";
  return value;
}

function Inline({ text }: { text: string }) {
  const token =
    /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:[^)]+\))/g;
  const parts = text.split(token);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (
          (part.startsWith("**") && part.endsWith("**")) ||
          (part.startsWith("__") && part.endsWith("__"))
        ) {
          return (
            <strong key={index} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <em key={index} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={index} className="rounded-md bg-fill px-1.5 py-0.5 text-[15px]">
              {part.slice(1, -1)}
            </code>
          );
        }
        const link = /^\[([^\]]+)\]\((https?:[^)]+)\)$/.exec(part);
        if (link) {
          return (
            <a
              key={index}
              href={link[2]}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-border underline-offset-2"
            >
              {link[1]}
            </a>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
