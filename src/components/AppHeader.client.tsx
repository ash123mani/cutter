'use client';

import * as styles from './AppHeader.module.css';
import UserMenu from './UserMenu.client';

export default function AppHeader() {
  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerInner}>
           <span className={styles.logo}>
             CopyCut<span className={styles.logoAccent}>Save</span>
            </span>
          <div className={styles.headerRight}>
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
