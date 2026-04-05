'use client'

import {useCallback, useRef, useState} from 'react';
import UrlBar from './UrlBar.client';
import Toolbar from './Toolbar.client';
import {useArticleFetcher} from './hooks/useArticleFetcher';
import {useUndoRedo} from './hooks/useUndoRedo';
import {useCodeSections} from './hooks/useCodeSections';
import * as styles from './ArticleEditor.module.css';
import {useFocusTitleOnLoad} from "./hooks/useFocusTitleOnLoad";
import UserMenu from "./UserMenu.client";

export default function ArticleEditor() {
    const [url, setUrl] = useState('');

    const contentRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);

    // ── Hooks ────────────────────────────────────────────
    const {article, loading, error, fetch} = useArticleFetcher();

    const {pushDeleted} = useUndoRedo({contentRef, titleRef});

    useFocusTitleOnLoad({article, titleRef});

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
    }, [article]);

    // ── Render ───────────────────────────────────────────
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container">
                    <div className={styles.headerInner}>
      <span className={styles.logo}>
        Read<span className={styles.logoAccent}>wise</span>
      </span>

                        <div className={styles.headerRight}>
                            <span className={styles.tagline}>Article Editor</span>
                            <UserMenu />
                        </div>
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
                        />
                        <div className={styles.editorCard}>
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
                    </div>
                )}
            </div>

        </div>
    );
}
