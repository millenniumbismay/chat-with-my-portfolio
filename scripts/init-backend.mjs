import { randomBytes } from "node:crypto";
import { readFile, writeFile, chmod } from "node:fs/promises";
import { resolve } from "node:path";
const filename = resolve(import.meta.dirname, "../.env");
let text = "";
try {
  text = await readFile(filename, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const existing = text
  .match(/^ADMIN_TOKEN=(.*)$/m)?.[1]
  ?.trim()
  .replace(/^(["'])(.*)\1$/, "$2");
if (!existing) {
  text = text.replace(/^ADMIN_TOKEN=.*\n?/m, "");
  await writeFile(filename, `${text.trimEnd()}\nADMIN_TOKEN=${randomBytes(32).toString("hex")}\n`, {
    mode: 0o600,
  });
  await chmod(filename, 0o600);
} else if (existing.length < 32)
  throw new Error("Existing ADMIN_TOKEN is too short; choose at least 32 characters in .env.");
console.log(
  "Owner token is configured in .env (ADMIN_TOKEN). It is not printed or bundled.\nRun npm run dev, open /studio/, and enter that token to load the server draft.\nLocal SQLite is created automatically in ignored .portfolio/. See docs/backend.md for Cloudflare D1 deployment.",
);
