import { useEffect } from 'react';
import { wrapCodeSections } from '../utils/codeSections';

interface CodeSectionsOptions {
    containerRef: React.RefObject<HTMLDivElement | null>;
    active:       boolean;
    onDelete:     (entry: { node: Element; parent: Element; nextSibling: Node | null }) => void;
}

export function useCodeSections({ containerRef, active, onDelete }: CodeSectionsOptions): void {
    useEffect(() => {
        if (!active || !containerRef?.current) return;

        const timer = setTimeout(() => {
            const { cleanup } = wrapCodeSections(containerRef?.current!, onDelete);
            return cleanup;
        }, 50);

        return () => clearTimeout(timer);
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
}
