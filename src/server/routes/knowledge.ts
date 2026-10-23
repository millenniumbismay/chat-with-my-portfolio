import { loadPublicKnowledge, type BackendEnv } from "@/server/backend";
export async function GET(env: BackendEnv = {}) {
  return Response.json(await loadPublicKnowledge(env), {
    headers: { "Cache-Control": "no-store" },
  });
}
