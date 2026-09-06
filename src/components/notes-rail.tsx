"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { haptic } from "@/lib/apple-motion";
import { notePreview, noteTitle, type Note } from "@/lib/clip-types";
import { createNote, listNotes, updateNote } from "@/lib/notes-api";
import { cn } from "@/lib/utils";

export function NotesRail({ compact = false }: { compact?: boolean }) {
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
      haptic(10);
      setDraft("");
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const pin = useMutation({
    mutationFn: (input: { id: number; pinned: boolean }) => updateNote({ data: input }),
    onSuccess: () => {
      haptic(8);
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
    <div className={cn("flex w-full flex-col gap-3", compact ? "" : "h-full")}>
      <div className="shrink-0 rounded-2xl bg-surface p-4 shadow-card">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="在想什么？"
          aria-label="随手记"
          rows={compact ? 3 : 4}
          className="min-h-[112px] w-full resize-none bg-transparent text-body leading-relaxed text-fg outline-none placeholder:text-subtle"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || create.isPending}
            className="font-en h-9 rounded-full px-3.5 text-[17px] text-fg transition-opacity duration-100 disabled:opacity-30"
          >
            save
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-y-auto rounded-2xl bg-fill px-1.5 py-2",
          compact ? "max-h-52" : "min-h-0 flex-1",
        )}
      >
        {pinned.length ? (
          <ul>
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
          <ul className={pinned.length ? "mt-1" : undefined}>
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
          note.pinned ? "text-fg" : "text-subtle lg:opacity-0 lg:group-hover:opacity-100 hover:text-fg",
        )}
        aria-label={note.pinned ? "取消固定" : "固定"}
      >
        <Pin className="size-3.5" fill={note.pinned ? "currentColor" : "none"} />
      </button>
      <div className="min-w-0 flex-1 py-2 pr-2">
        <p className="truncate text-subhead font-medium text-fg">{noteTitle(note.body)}</p>
        {preview ? (
          <p className="mt-0.5 line-clamp-2 text-footnote leading-relaxed text-muted">{preview}</p>
        ) : null}
      </div>
    </div>
  );
}
