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
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:pl-12 lg:pr-6">
          <Link
            to="/"
            className={cn(
              "text-[15px] font-medium tracking-tight transition-colors duration-150",
              pathname === "/" ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            HOME
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/library"
              search={DEFAULT_LIBRARY_SEARCH}
              className={cn(
                "flex h-10 items-center px-3 text-[15px] font-medium tracking-tight transition-colors duration-150",
                pathname.startsWith("/library") || pathname.startsWith("/clips")
                  ? "text-fg"
                  : "text-muted hover:text-fg",
              )}
            >
              DATABASE
            </Link>
            <button
              type="button"
              onClick={openSpotlight}
              className="flex size-10 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-fill hover:text-fg"
              aria-label="Search"
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
