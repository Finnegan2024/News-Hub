import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { sessionMiddleware } from "./lib/session.js";
import { authRouter } from "./routes/auth.js";
import { organizationsRouter } from "./routes/organizations.js";
import { ingestArticles } from "./lib/ingest.js";

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

// Dev-only: trigger ingestion on demand instead of waiting for the cron tick.
if (!isProduction) {
  app.post("/api/internal/ingest", async (_req, res) => {
    await ingestArticles();
    res.status(204).send();
  });
}

// Single-service topology (§2/§10.1): ingestion runs in-process on the same
// server as the API, not as a separate worker.
cron.schedule("0 */2 * * *", () => {
  ingestArticles().catch((err) => console.error("Scheduled ingestion failed:", err));
});

app.listen(port, () => {
  console.log(`NewsHub API listening on http://localhost:${port}`);
});
