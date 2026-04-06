'use client';

import * as styles from './Toolbar.module.css';

interface Props {
  onSave: () => void;
  onDownloadPDF: () => void;
}

export default function Toolbar({ onSave, onDownloadPDF }: Props) {
  return (
    <div className={styles.root} role="toolbar" aria-label="Article editing tools">
      <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSave}>
        Save
      </button>
      <button className={styles.btn} onClick={onDownloadPDF}>
        Download PDF
      </button>
    </div>
  );
}
