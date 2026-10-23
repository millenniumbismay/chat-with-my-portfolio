import config from "@/portfolio.config.json";
import seeds from "@/content/source-drafts.json";
import { approvedEntries, publicKnowledge, type Entry } from "@/lib/knowledge";
import { SourceError } from "@/sources/types";

// The small subset of D1 used here is also implemented by the local SQLite adapter.
export type Database = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      first<T>(): Promise<T | null>;
      run(): Promise<{ meta: { changes: number } }>;
    };
  };
};
export type BackendEnv = { PORTFOLIO_DB?: Database; [key: string]: unknown };
export type Draft = { version: 1; ownerName: string; demo: boolean; entries: Entry[] };
type State = {
  draft_json: string;
  published_json: string | null;
  revision: number;
  published_at: string | null;
};

export function stringEnv(env: BackendEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter((item): item is [string, string] => typeof item[1] === "string"),
  );
}

export function validateDraft(value: unknown): Draft {
  const data = value as Draft;
  if (
    !data ||
    data.version !== 1 ||
    typeof data.demo !== "boolean" ||
    !Array.isArray(data.entries) ||
    data.entries.length > 500
  )
    throw new SourceError("Send a version 1 knowledge file with at most 500 entries.", 400);
  const ids = new Set<string>();
  const entries = data.entries.map((entry) => {
    for (const [key, max] of [
      ["id", 200],
      ["title", 200],
      ["kind", 40],
      ["text", 20000],
    ] as const)
      if (typeof entry?.[key] !== "string" || !entry[key].trim() || entry[key].length > max)
        throw new SourceError(
          `Each source needs valid ${key} text (up to ${max} characters).`,
          400,
        );
    if (ids.has(entry.id) || typeof entry.approved !== "boolean" || typeof entry.url !== "string")
      throw new SourceError(
        "Source IDs must be unique, with an explicit selection and a source URL field.",
        400,
      );
    ids.add(entry.id);
    if (entry.url) {
      let url;
      try {
        url = new URL(entry.url);
      } catch {
        throw new SourceError("Invalid source URL.", 400);
      }
      if (url.protocol !== "https:" || url.username || url.password)
        throw new SourceError("Source URLs must use HTTPS without credentials.", 400);
    }
    return {
      id: entry.id,
      title: entry.title,
      kind: entry.kind,
      text: entry.text,
      url: entry.url,
      approved: entry.approved,
      ...(typeof entry.sourceId === "string" && entry.sourceId.length <= 40
        ? { sourceId: entry.sourceId }
        : {}),
      ...(typeof entry.updatedAt === "string" && entry.updatedAt.length <= 40
        ? { updatedAt: entry.updatedAt }
        : {}),
    };
  });
  return { version: 1, ownerName: config.profile.name, demo: data.demo, entries };
}

export async function authorize(request: Request, env: BackendEnv) {
  const token = env.ADMIN_TOKEN;
  if (typeof token !== "string" || token.length < 32 || !env.PORTFOLIO_DB)
    throw new SourceError(
      "Owner backend needs a database and ADMIN_TOKEN of at least 32 characters. See docs/backend.md.",
      503,
    );
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!supplied || supplied.length > 512)
    throw new SourceError("Enter the owner access token.", 401);
  const digest = (value: string) =>
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const [a, b] = await Promise.all([digest(token), digest(supplied)]);
  const left = new Uint8Array(a),
    right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  if (difference) throw new SourceError("The owner access token is incorrect.", 401);
}

export async function loadState(db: Database) {
  const draft = validateDraft({
    version: 1,
    demo: false,
    entries: seeds.ownerName === config.profile.name ? seeds.entries : [],
  });
  await db
    .prepare("INSERT OR IGNORE INTO portfolio_state (id, draft_json) VALUES (?, ?)")
    .bind(config.id, JSON.stringify(draft))
    .run();
  const row = await db
    .prepare(
      "SELECT draft_json, published_json, revision, published_at FROM portfolio_state WHERE id = ?",
    )
    .bind(config.id)
    .first<State>();
  if (!row) throw new Error("Missing database state");
  return {
    draft: validateDraft(JSON.parse(row.draft_json)),
    revision: row.revision,
    publishedAt: row.published_at,
  };
}

export async function saveDraft(db: Database, draft: Draft, revision: number) {
  const result = await db
    .prepare(
      "UPDATE portfolio_state SET draft_json = ?, revision = revision + 1 WHERE id = ? AND revision = ?",
    )
    .bind(JSON.stringify(draft), config.id, revision)
    .run();
  if (!result.meta.changes)
    throw new SourceError(
      "The server draft changed. Reload it before saving to avoid overwriting another edit.",
      409,
    );
  return loadState(db);
}

export async function publishDraft(db: Database, revision: number) {
  const state = await loadState(db);
  if (state.revision !== revision)
    throw new SourceError("Save or reload the latest draft before publishing.", 409);
  const published = { ...state.draft, entries: approvedEntries(state.draft.entries) };
  const result = await db
    .prepare(
      "UPDATE portfolio_state SET published_json = ?, published_at = ?, revision = revision + 1 WHERE id = ? AND revision = ?",
    )
    .bind(JSON.stringify(published), new Date().toISOString(), config.id, revision)
    .run();
  if (!result.meta.changes)
    throw new SourceError("The draft changed during publication. Reload and try again.", 409);
  return loadState(db);
}

export async function loadPublicKnowledge(env: BackendEnv) {
  if (!env.PORTFOLIO_DB) return publicKnowledge();
  const row = await env.PORTFOLIO_DB.prepare(
    "SELECT published_json FROM portfolio_state WHERE id = ?",
  )
    .bind(config.id)
    .first<{ published_json: string | null }>();
  if (!row?.published_json) return publicKnowledge();
  const published = validateDraft(JSON.parse(row.published_json));
  return { ...published, entries: approvedEntries(published.entries) };
}
