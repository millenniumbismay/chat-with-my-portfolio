import { assistant, identityReply, demoReply } from "@/content/assistant";
import { assistantPersona } from "@/lib/assistant-persona";
import { generateAnswer } from "@/lib/llm";
import { isAllowedOrigin } from "@/lib/origin";
import { publicKnowledge, selectedContext, rateLimited, readJson } from "@/lib/knowledge";

type Message = { role: "user" | "assistant"; content: string };
export async function POST(request: Request, env: Record<string, string> = {}) {
  if (!isAllowedOrigin(request, env))
    return Response.json({ error: "Please use the chat on this website." }, { status: 403 });
  if (rateLimited(request, "chat", 15))
    return Response.json(
      { error: "A little pause. Please try again in a minute." },
      { status: 429 },
    );
  let body;
  try {
    body = await readJson(request);
  } catch {
    return Response.json({ error: "Please send a valid question." }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > 30 ||
    body.messages.some(
      (m: Message) =>
        !m ||
        !["user", "assistant"].includes(m.role) ||
        typeof m.content !== "string" ||
        m.content.length > 2000,
    )
  )
    return Response.json(
      {
        error:
          "Please keep questions under 2,000 characters and start a new conversation after 30 messages.",
      },
      { status: 400 },
    );
  const messages: Message[] = body.messages.slice(-12);
  const question = messages.at(-1)?.content.trim();
  if (!question || messages.at(-1)?.role !== "user")
    return Response.json({ error: "Please enter a question." }, { status: 400 });
  const knowledge = publicKnowledge();
  const identity = identityReply(question, knowledge.ownerName);
  if (identity)
    return Response.json(
      {
        answer: knowledge.demo ? demoReply(question, knowledge.ownerName) : identity,
        demo: knowledge.demo,
        sources: [],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  if (knowledge.demo)
    return Response.json(
      { answer: demoReply(question, knowledge.ownerName), demo: true, sources: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  if (!knowledge.entries.length)
    return Response.json({
      answer:
        "I don’t have any selected sources yet. Please check back after the owner has added their work.",
      demo: false,
      sources: [],
    });
  const sources = selectedContext(
    knowledge.entries,
    messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(" "),
  );
  try {
    const instructions = `${assistantPersona(knowledge.ownerName)}\nAPPROVED REFERENCE DATA:\n${JSON.stringify(sources.map(({ id, title, kind, text }) => ({ id, title, kind, text })))}`;
    const answer = await generateAnswer(instructions, messages, env);
    return Response.json(
      { answer, demo: false, sources: sources.map(({ id, title, url }) => ({ id, title, url })) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const unconfigured = error instanceof Error && error.message === "unconfigured";
    return Response.json(
      {
        error: unconfigured
          ? `${assistant.name} isn’t connected yet. The owner needs to configure the server’s AI provider.`
          : "The AI service is temporarily unavailable. Please try again shortly.",
      },
      { status: unconfigured ? 503 : 502 },
    );
  }
}
