import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/requireAuth.js";

export const feedRouter = Router();

feedRouter.use(requireAuth);

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

feedRouter.get("/", async (req, res) => {
  const userId = req.session.userId as string;
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const limit = Math.min(
    Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const articles = await prisma.article.findMany({
    where: {
      organization: { follows: { some: { userId } } },
    },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      organization: { select: { id: true, name: true, logoUrl: true } },
      readEvents: { where: { userId }, select: { userId: true } },
    },
  });

  const hasMore = articles.length > limit;
  const page = hasMore ? articles.slice(0, limit) : articles;

  res.json({
    articles: page.map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.summary,
      sourceUrl: article.sourceUrl,
      imageUrl: article.imageUrl,
      publishedAt: article.publishedAt,
      organization: article.organization,
      isRead: article.readEvents.length > 0,
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});
