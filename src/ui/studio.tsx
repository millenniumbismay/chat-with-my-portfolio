"use client";

import config from "@/portfolio.config.json";
import { assistant } from "@/content/assistant";
import { profile } from "@/content/site";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  Github,
  Info,
  Plus,
  Trash2,
  Upload,
} from "@/components/icons";
import { apiFetch } from "@/client/api";
import { Asterisk } from "./portfolio";
import ThemeToggle from "@/components/theme-toggle";

type Entry = {
  id: string;
  title: string;
  kind: string;
  text: string;
  url: string;
  approved: boolean;
};
type Draft = { ownerName: string; demo: boolean; entries: Entry[] };
const blank = { title: "", kind: "note", text: "", url: "" };
const storageKey = `portfolio:${config.id}:knowledge-v1`;
// Preserve browser drafts saved before the project was renamed.
const legacyStorageKey = `fieldnotes:${config.id}:knowledge-v1`;
function validDraft(data: unknown): data is Draft {
  if (!data || typeof data !== "object") return false;
  const draft = data as Draft;
  return (
    typeof draft.ownerName === "string" &&
    draft.ownerName.length <= 100 &&
    typeof draft.demo === "boolean" &&
    Array.isArray(draft.entries) &&
    draft.entries.length <= 500 &&
    draft.entries.every(
      (e) =>
        e &&
        typeof e.id === "string" &&
        typeof e.title === "string" &&
        e.title.length <= 200 &&
        typeof e.kind === "string" &&
        typeof e.text === "string" &&
        e.text.length <= 20000 &&
        typeof e.url === "string" &&
        typeof e.approved === "boolean",
    )
  );
}

export default function Studio() {
  const [draft, setDraft] = useState<Draft>({ ownerName: profile.name, demo: true, entries: [] });
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const [username, setUsername] = useState(config.sources.github.username);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [clearPending, setClearPending] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const saved = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (validDraft(parsed)) {
            if (active) {
              setDraft({ ...parsed, ownerName: profile.name });
              setReady(true);
            }
            return;
          }
        }
      } catch {
        if (active) setStorageError(true);
      }
      try {
        const response = await apiFetch("/api/knowledge");
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (active && validDraft(data)) setDraft({ ...data, ownerName: profile.name });
      } catch {
        if (active)
          setError("Couldn’t load the published knowledge. You can still add entries here.");
      }
      if (active) setReady(true);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      setStorageError(true);
    }
  }, [draft, ready]);
  const selected = draft.entries.filter((e) => e.approved).length;
  function addEntry() {
    setError("");
    if (!form.title.trim() || !form.text.trim()) {
      setError("Add a title and some source text first.");
      return;
    }
    if (form.url) {
      try {
        if (new URL(form.url).protocol !== "https:") throw new Error();
      } catch {
        setError("Source links must be complete HTTPS URLs.");
        return;
      }
    }
    if (draft.entries.length >= 500 && !editId) {
      setError("This draft has reached the 500-entry limit.");
      return;
    }
    const next = {
      ...form,
      title: form.title.trim(),
      text: form.text.trim(),
      id: editId || crypto.randomUUID(),
      approved: false,
    };
    setDraft((d) => ({
      ...d,
      entries: editId ? d.entries.map((e) => (e.id === editId ? next : e)) : [...d.entries, next],
    }));
    setForm(blank);
    setEditId(null);
    setNotice("Saved as an excluded draft. Select its checkbox when you’re ready to include it.");
  }
  async function importGithub() {
    if (!username.trim() || importing) return;
    setImporting(true);
    setError("");
    setNotice("");
    try {
      const response = await apiFetch(
        `/api/import/github?username=${encodeURIComponent(username.trim())}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setDraft((d) => {
        const existing = new Set(d.entries.map((e) => e.id));
        const fresh: Entry[] = data.entries
          .filter((e: Entry) => !existing.has(e.id))
          .slice(0, 500 - d.entries.length);
        return { ...d, entries: [...d.entries, ...fresh] };
      });
      setNotice(
        data.entries.length
          ? `${data.entries.length} public repository summaries fetched. Existing entries are preserved. All new entries are excluded until you select them. This imports summaries, not READMEs or code.`
          : "No eligible public repositories found. Forks and archived repositories are excluded.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t import repositories.");
    } finally {
      setImporting(false);
    }
  }
  function exportKnowledge() {
    setError("");
    if (!selected) {
      setError("Select at least one source to export.");
      return;
    }
    const exported = {
      version: 1,
      ownerName: draft.ownerName.trim() || "Portfolio owner",
      demo: draft.demo,
      entries: draft.entries.filter((e) => e.approved),
    };
    const blob = new Blob([JSON.stringify(exported, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "knowledge.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      `Exported ${selected} selected sources. Replace content/knowledge.json in the project and redeploy to update the live assistant. The live site has not changed.`,
    );
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (file.size > 2000000) {
      setError("Please choose a JSON file under 2 MB.");
      return;
    }
    try {
      const data = JSON.parse(await file.text());
      if (!validDraft(data)) throw new Error();
      setDraft({ ...data, ownerName: profile.name });
      setNotice(
        "Loaded your knowledge file into this browser draft. The live site has not changed.",
      );
    } catch {
      setError("That file isn’t a valid knowledge.json export.");
    }
  }
  return (
    <div className="shell studio-shell">
      <header className="studio-header">
        <a href="../">
          <ArrowLeft size={15} />
          Back to portfolio
        </a>
        <div className="header-actions">
          <span className="studio-badge">Browser draft</span>
          <ThemeToggle />
        </div>
      </header>
      <main>
        <section className="studio-intro">
          <div className="eyebrow">
            <Asterisk /> Source studio
          </div>
          <h1>Choose what I know.</h1>
          <p>
            Choose what {assistant.name}, your {assistant.role}, knows. Bring in your work, add
            context, and include only the things you want to be part of the conversation.
          </p>
        </section>
        <div className="studio-notice">
          <Info size={17} />
          <p>
            This workspace is a local drafting tool. Edits{" "}
            {storageError ? "are kept in memory for this session" : "are saved in this browser"},
            and do not change the live assistant. Export selected sources, replace the project’s
            knowledge file, and redeploy to publish. No accounts are connected here.
          </p>
        </div>
        {storageError && (
          <div className="studio-status studio-error">
            Browser storage is unavailable. Export before leaving this page to avoid losing this
            session’s draft.
          </div>
        )}
        {error && (
          <div className="studio-status studio-error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="studio-status" role="status">
            {notice}
          </div>
        )}
        {!ready ? (
          <p className="studio-empty">Loading your workspace…</p>
        ) : (
          <div className="studio-layout">
            <aside className="studio-controls">
              <div className="studio-box">
                <h2>The person behind it.</h2>
                <label className="studio-field">
                  <span>Your name</span>
                  <input value={profile.name} readOnly />
                  <small>Set your name in portfolio.config.json.</small>
                </label>
                <label
                  className="studio-item-label"
                  style={{ fontSize: 10, marginTop: 17, color: "var(--muted)" }}
                >
                  <input
                    type="checkbox"
                    checked={draft.demo}
                    onChange={(e) => setDraft((d) => ({ ...d, demo: e.target.checked }))}
                  />
                  Use illustrative demo replies
                </label>
                <p className="studio-publish-note">
                  Turn demo replies off when your real sources and server API key are ready.
                </p>
                <button className="button dark" onClick={exportKnowledge}>
                  <Download size={14} />
                  Export selected knowledge
                </button>
                <label className="studio-file-label">
                  <Upload size={12} />
                  Load knowledge file
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={(e) => {
                      void importFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {config.sources.github.enabled && (
                <div className="studio-box">
                  <h2>From GitHub.</h2>
                  <p>Import public repository summaries. Nothing is included automatically.</p>
                  <label className="studio-field">
                    <span>GitHub username</span>
                    <input
                      placeholder="your-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={39}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void importGithub();
                      }}
                    />
                  </label>
                  <button
                    className="button dark"
                    disabled={importing || !username.trim()}
                    onClick={importGithub}
                  >
                    <Github size={14} />
                    {importing ? "Importing…" : "Import repositories"}
                  </button>
                </div>
              )}
              {config.sources.manual.enabled && (
                <div className="studio-box" ref={formRef}>
                  <h2>{editId ? "Refine a source." : "In your own words."}</h2>
                  <p>
                    Add selected LinkedIn experience, a blog post, a paper abstract, or context from
                    a project. Paste only what you want to share.
                  </p>
                  <label className="studio-field">
                    <span>Source type</span>
                    <select
                      value={form.kind}
                      onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                    >
                      {[
                        "note",
                        "about",
                        "linkedin",
                        "github",
                        "blog",
                        "publication",
                        "project",
                      ].map((k) => (
                        <option value={k} key={k}>
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="studio-field">
                    <span>Title</span>
                    <input
                      maxLength={200}
                      placeholder="A project, a role, an idea…"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </label>
                  <label className="studio-field">
                    <span>Selected source text</span>
                    <textarea
                      maxLength={20000}
                      placeholder="The context your AI should know…"
                      value={form.text}
                      onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                    />
                  </label>
                  <label className="studio-field">
                    <span>Source URL (optional)</span>
                    <input
                      type="url"
                      placeholder="https://…"
                      value={form.url}
                      onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    />
                  </label>
                  <button className="button dark" onClick={addEntry}>
                    <Plus size={14} />
                    {editId ? "Save edited draft" : "Add as a draft"}
                  </button>
                  {editId && (
                    <div className="studio-add-actions">
                      <button
                        onClick={() => {
                          setEditId(null);
                          setForm(blank);
                        }}
                      >
                        Cancel editing
                      </button>
                    </div>
                  )}
                </div>
              )}
            </aside>
            <section className="studio-list" aria-label="Knowledge sources">
              <div className="studio-list-header">
                <h2>Your selected world.</h2>
                <span>
                  {selected} / {draft.entries.length} INCLUDED
                </span>
              </div>
              <div className="studio-add-actions">
                <button
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      entries: d.entries.map((e) => ({ ...e, approved: false })),
                    }))
                  }
                >
                  Deselect all
                </button>
                <button
                  onClick={() => {
                    if (clearPending) {
                      setDraft((d) => ({ ...d, entries: [] }));
                      setClearPending(false);
                      setNotice("All browser draft entries removed. The live site is unchanged.");
                    } else {
                      setClearPending(true);
                    }
                  }}
                >
                  <Trash2 size={10} style={{ display: "inline", marginRight: 4 }} />
                  {clearPending ? "Confirm clear draft" : "Clear draft"}
                </button>
                {clearPending && <button onClick={() => setClearPending(false)}>Cancel</button>}
              </div>
              {!draft.entries.length && (
                <div className="studio-empty">
                  Your knowledge starts with a source.
                  <br />
                  Import repositories, load a file, or add your own text.
                </div>
              )}
              {draft.entries.map((entry) => (
                <article className="studio-item" key={entry.id}>
                  <div className="studio-item-heading">
                    <label className="studio-item-label">
                      <input
                        type="checkbox"
                        checked={entry.approved}
                        aria-label={`Include ${entry.title} in exported knowledge`}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            entries: d.entries.map((item) =>
                              item.id === entry.id ? { ...item, approved: e.target.checked } : item,
                            ),
                          }))
                        }
                      />
                      <div>
                        <h3>{entry.title}</h3>
                        <div className="studio-item-kind">
                          {entry.kind} · {entry.approved ? "Included in export" : "Excluded draft"}
                        </div>
                      </div>
                    </label>
                  </div>
                  <p>{entry.text}</p>
                  <div className="studio-item-foot">
                    {entry.url.startsWith("https://") ? (
                      <a href={entry.url} rel="noreferrer" target="_blank">
                        {entry.url} <ArrowUpRight size={10} style={{ display: "inline" }} />
                      </a>
                    ) : (
                      <span>Owner-provided text</span>
                    )}
                    <div className="studio-item-actions">
                      <button
                        onClick={() => {
                          setEditId(entry.id);
                          setForm({
                            title: entry.title,
                            kind: entry.kind,
                            text: entry.text,
                            url: entry.url,
                          });
                          formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          setNotice(
                            "Editing a source. Saving will exclude it until you select it again.",
                          );
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            entries: d.entries.filter((e) => e.id !== entry.id),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}
      </main>
      <footer className="studio-footer">
        You choose the sources. {assistant.name} gets the context. Visitors get a better
        conversation.
      </footer>
    </div>
  );
}
