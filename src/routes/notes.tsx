"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { NotesPanel } from "@/components/notes-panel";
import { haptic } from "@/lib/apple-motion";
import { getNote, listNotes, updateNote } from "@/lib/notes-api";
import { noteTitle } from "@/lib/clip-types";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
});

function NotesPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const notesQuery = useQuery({ queryKey: ["notes"], queryFn: () => listNotes() });
  const selected = (notesQuery.data ?? []).find((note) => note.id === selectedId) ?? null;

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-3xl min-w-0">
        {selected ? (
          <NoteEditor
            id={selected.id}
            initialBody={selected.body}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <>
            <header className="mb-6">
              <h1 className="font-en large-title">Notes</h1>
            </header>
            <NotesPanel selectedId={selectedId} onSelect={setSelectedId} />
          </>
        )}
      </main>
    </AppShell>
  );
}

function NoteEditor({
  id,
  initialBody,
  onBack,
}: {
  id: number;
  initialBody: string;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [body, setBody] = useState(initialBody);

  const noteQuery = useQuery({
    queryKey: ["note", id],
    queryFn: () => getNote({ data: { id } }),
    initialData: undefined,
  });

  useEffect(() => {
    if (typeof noteQuery.data?.body === "string") setBody(noteQuery.data.body);
  }, [noteQuery.data?.body, id]);

  useEffect(() => {
    setBody(initialBody);
  }, [id, initialBody]);

  const save = useMutation({
    mutationFn: (next: string) => updateNote({ data: { id, body: next } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  function persist() {
    if (body !== initialBody) {
      haptic(8);
      save.mutate(body);
    }
  }

  return (
    <article>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            persist();
            onBack();
          }}
          className="font-en inline-flex h-11 items-center gap-1 -ml-2 pr-3 text-[15px] text-primary"
        >
          <ChevronLeft className="size-5" strokeWidth={2} />
          Notes
        </button>
        <button
          type="button"
          onClick={() => {
            persist();
            onBack();
          }}
          className="h-11 px-2 text-subhead font-semibold text-primary"
        >
          完成
        </button>
      </div>
      <div className="rounded-2xl bg-surface p-5 shadow-card sm:p-6">
        <p className="text-caption font-medium tracking-wide text-subtle">
          {noteTitle(body)}
        </p>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onBlur={persist}
          className="mt-3 min-h-[50vh] w-full resize-none bg-transparent text-body leading-relaxed text-fg outline-none"
          autoFocus
        />
      </div>
    </article>
  );
}
