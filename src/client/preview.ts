import { demoReply } from "@/content/assistant";
import { profile } from "@/content/site";
// Browser file preview: never bundle the server knowledge file or API secrets.
// Published and HTTP-served versions always use the actual server endpoints.
export const previewFetch: typeof fetch = async (input, init) => {
  const url = String(input);
  if (url === "/api/knowledge")
    return Response.json({ version: 1, ownerName: profile.name, demo: true, entries: [] });
  if (url === "/api/chat") {
    let question = "";
    try {
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
      question = body.messages?.at(-1)?.content || "";
    } catch {
      /* Keep the preview usable for an empty request. */
    }
    return Response.json({ answer: demoReply(question, profile.name), demo: true, sources: [] });
  }
  return Response.json(
    {
      error:
        "This preview uses demo APIs. Open the local server or configure PORTFOLIO_API_URL to use the owner backend and source connectors. You can still draft source text here.",
    },
    { status: 503 },
  );
};
