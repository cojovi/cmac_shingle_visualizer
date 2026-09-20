import express from "express";
import { config } from "dotenv";
import path from "node:path";
import { generate, RequestError } from "./generate";
config({ path: ".env.local", quiet: true });
config({ quiet: true });
const app = express();
app.disable("x-powered-by");
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  const origin = req.get("origin");
  if (origin && new URL(origin).host !== req.get("host"))
    return res
      .status(403)
      .json({ error: "Please generate from the studio on this server." });
  next();
});
app.get("/api/health", (_req, res) =>
  res.json({ configured: Boolean(process.env.GEMINI_API_KEY) }),
);
app.use("/api", express.json({ limit: "17mb" }));
const usage = new Map<string, { count: number; reset: number }>();
let active = 0;
app.post("/api/generate", async (req, res) => {
  const ip = req.ip || "local";
  const now = Date.now();
  for (const [key, value] of usage) if (value.reset < now) usage.delete(key);
  const window = usage.get(ip) || { count: 0, reset: now + 15 * 60_000 };
  if (window.count >= 10 || active >= 2)
    return res
      .status(429)
      .json({
        error:
          "The studio is busy. Please wait a moment before generating another preview.",
      });
  if (process.env.GEMINI_API_KEY) {
    window.count++;
    usage.set(ip, window);
  }
  active++;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 185_000);
  const onClose = () => {
    if (!res.writableEnded) controller.abort();
  };
  res.on("close", onClose);
  try {
    const image = await generate(req.body, controller.signal);
    if (!res.destroyed) res.json({ image });
  } catch (e) {
    const error = e as Error & { status?: number };
    const status =
      e instanceof RequestError
        ? e.status
        : error.status === 429
          ? 429
          : controller.signal.aborted
            ? 504
            : 502;
    const message =
      e instanceof RequestError
        ? e.message
        : status === 429
          ? "The image provider is at capacity. Please try again shortly."
          : status === 504
            ? "This preview took too long. Try again with a clearer photo."
            : "The image provider could not complete this preview. Check the server API key, billing, and model access, then try again.";
    if (!res.destroyed) res.status(status).json({ error: message });
  } finally {
    active--;
    clearTimeout(timeout);
    res.off("close", onClose);
  }
});
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Endpoint not found." }),
);
if (process.argv.includes("--production")) {
  app.use(express.static(path.resolve("dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
app.use(
  (
    error: Error & { type?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res
      .status(error.type === "entity.too.large" ? 413 : 400)
      .json({
        error:
          error.type === "entity.too.large"
            ? "The images are too large. Please choose smaller photos."
            : "The request could not be read. Please try again.",
      });
  },
);
const port = Number(process.env.PORT || 3000);
app.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`CMAC Roof Studio: http://localhost:${port}`),
);
