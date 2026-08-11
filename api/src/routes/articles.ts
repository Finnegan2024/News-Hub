import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/requireAuth.js";

export const articlesRouter = Router();

articlesRouter.use(requireAuth);

articlesRouter.get("/:id", async (req, res) => {
  const article = await prisma.article.findUnique({
    where: { id: req.params.id },
    include: {
      organization: { select: { id: true, name: true, logoUrl: true } },
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
  });
});
