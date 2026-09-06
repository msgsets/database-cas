"use client";

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { NotesPanel } from "@/components/notes-panel";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
});

function NotesPage() {
  return (
    <AppShell>
      <main className="w-full min-w-0 max-w-3xl">
        <header className="mb-6">
          <h1 className="font-en large-title">NOTES</h1>
        </header>
        <NotesPanel />
      </main>
    </AppShell>
  );
}
