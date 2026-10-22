import { previewFetch } from "./preview";

function configuration() {
  if (typeof document === "undefined") return { base: "", staticSite: false };
  return {
    base: document.querySelector<HTMLMetaElement>('meta[name="portfolio-api"]')?.content || "",
    staticSite:
      document.querySelector('meta[name="portfolio-static"]')?.getAttribute("content") === "true",
  };
}

export function usesDemoApi() {
  if (typeof location === "undefined") return false;
  const { base, staticSite } = configuration();
  return location.protocol === "file:" || (staticSite && !base);
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (usesDemoApi()) return previewFetch(path, init);
  const { base } = configuration();
  return fetch(base ? new URL(path, base) : path, {
    ...init,
    ...(base ? { credentials: "omit" } : {}),
  });
}
