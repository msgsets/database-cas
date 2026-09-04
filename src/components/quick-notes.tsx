"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, StickyNote, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createNote, deleteNote, listNotes, updateNote } from "@/lib/notes-api";
import { notePreview, noteTitle, type Note } from "@/lib/clip-types";
import { useNotesUi } from "@/lib/notes-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function QuickNotes() {
  const open = useNotesUi((state) => state.open);
  const setOpen = useNotesUi((state) => state.setOpen);

  return (
    <>
      <aside className="pointer-events-none fixed top-20 right-4 bottom-6 z-40 hidden w-[300px] lg:block">
        <div className="pointer-events-auto flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-float">
          <NotesPanel />
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-5 z-40 flex size-14 items-center justify-center rounded-full bg-fg text-bg shadow-float transition-transform duration-150 ease-smooth-out hover:scale-[1.03] active:scale-[0.96] lg:hidden"
        aria-label="打开随手记"
      >
        <StickyNote className="size-5" strokeWidth={1.75} />
      </button>

      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
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
            "absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-surface shadow-float transition-transform duration-300 ease-smooth-out",
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
          <div className="min-h-0 flex-1 overflow-hidden pb-[env(safe-area-inset-bottom)]">
            {open ? <NotesPanel /> : null}
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
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const savedBody = useRef("");
  const updateRef = useRef<(input: { id: number; body: string }) => void>(() => {});

  const active = notes.find((note) => note.id === activeId) ?? null;

  const create = useMutation({
    mutationFn: (body: string) => createNote({ data: { body } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      qc.invalidateQueries({ queryKey: ["notes"] });
      savedBody.current = result.note.body;
      setActiveId(result.note.id);
      setDraft(result.note.body);
    },
  });

  const update = useMutation({
    mutationFn: (input: { id: number; body: string }) => updateNote({ data: input }),
    onSuccess: (result) => {
      if (result.ok) savedBody.current = result.note.body;
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  updateRef.current = (input) => update.mutate(input);

  const remove = useMutation({
    mutationFn: (id: number) => deleteNote({ data: { id } }),
    onSuccess: (_result, id) => {
      if (activeId === id) {
        setActiveId(null);
        setDraft("");
      }
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  useEffect(() => {
    if (!active) return;
    savedBody.current = active.body;
    setDraft(active.body);
  }, [active?.id]);

  useEffect(() => {
    if (!activeId) return;
    if (draft === savedBody.current) return;
    const timer = setTimeout(() => {
      updateRef.current({ id: activeId, body: draft });
    }, 450);
    return () => clearTimeout(timer);
  }, [draft, activeId]);

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-subtle">03</p>
          <h2 className="text-[17px] font-semibold tracking-tight text-fg">
            随手记
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={() => create.mutate("新笔记")}
          aria-label="新建笔记"
        >
          <Plus className="size-5" />
        </Button>
      </header>

      {active ? (
        <div className="flex min-h-0 flex-1 flex-col border-t border-border/70">
          <div className="flex items-center justify-between px-2">
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="h-10 px-3 text-sm text-primary"
            >
              全部笔记
            </button>
            <button
              type="button"
              onClick={() => remove.mutate(active.id)}
              className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-fill hover:text-danger"
              aria-label="删除笔记"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-0 flex-1 resize-none bg-transparent px-4 pb-4 text-[15px] leading-relaxed text-fg outline-none"
            placeholder="写下一句就好…"
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {notes.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">
              还没有笔记。点右上角写一句。
            </p>
          ) : (
            <ul className="space-y-1">
              {notes.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  onOpen={() => setActiveId(note.id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NoteRow({ note, onOpen }: { note: Note; onOpen: () => void }) {
  const preview = notePreview(note.body);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-fill"
    >
      <p className="truncate text-sm font-medium text-fg">{noteTitle(note.body)}</p>
      {preview ? (
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
          {preview}
        </p>
      ) : null}
    </button>
  );
}
