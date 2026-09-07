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

export function parseArticle(markdown: string, title = ""): ArticleBlock[] {
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
      const text = unwrapEmphasis(heading[2].trim());
      if (text) blocks.push({ type: "h", level, text });
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
      const text = unwrapEmphasis(parts.join(" ").replace(/\s+/g, " ").trim());
      if (text && !isChromeText(text)) splitInline(text, blocks);
      continue;
    }

    if (/^\s*[-*+]\s+\S/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+\S/.test(lines[i] ?? "")) {
        const item = unwrapEmphasis((lines[i] ?? "").replace(/^\s*[-*+]\s+/, "").trim());
        if (item && !isChromeText(item)) items.push(item);
        i += 1;
      }
      if (items.length) blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\s*\d+\.\s+\S/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+\S/.test(lines[i] ?? "")) {
        const item = unwrapEmphasis((lines[i] ?? "").replace(/^\s*\d+\.\s+/, "").trim());
        if (item && !isChromeText(item)) items.push(item);
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

  return tidyBlocks(blocks, title);
}

export function dropTitleHeading(blocks: ArticleBlock[], title: string): ArticleBlock[] {
  if (!blocks.length || blocks[0]?.type !== "h") return blocks;
  const first = blocks[0].text;
  if (normalizeTitle(first) === normalizeTitle(title)) return blocks.slice(1);
  return blocks;
}

export function isJunkImageUrl(url: string): boolean {
  return /avatar|headimg|qlogo\.cn|user[_-]?pic|profile[_-]?images?|default-avatar|sprite|icon|logo|emoji|pixel|spacer|1x1|tracking|badge|qrcode|adsct|cookielaw|doubleclick|facebook\.com\/tr|googletagmanager|crop\/(?:[1-9]\d|1\d{2}|2\d{2})x(?:[1-9]\d|1\d{2}|2\d{2})(?:[/?]|$)|(?:72|64|48|40|32|96|100|120|132|160)x(?:72|64|48|40|32|96|100|120|132|160)/i.test(
    url,
  );
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/<img\b[^>]*src=["'](https?:[^"']+)["'][^>]*>/gi, "\n\n![]($1)\n\n")
    .replace(
      /\[!\[([^\]]*)\]\((https?:[^)\s]+)(?:\s+"[^"]*")?\)\]\((https?:[^)]+)\)/g,
      (_all, alt: string, img: string, href: string) => {
        if (isProfileHref(href) || isJunkImageUrl(img)) return "";
        return `![${alt}](${img})`;
      },
    )
    .replace(/\[\]\((https?:[^)]+)\)/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

function pushImages(line: string, blocks: ArticleBlock[]) {
  IMAGE_MD_GLOBAL.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IMAGE_MD_GLOBAL.exec(line))) {
    if (isAvatarImage(match[2]!, match[1] ?? "")) continue;
    blocks.push({ type: "img", alt: match[1] ?? "", src: match[2]! });
  }
}

function splitInline(text: string, blocks: ArticleBlock[]) {
  if (!text) return;
  IMAGE_MD_GLOBAL.lastIndex = 0;
  if (!IMAGE_MD.test(text)) {
    const clean = unwrapEmphasis(text);
    if (clean && !isChromeText(clean) && !isNavDump(clean)) {
      blocks.push({ type: "p", text: clean });
    }
    return;
  }
  let last = 0;
  IMAGE_MD_GLOBAL.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IMAGE_MD_GLOBAL.exec(text))) {
    const before = unwrapEmphasis(text.slice(last, match.index).trim());
    if (before && !isChromeText(before) && !isNavDump(before)) {
      blocks.push({ type: "p", text: before });
    }
    if (!isAvatarImage(match[2]!, match[1] ?? "")) {
      blocks.push({ type: "img", alt: match[1] ?? "", src: match[2]! });
    }
    last = match.index + match[0].length;
  }
  const after = unwrapEmphasis(text.slice(last).trim());
  if (after && !isChromeText(after) && !isNavDump(after)) {
    blocks.push({ type: "p", text: after });
  }
}

function tidyBlocks(blocks: ArticleBlock[], title: string): ArticleBlock[] {
  let start = 0;
  while (start < blocks.length) {
    const block = blocks[start];
    if (!block) break;
    if (block.type === "img" && isAvatarImage(block.src, block.alt)) {
      start += 1;
      continue;
    }
    if (block.type === "p" && (isChromeText(block.text) || isNavDump(block.text))) {
      start += 1;
      continue;
    }
    if (block.type === "h" && title && normalizeTitle(block.text) === normalizeTitle(title)) {
      start += 1;
      continue;
    }
    if (block.type === "ul" && block.items.length <= 6 && block.items.every(isChromeText)) {
      start += 1;
      continue;
    }
    break;
  }

  let end = blocks.length;
  while (end > start) {
    const block = blocks[end - 1];
    if (!block) break;
    if (block.type === "p" && (isChromeText(block.text) || isNavDump(block.text) || isFooterText(block.text))) {
      end -= 1;
      continue;
    }
    if (block.type === "ul" && block.items.every((item) => isChromeText(item) || isFooterText(item))) {
      end -= 1;
      continue;
    }
    if (block.type === "img" && isAvatarImage(block.src, block.alt)) {
      end -= 1;
      continue;
    }
    break;
  }

  const sliced = blocks.slice(start, end).filter((block) => {
    if (block.type === "img") return !isAvatarImage(block.src, block.alt);
    if (block.type === "p") return !isChromeText(block.text) && !isNavDump(block.text) && !isFooterText(block.text);
    if (block.type === "h") return Boolean(block.text);
    return true;
  });

  // Drop a leading portrait sitting in the byline before the first paragraph.
  if (sliced[0]?.type === "img" && sliced[1]?.type === "p" && isLikelyPortrait(sliced[0])) {
    sliced.shift();
  }
  return sliced;
}

function isAvatarImage(url: string, alt: string): boolean {
  if (isJunkImageUrl(url)) return true;
  const name = alt.replace(/^Image\s*\d+\s*:?\s*/i, "").trim();
  if (name && name.length <= 24 && /作者|avatar|user|profile/i.test(name)) return true;
  if (
    name &&
    name.length <= 16 &&
    !/\s/.test(name) &&
    /\/(?:u|user|people|author)\b|avatar|headimg|qlogo/i.test(url)
  ) {
    return true;
  }
  return false;
}

function isLikelyPortrait(block: ArticleBlock): boolean {
  if (block.type !== "img") return false;
  if (isAvatarImage(block.src, block.alt)) return true;
  const alt = block.alt.replace(/^Image\s*\d+\s*:?\s*/i, "").trim();
  return Boolean(alt) && alt.length <= 16 && !/\s/.test(alt);
}

function isChromeText(text: string): boolean {
  const t = text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length < 2) return true;
  if (/^\d{4}年\d{1,2}月/.test(t)) return true;
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(t)) return true;
  if (/\d+\s*分钟阅读/.test(t)) return true;
  if (/^(关注(作者)?|分享(到)?|评论|收藏|点赞|转发|订阅|登录|注册|阅读原文|展开全文|查看更多)\s*\d*$/.test(t)) {
    return true;
  }
  if (/^(首页|下载 App|联系我们|商务合作|关于我们|用户协议)$/.test(t)) return true;
  return false;
}

function isFooterText(text: string): boolean {
  return /相关阅读|推荐阅读|热门评论|发表评论|版权声明|未经授权|转载请联系|©|粤ICP|京ICP/.test(text);
}

function isNavDump(text: string): boolean {
  const links = text.match(/\[[^\]]+\]\(https?:[^)]+\)/g) || [];
  const leftover = text.replace(/\[[^\]]*\]\([^)]+\)/g, "").replace(/\s+/g, " ").trim();
  return links.length >= 2 && leftover.length < 24;
}

function isProfileHref(href: string): boolean {
  return /\/(?:u|user|users|people|author|authors|profile|member|members)\/|\/u\/[a-z0-9]|\/people\/|mp\.weixin\.qq\.com\/mp\/profile/i.test(
    href,
  );
}

function unwrapEmphasis(text: string): string {
  return text.replace(/^\*\*(.+)\*\*$/s, "$1").replace(/^__(.+)__$/s, "$1").trim();
}

function normalizeTitle(value: string): string {
  return value.replace(/[\s\p{P}\p{S}]+/gu, "").toLowerCase();
}
