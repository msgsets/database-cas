import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import type { Note } from "@/lib/clip-types";

type NoteRow = {
  id: number;
  body: string;
  created_at: unknown;
  updated_at: unknown;
};

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function mapNote(row: NoteRow): Note {
  return {
    id: Number(row.id),
    body: row.body,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

export const listNotes = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<NoteRow>(
    `select id, body, created_at, updated_at from notes order by updated_at desc`,
  );
  return rows.map(mapNote);
});

export const createNote = createServerFn({ method: "POST" })
  .validator((input: { body: string }) => input)
  .handler(async ({ data }) => {
    const body = data.body.trim();
    if (!body) return { ok: false as const, error: "先写一句" };
    const sql = await getSql();
    const rows = await sql.query<NoteRow>(
      `insert into notes (body) values ($1)
       returning id, body, created_at, updated_at`,
      [body.slice(0, 8000)],
    );
    return { ok: true as const, note: mapNote(rows[0]) };
  });

export const updateNote = createServerFn({ method: "POST" })
  .validator((input: { id: number; body: string }) => input)
  .handler(async ({ data }) => {
    const body = data.body;
    const sql = await getSql();
    const rows = await sql.query<NoteRow>(
      `update notes
       set body = $1, updated_at = now()
       where id = $2
       returning id, body, created_at, updated_at`,
      [body.slice(0, 8000), data.id],
    );
    if (!rows[0]) return { ok: false as const, error: "未找到" };
    return { ok: true as const, note: mapNote(rows[0]) };
  });

export const deleteNote = createServerFn({ method: "POST" })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql.query(`delete from notes where id = $1`, [data.id]);
    return { ok: true as const };
  });
