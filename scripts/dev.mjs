import { watch } from "node:fs";
import { spawn } from "node:child_process";
import { resolve, join } from "node:path";

const root = resolve(import.meta.dirname, "..");
let server;
let building = false;
let pending = false;
let timer;
let stopping = false;
function runBuild() {
  return new Promise((resolveBuild) => {
    const child = spawn(processExec, [join(root, "scripts/build-portfolio.mjs")], {
      cwd: root,
      stdio: "inherit",
    });
    child.once("exit", (code) => resolveBuild(code === 0));
    child.once("error", () => resolveBuild(false));
  });
}
const processExec = process.execPath;
async function rebuild() {
  if (stopping) return;
  if (building) {
    pending = true;
    return;
  }
  building = true;
  const success = await runBuild();
  if (success && !stopping) {
    if (server && server.exitCode === null)
      await new Promise((done) => {
        server.once("exit", done);
        server.kill("SIGTERM");
      });
    server = spawn(processExec, [join(root, "scripts/serve-portfolio.mjs")], {
      cwd: root,
      stdio: "inherit",
    });
    server.on("error", (error) => console.error(error.message));
    console.log("Built. Refresh your browser to see changes.");
  }
  building = false;
  if (pending) {
    pending = false;
    void rebuild();
  }
}
const watchers = [
  watch(join(root, "src"), { recursive: true }, schedule),
  watch(join(root, "content"), { recursive: true }, schedule),
  watch(join(root, "portfolio.config.json"), schedule),
];
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => void rebuild(), 120);
}
for (const watcher of watchers) watcher.on("error", (error) => console.error(error.message));
function stop() {
  stopping = true;
  clearTimeout(timer);
  watchers.forEach((watcher) => watcher.close());
  server?.kill("SIGTERM");
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
await rebuild();
