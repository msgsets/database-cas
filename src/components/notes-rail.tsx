"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";
import { SwipeRow } from "@/components/swipe-row";
import { haptic } from "@/lib/apple-motion";
import { notePreview, noteTitle, type Note } from "@/lib/clip-types";
import { createNote, deleteNote, listNotes, updateNote } from "@/lib/notes-api";
import { cn } from "@/lib/utils";

export function NotesRail({ compact = false }: { compact?: boolean }) {
  const qc = useQueryClient();
  const notesQuery = useQuery({ queryKey: ["notes"], queryFn: () => listNotes() });
  const notes = notesQuery.data ?? [];
  const pinned = notes.filter((note) => note.pinned);
  const rest = notes.filter((note) => !note.pinned);
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

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

  const remove = useMutation({
    mutationFn: (id: number) => deleteNote({ data: { id } }),
    onSuccess: (_result, id) => {
      qc.setQueryData<Note[]>(["notes"], (current) =>
        (current ?? []).filter((note) => note.id !== id),
      );
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["notes", "deleted"] });
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

  const list = pinned.concat(rest);

  return (
    <div className={cn("flex w-full flex-col gap-3", compact ? "" : "h-full")}>
      <div className="lift shrink-0 rounded-2xl bg-surface p-4 shadow-card">
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
            className="font-en inline-flex h-11 items-center justify-center rounded-full bg-fg px-5 text-[17px] leading-none text-bg transition-opacity duration-100 disabled:opacity-30"
          >
            save
          </button>
        </div>
      </div>

      <div
        className={cn(
          "min-h-0 overflow-y-auto",
          compact ? (openId ? "max-h-[min(28rem,70dvh)]" : "max-h-52") : "flex-1",
        )}
      >
        {list.length ? (
          <ul className="flex flex-col gap-2">
            {list.map((note) => (
              <li key={note.id}>
                <NoteRow
                  note={note}
                  expanded={openId === note.id}
                  onOpen={() => setOpenId((current) => (current === note.id ? null : note.id))}
                  onPin={() => pin.mutate({ id: note.id, pinned: !note.pinned })}
                  onDelete={() => remove.mutate(note.id)}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function NoteRow({
  note,
  expanded,
  onOpen,
  onPin,
  onDelete,
}: {
  note: Note;
  expanded: boolean;
  onOpen: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const preview = notePreview(note.body);
  const [body, setBody] = useState(note.body);

  useEffect(() => {
    setBody(note.body);
  }, [note.body, note.id]);

  const save = useMutation({
    mutationFn: (next: string) => updateNote({ data: { id: note.id, body: next } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  function persist() {
    const next = body.trim();
    if (!next || next === note.body) return;
    haptic(8);
    save.mutate(next);
  }

  function onEditorKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      persist();
    }
  }

  return (
    <SwipeRow compact onDelete={onDelete}>
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className={cn("flex gap-0.5", expanded ? "items-start" : "items-center")}>
          <button
            type="button"
            data-swipe-ignore
            onClick={onPin}
            className={cn(
              "ml-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
              expanded && "mt-2",
              note.pinned ? "text-fg" : "text-subtle",
            )}
            aria-label={note.pinned ? "取消固定" : "固定"}
          >
            <Pin className="size-3.5" fill={note.pinned ? "currentColor" : "none"} />
          </button>
          {expanded ? (
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onBlur={persist}
              onKeyDown={onEditorKey}
              autoFocus
              className="min-h-[140px] min-w-0 flex-1 resize-none touch-pan-y bg-transparent py-3 pr-3 text-body leading-relaxed text-fg outline-none"
            />
          ) : (
            <button type="button" onClick={onOpen} className="min-w-0 flex-1 py-2 pr-3 text-left">
              <p className="truncate text-subhead font-medium text-fg">{noteTitle(note.body)}</p>
              {preview ? (
                <p className="mt-0.5 line-clamp-2 text-footnote leading-relaxed text-muted">
                  {preview}
                </p>
              ) : null}
            </button>
          )}
        </div>
      </div>
    </SwipeRow>
  );
}
