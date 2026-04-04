'use client'

import * as styles from './Toolbar.module.css';

interface Props {
    onSave: () => void;
}

export default function Toolbar({ onSave }: Props) {
    return (
        <div className={styles.root} role="toolbar" aria-label="Article editing tools">
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSave}>
                Save
            </button>
        </div>
    );
}
