"use client";

import type { ReactNode } from "react";
import { QuickNotes } from "@/components/quick-notes";
import { SiteHeader } from "@/components/site-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <div className="flex items-start gap-3 px-4 sm:gap-4 sm:px-6 lg:gap-5 lg:pl-12 lg:pr-6">
        {children}
        <QuickNotes />
      </div>
    </div>
  );
}
