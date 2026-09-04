import type { ClipType } from "@/lib/clip-types";

export type ParsedClip = {
  kind: "url" | "text";
  type: ClipType;
  url: string | null;
  title: string;
  excerpt: string | null;
  content: string | null;
  site_name: string | null;
  image_url: string | null;
};

const VIDEO_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com",
  "bilibili.com",
  "www.bilibili.com",
  "b23.tv",
  "tiktok.com",
  "www.tiktok.com",
  "douyin.com",
  "www.douyin.com",
  "youku.com",
  "v.qq.com",
];

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?.*)?$/i;
const MAX_BYTES = 1_500_000;

export async function parseInput(raw: string): Promise<ParsedClip> {
  const input = raw.trim();
  if (!input) throw new Error("empty");

  const url = coerceUrl(input);
  if (url) {
    try {
      return await parseUrl(url);
    } catch {
      return fallbackUrl(url);
    }
  }

  const title = await titleFromText(input);
  const excerpt = input.length > 180 ? `${input.slice(0, 180).trim()}…` : input;
  return {
    kind: "text",
    type: "text",
    url: null,
    title: title.slice(0, 200),
    excerpt,
    content: input.slice(0, 20_000),
    site_name: null,
    image_url: null,
  };
}

function coerceUrl(input: string): URL | null {
  if (/\s/.test(input)) return null;
  let value = input;
  if (!/^https?:\/\//i.test(value)) {
    if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}([/:?#].*)?$/i.test(value)) return null;
    value = `https://${value}`;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (isPrivateHost(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "::1" ||
    host === "0.0.0.0"
  ) {
    return true;
  }
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  if (host.includes(":")) return true;
  return false;
}

function detectTypeFromUrl(url: URL, ogType?: string | null): ClipType {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (VIDEO_HOSTS.some((item) => host === item || host.endsWith(`.${item}`))) {
    return "video";
  }
  if (IMAGE_EXT.test(url.pathname)) return "image";
  const og = (ogType ?? "").toLowerCase();
  if (og.includes("video")) return "video";
  if (og.includes("image")) return "image";
  if (og.includes("article") || og.includes("blog")) return "article";
  return "link";
}

function fallbackUrl(url: URL): ParsedClip {
  const site = url.hostname.replace(/^www\./, "");
  return {
    kind: "url",
    type: detectTypeFromUrl(url),
    url: url.toString(),
    title: site,
    excerpt: null,
    content: null,
    site_name: site,
    image_url: youtubeThumb(url),
  };
}

function youtubeThumb(url: URL): string | null {
  let id: string | null = null;
  if (url.hostname === "youtu.be") {
    id = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (url.hostname.includes("youtube.com")) {
    id = url.searchParams.get("v");
  }
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

async function parseUrl(url: URL): Promise<ParsedClip> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        Accept: "text/html,application/xhtml+xml,image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) return fallbackUrl(url);

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.startsWith("image/")) {
      const name = decodeURIComponent(url.pathname.split("/").pop() || url.hostname);
      return {
        kind: "url",
        type: "image",
        url: url.toString(),
        title: name.slice(0, 200) || url.hostname,
        excerpt: null,
        content: null,
        site_name: url.hostname.replace(/^www\./, ""),
        image_url: url.toString(),
      };
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) return fallbackUrl(url);
    const html = new TextDecoder("utf-8").decode(buffer);

    const ogTitle = metaContent(html, ["og:title", "twitter:title"]);
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const title = (ogTitle || stripTags(titleTag || "")).trim() || url.hostname;
    const description = metaContent(html, [
      "og:description",
      "twitter:description",
      "description",
    ]);
    const ogImage = metaContent(html, ["og:image", "twitter:image", "og:image:url"]);
    const siteName =
      metaContent(html, ["og:site_name"]) || url.hostname.replace(/^www\./, "");
    const ogType = metaContent(html, ["og:type"]);
    const image = absolutize(url, ogImage) || youtubeThumb(url);
    const type = detectTypeFromUrl(url, ogType);

    return {
      kind: "url",
      type: type === "link" && description && description.length > 80 ? "article" : type,
      url: url.toString(),
      title: title.slice(0, 200),
      excerpt: description ? description.slice(0, 400) : null,
      content: description ? description.slice(0, 4000) : null,
      site_name: siteName.slice(0, 120),
      image_url: image,
    };
  } finally {
    clearTimeout(timer);
  }
}

function metaContent(html: string, names: string[]): string | null {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re1 = new RegExp(
      `<meta\\s[^>]*?(?:property|name|itemprop)\\s*=\\s*["']${escaped}["'][^>]*?content\\s*=\\s*["']([^"']*)["'][^>]*>`,
      "i",
    );
    const re2 = new RegExp(
      `<meta\\s[^>]*?content\\s*=\\s*["']([^"']*)["'][^>]*?(?:property|name|itemprop)\\s*=\\s*["']${escaped}["'][^>]*>`,
      "i",
    );
    const match = html.match(re1) || html.match(re2);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return null;
}

function absolutize(base: URL, value: string | null): string | null {
  if (!value) return null;
  try {
    const resolved = new URL(value, base);
    if (resolved.protocol === "http:" || resolved.protocol === "https:") {
      return resolved.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCharCode(parseInt(n, 16)),
    );
}

function stripTags(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

async function titleFromText(text: string): Promise<string> {
  const first =
    text
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean)
      ?.slice(0, 80) || "未命名";
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey || text.trim().length < 40) return first;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 40,
        messages: [
          {
            role: "user",
            content: `为下面这段笔记生成一个不超过16个字的标题，只返回标题本身，不要引号：\n\n${text.slice(0, 400)}`,
          },
        ],
      }),
    });
    if (!res.ok) return first;
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const title = body.choices?.[0]?.message?.content?.trim();
    return title ? title.replace(/^["“]|["”]$/g, "").slice(0, 80) : first;
  } catch {
    return first;
  } finally {
    clearTimeout(timer);
  }
}
