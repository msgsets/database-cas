import type { Clip } from "@/lib/clip-types";

const KEY = "database:recent-clips";

export type RecentClips = {
  items: Clip[];
  total: number;
};

export function readRecentClips(): RecentClips | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as RecentClips;
    if (!parsed || !Array.isArray(parsed.items)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function writeRecentClips(data: RecentClips) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // quota / private mode
  }
}
