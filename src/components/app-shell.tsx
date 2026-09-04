"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { isNavActive, NAV_ITEMS } from "@/components/nav-config";
import { Spotlight } from "@/components/spotlight";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const left = NAV_ITEMS.find((item) => item.to === "/")!;
  const right = NAV_ITEMS.filter((item) => item.to !== "/");

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="material sticky top-0 z-30">
        <nav className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4 sm:h-14 sm:px-6">
          <Link
            to={left.to}
            className={cn(
              "font-en text-[17px] tracking-wide",
              isNavActive(pathname, left.to) ? "text-fg" : "text-muted",
            )}
          >
            {left.label}
          </Link>
          <div className="flex items-center gap-5">
            {right.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                search={item.search}
                className={cn(
                  "font-en text-[17px] tracking-wide",
                  isNavActive(pathname, item.to) ? "text-fg" : "text-muted",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <div className="px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:pb-12">
        {children}
      </div>
      <Spotlight />
    </div>
  );
}
