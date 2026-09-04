"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { isNavActive, NAV_ITEMS } from "@/components/nav-config";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <aside className="material-heavy fixed inset-y-0 left-0 z-40 hidden w-56 flex-col px-3 pt-5 pb-6 lg:flex">
      <Link to="/" className="font-en mb-6 px-3 text-[22px] tracking-wide text-fg">
        Folio
      </Link>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              search={item.search}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] tracking-tight transition-colors duration-100",
                item.english ? "font-en" : "font-medium",
                active
                  ? "bg-fill text-fg"
                  : "text-muted hover:bg-fill/70 hover:text-fg",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={active ? 2.1 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
