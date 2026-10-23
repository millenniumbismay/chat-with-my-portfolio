import { SourceError } from "./types";

export function profileUrl(input: string, source: "linkedin" | "scholar") {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new SourceError("Enter a complete profile URL.", 400);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    throw new SourceError("Use an HTTPS profile URL without credentials or a custom port.", 400);
  if (source === "linkedin") {
    if (
      !["linkedin.com", "www.linkedin.com"].includes(url.hostname) ||
      !/^\/in\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname)
    )
      throw new SourceError("Use a LinkedIn /in/ profile URL.", 400);
    return `https://www.linkedin.com${url.pathname.replace(/\/$/, "")}`;
  }
  const user = url.searchParams.get("user") || "";
  if (
    url.hostname !== "scholar.google.com" ||
    url.pathname !== "/citations" ||
    !/^[a-zA-Z0-9_-]{4,64}$/.test(user)
  )
    throw new SourceError("Use a scholar.google.com/citations profile URL with a user ID.", 400);
  return `https://scholar.google.com/citations?user=${user}&hl=en`;
}

export async function sourceId(source: string, value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return `${source}-${Array.from(new Uint8Array(hash))
    .slice(0, 12)
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

export async function limitedText(response: Response, limit = 1_000_000) {
  const reader = response.body?.getReader();
  if (!reader) throw new SourceError("The source returned no content.");
  const charset =
    response.headers.get("content-type")?.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1] || "utf-8";
  let decoder;
  try {
    decoder = new TextDecoder(charset);
  } catch {
    await reader.cancel();
    throw new SourceError(
      "The source uses an unsupported text encoding. Import a UTF-8 CSV export instead.",
    );
  }
  let text = "",
    bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > limit) {
        await reader.cancel();
        throw new SourceError("The source is too large. Import a smaller export.", 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
