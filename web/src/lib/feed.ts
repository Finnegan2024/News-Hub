import { apiFetch } from "./api";

export interface FeedOrganization {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface FeedArticle {
  id: string;
  title: string;
  summary: string | null;
  sourceUrl: string;
  imageUrl: string | null;
  publishedAt: string;
  organization: FeedOrganization;
}

export interface FeedPage {
  articles: FeedArticle[];
  nextCursor: string | null;
}

export function fetchFeed(cursor?: string): Promise<FeedPage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  return apiFetch<FeedPage>(`/feed${query ? `?${query}` : ""}`);
}

export function fetchArticle(id: string): Promise<FeedArticle> {
  return apiFetch<FeedArticle>(`/articles/${id}`);
}
