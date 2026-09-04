import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import {
  CLIP_TYPES,
  type Clip,
  type ClipType,
  type LibrarySearch,
  type Tag,
  type TimeFilter,
  type TypeFilter,
} from "@/lib/clip-types";

type ClipRow = {
  id: number;
  kind: "url" | "text";
  type: ClipType;
  url: string | null;
  title: string;
  excerpt: string | null;
  content: string | null;
  site_name: string | null;
  image_url: string | null;
  created_at: unknown;
  tags: unknown;
};

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function parseTags(value: unknown): Tag[] {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      return parseTags(JSON.parse(value));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const tags: Tag[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const rec = item as { id?: unknown; name?: unknown };
    const id = Number(rec.id);
    const name = typeof rec.name === "string" ? rec.name : "";
    if (Number.isFinite(id) && name) tags.push({ id, name });
  }
  return tags;
}

function mapClip(row: ClipRow): Clip {
  return {
    id: Number(row.id),
    kind: row.kind,
    type: row.type,
    url: row.url,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    site_name: row.site_name,
    image_url: row.image_url,
    created_at: toIso(row.created_at),
    tags: parseTags(row.tags),
  };
}

const CLIP_SELECT = `
  select c.id, c.kind, c.type, c.url, c.title, c.excerpt, c.content,
         c.site_name, c.image_url, c.created_at,
         coalesce((
           select json_agg(json_build_object('id', t.id, 'name', t.name) order by t.name)
           from clip_tags ct
           join tags t on t.id = ct.tag_id
           where ct.clip_id = c.id
         ), '[]'::json) as tags
  from clips c
`;

async function loadClip(id: number): Promise<Clip | null> {
  const sql = await getSql();
  const rows = await sql.query<ClipRow>(`${CLIP_SELECT} where c.id = $1`, [id]);
  return rows[0] ? mapClip(rows[0]) : null;
}

export type ListClipsInput = {
  q?: string;
  time?: TimeFilter;
  type?: TypeFilter;
  tag?: string;
  limit?: number;
};

export const listClips = createServerFn({ method: "GET" })
  .validator((input: ListClipsInput) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const q = (data.q ?? "").trim();
    const time = data.time ?? "all";
    const type = data.type ?? "all";
    const tag = (data.tag ?? "").trim();
    const limit = Math.min(Math.max(data.limit ?? 120, 1), 200);

    const clauses: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (type !== "all" && CLIP_TYPES.includes(type)) {
      clauses.push(`c.type = $${i++}`);
      params.push(type);
    }

    if (time === "today") {
      clauses.push(`c.created_at >= date_trunc('day', now())`);
    } else if (time === "week") {
      clauses.push(`c.created_at >= date_trunc('week', now())`);
    } else if (time === "month") {
      clauses.push(`c.created_at >= date_trunc('month', now())`);
    } else if (time === "year") {
      clauses.push(`c.created_at >= date_trunc('year', now())`);
    }

    if (tag) {
      clauses.push(
        `exists (
           select 1 from clip_tags ct
           join tags t on t.id = ct.tag_id
           where ct.clip_id = c.id and t.name = $${i++}
         )`,
      );
      params.push(tag);
    }

    if (q) {
      const like = `%${q.replace(/[\\%_]/g, "")}%`;
      clauses.push(
        `(c.title ilike $${i} or coalesce(c.excerpt, '') ilike $${i} or coalesce(c.content, '') ilike $${i} or coalesce(c.url, '') ilike $${i} or exists (
            select 1 from clip_tags ct
            join tags t on t.id = ct.tag_id
            where ct.clip_id = c.id and t.name ilike $${i}
          ))`,
      );
      params.push(like);
      i += 1;
    }

    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    const countRows = await sql.query<{ n: number }>(
      `select count(*)::int as n from clips c ${where}`,
      params,
    );
    const rows = await sql.query<ClipRow>(
      `${CLIP_SELECT} ${where} order by c.created_at desc limit $${i}`,
      [...params, limit],
    );

    return {
      items: rows.map(mapClip),
      total: Number(countRows[0]?.n ?? 0),
    };
  });

export const getClip = createServerFn({ method: "GET" })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => loadClip(data.id));

export const captureInput = createServerFn({ method: "POST" })
  .validator((input: { input: string }) => input)
  .handler(async ({ data }) => {
    const raw = data.input.trim();
    if (!raw) return { ok: false as const, error: "先粘贴一段文字或链接" };
    if (raw.length > 20_000) {
      return { ok: false as const, error: "内容过长，试试缩短后再保存" };
    }

    const { parseInput } = await import("./parse-input.server");
    const parsed = await parseInput(raw);
    const sql = await getSql();
    const rows = await sql.query<{ id: number }>(
      `insert into clips (kind, type, url, title, excerpt, content, site_name, image_url)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id`,
      [
        parsed.kind,
        parsed.type,
        parsed.url,
        parsed.title,
        parsed.excerpt,
        parsed.content,
        parsed.site_name,
        parsed.image_url,
      ],
    );
    const clip = await loadClip(Number(rows[0].id));
    if (!clip) return { ok: false as const, error: "保存失败" };
    return { ok: true as const, clip };
  });

export const updateClip = createServerFn({ method: "POST" })
  .validator((input: { id: number; title?: string; type?: ClipType }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (typeof data.title === "string") {
      const title = data.title.trim().slice(0, 200);
      if (!title) return { ok: false as const, error: "标题不能为空" };
      sets.push(`title = $${i++}`);
      params.push(title);
    }
    if (data.type && CLIP_TYPES.includes(data.type)) {
      sets.push(`type = $${i++}`);
      params.push(data.type);
    }
    if (!sets.length) {
      const clip = await loadClip(data.id);
      return clip
        ? { ok: true as const, clip }
        : { ok: false as const, error: "未找到" };
    }
    params.push(data.id);
    await sql.query(
      `update clips set ${sets.join(", ")} where id = $${i}`,
      params,
    );
    const clip = await loadClip(data.id);
    if (!clip) return { ok: false as const, error: "未找到" };
    return { ok: true as const, clip };
  });

export const deleteClip = createServerFn({ method: "POST" })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql.query(`delete from clips where id = $1`, [data.id]);
    return { ok: true as const };
  });

export const listTags = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<{ id: number; name: string }>(
    `select id, name from tags order by name asc`,
  );
  return rows.map((row) => ({ id: Number(row.id), name: row.name }));
});

function normalizeTagName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, 20);
}

export const createTag = createServerFn({ method: "POST" })
  .validator((input: { name: string }) => input)
  .handler(async ({ data }) => {
    const name = normalizeTagName(data.name);
    if (!name) return { ok: false as const, error: "标签不能为空" };
    const sql = await getSql();
    const inserted = await sql.query<Tag>(
      `insert into tags (name) values ($1)
       on conflict (name) do nothing
       returning id, name`,
      [name],
    );
    if (inserted[0]) {
      return {
        ok: true as const,
        tag: { id: Number(inserted[0].id), name: inserted[0].name },
      };
    }
    const existing = await sql.query<Tag>(
      `select id, name from tags where name = $1`,
      [name],
    );
    if (!existing[0]) return { ok: false as const, error: "无法保存标签" };
    return {
      ok: true as const,
      tag: { id: Number(existing[0].id), name: existing[0].name },
    };
  });

export const addClipTag = createServerFn({ method: "POST" })
  .validator((input: { clipId: number; name: string }) => input)
  .handler(async ({ data }) => {
    const name = normalizeTagName(data.name);
    if (!name) return { ok: false as const, error: "标签不能为空" };
    const sql = await getSql();
    const inserted = await sql.query<Tag>(
      `insert into tags (name) values ($1)
       on conflict (name) do nothing
       returning id, name`,
      [name],
    );
    let tag = inserted[0];
    if (!tag) {
      const existing = await sql.query<Tag>(
        `select id, name from tags where name = $1`,
        [name],
      );
      tag = existing[0];
    }
    if (!tag) return { ok: false as const, error: "无法保存标签" };
    await sql.query(
      `insert into clip_tags (clip_id, tag_id) values ($1, $2)
       on conflict do nothing`,
      [data.clipId, tag.id],
    );
    const clip = await loadClip(data.clipId);
    if (!clip) return { ok: false as const, error: "未找到" };
    return { ok: true as const, clip };
  });

export const removeClipTag = createServerFn({ method: "POST" })
  .validator((input: { clipId: number; tagId: number }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql.query(
      `delete from clip_tags where clip_id = $1 and tag_id = $2`,
      [data.clipId, data.tagId],
    );
    const clip = await loadClip(data.clipId);
    if (!clip) return { ok: false as const, error: "未找到" };
    return { ok: true as const, clip };
  });

export function toListInput(search: LibrarySearch, limit?: number): ListClipsInput {
  return {
    q: search.q,
    time: search.time,
    type: search.type,
    tag: search.tag,
    limit,
  };
}
