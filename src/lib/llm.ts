import config from "@/portfolio.config.json";
// Provider credentials stay on the server. No visitor-supplied endpoints or models.
export type Message = { role: "user" | "assistant"; content: string };

export async function generateAnswer(
  instructions: string,
  messages: Message[],
  env: Record<string, string> = {},
): Promise<string> {
  const settings = typeof process === "undefined" ? env : { ...process.env, ...env };
  const provider = settings.LLM_PROVIDER || config.ai.provider;
  if (provider === "cloudflare") {
    const account = settings.CLOUDFLARE_ACCOUNT_ID;
    const token = settings.CLOUDFLARE_AI_TOKEN;
    if (!account || !/^[a-f0-9]{32}$/i.test(account) || !token) throw new Error("unconfigured");
    const model = settings.CLOUDFLARE_AI_MODEL || config.ai.cloudflareModel;
    if (!/^@cf\/[a-z0-9-]+\/[a-z0-9._-]+$/i.test(model)) throw new Error("unconfigured");
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(45_000),
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "system", content: instructions }, ...messages],
          max_completion_tokens: 900,
          store: false,
        }),
      },
    );
    if (!response.ok) throw new Error("unavailable");
    const data = (await response.json()) as {
      success?: boolean;
      result?: { response?: string; choices?: { message?: { content?: string } }[] };
    };
    const answer = data.result?.response || data.result?.choices?.[0]?.message?.content;
    if (data.success === false || !answer?.trim()) throw new Error("unavailable");
    return answer;
  }
  if (provider !== "openai" || !settings.OPENAI_API_KEY) throw new Error("unconfigured");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(45_000),
    headers: {
      Authorization: `Bearer ${settings.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: settings.OPENAI_MODEL || config.ai.openaiModel,
      store: false,
      max_output_tokens: 650,
      instructions,
      input: messages,
    }),
  });
  if (!response.ok) throw new Error("unavailable");
  const data = (await response.json()) as {
    output?: { type: string; content?: { type: string; text?: string }[] }[];
  };
  const answer = data.output
    ?.filter((o) => o.type === "message")
    .flatMap((o) => o.content || [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text || "")
    .join("\n");
  if (!answer?.trim()) throw new Error("unavailable");
  return answer;
}
