export type ArticleBlock =
  | { type: "h"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "img"; src: string; alt: string };

const IMAGE_MD = /!\[([^\]]*)\]\((https?:[^)\s]+)(?:\s+"[^"]*")?\)/;
const IMAGE_MD_GLOBAL = /!\[([^\]]*)\]\((https?:[^)\s]+)(?:\s+"[^"]*")?\)/g;

export function headingCount(text: string | null | undefined): number {
  if (!text) return 0;
  return (text.match(/^#{1,4}\s+\S/gm) || []).length;
}

export function imageCount(text: string | null | undefined): number {
  if (!text) return 0;
  return (text.match(IMAGE_MD_GLOBAL) || []).length;
}

export function contentRank(text: string | null | undefined): number {
  if (!text) return 0;
  const images = imageCount(text);
  const headings = headingCount(text);
  const prose = text.replace(IMAGE_MD_GLOBAL, "").replace(/\s+/g, " ").trim().length;
  return headings * 520 + images * 360 + Math.min(prose, 6000);
}

export function parseArticle(markdown: string): ArticleBlock[] {
  const src = normalizeMarkdown(markdown);
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: ArticleBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = (lines[i] ?? "").trimEnd();
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line.trim());
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3 | 4;
      blocks.push({ type: "h", level, text: heading[2].trim() });
      i += 1;
      continue;
    }

    if (/^[-*]{3,}$/.test(line.trim())) {
      i += 1;
      continue;
    }

    if (IMAGE_MD.test(line.trim()) && !line.trim().replace(IMAGE_MD_GLOBAL, "").trim()) {
      pushImages(line, blocks);
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i] ?? "")) {
        parts.push((lines[i] ?? "").replace(/^>\s?/, ""));
        i += 1;
      }
      const text = parts.join(" ").replace(/\s+/g, " ").trim();
      if (text) splitInline(text, blocks);
      continue;
    }

    if (/^\s*[-*+]\s+\S/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+\S/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*+]\s+/, "").trim());
        i += 1;
      }
      if (items.length) blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\s*\d+\.\s+\S/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+\S/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*\d+\.\s+/, "").trim());
        i += 1;
      }
      if (items.length) blocks.push({ type: "ol", items });
      continue;
    }

    const parts = [line];
    i += 1;
    while (i < lines.length) {
      const next = lines[i] ?? "";
      if (!next.trim()) break;
      if (
        /^(#{1,4}\s|[-*]{3,}$|>\s?|\s*[-*+]\s+\S|\s*\d+\.\s+\S)/.test(next) ||
        IMAGE_MD.test(next.trim())
      ) {
        break;
      }
      parts.push(next.trim());
      i += 1;
    }
    splitInline(parts.join(" ").replace(/\s+/g, " ").trim(), blocks);
  }

  return blocks;
}

export function dropTitleHeading(blocks: ArticleBlock[], title: string): ArticleBlock[] {
  if (!blocks.length || blocks[0]?.type !== "h") return blocks;
  const first = blocks[0].text;
  if (normalizeTitle(first) === normalizeTitle(title)) return blocks.slice(1);
  return blocks;
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/<img\b[^>]*src=["'](https?:[^"']+)["'][^>]*>/gi, "\n\n![]($1)\n\n")
    .replace(
      /\[!\[([^\]]*)\]\((https?:[^)\s]+)(?:\s+"[^"]*")?\)\]\((https?:[^)]+)\)/g,
      "![$1]($2)",
    )
    .replace(/\n{3,}/g, "\n\n");
}

function pushImages(line: string, blocks: ArticleBlock[]) {
  IMAGE_MD_GLOBAL.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IMAGE_MD_GLOBAL.exec(line))) {
    if (isJunkImageUrl(match[2]!)) continue;
    blocks.push({ type: "img", alt: match[1] ?? "", src: match[2]! });
  }
}

function splitInline(text: string, blocks: ArticleBlock[]) {
  if (!text) return;
  IMAGE_MD_GLOBAL.lastIndex = 0;
  if (!IMAGE_MD.test(text)) {
    blocks.push({ type: "p", text });
    return;
  }
  let last = 0;
  IMAGE_MD_GLOBAL.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IMAGE_MD_GLOBAL.exec(text))) {
    const before = text.slice(last, match.index).trim();
    if (before) blocks.push({ type: "p", text: before });
    if (!isJunkImageUrl(match[2]!)) {
      blocks.push({ type: "img", alt: match[1] ?? "", src: match[2]! });
    }
    last = match.index + match[0].length;
  }
  const after = text.slice(last).trim();
  if (after) blocks.push({ type: "p", text: after });
}

function normalizeTitle(value: string): string {
  return value.replace(/[\s\p{P}\p{S}]+/gu, "").toLowerCase();
}

function isJunkImageUrl(url: string): boolean {
  return /avatar|sprite|icon|logo|emoji|pixel|spacer|1x1|tracking|badge|qrcode|adsct|cookielaw|doubleclick|facebook\.com\/tr|googletagmanager/i.test(
    url,
  );
}
