"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";
import { SwipeRow } from "@/components/swipe-row";
import { haptic } from "@/lib/apple-motion";
import { notePreview, noteTitle, type Note } from "@/lib/clip-types";
import {
  createNote,
  deleteNote,
  listDeletedNotes,
  listNotes,
  purgeNote,
  restoreNote,
  updateNote,
} from "@/lib/notes-api";
import { cn } from "@/lib/utils";

function invalidateNotes(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["notes"] });
  qc.invalidateQueries({ queryKey: ["notes", "deleted"] });
}

export function NotesPanel({
  selectedId,
  onSelect,
}: {
  selectedId?: number | null;
  onSelect?: (id: number | null) => void;
}) {
  const qc = useQueryClient();
  const notesQuery = useQuery({ queryKey: ["notes"], queryFn: () => listNotes() });
  const deletedQuery = useQuery({
    queryKey: ["notes", "deleted"],
    queryFn: () => listDeletedNotes(),
  });
  const notes = notesQuery.data ?? [];
  const deleted = deletedQuery.data ?? [];
  const pinned = notes.filter((note) => note.pinned);
  const rest = notes.filter((note) => !note.pinned);
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState<number | null>(selectedId ?? null);

  const create = useMutation({
    mutationFn: (body: string) => createNote({ data: { body } }),
    onSuccess: (result) => {
      if (!result.ok) return;
      haptic(10);
      setDraft("");
      invalidateNotes(qc);
      if (result.note) {
        setOpenId(result.note.id);
        onSelect?.(result.note.id);
      }
    },
  });

  const pin = useMutation({
    mutationFn: (input: { id: number; pinned: boolean }) => updateNote({ data: input }),
    onSuccess: () => {
      haptic(8);
      invalidateNotes(qc);
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteNote({ data: { id } }),
    onSuccess: (_result, id) => {
      qc.setQueryData<Note[]>(["notes"], (current) =>
        (current ?? []).filter((note) => note.id !== id),
      );
      invalidateNotes(qc);
      if (openId === id) setOpenId(null);
      if (selectedId === id) onSelect?.(null);
    },
  });

  const restore = useMutation({
    mutationFn: (id: number) => restoreNote({ data: { id } }),
    onSuccess: (_result, id) => {
      haptic(10);
      qc.setQueryData<Note[]>(["notes", "deleted"], (current) =>
        (current ?? []).filter((note) => note.id !== id),
      );
      invalidateNotes(qc);
    },
  });

  const purge = useMutation({
    mutationFn: (id: number) => purgeNote({ data: { id } }),
    onSuccess: (_result, id) => {
      qc.setQueryData<Note[]>(["notes", "deleted"], (current) =>
        (current ?? []).filter((note) => note.id !== id),
      );
      invalidateNotes(qc);
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

  function toggle(id: number) {
    const next = openId === id ? null : id;
    setOpenId(next);
    onSelect?.(next);
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="lift rounded-2xl bg-surface p-4 shadow-card">
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
            className="font-en inline-flex h-9 items-center justify-center rounded-full bg-fg px-4 text-[15px] leading-none text-bg transition-opacity duration-100 disabled:opacity-30"
          >
            save
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="px-4 py-8 text-center text-subhead text-muted">还没有笔记</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pinned.concat(rest).map((note) => (
            <li key={note.id}>
              <NoteRow
                note={note}
                expanded={openId === note.id}
                onOpen={() => toggle(note.id)}
                onPin={() => pin.mutate({ id: note.id, pinned: !note.pinned })}
                onDelete={() => remove.mutate(note.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <section className="mt-5">
        <h2 className="font-en mb-3 text-[22px] leading-none tracking-wide text-fg">DELETED</h2>
        {deleted.length === 0 ? (
          <p className="px-1 py-2 text-footnote text-muted">左滑删除的笔记会出现在这里</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {deleted.map((note) => (
              <li key={note.id}>
                <DeletedRow
                  note={note}
                  onRestore={() => restore.mutate(note.id)}
                  onPurge={() => purge.mutate(note.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
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
      invalidateNotes(qc);
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
    <SwipeRow onDelete={onDelete}>
      <div className="lift overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className={cn("flex gap-0.5", expanded ? "items-start" : "items-center")}>
          <button
            type="button"
            data-swipe-ignore
            onClick={onPin}
            className={cn(
              "ml-1 flex size-10 shrink-0 items-center justify-center rounded-full",
              expanded && "mt-1.5",
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
              className="min-h-[140px] min-w-0 flex-1 resize-none touch-pan-y bg-transparent py-3 pr-4 text-body leading-relaxed text-fg outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className="min-w-0 flex-1 py-3 pr-4 text-left"
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
          )}
        </div>
      </div>
    </SwipeRow>
  );
}

function DeletedRow({
  note,
  onRestore,
  onPurge,
}: {
  note: Note;
  onRestore: () => void;
  onPurge: () => void;
}) {
  const preview = notePreview(note.body);
  return (
    <SwipeRow onDelete={onPurge}>
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <button
          type="button"
          onClick={onRestore}
          className="w-full px-4 py-3 text-left"
        >
          <p className="truncate text-subhead font-semibold tracking-tight text-muted">
            {noteTitle(note.body)}
          </p>
          {preview ? (
            <p className="mt-0.5 line-clamp-2 text-footnote leading-relaxed text-subtle">
              {preview}
            </p>
          ) : null}
          <p className="mt-1 text-[11px] leading-none text-subtle">点击恢复</p>
        </button>
      </div>
    </SwipeRow>
  );
}
