import { Link } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { useFeed } from "../hooks/useFeed";
import { useOrganizations } from "../hooks/useOrganizations";

export function FeedPage() {
  const feed = useFeed();
  const { data: organizations } = useOrganizations();

  const followedCount = organizations?.filter((org) => org.isFollowed).length ?? 0;
  const articles = feed.data?.pages.flatMap((page) => page.articles) ?? [];

  return (
    <>
      <AppHeader />
      <main>
        <h1>Feed</h1>

        {feed.isPending && <p>Loading…</p>}

        {feed.isError && (
          <p role="alert">
            Couldn't load your feed.{" "}
            <button onClick={() => feed.refetch()}>Retry</button>
          </p>
        )}

        {feed.isSuccess && articles.length === 0 && followedCount === 0 && (
          <p>
            You're not following any organizations yet.{" "}
            <Link to="/organizations">Follow some to build your feed</Link>.
          </p>
        )}

        {feed.isSuccess && articles.length === 0 && followedCount > 0 && (
          <p>No articles yet from your followed organizations. Check back soon.</p>
        )}

        {articles.length > 0 && (
          <ul>
            {articles.map((article) => (
              <li
                key={article.id}
                className={article.isRead ? "feed-item feed-item--read" : "feed-item feed-item--unread"}
              >
                <Link to={`/articles/${article.id}`}>
                  <h2>
                    {!article.isRead && (
                      <span className="unread-dot" aria-label="Unread" />
                    )}
                    {article.title}
                  </h2>
                </Link>
                <p>
                  {article.organization.name} ·{" "}
                  {new Date(article.publishedAt).toLocaleString()}
                </p>
                {article.summary && <p>{article.summary}</p>}
              </li>
            ))}
          </ul>
        )}

        {feed.hasNextPage && (
          <button onClick={() => feed.fetchNextPage()} disabled={feed.isFetchingNextPage}>
            {feed.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        )}
      </main>
    </>
  );
}
