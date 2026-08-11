import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { sessionMiddleware } from "./lib/session.js";
import { authRouter } from "./routes/auth.js";
import { organizationsRouter } from "./routes/organizations.js";
import { feedRouter } from "./routes/feed.js";
import { articlesRouter } from "./routes/articles.js";
import { ingestArticles } from "./lib/ingest.js";
import { asyncHandler } from "./lib/asyncHandler.js";

const app = express();
const port = process.env.PORT ?? 4000;
const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: process.env.WEB_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(sessionMiddleware);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/feed", feedRouter);
app.use("/api/articles", articlesRouter);

// Dev-only: trigger ingestion on demand instead of waiting for the cron tick.
if (!isProduction) {
  app.post(
    "/api/internal/ingest",
    asyncHandler(async (_req, res) => {
      await ingestArticles();
      res.status(204).send();
    }),
  );
}

// Single-service topology (§2/§10.1): ingestion runs in-process on the same
// server as the API, not as a separate worker.
cron.schedule("0 */2 * * *", () => {
  ingestArticles().catch((err) => console.error("Scheduled ingestion failed:", err));
});

// Final safety net: any error reaching here (via asyncHandler's next(err),
// or a sync throw) is logged and answered with 500 instead of taking down
// the process. Must be registered after all routes.
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled request error:", err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Something went wrong." });
  },
);

app.listen(port, () => {
  console.log(`NewsHub API listening on http://localhost:${port}`);
});
