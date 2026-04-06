import { useState, useCallback } from 'react';
import { fetchAndParseArticle, type Article } from '../utils/fetchArticle';

interface FetcherState {
  article: Article | null;
  loading: boolean;
  error: string;
}

interface FetcherActions {
  fetch: (url: string) => Promise<void>;
}

export function useArticleFetcher(): FetcherState & FetcherActions {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetch = useCallback(async (url: string) => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setArticle(null);

    try {
      const result = await fetchAndParseArticle(url);
      setArticle(result);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { article, loading, error, fetch };
}
