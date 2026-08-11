import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/requireAuth.js";

export const articlesRouter = Router();

articlesRouter.use(requireAuth);

articlesRouter.get("/:id", async (req, res) => {
  const userId = req.session.userId as string;

  const article = await prisma.article.findUnique({
    where: { id: req.params.id },
    include: {
      organization: { select: { id: true, name: true, logoUrl: true } },
      readEvents: { where: { userId }, select: { userId: true } },
    },
  });

  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }

  res.json({
    id: article.id,
    title: article.title,
    summary: article.summary,
    sourceUrl: article.sourceUrl,
    imageUrl: article.imageUrl,
    publishedAt: article.publishedAt,
    organization: article.organization,
    isRead: article.readEvents.length > 0,
  });
});

const VALID_TRIGGERS = new Set(["scrolled", "dwell_45s"]);

articlesRouter.post("/:id/read-events", async (req, res) => {
  const userId = req.session.userId as string;
  const articleId = req.params.id;
  const trigger = req.body?.trigger;

  if (!VALID_TRIGGERS.has(trigger)) {
    return res.status(400).json({ error: "trigger must be 'scrolled' or 'dwell_45s'." });
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }

  // Idempotent: the first read event for a (user, article) pair wins —
  // repeat calls (e.g. both triggers firing) are a no-op.
  await prisma.readEvent.upsert({
    where: { userId_articleId: { userId, articleId } },
    update: {},
    create: { userId, articleId, trigger },
  });

  res.status(204).send();
});
