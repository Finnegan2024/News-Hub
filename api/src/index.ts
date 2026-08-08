import "dotenv/config";
import express from "express";
import cors from "cors";
import { sessionMiddleware } from "./lib/session.js";
import { authRouter } from "./routes/auth.js";
import { organizationsRouter } from "./routes/organizations.js";

const app = express();
const port = process.env.PORT ?? 4000;

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

app.listen(port, () => {
  console.log(`NewsHub API listening on http://localhost:${port}`);
});
