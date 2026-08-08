import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { fetchNewsApiSources } from "../src/lib/newsApi.js";

async function main() {
  const sources = await fetchNewsApiSources({ category: "general", language: "en" });
  const top5 = sources.slice(0, 5);

  if (top5.length === 0) {
    throw new Error("NewsAPI returned no sources for category=general&language=en");
  }

  for (const source of top5) {
    await prisma.organization.upsert({
      where: { slug: source.id },
      update: {
        name: source.name,
        sourceConfig: { newsApiSourceId: source.id },
      },
      create: {
        name: source.name,
        slug: source.id,
        sourceType: "api",
        sourceConfig: { newsApiSourceId: source.id },
      },
    });
    console.log(`Seeded organization: ${source.name} (${source.id})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
