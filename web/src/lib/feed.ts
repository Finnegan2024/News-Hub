import { apiFetch } from "./api";

export interface FeedOrganization {
  id: string;
  name: string;
  logoUrl: string | null;
}

export type ReadTrigger = "scrolled" | "dwell_45s";

export interface FeedArticle {
  id: string;
  title: string;
  summary: string | null;
  sourceUrl: string;
  imageUrl: string | null;
  publishedAt: string;
  organization: FeedOrganization;
  isRead: boolean;
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

export function postReadEvent(articleId: string, trigger: ReadTrigger): Promise<void> {
  return apiFetch<void>(`/articles/${articleId}/read-events`, {
    method: "POST",
    body: JSON.stringify({ trigger }),
  });
}
