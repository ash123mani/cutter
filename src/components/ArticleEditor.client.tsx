'use client'

import {useState, useRef, useCallback} from 'react';
import UrlBar from './UrlBar.client';
import Toolbar from './Toolbar.client';
import {useArticleFetcher} from './hooks/useArticleFetcher';
// import {useArticlePersistence} from './hooks/useArticlePersistence';
import {useUndoRedo} from './hooks/useUndoRedo';
import {useCodeSections} from './hooks/useCodeSections';
import {exportToPDF} from './utils/pdfExport';
import * as styles from './ArticleEditor.module.css';

export default function ArticleEditor() {
    const [url, setUrl] = useState('');
    const [saved, setSaved] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);

    // ── Hooks ────────────────────────────────────────────
    const {article, loading, error, fetch, setArticle} = useArticleFetcher();

    const {pushDeleted} = useUndoRedo({contentRef, titleRef});

    // useArticlePersistence({onLoad: setArticle});

    useCodeSections({
        containerRef: contentRef,
        active: !!article,
        onDelete: pushDeleted,
    });

    // ── Handlers ─────────────────────────────────────────
    const handleSave = useCallback(() => {
        if (!article || !contentRef.current || !titleRef.current) return;

        const updated = {
            ...article,
            title: titleRef.current.innerText,
            content: contentRef.current.innerHTML,
        };

        setArticle(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    }, [article, setArticle]);

    const handleDeleteSection = useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'figure', 'div'];
        let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;

        while (node && node !== contentRef.current) {
            if (blockTags.includes((node as HTMLElement).tagName?.toLowerCase())) {
                (node as HTMLElement).remove();
                return;
            }
            node = node.parentNode;
        }
    }, []);

    const handleAddAnnotation = useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const note = prompt('Add annotation:');
        if (!note) return;

        const annotation = document.createElement('div');
        annotation.className = 'annotation';
        annotation.contentEditable = 'true';
        annotation.innerText = `📝 ${note}`;

        const range = sel.getRangeAt(0);
        range.collapse(false);
        range.insertNode(annotation);
        sel.removeAllRanges();
    }, []);

    const handleDownloadPDF = useCallback(async () => {
        if (!contentRef.current || !titleRef.current) return;
        await exportToPDF(titleRef.current.innerText, contentRef.current.innerHTML);
    }, []);

    // ── Render ───────────────────────────────────────────
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container">
                    <div className={styles.headerInner}>
            <span className={styles.logo}>
              Read<span className={styles.logoAccent}>wise</span>
            </span>
                        <span className={styles.tagline}>Article Editor</span>
                    </div>
                </div>
            </header>

            <div className="container">
                <UrlBar
                    url={url}
                    loading={loading}
                    error={error}
                    onChange={setUrl}
                    onFetch={() => fetch(url)}
                />

                {loading && (
                    <div className={styles.loadingState}>
                        <span className={styles.loadingDots}>Fetching article</span>
                    </div>
                )}

                {article && (
                    <div className={styles.articleWrapper}>
                        <Toolbar
                            onSave={handleSave}
                            onDownloadPDF={handleDownloadPDF}
                            onDeleteSection={handleDeleteSection}
                            onAddAnnotation={handleAddAnnotation}
                            saved={saved}
                        />

                        {(article.siteName || article.byline) && (
                            <div className={styles.meta}>
                                {article.siteName && <span>{article.siteName}</span>}
                                {article.siteName && article.byline && (
                                    <span className={styles.metaDot}>·</span>
                                )}
                                {article.byline && <span>{article.byline}</span>}
                            </div>
                        )}

                        <div
                            ref={titleRef}
                            className={styles.title}
                            contentEditable
                            suppressContentEditableWarning
                            role="heading"
                            aria-level={1}
                        >
                            {article.title}
                        </div>

                        <hr className="divider"/>

                        <div
                            ref={contentRef}
                            className={styles.content}
                            contentEditable
                            suppressContentEditableWarning
                            dangerouslySetInnerHTML={{__html: article.content}}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
