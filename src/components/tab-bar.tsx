"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { isNavActive, NAV_ITEMS } from "@/components/nav-config";
import { cn } from "@/lib/utils";

export function TabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      className="material hairline-t fixed inset-x-0 bottom-0 z-40 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid h-[52px] grid-cols-3">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                search={item.search}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-caption tracking-wide",
                  item.english ? "font-en" : "font-medium",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon
                  className="size-[22px]"
                  strokeWidth={active ? 2.15 : 1.7}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
