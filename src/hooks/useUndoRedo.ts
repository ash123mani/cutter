import { useEffect, useRef, useCallback } from 'react';

type DeletedSection = {
    node:        Element;
    parent:      Element;
    nextSibling: Node | null;
};

interface UndoRedoOptions {
    contentRef: React.RefObject<HTMLDivElement | null>;
    titleRef:   React.RefObject<HTMLDivElement | null>;
}

interface UndoRedoActions {
    pushDeleted: (entry: DeletedSection) => void;
}

export function useUndoRedo({ contentRef, titleRef }: UndoRedoOptions): UndoRedoActions {
    const stackRef = useRef<DeletedSection[]>([]);

    const pushDeleted = useCallback((entry: DeletedSection) => {
        stackRef.current.push(entry);
    }, []);

    useEffect(() => {
        const isMac = navigator.platform.toUpperCase().includes('MAC');

        function handleKeyDown(e: KeyboardEvent) {
            const modKey   = isMac ? e.metaKey : e.ctrlKey;
            if (!modKey) return;

            const inEditor =
                contentRef?.current?.contains(document.activeElement) ||
                titleRef?.current?.contains(document.activeElement);

            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();

                // Pop from manual delete stack first
                // if (stackRef.current.length > 0) {
                //     const last = stackRef.current.pop()!;
                //     last.parent.insertBefore(last.node, last.nextSibling);
                //     return;
                // }

                // Fall back to native undo for text edits
                if (inEditor) document.execCommand('undo');
            }

            if (e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                if (inEditor) document.execCommand('redo');
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [contentRef, titleRef]);

    return { pushDeleted };
}
