import express from "express";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generate, RequestError, apiKey } from "./generate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.cwd() !== root) process.chdir(root);

function loadEnv() {
  const collected: Record<string, string> = {};
  for (const file of [".env", ".env.local"]) {
    const result = config({ path: path.join(root, file), quiet: true });
    if (!result.parsed) continue;
    for (const [key, value] of Object.entries(result.parsed)) {
      if (value.trim()) collected[key] = value.trim();
    }
  }
  for (const [key, value] of Object.entries(collected)) {
    if (!process.env[key]?.trim()) process.env[key] = value;
  }
  if (process.env.GEMINI_API_KEY)
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY.trim();
}
loadEnv();

const app = express();
app.disable("x-powered-by");
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  const origin = req.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== req.get("host"))
        return res
          .status(403)
          .json({ error: "Please generate from the studio on this server." });
    } catch {
      return res
        .status(403)
        .json({ error: "Please generate from the studio on this server." });
    }
  }
  next();
});
app.get("/api/health", (_req, res) =>
  res.json({ configured: Boolean(apiKey()) }),
);
app.use("/api", express.json({ limit: "60mb" }));
const usage = new Map<string, { count: number; reset: number }>();
let active = 0;
app.post("/api/generate", async (req, res) => {
  const ip = req.ip || "local";
  const now = Date.now();
  for (const [key, value] of usage) if (value.reset < now) usage.delete(key);
  const window = usage.get(ip) || { count: 0, reset: now + 15 * 60_000 };
  if (window.count >= 10 || active >= 2)
    return res.status(429).json({
      error:
        "The studio is busy. Please wait a moment before generating another preview.",
    });
  if (apiKey()) {
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
          : error.status === 401 || error.status === 403
            ? 502
            : controller.signal.aborted
              ? 504
              : 502;
    const message =
      e instanceof RequestError
        ? e.message
        : status === 429
          ? "The image provider is at capacity. Please try again shortly."
          : error.status === 401 || error.status === 403
            ? "The Gemini API key was rejected. Check GEMINI_API_KEY, billing, and image-model access, then restart the studio."
            : status === 504
              ? "This preview took too long. Try again with a clearer photo."
              : "The image provider could not complete this preview. Check the server API key, billing, and model access, then try again.";
    console.error("Generate failed:", error.status ?? status, error.message);
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
app.use(
  (
    error: Error & { type?: string },
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (res.headersSent) return next(error);
    res.status(error.type === "entity.too.large" ? 413 : 400).json({
      error:
        error.type === "entity.too.large"
          ? "The images are too large. Please choose smaller photos."
          : "The request could not be read. Please try again.",
    });
  },
);
if (process.argv.includes("--production")) {
  app.use(express.static(path.join(root, "dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(root, "dist", "index.html")),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
app.listen(port, host, () =>
  console.log(
    `Shingle Visualizer: http://${host === "0.0.0.0" ? "localhost" : host}:${port} (${apiKey() ? "image studio connected" : "explore mode · add GEMINI_API_KEY to .env or .env.local"})`,
  ),
);
