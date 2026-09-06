export type ArticleBlock =
  | { type: "h"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "img"; src: string; alt: string };

export function headingCount(text: string | null | undefined): number {
  if (!text) return 0;
  return (text.match(/^#{1,4}\s+\S/gm) || []).length;
}

export function contentRank(text: string | null | undefined): number {
  if (!text) return 0;
  return headingCount(text) * 420 + Math.min(text.length, 8000);
}

export function parseArticle(markdown: string): ArticleBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ArticleBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i] ?? "";
    const line = raw.trimEnd();
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
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

    const img = /^!\[([^\]]*)\]\((https?:[^)\s]+)\)$/.exec(line.trim());
    if (img) {
      blocks.push({ type: "img", alt: img[1] ?? "", src: img[2]! });
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
      if (text) blocks.push({ type: "quote", text });
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
      if (/^(#{1,4}\s|[-*+]{3,}$|>\s?|\s*[-*+]\s+\S|\s*\d+\.\s+\S|!\[[^\]]*\]\(https?:)/.test(next)) {
        break;
      }
      parts.push(next.trim());
      i += 1;
    }
    const text = parts.join(" ").replace(/\s+/g, " ").trim();
    if (text) blocks.push({ type: "p", text });
  }

  return blocks;
}

export function dropTitleHeading(blocks: ArticleBlock[], title: string): ArticleBlock[] {
  if (!blocks.length || blocks[0]?.type !== "h") return blocks;
  const first = blocks[0].text;
  if (normalizeTitle(first) === normalizeTitle(title)) return blocks.slice(1);
  return blocks;
}

function normalizeTitle(value: string): string {
  return value.replace(/[\s\p{P}\p{S}]+/gu, "").toLowerCase();
}
