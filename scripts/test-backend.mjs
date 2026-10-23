import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { build } from "esbuild";
import worker from "../dist/server/index.js";
import { openDatabase } from "./local-database.mjs";

const root = resolve(import.meta.dirname, "..");
const config = JSON.parse(await readFile(join(root, "portfolio.config.json"), "utf8"));
const compiled = await build({
  stdin: {
    contents:
      'export {sourceAdapters} from "@/sources"; export {mergeImports} from "@/lib/source-merge";',
    resolveDir: root,
    sourcefile: "backend-test.ts",
  },
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  tsconfig: join(root, "tsconfig.json"),
});
const { sourceAdapters, mergeImports } = await import(
  "data:text/javascript;base64," + Buffer.from(compiled.outputFiles[0].text).toString("base64")
);
let checks = 0;
function check(condition, label) {
  assert.ok(condition, label);
  checks++;
}
async function rejects(fn, status, label) {
  await assert.rejects(fn, (error) => error.status === status, label);
  checks++;
}
const temporary = await mkdtemp(join(tmpdir(), "portfolio-backend-"));
let db = openDatabase(join(temporary, "test.sqlite"));
const token = "test-owner-token-" + "x".repeat(48);
const env = { PORTFOLIO_DB: db, ADMIN_TOKEN: token };
let count = 0;
function request(path, method = "GET", body, auth = token, origin) {
  return new Request(`https://backend.test${path}`, {
    method,
    headers: {
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      "Content-Type": "application/json",
      "cf-connecting-ip": `backend-test-${count++}`,
      ...(origin ? { Origin: origin } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
const api = (path, method = "GET", body, auth = token) =>
  worker.fetch(request(path, method, body, auth), { ...env, PORTFOLIO_DB: db });
const originalFetch = globalThis.fetch;
try {
  check(
    (await worker.fetch(request("/api/admin/knowledge"))).status === 503,
    "Owner backend is disabled without configured secrets and database",
  );
  check(
    (await api("/api/admin/knowledge", "GET", undefined, "")).status === 401,
    "Anonymous callers cannot read drafts",
  );
  check(
    (await api("/api/admin/knowledge", "GET", undefined, "wrong-token")).status === 401,
    "Incorrect owner token is rejected",
  );
  check(
    (
      await worker.fetch(
        request("/api/admin/knowledge", "GET", undefined, token, "https://untrusted.test"),
        env,
      )
    ).status === 403,
    "Unlisted origins cannot use the owner API",
  );
  const preflight = await worker.fetch(
    request("/api/admin/knowledge", "OPTIONS", undefined, "", "https://example.github.io"),
    { ...env, ALLOWED_ORIGIN: "https://example.github.io" },
  );
  check(
    preflight.status === 204 &&
      preflight.headers.get("Access-Control-Allow-Headers").includes("Authorization"),
    "Pages supports authenticated owner preflight",
  );
  let state = await (await api("/api/admin/knowledge")).json();
  check(
    state.revision === 0 && state.draft.entries.every((entry) => !entry.approved),
    "Initial profile material is staged as excluded drafts",
  );
  const before = await (await api("/api/knowledge")).json();
  check(
    !before.entries.some((entry) => entry.sourceId === "linkedin"),
    "Unpublished LinkedIn imports do not enter public knowledge",
  );
  const selected = {
    id: "selected-compiler",
    title: "Selected compiler project",
    kind: "project",
    text: "SELECTED_MARKER: a compiler project.",
    approved: true,
    url: "https://example.com/selected",
  };
  const excluded = {
    ...selected,
    id: "excluded",
    title: "Unpublished",
    text: "EXCLUDED_BACKEND_MARKER",
    approved: false,
  };
  const draft = {
    version: 1,
    ownerName: "Spoofed owner",
    demo: false,
    entries: [selected, excluded],
  };
  const saved = await api("/api/admin/knowledge", "PUT", { revision: state.revision, draft });
  state = await saved.json();
  check(
    saved.status === 200 && state.revision === 1 && state.draft.ownerName === config.profile.name,
    "Saving persists drafts and enforces the configured owner",
  );
  check(
    (await api("/api/admin/knowledge", "PUT", { revision: 0, draft })).status === 409,
    "Stale saves cannot overwrite concurrent edits",
  );
  check(
    (
      await api("/api/admin/knowledge", "PUT", {
        revision: 1,
        draft: { ...draft, entries: [selected, selected] },
      })
    ).status === 400,
    "Duplicate IDs are rejected",
  );
  check(
    (
      await api("/api/admin/knowledge", "PUT", {
        revision: 1,
        draft: { ...draft, entries: [{ ...selected, url: "javascript:alert(1)" }] },
      })
    ).status === 400,
    "Unsafe source URLs are rejected",
  );
  check(
    !(await (await api("/api/knowledge")).text()).includes("SELECTED_MARKER"),
    "Saving a selected draft does not publish it",
  );
  check(
    (await api("/api/admin/publish", "POST", { revision: 0 })).status === 409,
    "Publishing requires the latest revision",
  );
  const published = await api("/api/admin/publish", "POST", { revision: state.revision });
  state = await published.json();
  const publicData = await (await api("/api/knowledge")).json();
  check(
    published.status === 200 &&
      state.publishedAt &&
      publicData.entries.length === 1 &&
      publicData.entries[0].id === selected.id &&
      !publicData.demo,
    "Publishing makes exactly the selected sources available without a rebuild",
  );
  db.close();
  db = openDatabase(join(temporary, "test.sqlite"));
  check(
    (await (await api("/api/knowledge")).json()).entries[0].id === selected.id,
    "Published state survives closing and reopening the SQLite database",
  );
  let modelPayload;
  globalThis.fetch = async (url, options) => {
    modelPayload = JSON.parse(options.body);
    return Response.json({ success: true, result: { response: "A grounded answer." } });
  };
  const answer = await worker.fetch(
    request("/api/chat", "POST", {
      messages: [{ role: "user", content: "Tell me about the compiler project" }],
    }),
    {
      ...env,
      PORTFOLIO_DB: db,
      LLM_PROVIDER: "cloudflare",
      CLOUDFLARE_ACCOUNT_ID: "a".repeat(32),
      CLOUDFLARE_AI_TOKEN: "test-only-token",
    },
  );
  const reply = await answer.json();
  check(
    answer.status === 200 &&
      !reply.demo &&
      reply.sources.length === 1 &&
      modelPayload.messages[0].content.includes("SELECTED_MARKER") &&
      !JSON.stringify(modelPayload).includes("EXCLUDED_BACKEND_MARKER"),
    "Chat uses live published database sources and excludes private drafts",
  );
  state.draft.entries[0].text = "A changed draft that is not published";
  state = await (
    await api("/api/admin/knowledge", "PUT", { revision: state.revision, draft: state.draft })
  ).json();
  check(
    (await (await api("/api/knowledge")).text()).includes("SELECTED_MARKER"),
    "Editing a draft does not alter the published snapshot",
  );
  state.draft.entries = [];
  state = await (
    await api("/api/admin/knowledge", "PUT", { revision: state.revision, draft: state.draft })
  ).json();
  await api("/api/admin/publish", "POST", { revision: state.revision });
  check(
    (await (await api("/api/knowledge")).json()).entries.length === 0,
    "The owner can revoke every published source",
  );

  const linkedinUrl = "https://www.linkedin.com/in/test-owner";
  await rejects(
    () => sourceAdapters.linkedin.import(linkedinUrl),
    422,
    "LinkedIn URLs never pretend to grant detailed profile access",
  );
  await rejects(
    () => sourceAdapters.linkedin.import("https://evil.test/in/test", { text: "Experience" }),
    400,
    "LinkedIn rejects other hosts",
  );
  const linked = await sourceAdapters.linkedin.import(linkedinUrl, {
    text: "About\nCompiler engineer\n\nExperience\nBuilt a parser.",
  });
  check(
    linked.entries.length > 0 &&
      linked.entries.every((entry) => !entry.approved && entry.url === linkedinUrl),
    "Selected LinkedIn text becomes traceable excluded drafts",
  );
  const scholarUrl = "https://scholar.google.com/citations?user=Example_1234&hl=en";
  for (const invalid of [
    "http://scholar.google.com/citations?user=Example_1234",
    "https://scholar.google.com.evil.test/citations?user=Example_1234",
    "https://user:password@scholar.google.com/citations?user=Example_1234",
    "https://127.0.0.1/citations?user=Example_1234",
  ])
    await rejects(
      () => sourceAdapters.scholar.import(invalid),
      400,
      "Scholar importer rejects unsafe target URLs before fetching",
    );
  const csv =
    '"Title","Authors","Publication","Year"\n"A paper, with ""quotes""","A; B","Test Venue","2025"\n"A paper, with ""quotes""","A; B","Test Venue","2025"\n"Another paper","C","Test Venue","2024"';
  const papers = await sourceAdapters.scholar.import(scholarUrl, { text: csv, format: "csv" });
  check(
    papers.entries.length === 2 &&
      papers.entries[0].title === 'A paper, with "quotes"' &&
      papers.entries.every((entry) => !entry.approved && entry.sourceId === "scholar"),
    "Scholar CSV handles quoting, deduplication, provenance, and approval",
  );
  await rejects(
    () =>
      sourceAdapters.scholar.import(scholarUrl, {
        text: 'Title,Authors\n"unclosed',
        format: "csv",
      }),
    400,
    "Malformed CSV fails clearly",
  );
  globalThis.fetch = async () => new Response("Blocked", { status: 429 });
  await rejects(
    () => sourceAdapters.scholar.import(scholarUrl),
    429,
    "Rate limits produce an export fallback without bypass attempts",
  );
  globalThis.fetch = async () => new Response("<html>Sign in or CAPTCHA</html>");
  await rejects(
    () => sourceAdapters.scholar.import(scholarUrl),
    502,
    "Login and challenge pages are not imported as research",
  );
  let target, options;
  globalThis.fetch = async (url, init) => {
    target = url;
    options = init;
    return new Response(
      '<div id="gsc_prf_in">Test Owner</div><table><tr class="gsc_a_tr"><td><a class="gsc_a_at" href="/citations?view_op=view_citation&amp;user=Example_1234&amp;citation_for_view=Example_1234:one">A &amp; B</a><div class="gs_gray">Test Author</div><div class="gs_gray">Test Venue</div></td><td class="gsc_a_y">2025</td></tr></table>',
    );
  };
  const visible = await sourceAdapters.scholar.import(scholarUrl);
  check(
    visible.entries[0].title === "A & B" &&
      visible.entries[0].text.includes("2025") &&
      new URL(target).hostname === "scholar.google.com" &&
      options.redirect === "error",
    "Scholar HTML extracts metadata and never follows arbitrary redirects",
  );
  const stable = await sourceAdapters.scholar.import(scholarUrl, {
    text: "Title,Authors,Year\nA & B,Test Author,2025",
    format: "csv",
  });
  check(
    stable.entries[0].id === visible.entries[0].id,
    "Scholar IDs are stable across HTML and CSV imports",
  );
  globalThis.fetch = async () =>
    new Response(
      Buffer.from(
        '<div id="gsc_prf_in">Test Owner</div><tr class="gsc_a_tr"><td><a class="gsc_a_at">Encoded paper</a><div class="gs_gray">Author café</div><div class="gs_gray">Venue</div></td><td class="gsc_a_y">2025</td></tr>',
        "latin1",
      ),
      { headers: { "Content-Type": "text/html; charset=ISO-8859-1" } },
    );
  const encoded = await sourceAdapters.scholar.import(scholarUrl);
  check(
    encoded.entries[0].text.includes("café") && !encoded.entries[0].text.includes("�"),
    "Scholar’s declared charset is respected without corrupting accented or nonbreaking text",
  );
  const previous = { ...papers.entries[0], approved: true };
  check(
    mergeImports([previous], [{ ...previous, approved: false }])[0].approved,
    "Unchanged imported text preserves an existing selection",
  );
  check(
    !mergeImports([previous], [{ ...previous, text: "Changed", approved: true }])[0].approved,
    "Changed imported text always needs review again",
  );
  check(
    !mergeImports([], [{ ...previous, approved: true }])[0].approved,
    "New imports cannot silently approve themselves",
  );
  const importResponse = await api("/api/admin/import/linkedin", "POST", {
    url: linkedinUrl,
    text: "Selected experience",
  });
  check(
    importResponse.status === 200 &&
      (await importResponse.json()).entries.every((entry) => !entry.approved),
    "Protected connector route produces excluded drafts",
  );
  check(
    (
      await api(
        "/api/admin/import/scholar",
        "POST",
        { url: scholarUrl, format: "csv", text: csv },
        "",
      )
    ).status === 401,
    "Source imports require owner authentication",
  );
  const headers = (await api("/api/admin/knowledge")).headers;
  check(headers.get("Cache-Control") === "no-store", "Owner drafts are never publicly cached");
} finally {
  globalThis.fetch = originalFetch;
  db.close();
  await rm(temporary, { recursive: true, force: true });
}
console.log(
  `${checks} backend checks passed with real SQLite and mocked external services. No live AI calls made.`,
);
