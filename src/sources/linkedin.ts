import { type SourceAdapter, SourceError } from "./types";
import { profileUrl, sourceId } from "./profile";

export const linkedin: SourceAdapter = {
  id: "linkedin",
  label: "LinkedIn selected profile text",
  async import(input, options) {
    const url = profileUrl(input, "linkedin");
    const text = options?.text?.trim();
    if (!text)
      throw new SourceError(
        "Paste the LinkedIn About, experience, education, projects, or posts you want to import. A profile link alone does not grant full-profile API access.",
        422,
      );
    if (text.length > 60000)
      throw new SourceError(
        "Import up to 60,000 characters of selected LinkedIn text at a time.",
        413,
      );
    const chunks: string[] = [];
    let chunk = "";
    for (const paragraph of text.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
      for (const part of paragraph.match(/[\s\S]{1,1800}/g) || []) {
        if (chunk && chunk.length + part.length > 2000) {
          chunks.push(chunk);
          chunk = "";
        }
        chunk += `${chunk ? "\n\n" : ""}${part}`;
      }
    }
    if (chunk) chunks.push(chunk);
    const updatedAt = new Date().toISOString();
    const entries = await Promise.all(
      chunks.map(async (text, index) => ({
        id: await sourceId("linkedin", `${url}:${index}`),
        title: `LinkedIn: ${text.split("\n")[0].slice(0, 140)}`,
        kind: "linkedin",
        sourceId: "linkedin",
        url,
        text,
        approved: false,
        updatedAt,
      })),
    );
    return {
      entries,
      note: `Prepared ${entries.length} LinkedIn text sections. This is a selected-text import, not an OAuth connection or automatic profile sync. Review before publishing.`,
    };
  },
};
