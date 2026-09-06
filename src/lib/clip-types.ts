export const CLIP_TYPES = ["link", "article", "video", "image", "text"] as const;
export type ClipType = (typeof CLIP_TYPES)[number];

export const CLIP_TYPE_LABEL: Record<ClipType, string> = {
  link: "链接",
  article: "文章",
  video: "视频",
  image: "图片",
  text: "文本",
};

export const TIME_FILTERS = ["all", "today", "week", "month", "year"] as const;
export type TimeFilter = (typeof TIME_FILTERS)[number];

export const TIME_FILTER_LABEL: Record<TimeFilter, string> = {
  all: "全部",
  today: "今天",
  week: "本周",
  month: "本月",
  year: "今年",
};

export type TypeFilter = "all" | ClipType;

export type LibrarySearch = {
  q: string;
  time: TimeFilter;
  type: TypeFilter;
  tag: string;
};

export const DEFAULT_LIBRARY_SEARCH: LibrarySearch = {
  q: "",
  time: "all",
  type: "all",
  tag: "",
};

export type Tag = {
  id: number;
  name: string;
};

export type Clip = {
  id: number;
  kind: "url" | "text";
  type: ClipType;
  url: string | null;
  title: string;
  excerpt: string | null;
  content: string | null;
  site_name: string | null;
  image_url: string | null;
  created_at: string;
  tags: Tag[];
};

export type Note = {
  id: number;
  body: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function isClipType(value: unknown): value is ClipType {
  return CLIP_TYPES.includes(value as ClipType);
}

export function isTimeFilter(value: unknown): value is TimeFilter {
  return TIME_FILTERS.includes(value as TimeFilter);
}

export function isTypeFilter(value: unknown): value is TypeFilter {
  return value === "all" || isClipType(value);
}

export function parseLibrarySearch(raw: Record<string, unknown>): LibrarySearch {
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    time: isTimeFilter(raw.time) ? raw.time : "all",
    type: isTypeFilter(raw.type) ? raw.type : "all",
    tag: typeof raw.tag === "string" ? raw.tag : "",
  };
}

export function noteTitle(body: string): string {
  const line = body.trim().split("\n").find((part) => part.trim().length > 0);
  return line?.trim() || "未命名";
}

export function notePreview(body: string): string {
  const lines = body
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.slice(1).join(" ") || "";
}
