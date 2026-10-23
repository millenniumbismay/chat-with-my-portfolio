import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}
function text(value, label, max = 200) {
  ensure(
    typeof value === "string" && value.trim().length > 0 && value.length <= max,
    `${label} must be nonempty text (up to ${max} characters).`,
  );
}
function link(value, label) {
  ensure(typeof value === "string", `${label} must be text.`);
  if (!value) return;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a complete HTTPS URL.`);
  }
  ensure(
    url.protocol === "https:" && !url.username && !url.password,
    `${label} must be an HTTPS URL without credentials.`,
  );
}
export function validateConfig(config) {
  ensure(
    config && typeof config === "object" && config.schemaVersion === 1,
    "portfolio.config.json needs schemaVersion: 1.",
  );
  ensure(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.id || ""),
    "config.id must be a lowercase URL slug.",
  );
  ensure(
    config.profile && config.assistant && config.site && config.sources,
    "Config needs profile, assistant, site, and sources sections.",
  );
  for (const key of ["name", "firstName", "initials", "tagline", "bio", "about"])
    text(config.profile[key], `profile.${key}`, ["bio", "about"].includes(key) ? 4000 : 200);
  ensure(typeof config.profile.sample === "boolean", "profile.sample must be true or false.");
  ensure(typeof config.profile.email === "string", "profile.email must be text.");
  for (const key of ["github", "linkedin"]) link(config.profile[key], `profile.${key}`);
  if (config.profile.scholar !== undefined) link(config.profile.scholar, "profile.scholar");
  ensure(
    Array.isArray(config.profile.interests) && config.profile.interests.length <= 20,
    "profile.interests must be an array of at most 20 items.",
  );
  config.profile.interests.forEach((value) => text(value, "profile interest", 100));
  text(config.site.description, "site.description", 500);
  ensure(
    typeof config.site.showStudioLink === "boolean",
    "site.showStudioLink must be true or false.",
  );
  for (const key of ["name", "tagline", "role", "tone", "prompt"])
    text(config.assistant[key], `assistant.${key}`, key === "prompt" ? 12000 : 500);
  for (const key of ["behavior", "starterQuestions"]) {
    const values = config.assistant[key];
    ensure(
      Array.isArray(values) && values.length > 0 && values.length <= (key === "behavior" ? 20 : 6),
      `assistant.${key} needs 1–${key === "behavior" ? 20 : 6} items.`,
    );
    values.forEach((value) => text(value, `assistant.${key} item`, 500));
  }
  ensure(
    config.ai && ["cloudflare", "openai"].includes(config.ai.provider),
    "ai.provider must be cloudflare or openai.",
  );
  text(config.ai.cloudflareModel, "ai.cloudflareModel");
  text(config.ai.openaiModel, "ai.openaiModel");
  ensure(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.deployment?.workerName || "") &&
      config.deployment.workerName.length <= 63,
    "deployment.workerName must be a lowercase slug up to 63 characters.",
  );
  ensure(
    Array.isArray(config.deployment.allowedOrigins),
    "deployment.allowedOrigins must be an array.",
  );
  ensure(
    !config.deployment.databaseId ||
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        config.deployment.databaseId,
      ),
    "deployment.databaseId must be blank or a Cloudflare D1 UUID.",
  );
  for (const origin of config.deployment.allowedOrigins) {
    link(origin, "allowed origin");
    ensure(
      new URL(origin).origin === origin,
      "Allowed origins must not include paths or trailing slashes.",
    );
  }
  for (const key of ["github", "manual"])
    ensure(
      typeof config.sources[key]?.enabled === "boolean",
      `sources.${key}.enabled must be true or false.`,
    );
  ensure(
    typeof config.sources.github.username === "string",
    "sources.github.username must be text.",
  );
  ensure(
    !config.sources.github.username ||
      /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(config.sources.github.username),
    "sources.github.username must be a GitHub username, not a URL.",
  );
  for (const source of ["linkedin", "scholar"]) {
    const settings = config.sources[source];
    ensure(
      typeof settings?.enabled === "boolean",
      `sources.${source}.enabled must be true or false.`,
    );
    link(settings.url, `sources.${source}.url`);
    if (settings.url) {
      const url = new URL(settings.url);
      ensure(
        !url.port &&
          (source === "linkedin"
            ? ["linkedin.com", "www.linkedin.com"].includes(url.hostname) &&
              /^\/in\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname)
            : url.hostname === "scholar.google.com" &&
              url.pathname === "/citations" &&
              /^[a-zA-Z0-9_-]{4,64}$/.test(url.searchParams.get("user") || "")),
        `sources.${source}.url must be a valid ${source} profile URL.`,
      );
    }
  }
}
export function validateKnowledge(knowledge) {
  ensure(
    knowledge?.version === 1 &&
      typeof knowledge.demo === "boolean" &&
      Array.isArray(knowledge.entries),
    "knowledge.json needs version: 1, a demo boolean, and an entries array.",
  );
  ensure(knowledge.entries.length <= 500, "Knowledge is limited to 500 entries.");
  const ids = new Set();
  for (const entry of knowledge.entries) {
    text(entry.id, "knowledge entry id", 200);
    ensure(!ids.has(entry.id), `Duplicate knowledge id: ${entry.id}`);
    ids.add(entry.id);
    text(entry.title, "knowledge entry title");
    text(entry.kind, "knowledge entry kind", 40);
    text(entry.text, "knowledge entry text", 20000);
    ensure(
      typeof entry.approved === "boolean",
      `Entry ${entry.id} needs an explicit approved boolean.`,
    );
    link(entry.url, `Entry ${entry.id} URL`);
  }
}
export function validateContent(content) {
  for (const kind of ["projects", "publications", "posts"]) {
    ensure(Array.isArray(content[kind]), `${kind} must be an array.`);
    const ids = new Set();
    for (const item of content[kind]) {
      ensure(
        typeof item.id === "string" &&
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) &&
          !ids.has(item.id),
        `${kind} IDs must be unique lowercase URL slugs.`,
      );
      ids.add(item.id);
      text(item.title, `${kind} title`);
      text(item.description, `${kind} description`, 4000);
      if (kind !== "publications") text(item.body, `${kind} body`, 100000);
      if (item.url) link(item.url, `${kind} source URL`);
    }
  }
}
export async function validateProject(root = resolve(import.meta.dirname, "..")) {
  const config = JSON.parse(await readFile(join(root, "portfolio.config.json"), "utf8"));
  const knowledge = JSON.parse(await readFile(join(root, "content/knowledge.json"), "utf8"));
  validateConfig(config);
  validateKnowledge(knowledge);
  validateKnowledge(JSON.parse(await readFile(join(root, "content/source-drafts.json"), "utf8")));
  return config;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    await validateProject();
    console.log("Portfolio configuration and knowledge are valid.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
