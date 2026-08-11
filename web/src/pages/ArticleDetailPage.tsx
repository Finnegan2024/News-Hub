import { Link, useParams } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { useArticle } from "../hooks/useFeed";
import { useReadTracking } from "../hooks/useReadTracking";

export function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const articleId = id as string;
  const { data: article, isPending, isError } = useArticle(articleId);

  useReadTracking(articleId, !isPending && !!article, article?.isRead ?? false);

  return (
    <>
      <AppHeader />
      <main>
        <p>
          <Link to="/feed">← Back to feed</Link>
        </p>

        {isPending && <p>Loading…</p>}
        {isError && <p role="alert">Couldn't load this article.</p>}

        {article && (
          <article>
            <h1>{article.title}</h1>
            <p>
              {article.organization.name} ·{" "}
              {new Date(article.publishedAt).toLocaleString()}
            </p>
            {article.summary && <p>{article.summary}</p>}
            <p>
              <a href={article.sourceUrl} target="_blank" rel="noreferrer">
                Read full article at source
              </a>
            </p>
          </article>
        )}
      </main>
    </>
  );
}
