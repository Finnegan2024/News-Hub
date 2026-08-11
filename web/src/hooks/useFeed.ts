import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchArticle, fetchFeed } from "../lib/feed";

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }: { pageParam?: string }) => fetchFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ["articles", id],
    queryFn: () => fetchArticle(id),
  });
}
