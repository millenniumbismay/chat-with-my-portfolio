import { POST as chat } from "@/server/routes/chat";
import { GET as knowledge } from "@/server/routes/knowledge";
import { GET as github } from "@/server/routes/import-github";
import { isAllowedOrigin } from "@/lib/origin";
import homeHtml from "virtual:home";
import studioHtml from "virtual:studio";
import favicon from "virtual:favicon";
import blogHtml from "virtual:blogs";

export default {
  async fetch(request: Request, env: Record<string, string> = {}) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) {
      if (!isAllowedOrigin(request, env))
        return Response.json(
          { error: "This website is not allowed to use the API." },
          { status: 403 },
        );
      let response: Response;
      if (request.method === "OPTIONS") {
        response = new Response(null, { status: 204 });
      } else if (path === "/api/chat" && request.method === "POST") {
        response = await chat(request, env);
      } else if (path === "/api/knowledge" && request.method === "GET") {
        response = knowledge();
      } else if (path === "/api/import/github" && request.method === "GET") {
        response = await github(request);
      } else {
        response = Response.json({ error: "API route or method not found." }, { status: 404 });
      }
      const headers = new Headers(response.headers);
      const origin = request.headers.get("origin");
      if (origin) headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Vary", "Origin");
      headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      headers.set("Cache-Control", "no-store");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(response.body, { status: response.status, headers });
    }
    if (path === "/favicon.svg")
      return new Response(request.method === "HEAD" ? null : favicon, {
        headers: { "Content-Type": "image/svg+xml" },
      });
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Method not allowed", { status: 405 });
    const blogId = path.match(/^\/blog\/([a-z0-9-]+)\/?$/)?.[1];
    const page =
      path === "/"
        ? homeHtml
        : path === "/studio" || path === "/studio/"
          ? studioHtml
          : blogId && Object.hasOwn(blogHtml, blogId)
            ? blogHtml[blogId]
            : null;
    if (!page) return new Response("Page not found", { status: 404 });
    return new Response(request.method === "HEAD" ? null : page, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Cache-Control": "no-cache",
      },
    });
  },
};
