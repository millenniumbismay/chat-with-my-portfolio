import "./env.mjs";
import { validateProject, validateContent } from "./validate.mjs";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import { resolve, join } from "node:path";

const root = resolve(import.meta.dirname, "..");
await validateProject(root);
const require = createRequire(import.meta.url);
let build;
try {
  ({ build } = require("esbuild"));
} catch {
  if (!process.env.PORTFOLIO_TOOL_ROOT)
    throw new Error(
      "Run npm install first, or set PORTFOLIO_TOOL_ROOT to an existing node_modules directory for an offline build.",
    );
  ({ build } = require(join(process.env.PORTFOLIO_TOOL_ROOT, "esbuild")));
}
const apiBase = (process.env.PORTFOLIO_API_URL || "").trim();
if (apiBase) {
  const url = new URL(apiBase);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(
      "PORTFOLIO_API_URL must be an HTTPS origin, such as https://portfolio-api.example.workers.dev. Never put credentials here.",
    );
  }
}
const common = {
  bundle: true,
  jsx: "automatic",
  nodePaths: process.env.PORTFOLIO_TOOL_ROOT ? [process.env.PORTFOLIO_TOOL_ROOT] : [],
  tsconfig: join(root, "tsconfig.json"),
  logLevel: "warning",
};
await mkdir(join(root, ".portfolio"), { recursive: true });
await build({
  ...common,
  entryPoints: [join(root, "src/client/render.tsx")],
  outfile: join(root, ".portfolio/render.cjs"),
  platform: "node",
  format: "cjs",
  define: { "process.env.NODE_ENV": '"production"' },
});
const { render, blogPosts, portfolioConfig: config, portfolioContent, themeBootstrap } = require(
  join(root, ".portfolio/render.cjs"),
);
validateContent(portfolioContent);
const client = await build({
  ...common,
  entryPoints: [join(root, "src/client/main.tsx")],
  write: false,
  platform: "browser",
  format: "iife",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
});
const js = client.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = await readFile(join(root, "src/ui/globals.css"), "utf8");
const favicon = await readFile(join(root, "public/favicon.svg"), "utf8");
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );
const blogIds = new Set();
for (const post of blogPosts) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.id) || blogIds.has(post.id))
    throw new Error("Blog IDs must be unique lowercase URL slugs.");
  blogIds.add(post.id);
}
function html(studio = false, staticSite = false, post = undefined, blogs = false) {
  const title = post
    ? `${post.title} — ${config.profile.name}`
    : studio
      ? `Source studio — ${config.profile.name}`
      : blogs
        ? `Blogs & Thoughts — ${config.profile.name}`
        : config.profile.name;
  const description = post?.description || config.site.description;
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="#ffffff"><meta name="portfolio-static" content="${staticSite}"><meta name="portfolio-api" content="${staticSite ? escapeHtml(apiBase) : ""}"><meta name="portfolio-page" content="${blogs ? "blogs" : studio ? "studio" : post ? "post" : "home"}"><meta name="portfolio-post" content="${post ? escapeHtml(post.id) : ""}"><title>${escapeHtml(title)}</title><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(favicon)}"><script>${themeBootstrap}</script><style>${css}</style></head><body><div id="root">${render(studio, post?.id, blogs)}</div><script>${js}</script></body></html>`;
}
// Remove generated article files so deleted posts cannot remain published.
await rm(join(root, "dist/pages"), { recursive: true, force: true });
await rm(join(root, "preview"), { recursive: true, force: true });
const pages = {
  home: html(),
  studio: html(true),
  writing: html(false, false, undefined, true),
  favicon,
  blogs: Object.fromEntries(blogPosts.map((post) => [post.id, html(false, false, post)])),
};
for (const directory of [
  "dist/server",
  "dist/.openai",
  "dist/pages/studio",
  "dist/pages/blogs",
  "preview/blogs",
]) {
  await mkdir(join(root, directory), { recursive: true });
}
await writeFile(join(root, "preview/index.html"), html(false, true));
await writeFile(join(root, "preview/studio.html"), html(true, true));
await writeFile(join(root, "dist/pages/index.html"), html(false, true));
await writeFile(join(root, "dist/pages/studio/index.html"), html(true, true));
for (const base of ["dist/pages", "preview"]) {
  await writeFile(join(root, base, "blogs/index.html"), html(false, true, undefined, true));
}
await writeFile(join(root, "dist/pages/.nojekyll"), "");
for (const post of blogPosts) {
  const page = html(false, true, post);
  for (const base of ["dist/pages", "preview"]) {
    const directory = join(root, base, "blog", post.id);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "index.html"), page);
  }
}

await build({
  ...common,
  entryPoints: [join(root, "src/server/worker.ts")],
  outfile: join(root, "dist/server/index.js"),
  platform: "browser",
  format: "esm",
  plugins: [
    {
      name: "embedded-pages",
      setup(b) {
        b.onResolve({ filter: /^virtual:/ }, (args) => ({
          path: args.path.slice(8),
          namespace: "pages",
        }));
        b.onLoad({ filter: /.*/, namespace: "pages" }, (args) => ({
          contents: JSON.stringify(pages[args.path]),
          loader: "json",
        }));
      },
    },
  ],
});
// Existing local Sites identity is optional and is never part of the forkable source.
try {
  await copyFile(join(root, ".openai/hosting.json"), join(root, "dist/.openai/hosting.json"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const workerConfig = {
  name: config.deployment.workerName,
  main: "../dist/server/index.js",
  compatibility_date: "2026-10-21",
  workers_dev: true,
  vars: {
    LLM_PROVIDER: config.ai.provider,
    CLOUDFLARE_AI_MODEL: config.ai.cloudflareModel,
    OPENAI_MODEL: config.ai.openaiModel,
    ALLOWED_ORIGIN: config.deployment.allowedOrigins.join(","),
  },
  observability: { enabled: false },
};
await writeFile(
  join(root, ".portfolio/wrangler.json"),
  JSON.stringify(workerConfig, null, 2) + "\n",
);
console.log("Built Cloudflare Worker, GitHub Pages files (dist/pages), and local previews.");
