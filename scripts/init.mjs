import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir, mkdtemp, copyFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { validateConfig } from "./validate.mjs";

const { values } = parseArgs({
  options: {
    name: { type: "string" },
    assistant: { type: "string" },
    github: { type: "string" },
    help: { type: "boolean" },
  },
});
if (values.help) {
  console.log(
    'npm run init -- --name "Your Name" --assistant "Nova" --github your-username\nCreates your config and clears inherited AI sources. Local backups go into ignored .portfolio/backups/.',
  );
  process.exit(0);
}
let name = values.name;
let assistantName = values.assistant;
if (!name && stdin.isTTY) {
  const input = createInterface({ input: stdin, output: stdout });
  name = await input.question("Your name: ");
  assistantName ||= (await input.question("Assistant name [Nova]: ")).trim() || "Nova";
  input.close();
}
if (!name?.trim())
  throw new Error('Provide --name "Your Name", or run this command in an interactive terminal.');
name = name.trim();
assistantName = assistantName?.trim() || "Nova";
const root = resolve(import.meta.dirname, "..");
const config = JSON.parse(await readFile(join(root, "portfolio.config.example.json"), "utf8"));
const slug =
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 44)
    .replace(/-$/, "") || "my-portfolio";
config.id = slug;
config.profile.name = name;
config.profile.firstName = name.split(/\s+/)[0];
config.profile.initials = name
  .split(/\s+/)
  .map((word) => Array.from(word)[0])
  .slice(0, 2)
  .join("")
  .toUpperCase();
config.assistant.name = assistantName;
config.deployment.workerName = `${slug}-portfolio`;
if (values.github) {
  config.sources.github.username = values.github;
  config.profile.github = `https://github.com/${values.github}`;
}
validateConfig(config);
await mkdir(join(root, ".portfolio/backups"), { recursive: true });
const backup = await mkdtemp(join(root, ".portfolio/backups/setup-"));
for (const file of ["portfolio.config.json", "content/knowledge.json"])
  await copyFile(join(root, file), join(backup, file.replaceAll("/", "-")));
await writeFile(join(root, "portfolio.config.json"), JSON.stringify(config, null, 2) + "\n");
await writeFile(
  join(root, "content/knowledge.json"),
  JSON.stringify({ version: 1, ownerName: name, demo: true, entries: [] }, null, 2) + "\n",
);
console.log(
  `Configured ${name} and ${assistantName}. Inherited AI sources were cleared; demo mode is on.\nBackup: ${backup}\nNext: edit content/site.ts, then run npm run check and npm run dev.`,
);
