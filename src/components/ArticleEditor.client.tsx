'use client';

import { useState } from 'react';
import AppHeader from './AppHeader.client';
import UrlBar from './UrlBar.client';
import EditorShell from './EditorShell.client';
import { useArticleFetcher } from '../hooks/useArticleFetcher';
import * as styles from './ArticleEditor.module.css';

export default function ArticleEditorPage() {
  const [url, setUrl] = useState('');
  const { article, loading, error, fetch } = useArticleFetcher();

  return (
    <div className={styles.page}>
      <AppHeader />
      <div className="container">
        <UrlBar
          url={url}
          loading={loading}
          error={error}
          onChange={setUrl}
          onFetch={() => fetch(url)}
        />

        {loading && <LoadingIndicator />}

        {article && <EditorShell article={article} />}
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className={styles.loadingState}>
      <span className={styles.loadingDots}>Fetching article</span>
    </div>
  );
}
