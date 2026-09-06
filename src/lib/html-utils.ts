export function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/"/g, "\u0022")
    .replace(/&#39;|'/g, "\u0027")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/&/g, "&");
}

export function stripTags(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function absolutize(base: URL, value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("javascript:")) {
    return null;
  }
  try {
    const resolved = new URL(trimmed.startsWith("//") ? `${base.protocol}${trimmed}` : trimmed, base);
    if (resolved.protocol === "http:" || resolved.protocol === "https:") {
      return resolved.toString();
    }
  } catch {
    return null;
  }
  return null;
}

export function attr(tag: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const quoted = tag.match(new RegExp(`${escaped}\\s*=\\s*["']([^"']*)["']`, "i"));
  if (quoted?.[1]) return decodeHtml(quoted[1].trim());
  const bare = tag.match(new RegExp(`${escaped}\\s*=\\s*([^\\s>]+)`, "i"));
  return bare?.[1] ? decodeHtml(bare[1].trim()) : null;
}
