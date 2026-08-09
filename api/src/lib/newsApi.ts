const NEWS_API_BASE = "https://newsapi.org/v2";

interface NewsApiSource {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  language: string;
  country: string;
}

interface NewsApiSourcesResponse {
  status: "ok" | "error";
  sources?: NewsApiSource[];
  message?: string;
}

export async function fetchNewsApiSources(params: {
  category: string;
  language: string;
}): Promise<NewsApiSource[]> {
  const apiKey = process.env.NEWS_API_KEY;
  const url = new URL(`${NEWS_API_BASE}/sources`);
  url.searchParams.set("category", params.category);
  url.searchParams.set("language", params.language);
  url.searchParams.set("apiKey", apiKey as string);

  const res = await fetch(url);
  const body = (await res.json()) as NewsApiSourcesResponse;

  if (!res.ok || body.status !== "ok" || !body.sources) {
    throw new Error(`NewsAPI /sources request failed: ${body.message ?? res.statusText}`);
  }

  return body.sources;
}

export interface NewsApiArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
}

interface NewsApiTopHeadlinesResponse {
  status: "ok" | "error";
  articles?: NewsApiArticle[];
  message?: string;
}

export async function fetchTopHeadlines(newsApiSourceId: string): Promise<NewsApiArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  const url = new URL(`${NEWS_API_BASE}/top-headlines`);
  url.searchParams.set("sources", newsApiSourceId);
  url.searchParams.set("apiKey", apiKey as string);

  const res = await fetch(url);
  const body = (await res.json()) as NewsApiTopHeadlinesResponse;

  if (!res.ok || body.status !== "ok" || !body.articles) {
    throw new Error(
      `NewsAPI /top-headlines request failed for source "${newsApiSourceId}": ${body.message ?? res.statusText}`,
    );
  }

  return body.articles;
}
