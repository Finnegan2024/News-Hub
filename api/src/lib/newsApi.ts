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
