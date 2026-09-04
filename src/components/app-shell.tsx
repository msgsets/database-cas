"use client";

import type { ReactNode } from "react";
import { QuickNotes } from "@/components/quick-notes";
import { SiteHeader } from "@/components/site-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <div className="flex items-start gap-3 px-4 pt-8 sm:gap-4 sm:px-6 sm:pt-10 lg:gap-5 lg:px-12">
        <div className="w-full min-w-0 max-w-3xl shrink-0">{children}</div>
        <QuickNotes />
      </div>
    </div>
  );
}
