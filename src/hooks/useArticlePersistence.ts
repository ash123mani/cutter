import { useCallback, useEffect } from 'react';
import type { Article } from '../utils/fetchArticle';

const STORAGE_KEY = 'readwise-article';

interface PersistenceOptions {
  onLoad: (article: Article) => void;
}

interface PersistenceActions {
  save: (article: Article) => void;
  clear: () => void;
}

export function useArticlePersistence({ onLoad }: PersistenceOptions): PersistenceActions {
  // Load on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        onLoad(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((article: Article) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(article));
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { save, clear };
}
