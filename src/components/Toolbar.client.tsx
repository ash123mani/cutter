'use client'

import * as styles from './Toolbar.module.css';

interface Props {
    onSave: () => void;
    onDownloadPDF: () => void;
    onDeleteSection: () => void;
    onAddAnnotation: () => void;
    saved: boolean;
}

export default function Toolbar({ onSave, onDownloadPDF, onDeleteSection, onAddAnnotation, saved }: Props) {
    return (
        <div className={styles.root} role="toolbar" aria-label="Article editing tools">
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSave}>
                Save
            </button>
            <button className={styles.btn} onClick={onDownloadPDF}>
                Download PDF
            </button>
            <div className={styles.divider} aria-hidden />
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onDeleteSection}>
                Delete Section
            </button>
            <button className={styles.btn} onClick={onAddAnnotation}>
                Annotate
            </button>
            {saved && <span className={styles.badge} role="status">Saved</span>}
        </div>
    );
}
