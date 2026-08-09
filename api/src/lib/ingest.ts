import { prisma } from "./prisma.js";
import { fetchTopHeadlines } from "./newsApi.js";

interface SourceConfig {
  newsApiSourceId?: string;
}

export async function ingestArticles() {
  const organizations = await prisma.organization.findMany({
    where: { sourceType: "api" },
  });

  for (const organization of organizations) {
    const sourceConfig = organization.sourceConfig as SourceConfig;
    const newsApiSourceId = sourceConfig.newsApiSourceId;

    if (!newsApiSourceId) {
      console.error(`Organization ${organization.name} has no newsApiSourceId, skipping.`);
      continue;
    }

    try {
      const articles = await fetchTopHeadlines(newsApiSourceId);

      for (const article of articles) {
        await prisma.article.upsert({
          where: {
            organizationId_externalId: {
              organizationId: organization.id,
              externalId: article.url,
            },
          },
          update: {
            title: article.title,
            summary: article.description,
            imageUrl: article.urlToImage,
            publishedAt: new Date(article.publishedAt),
          },
          create: {
            organizationId: organization.id,
            externalId: article.url,
            title: article.title,
            summary: article.description,
            sourceUrl: article.url,
            imageUrl: article.urlToImage,
            publishedAt: new Date(article.publishedAt),
          },
        });
      }

      console.log(`Ingested ${articles.length} articles for ${organization.name}.`);
    } catch (err) {
      console.error(`Ingestion failed for organization ${organization.name}:`, err);
    }
  }
}
