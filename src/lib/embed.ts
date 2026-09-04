const VIDEO_FILE = /\.(mp4|webm|ogg|m4v|mov)(\?.*)?$/i;

export type VideoEmbed =
  | { kind: "iframe"; src: string; title: string }
  | { kind: "file"; src: string };

export function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? null;
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
      return parts[1] ?? null;
    }
  }
  return null;
}

export function videoEmbed(raw: string): VideoEmbed | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const yt = youtubeId(url);
  if (yt) {
    return {
      kind: "iframe",
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?rel=0`,
      title: "YouTube",
    };
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    if (id && /^\d+$/.test(id)) {
      return {
        kind: "iframe",
        src: `https://player.vimeo.com/video/${id}`,
        title: "Vimeo",
      };
    }
  }

  if (host === "bilibili.com" || host === "m.bilibili.com" || host.endsWith(".bilibili.com")) {
    const bv = url.pathname.match(/\/video\/(BV[\w]+)/i)?.[1];
    const av = url.pathname.match(/\/video\/av(\d+)/i)?.[1];
    if (bv) {
      return {
        kind: "iframe",
        src: `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bv)}&high_quality=1`,
        title: "哔哩哔哩",
      };
    }
    if (av) {
      return {
        kind: "iframe",
        src: `https://player.bilibili.com/player.html?aid=${encodeURIComponent(av)}&high_quality=1`,
        title: "哔哩哔哩",
      };
    }
  }

  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const id = url.pathname.match(/\/video\/(\d+)/)?.[1];
    if (id) {
      return {
        kind: "iframe",
        src: `https://www.tiktok.com/embed/v2/${id}`,
        title: "TikTok",
      };
    }
  }

  if (VIDEO_FILE.test(url.pathname)) {
    return { kind: "file", src: url.toString() };
  }

  return null;
}
