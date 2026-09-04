"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { DEFAULT_LIBRARY_SEARCH } from "@/lib/clip-types";
import { cn } from "@/lib/utils";
import { Spotlight, openSpotlight } from "@/components/spotlight";

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-[17px] font-semibold tracking-tight text-fg">
            Folio
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={cn(
                "flex h-10 items-center rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
                pathname === "/" ? "text-fg" : "text-muted hover:text-fg",
              )}
            >
              首页
            </Link>
            <Link
              to="/library"
              search={DEFAULT_LIBRARY_SEARCH}
              className={cn(
                "flex h-10 items-center rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
                pathname.startsWith("/library") || pathname.startsWith("/clips")
                  ? "text-fg"
                  : "text-muted hover:text-fg",
              )}
            >
              资料库
            </Link>
            <button
              type="button"
              onClick={openSpotlight}
              className="ml-1 flex size-10 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-fill hover:text-fg"
              aria-label="查找"
            >
              <Search className="size-4" />
            </button>
          </nav>
        </div>
      </header>
      <Spotlight />
    </>
  );
}
