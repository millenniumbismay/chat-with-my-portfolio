import type { Entry } from "./knowledge";

export function mergeImports(current: Entry[], imported: Entry[]) {
  const incoming = new Map(imported.map((entry) => [entry.id, entry]));
  const entries = current.map((entry) => {
    const replacement = incoming.get(entry.id);
    if (!replacement) return entry;
    incoming.delete(entry.id);
    const same = (["title", "text", "url", "kind"] as const).every(
      (key) => entry[key] === replacement[key],
    );
    return { ...replacement, approved: same && entry.approved };
  });
  return [
    ...entries,
    ...Array.from(incoming.values(), (entry) => ({ ...entry, approved: false })),
  ].slice(0, 500);
}
