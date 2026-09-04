"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin, Trash2 } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { SwipeRow } from "@/components/swipe-row";
import { haptic } from "@/lib/apple-motion";
import { notePreview, noteTitle, type Note } from "@/lib/clip-types";
import { createNote, deleteNote, listNotes, updateNote } from "@/lib/notes-api";
import { cn } from "@/lib/utils";

export function NotesPanel({
  selectedId,
  onSelect,
}: {
  selectedId?: number | null;
  onSelect?: (id: number | null) => void;
}) {
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
      if (result.note) onSelect?.(result.note.id);
    },
  });

  const pin = useMutation({
    mutationFn: (input: { id: number; pinned: boolean }) => updateNote({ data: input }),
    onSuccess: () => {
      haptic(8);
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteNote({ data: { id } }),
    onSuccess: (_result, id) => {
      haptic(16);
      qc.invalidateQueries({ queryKey: ["notes"] });
      if (selectedId === id) onSelect?.(null);
      toast.success("已删除");
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
    <div className="flex w-full flex-col gap-3">
      <div className="rounded-2xl bg-surface p-4 shadow-card">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="在想什么？"
          aria-label="新笔记"
          rows={3}
          className="min-h-[88px] w-full resize-none bg-transparent text-body leading-relaxed text-fg outline-none placeholder:text-subtle"
        />
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || create.isPending}
            className="h-9 rounded-full px-3.5 text-subhead font-semibold text-primary transition-opacity duration-100 disabled:opacity-30"
          >
            存储
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        {notes.length === 0 ? (
          <p className="px-4 py-12 text-center text-subhead text-muted">还没有笔记</p>
        ) : (
          <ul>
            {pinned.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                selected={selectedId === note.id}
                onOpen={() => onSelect?.(note.id)}
                onPin={() => pin.mutate({ id: note.id, pinned: false })}
                onDelete={() => remove.mutate(note.id)}
              />
            ))}
            {rest.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                selected={selectedId === note.id}
                onOpen={() => onSelect?.(note.id)}
                onPin={() => pin.mutate({ id: note.id, pinned: true })}
                onDelete={() => remove.mutate(note.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NoteRow({
  note,
  selected,
  onOpen,
  onPin,
  onDelete,
}: {
  note: Note;
  selected: boolean;
  onOpen: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const preview = notePreview(note.body);
  return (
    <li className="border-b border-border/50 last:border-b-0">
      <SwipeRow
        action={
          <button
            type="button"
            onClick={onDelete}
            className="flex h-full w-full items-center justify-center bg-danger text-sm font-semibold text-primary-fg"
          >
            删除
          </button>
        }
      >
        <div
          className={cn(
            "flex items-start gap-1 px-1",
            selected ? "bg-fill" : "bg-surface",
          )}
        >
          <button
            type="button"
            onClick={onPin}
            className={cn(
              "mt-1 flex size-10 shrink-0 items-center justify-center rounded-full",
              note.pinned ? "text-primary" : "text-subtle hover:text-fg",
            )}
            aria-label={note.pinned ? "取消固定" : "固定"}
          >
            <Pin className="size-3.5" fill={note.pinned ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="min-w-0 flex-1 py-3 pr-3 text-left"
          >
            <p className="truncate text-subhead font-semibold tracking-tight text-fg">
              {noteTitle(note.body)}
            </p>
            {preview ? (
              <p className="mt-0.5 line-clamp-2 text-footnote leading-relaxed text-muted">
                {preview}
              </p>
            ) : null}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="mt-1 hidden size-10 items-center justify-center rounded-full text-subtle hover:text-danger sm:flex"
            aria-label="删除"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </SwipeRow>
    </li>
  );
}
