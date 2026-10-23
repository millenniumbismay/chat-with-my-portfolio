import config from "@/portfolio.config.json";
import { readJson, rateLimited } from "@/lib/knowledge";
import {
  authorize,
  loadState,
  saveDraft,
  publishDraft,
  validateDraft,
  type BackendEnv,
} from "@/server/backend";
import { sourceAdapters } from "@/sources";
import { SourceError } from "@/sources/types";

export async function admin(request: Request, env: BackendEnv) {
  if (rateLimited(request, "admin", 30))
    throw new SourceError("Please wait a minute before using the owner API again.", 429);
  await authorize(request, env);
  const db = env.PORTFOLIO_DB!;
  const path = new URL(request.url).pathname;
  if (path === "/api/admin/knowledge" && request.method === "GET")
    return Response.json(await loadState(db));
  const imported = path.match(/^\/api\/admin\/import\/(linkedin|scholar)$/)?.[1] as
    "linkedin" | "scholar" | undefined;
  if (request.method !== "POST" && request.method !== "PUT")
    throw new SourceError("Owner route or method not found.", 404);
  let body;
  try {
    body = await readJson(request, 1_000_000);
  } catch {
    throw new SourceError("Send valid JSON under 1 MB.", 400);
  }
  if (!body || typeof body !== "object") throw new SourceError("Send a JSON object.", 400);
  if (imported) {
    if (request.method !== "POST")
      throw new SourceError("Use POST to import profile sources.", 405);
    const settings = config.sources[imported];
    if (!settings?.enabled)
      throw new SourceError("This connector is disabled in portfolio.config.json.", 404);
    const url = typeof body.url === "string" ? body.url : settings.url;
    if (body.text !== undefined && typeof body.text !== "string")
      throw new SourceError("Imported source text must be a string.", 400);
    return Response.json(
      await sourceAdapters[imported].import(url, { text: body.text, format: body.format }),
    );
  }
  if (!Number.isInteger(body.revision) || body.revision < 0)
    throw new SourceError("Include the server draft’s revision number.", 400);
  if (path === "/api/admin/knowledge" && request.method === "PUT") {
    await loadState(db);
    return Response.json(await saveDraft(db, validateDraft(body.draft), body.revision));
  }
  if (path === "/api/admin/publish" && request.method === "POST")
    return Response.json(await publishDraft(db, body.revision));
  throw new SourceError("Owner route or method not found.", 404);
}
