import type { SourceAdapter } from "./types";
import { SourceError } from "./types";

type Repo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  topics?: string[];
  fork: boolean;
  archived: boolean;
};
export const github: SourceAdapter = {
  id: "github",
  label: "GitHub repository summaries",
  async import(username) {
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username))
      throw new SourceError("Enter a valid GitHub username, without the URL.", 400);
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "Chat-With-My-Portfolio",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok)
      throw new SourceError(
        response.status === 404
          ? "That GitHub user wasn’t found."
          : "GitHub is unavailable or its public API limit was reached. Please try later.",
        response.status === 404 ? 404 : 502,
      );
    const repos = (await response.json()) as Repo[];
    if (!Array.isArray(repos)) throw new SourceError("GitHub returned an unexpected response.");
    const entries = repos
      .filter((repo) => !repo.fork && !repo.archived)
      .map((repo) => ({
        id: `github-${repo.id}`,
        title: repo.name,
        kind: "github",
        sourceId: "github",
        url: repo.html_url,
        approved: false,
        text: [
          repo.description || "No description provided.",
          repo.language ? `Primary language: ${repo.language}.` : "",
          repo.topics?.length ? `Topics: ${repo.topics.join(", ")}.` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      }));
    return {
      entries,
      note: "Imported up to 100 recently updated public repository summaries. Forks and archived repositories are excluded. Review each entry before export. READMEs and repository code are not imported.",
    };
  },
};
