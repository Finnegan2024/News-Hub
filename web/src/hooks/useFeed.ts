import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FeedArticle, ReadTrigger } from "../lib/feed";
import { fetchArticle, fetchFeed, postReadEvent } from "../lib/feed";

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

export function useMarkArticleRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, trigger }: { articleId: string; trigger: ReadTrigger }) =>
      postReadEvent(articleId, trigger),
    onSuccess: (_data, { articleId }) => {
      queryClient.setQueryData<FeedArticle>(["articles", articleId], (old) =>
        old ? { ...old, isRead: true } : old,
      );
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
