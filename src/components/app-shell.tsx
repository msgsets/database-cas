"use client";

import type { ReactNode } from "react";
import { QuickNotes } from "@/components/quick-notes";
import { SiteHeader } from "@/components/site-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <div className="lg:pr-[336px]">{children}</div>
      <QuickNotes />
    </div>
  );
}
