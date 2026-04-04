'use client'

import { useState } from 'react';
import * as styles from './Counter.module.css';

export default function Counter() {
    const [count, setCount] = useState(0);

    return (
        <div>
            <p>Count: {count}</p>
            <button className={styles.button} onClick={() => setCount(c => c + 1)}>
                Increment
            </button>
        </div>
    );
}
