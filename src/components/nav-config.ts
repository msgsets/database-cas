import { DEFAULT_LIBRARY_SEARCH } from "@/lib/clip-types";

export type NavItem = {
  to: "/" | "/library" | "/notes";
  label: string;
  search?: typeof DEFAULT_LIBRARY_SEARCH;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "HOME" },
  { to: "/notes", label: "Notes" },
  { to: "/library", label: "DATABASE", search: DEFAULT_LIBRARY_SEARCH },
];

export function isNavActive(pathname: string, to: NavItem["to"]) {
  if (to === "/") return pathname === "/";
  if (to === "/library") return pathname.startsWith("/library") || pathname.startsWith("/clips");
  return pathname.startsWith("/notes");
}
