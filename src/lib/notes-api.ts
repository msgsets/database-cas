import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import type { Note } from "@/lib/clip-types";

type NoteRow = {
  id: number;
  body: string;
  pinned: boolean;
  created_at: unknown;
  updated_at: unknown;
  deleted_at: unknown;
};

const NOTE_COLS = "id, body, pinned, created_at, updated_at, deleted_at";

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function toIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  return toIso(value);
}

function mapNote(row: NoteRow): Note {
  return {
    id: Number(row.id),
    body: row.body,
    pinned: Boolean(row.pinned),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    deleted_at: toIsoOrNull(row.deleted_at),
  };
}

export const getNote = createServerFn({ method: "GET" })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<NoteRow>(
      `select ${NOTE_COLS} from notes where id = $1 and deleted_at is null`,
      [data.id],
    );
    return rows[0] ? mapNote(rows[0]) : null;
  });

export const listNotes = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<NoteRow>(
    `select ${NOTE_COLS}
     from notes
     where deleted_at is null
     order by pinned desc, updated_at desc`,
  );
  return rows.map(mapNote);
});

export const listDeletedNotes = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<NoteRow>(
    `select ${NOTE_COLS}
     from notes
     where deleted_at is not null
     order by deleted_at desc`,
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
       returning ${NOTE_COLS}`,
      [body.slice(0, 8000)],
    );
    return { ok: true as const, note: mapNote(rows[0]) };
  });

export const updateNote = createServerFn({ method: "POST" })
  .validator((input: { id: number; body?: string; pinned?: boolean }) => input)
  .handler(async ({ data }) => {
    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (typeof data.body === "string") {
      sets.push(`body = $${i++}`);
      vals.push(data.body.slice(0, 8000));
    }
    if (typeof data.pinned === "boolean") {
      sets.push(`pinned = $${i++}`);
      vals.push(data.pinned);
    }
    if (!sets.length) return { ok: false as const, error: "无变更" };
    sets.push("updated_at = now()");
    vals.push(data.id);
    const sql = await getSql();
    const rows = await sql.query<NoteRow>(
      `update notes
       set ${sets.join(", ")}
       where id = $${i} and deleted_at is null
       returning ${NOTE_COLS}`,
      vals,
    );
    if (!rows[0]) return { ok: false as const, error: "未找到" };
    return { ok: true as const, note: mapNote(rows[0]) };
  });

export const deleteNote = createServerFn({ method: "POST" })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql.query(
      `update notes
       set deleted_at = now(), pinned = false, updated_at = now()
       where id = $1 and deleted_at is null`,
      [data.id],
    );
    return { ok: true as const };
  });

export const restoreNote = createServerFn({ method: "POST" })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<NoteRow>(
      `update notes
       set deleted_at = null, updated_at = now()
       where id = $1 and deleted_at is not null
       returning ${NOTE_COLS}`,
      [data.id],
    );
    if (!rows[0]) return { ok: false as const, error: "未找到" };
    return { ok: true as const, note: mapNote(rows[0]) };
  });

export const purgeNote = createServerFn({ method: "POST" })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql.query(`delete from notes where id = $1 and deleted_at is not null`, [data.id]);
    return { ok: true as const };
  });
