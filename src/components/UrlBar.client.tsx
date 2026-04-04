'use client'

import * as styles from './UrlBar.module.css';

interface Props {
    url: string;
    loading: boolean;
    error: string;
    onChange: (val: string) => void;
    onFetch: () => void;
}

export default function UrlBar({ url, loading, error, onChange, onFetch }: Props) {
    return (
        <div className={styles.root}>
            <p className={styles.eyebrow}>Article URL</p>
            <div className={styles.inputRow}>
                <input
                    className={styles.input}
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onFetch()}
                    aria-label="Article URL"
                />
                <button
                    className={styles.button}
                    onClick={onFetch}
                    disabled={loading || !url.trim()}
                    aria-busy={loading}
                >
                    {loading ? 'Loading…' : 'Load Article'}
                </button>
            </div>
            {error && (
                <p className={styles.error} role="alert">
                    <span aria-hidden>⚠</span> {error}
                </p>
            )}
        </div>
    );
}
