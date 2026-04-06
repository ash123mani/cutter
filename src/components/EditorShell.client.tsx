'use client';

import { useRef, useCallback } from 'react';
import Toolbar from './Toolbar.client';
import { useUndoRedo, useCodeSections, useFocusTitleOnLoad } from '../hooks';
import * as styles from './ArticleEditor.module.css';
import { exportToPDF } from '../utils/pdfExport';

interface Props {
  article: any; // Replace with your Article type
}

export default function EditorShell({ article }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // ── Logic Hooks ────────────────────────────────────────
  const { pushDeleted } = useUndoRedo({ contentRef, titleRef });

  useFocusTitleOnLoad({ article, titleRef });

  useCodeSections({
    containerRef: contentRef,
    active: !!article,
    onDelete: pushDeleted,
  });

  const handleSave = useCallback(() => {
    if (!titleRef.current || !contentRef.current) return;

    const payload = {
      ...article,
      title: titleRef.current.innerText,
      content: contentRef.current.innerHTML,
    };
    console.log('Saving article:', payload);
    // Add your mutation logic here
  }, [article]);

  const handleDownloadPDF = useCallback(async () => {
    if (!contentRef.current || !titleRef.current) return;
    await exportToPDF(titleRef.current.innerText, contentRef.current.innerHTML);
  }, []);

  return (
    <div className={styles.articleWrapper}>
      <Toolbar onSave={handleSave} onDownloadPDF={handleDownloadPDF} />

      <article className={styles.editorCard}>
        <header className={styles.meta}>
          {article.siteName && <span>{article.siteName}</span>}
          {article.siteName && article.byline && <span className={styles.metaDot}>·</span>}
          {article.byline && <span>{article.byline}</span>}
        </header>

        <div
          ref={titleRef}
          className={styles.title}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label="Article Title"
        >
          {article.title}
        </div>

        <hr className="divider" />

        <div
          ref={contentRef}
          className={styles.content}
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: article.content }}
          aria-label="Article Content"
        />
      </article>
    </div>
  );
}
