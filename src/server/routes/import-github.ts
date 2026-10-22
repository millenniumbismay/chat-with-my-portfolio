import config from "@/portfolio.config.json";
import { rateLimited } from "@/lib/knowledge";
import { sourceAdapters } from "@/sources";
import { SourceError } from "@/sources/types";

export async function GET(request: Request) {
  if (!config.sources.github.enabled)
    return Response.json(
      { error: "GitHub import is disabled by this portfolio’s configuration." },
      { status: 404 },
    );
  if (rateLimited(request, "github", 5))
    return Response.json(
      { error: "Please wait a minute before importing again." },
      { status: 429 },
    );
  const username = new URL(request.url).searchParams.get("username") || "";
  try {
    const imported = await sourceAdapters.github.import(username);
    return Response.json(imported, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof SourceError ? error.message : "Couldn’t reach GitHub. Please try again.",
      },
      { status: error instanceof SourceError ? error.status : 502 },
    );
  }
}
