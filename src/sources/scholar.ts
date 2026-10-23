import { load } from "cheerio/slim";
import { type SourceAdapter, SourceError } from "./types";
import { profileUrl, sourceId, limitedText } from "./profile";

function csvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (quoted || !field) quoted = !quoted;
      else throw new SourceError("Invalid quote in Scholar CSV.", 400);
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += char;
    if (rows.length > 501 || row.length > 64)
      throw new SourceError("Import at most 500 Scholar articles at a time.", 413);
  }
  if (quoted) throw new SourceError("Scholar CSV has an unfinished quoted field.", 400);
  row.push(field);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}

export const scholar: SourceAdapter = {
  id: "scholar",
  label: "Google Scholar publications",
  async import(input, options) {
    const url = profileUrl(input, "scholar");
    const articles: { title: string; authors: string; venue: string; year: string; url: string }[] =
      [];
    let note: string;
    if (options?.text !== undefined) {
      if (options.format !== "csv" || options.text.length > 750000)
        throw new SourceError("Choose a Google Scholar CSV export under 750,000 characters.", 400);
      const rows = csvRows(options.text.replace(/^\uFEFF/, ""));
      const headers = rows.shift()?.map((s) => s.trim().toLowerCase()) || [];
      const titleColumn = headers.indexOf("title");
      if (titleColumn < 0 || !headers.includes("authors"))
        throw new SourceError(
          "Use Scholar’s Export → CSV file with Title and Authors columns.",
          400,
        );
      if (rows.length > 500)
        throw new SourceError("Import at most 500 Scholar articles at a time.", 413);
      for (const row of rows) {
        const field = (name: string) => (row[headers.indexOf(name)] || "").trim();
        if (!field("title")) continue;
        articles.push({
          title: field("title"),
          authors: field("authors"),
          venue: field("publication"),
          year: field("year"),
          url,
        });
      }
      note =
        "Imported the supplied Scholar CSV; this does not verify profile ownership or fetch full papers, abstracts, or citation counts.";
    } else {
      const target = new URL(url);
      target.searchParams.set("cstart", "0");
      target.searchParams.set("pagesize", "100");
      let response;
      try {
        response = await fetch(target.href, {
          redirect: "error",
          signal: AbortSignal.timeout(15000),
          headers: { Accept: "text/html" },
        });
      } catch {
        throw new SourceError(
          "Couldn’t fetch Scholar. Use your profile’s Export → CSV and import the file instead.",
        );
      }
      if (!response.ok)
        throw new SourceError(
          "Scholar blocked or rate-limited the request. Use Export → CSV on your profile, then import the file here.",
          response.status === 429 ? 429 : 502,
        );
      const $ = load(await limitedText(response));
      if (!$("#gsc_prf_in").text().trim())
        throw new SourceError("Scholar did not return a public profile. Use a CSV export instead.");
      $(".gsc_a_tr")
        .slice(0, 100)
        .each((_, element) => {
          const row = $(element),
            link = row.find(".gsc_a_at"),
            title = link.text().trim();
          if (!title) return;
          const detail = new URL(link.attr("href") || url, url);
          const articleUrl =
            detail.protocol === "https:" &&
            detail.hostname === "scholar.google.com" &&
            detail.pathname === "/citations"
              ? detail.href
              : url;
          articles.push({
            title,
            authors: row.find(".gs_gray").eq(0).text().trim(),
            venue: row.find(".gs_gray").eq(1).text().trim(),
            year: row.find(".gsc_a_y").text().trim(),
            url: articleUrl,
          });
        });
      note =
        "Imported up to 100 articles visible on the public profile’s first page. Full papers, abstracts, and citation counts are not imported. Use CSV for a larger selection.";
    }
    if (!articles.length)
      throw new SourceError(
        "No articles found. Check that the profile or CSV contains publications.",
        422,
      );
    const seen = new Set<string>();
    const entries = await Promise.all(
      articles
        .filter((article) => {
          const key = article.title.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map(async (article) => ({
          id: await sourceId("scholar", `${url}:${article.title.trim().toLowerCase()}`),
          title: article.title.slice(0, 200),
          kind: "publication",
          sourceId: "scholar",
          url: article.url,
          approved: false,
          updatedAt: new Date().toISOString(),
          text: [
            article.title,
            article.authors && `Authors: ${article.authors}`,
            article.venue && `Publication: ${article.venue}`,
            article.year && `Year: ${article.year}`,
          ]
            .filter(Boolean)
            .join("\n")
            .slice(0, 20000),
        })),
    );
    return { entries, note };
  },
};
