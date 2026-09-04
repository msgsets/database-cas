"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin, StickyNote, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { createNote, listNotes, updateNote } from "@/lib/notes-api";
import { notePreview, noteTitle, type Note } from "@/lib/clip-types";
import { useNotesUi } from "@/lib/notes-ui";
import { cn } from "@/lib/utils";

export function QuickNotes() {
  const open = useNotesUi((state) => state.open);
  const setOpen = useNotesUi((state) => state.setOpen);

  return (
    <>
      <aside className="sticky top-24 hidden h-[calc(100dvh-7.5rem)] w-[300px] shrink-0 lg:flex">
        <NotesPanel />
      </aside>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-5 z-40 flex size-14 items-center justify-center rounded-full bg-fg text-bg shadow-float transition-transform duration-150 ease-smooth-out hover:scale-[1.03] active:scale-[0.96]"
          aria-label="打开随手记"
        >
          <StickyNote className="size-5" strokeWidth={1.75} />
        </button>

        <div className={cn("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")}>
          <button
            type="button"
            aria-label="关闭随手记"
            onClick={() => setOpen(false)}
            className={cn(
              "absolute inset-0 bg-fg/30 transition-opacity duration-200",
              open ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-bg shadow-float transition-transform duration-300 ease-smooth-out",
              open ? "translate-y-0" : "translate-y-full",
            )}
          >
            <div className="relative flex items-center justify-center px-4 pt-3">
              <span className="h-1 w-10 rounded-full bg-fill-2" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-2 right-3 flex size-11 items-center justify-center rounded-full text-muted hover:bg-fill"
                aria-label="关闭"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-[420px] overflow-hidden px-4 pb-[env(safe-area-inset-bottom)]">
              {open ? <NotesPanel /> : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NotesPanel() {
  const qc = useQueryClient();
  const notesQuery = useQuery({ queryKey: ["notes"], queryFn: () => listNotes() });
  const notes = notesQuery.data ?? [];
  const pinned = notes.filter((note) => note.pinned);
  const rest = notes.filter((note) => !note.pinned);
  const [draft, setDraft] = useState("");

  const create = useMutation({
    mutationFn: (body: string) => createNote({ data: { body } }),
    onSuccess: (result) => {
      if (!result.ok) return;
      setDraft("");
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const pin = useMutation({
    mutationFn: (input: { id: number; pinned: boolean }) => updateNote({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  function submit() {
    const next = draft.trim();
    if (!next || create.isPending) return;
    create.mutate(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-3">
      <div className="relative shrink-0 rounded-2xl bg-surface shadow-card">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="在想什么？"
          aria-label="随手记"
          rows={4}
          className="min-h-[128px] w-full resize-none rounded-2xl bg-transparent px-4 py-3.5 pb-8 text-[15px] leading-relaxed text-fg outline-none placeholder:text-subtle"
        />
        <p className="pointer-events-none absolute right-3 bottom-2 text-xs text-subtle">⌘ Enter</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-fill px-1.5 py-2">
        {pinned.length ? (
          <ul className="space-y-0.5">
            {pinned.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                onPin={() => pin.mutate({ id: note.id, pinned: false })}
              />
            ))}
          </ul>
        ) : null}

        {rest.length ? (
          <ul className={cn("space-y-0.5", pinned.length && "mt-2")}>
            {rest.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                onPin={() => pin.mutate({ id: note.id, pinned: true })}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function NoteRow({ note, onPin }: { note: Note; onPin: () => void }) {
  const preview = notePreview(note.body);
  return (
    <div className="group flex items-start gap-0.5 rounded-xl pr-1 hover:bg-surface">
      <button
        type="button"
        onClick={onPin}
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
          note.pinned ? "text-fg" : "text-subtle opacity-0 group-hover:opacity-100 hover:text-fg",
        )}
        aria-label={note.pinned ? "取消固定" : "固定"}
      >
        <Pin className="size-3.5" fill={note.pinned ? "currentColor" : "none"} />
      </button>
      <div className="min-w-0 flex-1 py-2 pr-2">
        <p className="truncate text-sm font-medium text-fg">{noteTitle(note.body)}</p>
        {preview ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">{preview}</p>
        ) : null}
      </div>
    </div>
  );
}
