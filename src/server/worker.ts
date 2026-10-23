import { POST as chat } from "@/server/routes/chat";
import { GET as knowledge } from "@/server/routes/knowledge";
import { GET as github } from "@/server/routes/import-github";
import { isAllowedOrigin } from "@/lib/origin";
import { admin } from "@/server/routes/admin";
import { stringEnv, type BackendEnv } from "@/server/backend";
import { SourceError } from "@/sources/types";
import homeHtml from "virtual:home";
import studioHtml from "virtual:studio";
import favicon from "virtual:favicon";
import blogHtml from "virtual:blogs";
import writingHtml from "virtual:writing";

export default {
  async fetch(request: Request, env: BackendEnv = {}) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) {
      if (!isAllowedOrigin(request, stringEnv(env)))
        return Response.json(
          { error: "This website is not allowed to use the API." },
          { status: 403 },
        );
      let response: Response;
      try {
        if (request.method === "OPTIONS") {
          response = new Response(null, { status: 204 });
        } else if (path === "/api/chat" && request.method === "POST") {
          response = await chat(request, env);
        } else if (path === "/api/knowledge" && request.method === "GET") {
          response = await knowledge(env);
        } else if (path === "/api/import/github" && request.method === "GET") {
          response = await github(request);
        } else if (path.startsWith("/api/admin/")) {
          response = await admin(request, env);
        } else {
          response = Response.json({ error: "API route or method not found." }, { status: 404 });
        }
      } catch (error) {
        response = Response.json(
          {
            error:
              error instanceof SourceError
                ? error.message
                : "The backend is unavailable. Check the database configuration and migrations.",
          },
          { status: error instanceof SourceError ? error.status : 503 },
        );
      }
      const headers = new Headers(response.headers);
      const origin = request.headers.get("origin");
      if (origin) headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Vary", "Origin");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
          : path === "/blogs" || path === "/blogs/"
            ? writingHtml
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
