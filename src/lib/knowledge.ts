import config from "@/portfolio.config.json";
import knowledge from "@/content/knowledge.json";

export type Entry = {
  id: string;
  title: string;
  kind: string;
  text: string;
  url: string;
  approved: boolean;
  sourceId?: string;
  updatedAt?: string;
};
export function approvedEntries(entries: Entry[] = knowledge.entries): Entry[] {
  return entries
    .filter((entry) => entry.approved === true && entry.text.trim())
    .map((entry) => ({ ...entry, url: safeUrl(entry.url) }));
}
export function safeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}
export function selectedContext(entries: Entry[], query: string) {
  const terms = [...new Set(query.toLowerCase().match(/[a-z0-9]{3,}/g) || [])];
  const ranked = entries
    .map((entry) => ({
      entry,
      score: terms.reduce(
        (score, term) =>
          score +
          (entry.title.toLowerCase().includes(term) ? 4 : 0) +
          (entry.text.toLowerCase().includes(term) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score);
  let budget = 12000;
  return ranked.slice(0, 6).flatMap(({ entry }) => {
    if (budget <= 0) return [];
    const text = entry.text.slice(0, Math.min(3000, budget));
    budget -= text.length;
    return [{ ...entry, text }];
  });
}
export function publicKnowledge() {
  return {
    version: knowledge.version,
    ownerName: config.profile.name,
    demo: knowledge.demo,
    entries: approvedEntries(),
  };
}

// Best-effort per-isolate throttling. For a high-traffic public launch, use a
// platform rate-limiting binding or durable limiter as well.
const requests = new Map<string, { count: number; until: number }>();
export function rateLimited(request: Request, namespace: string, max: number) {
  const now = Date.now();
  if (requests.size > 5000) {
    for (const [key, entry] of requests) if (entry.until < now) requests.delete(key);
    if (requests.size > 5000) return true;
  }
  const identity = request.headers.get("cf-connecting-ip") || "local";
  const key = `${namespace}:${identity}`;
  const entry = requests.get(key);
  if (!entry || entry.until < now) {
    requests.set(key, { count: 1, until: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > max;
}
export async function readJson(request: Request, limit = 24000) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("Expected JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty request.");
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) {
      await reader.cancel();
      throw new Error("Request too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
