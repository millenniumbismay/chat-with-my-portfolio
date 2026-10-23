import "./env.mjs";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import worker from "../dist/server/index.js";
import { openDatabase } from "./local-database.mjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const config = JSON.parse(readFileSync(resolve(root, "portfolio.config.json"), "utf8"));
const database = openDatabase(resolve(root, `.portfolio/${config.id}.sqlite`));
const port = Number(process.env.PORT || 8888);
const server = createServer(async (req, res) => {
  try {
    const init = { method: req.method, headers: req.headers };
    if (!["GET", "HEAD"].includes(req.method)) {
      init.body = Readable.toWeb(req);
      init.duplex = "half";
    }
    const request = new Request(`http://${req.headers.host}${req.url}`, init);
    const response = await worker.fetch(request, { ...process.env, PORTFOLIO_DB: database });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500);
    res.end("Something went wrong.");
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Local: http://127.0.0.1:${port}`));
