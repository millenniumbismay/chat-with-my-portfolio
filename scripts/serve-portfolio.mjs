import "./env.mjs";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import worker from "../dist/server/index.js";
const port = Number(process.env.PORT || 8888);
const server = createServer(async (req, res) => {
  try {
    const init = { method: req.method, headers: req.headers };
    if (!["GET", "HEAD"].includes(req.method)) {
      init.body = Readable.toWeb(req);
      init.duplex = "half";
    }
    const request = new Request(`http://${req.headers.host}${req.url}`, init);
    const response = await worker.fetch(request, process.env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500);
    res.end("Something went wrong.");
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Local: http://127.0.0.1:${port}`));
