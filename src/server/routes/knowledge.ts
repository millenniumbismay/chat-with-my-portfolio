import { publicKnowledge } from "@/lib/knowledge";
export function GET() {
  return Response.json(publicKnowledge(), { headers: { "Cache-Control": "no-store" } });
}
