import { absolutize, attr, stripTags } from "@/lib/html-utils";

const MAX_CONTENT = 80_000;
const JUNK_IMAGE =
  /avatar|sprite|icon|logo|emoji|pixel|spacer|1x1|tracking|badge|button|qrcode|qr[_-]?code|share[_-]?(wx|weibo)|loading\.gif|adsct|cookielaw|doubleclick|facebook\.com\/tr|googletagmanager|crop\/(?:1\d{2}|[1-9]\d)x(?:1\d{2}|[1-9]\d)(?:[/?]|$)|thumbnail\/!(?:1\d{2}|[1-9]\d)x/i;

export function extractArticle(html: string, base: URL): string {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const root = pickRoot(cleaned);
  const blocks: string[] = [];
  const list: string[] = [];
  const seen = new Set<string>();

  function flushList() {
    if (!list.length) return;
    blocks.push(list.join("\n"));
    list.length = 0;
  }

  const re =
    /<img\b[^>]*>|<(figure|h[1-6]|p|li|blockquote)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(root))) {
    const raw = match[0];
    if (/^<img/i.test(raw)) {
      flushList();
      const image = imageMarkdown(raw, base, seen);
      if (image) blocks.push(image);
      continue;
    }

    const tag = (match[1] ?? "").toLowerCase();
    const inner = raw.replace(/^<[^>]+>/, "").replace(/<\/[^>]+>$/, "");

    if (tag === "figure") {
      flushList();
      const image = figureMarkdown(inner, base, seen);
      if (image) blocks.push(image);
      continue;
    }

    if (tag === "li") {
      const text = inlineToMarkdown(inner, base, seen).replace(/\n+/g, " ").trim();
      if (text.length >= 2 && !isBoilerplate(text)) list.push(`- ${text}`);
      continue;
    }

    flushList();

    if (tag === "blockquote") {
      const text = inlineToMarkdown(inner, base, seen).trim();
      if (text.length >= 8 && !isBoilerplate(text)) blocks.push(`> ${text.replace(/\n+/g, " ")}`);
      continue;
    }

    if (tag.startsWith("h")) {
      const text = stripTags(inner).trim();
      if (text.length < 2 || isBoilerplate(text)) continue;
      const level = tag === "h1" || tag === "h2" ? 2 : tag === "h3" ? 3 : 4;
      blocks.push(`${"#".repeat(level)} ${text}`);
      continue;
    }

    if (isBoldHeading(inner)) {
      const text = stripTags(inner).trim();
      if (text) blocks.push(`### ${text}`);
      continue;
    }

    const pieces = splitInlineContent(inner, base, seen);
    for (const piece of pieces) {
      if (piece.startsWith("![")) {
        blocks.push(piece);
        continue;
      }
      if (piece.length < 2 || isBoilerplate(piece)) continue;
      if (piece.length < 18 && !/[。！？.!?]$/.test(piece)) continue;
      blocks.push(piece);
    }
    if (blocks.join("\n\n").length > MAX_CONTENT) break;
  }

  flushList();
  return blocks.join("\n\n").slice(0, MAX_CONTENT);
}

export function firstContentImage(markdown: string | null | undefined): string | null {
  if (!markdown) return null;
  const match = markdown.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/);
  return match?.[1] ?? null;
}

function pickRoot(html: string): string {
  const patterns = [
    /<div[^>]*id=["']js_content["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*rich_media_content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*itemprop=["']articleBody["'][^>]*>([\s\S]*?)<\/div>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
  ];
  let best = html;
  let bestLen = stripTags(html).length;
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    const len = stripTags(match[1]).length;
    if (len > 80 && len >= bestLen * 0.35 && len <= bestLen) {
      // Prefer a tighter article root when it still holds most of the text.
      if (len > 200 && match[1].length < best.length) {
        best = match[1];
        bestLen = len;
      }
    }
    if (len > bestLen) {
      best = match[1];
      bestLen = len;
    }
  }
  return best;
}

function figureMarkdown(inner: string, base: URL, seen: Set<string>): string | null {
  const img = inner.match(/<img\b[^>]*>/i)?.[0];
  if (!img) return inlineToMarkdown(inner, base, seen).trim() || null;
  const caption = inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1];
  const image = imageMarkdown(img, base, seen, caption ? stripTags(caption) : undefined);
  return image;
}

function splitInlineContent(inner: string, base: URL, seen: Set<string>): string[] {
  const pieces: string[] = [];
  const re = /<img\b[^>]*>/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(inner))) {
    const before = tidyText(inner.slice(last, match.index));
    if (before) pieces.push(before);
    const image = imageMarkdown(match[0], base, seen);
    if (image) pieces.push(image);
    last = match.index + match[0].length;
  }
  const after = tidyText(inner.slice(last));
  if (after) pieces.push(after);
  return pieces;
}

function inlineToMarkdown(inner: string, base: URL, seen: Set<string>): string {
  return splitInlineContent(inner, base, seen).join("\n\n");
}

function tidyText(html: string): string {
  return stripTags(html.replace(/<br\s*\/?>/gi, "\n")).replace(/\s+/g, " ").trim();
}

function imageMarkdown(
  tag: string,
  base: URL,
  seen: Set<string>,
  caption?: string,
): string | null {
  const src = readImgSrc(tag, base);
  if (!src || seen.has(src)) return null;
  seen.add(src);
  const alt = (caption || attr(tag, "alt") || "").replace(/[[\]]/g, "").trim();
  return `![${alt}](${src})`;
}

function readImgSrc(tag: string, base: URL): string | null {
  const srcset = attr(tag, "srcset") || attr(tag, "data-srcset");
  const candidates = [
    attr(tag, "data-original"),
    attr(tag, "data-actualsrc"),
    attr(tag, "data-src"),
    attr(tag, "data-lazy-src"),
    attr(tag, "data-original-src"),
    largestSrcset(srcset),
    attr(tag, "src"),
  ];
  for (const candidate of candidates) {
    const abs = absolutize(base, candidate);
    if (abs && !isJunkImage(abs, tag)) return abs;
  }
  return null;
}

function largestSrcset(srcset: string | null): string | null {
  if (!srcset) return null;
  let best: string | null = null;
  let bestN = -1;
  for (const part of srcset.split(",")) {
    const bits = part.trim().split(/\s+/);
    const url = bits[0];
    if (!url) continue;
    const desc = bits[1] || "0";
    const n = desc.endsWith("w")
      ? Number.parseInt(desc, 10)
      : desc.endsWith("x")
        ? Number.parseFloat(desc) * 1000
        : 0;
    if (n >= bestN) {
      best = url;
      bestN = n;
    }
  }
  return best;
}

function isJunkImage(url: string, tag: string): boolean {
  if (JUNK_IMAGE.test(url)) return true;
  const width = Number(attr(tag, "width") || 0);
  const height = Number(attr(tag, "height") || 0);
  if ((width && width < 80) || (height && height < 80)) return true;
  return false;
}

function isBoldHeading(inner: string): boolean {
  const text = stripTags(inner).trim();
  if (text.length < 2 || text.length > 42) return false;
  return /^<(strong|b)(\s[^>]*)?>[\s\S]*<\/\1>$/i.test(inner.trim());
}

function isBoilerplate(text: string): boolean {
  if (text.length > 160) return false;
  return /cookie|privacy policy|订阅|登录|注册|copyright|accept all|同意并继续|分享到|相关阅读/i.test(
    text,
  );
}
