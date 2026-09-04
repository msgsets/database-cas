"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StickyNote, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createNote, listNotes, updateNote } from "@/lib/notes-api";
import { useNotesUi } from "@/lib/notes-ui";
import { cn } from "@/lib/utils";

export function QuickNotes() {
  const open = useNotesUi((state) => state.open);
  const setOpen = useNotesUi((state) => state.setOpen);

  return (
    <>
      <aside className="hidden w-[280px] shrink-0 lg:block">
        <NoteComposer className="h-44 shadow-card" />
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
            <div className="px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {open ? <NoteComposer className="h-48" /> : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NoteComposer({ className }: { className?: string }) {
  const qc = useQueryClient();
  const notesQuery = useQuery({ queryKey: ["notes"], queryFn: () => listNotes() });
  const latest = notesQuery.data?.[0] ?? null;
  const [draft, setDraft] = useState("");
  const savedBody = useRef("");
  const idRef = useRef<number | null>(null);
  const creating = useRef(false);
  const updateRef = useRef<(input: { id: number; body: string }) => void>(() => {});

  useEffect(() => {
    if (!latest) return;
    if (idRef.current && idRef.current !== latest.id) return;
    idRef.current = latest.id;
    savedBody.current = latest.body;
    setDraft(latest.body);
  }, [latest?.id, latest?.body]);

  const create = useMutation({
    mutationFn: (body: string) => createNote({ data: { body } }),
    onSuccess: (result) => {
      creating.current = false;
      if (!result.ok) return;
      idRef.current = result.note.id;
      savedBody.current = result.note.body;
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: () => {
      creating.current = false;
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

  useEffect(() => {
    const next = draft;
    if (next === savedBody.current) return;
    const timer = setTimeout(() => {
      const id = idRef.current;
      if (id) {
        updateRef.current({ id, body: next });
        return;
      }
      if (!next.trim() || creating.current) return;
      creating.current = true;
      create.mutate(next.trim());
    }, 450);
    return () => clearTimeout(timer);
  }, [draft]);

  return (
    <textarea
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      placeholder="在想什么？"
      aria-label="随手记"
      className={cn(
        "w-full resize-none rounded-2xl bg-surface px-4 py-3.5 text-[15px] leading-relaxed text-fg outline-none placeholder:text-subtle",
        "transition-[box-shadow] duration-150 ease-smooth-out",
        "focus:shadow-[0_0_0_4px_rgba(0,113,227,0.18)]",
        className,
      )}
    />
  );
}
