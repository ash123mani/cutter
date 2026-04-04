type DeletedSection = {
    node:        Element;
    parent:      Element;
    nextSibling: Node | null;
};

type WrapResult = {
    cleanup: () => void;
};

export function wrapCodeSections(
    container: HTMLDivElement,
    onDelete:  (entry: DeletedSection) => void,
): WrapResult {
    const listeners: Array<{ el: HTMLElement; type: string; fn: EventListener }> = [];

    const addListener = (el: HTMLElement, type: string, fn: EventListener) => {
        el.addEventListener(type, fn);
        listeners.push({ el, type, fn });
    };

    container.querySelectorAll('pre').forEach((pre, index) => {
        if (pre.parentElement?.classList.contains('section-body')) return;

        const wrapper     = createElement('div',    'section-wrapper');
        const header      = createElement('div',    'section-header');
        const label       = createElement('span',   'section-label');
        const icon        = createElement('i',      'collapse-icon');
        const labelText   = createElement('span');
        const actions     = createElement('div',    'section-actions');
        const collapseBtn = createElement('button', 'section-btn');
        const deleteBtn   = createElement('button', 'section-btn section-btn-delete');
        const body        = createElement('div',    'section-body');

        icon.textContent        = '▾';
        icon.setAttribute('aria-hidden', 'true');
        labelText.textContent   = `Code Block ${index + 1}`;
        collapseBtn.textContent = 'Collapse';
        collapseBtn.setAttribute('aria-expanded', 'true');
        deleteBtn.textContent   = 'Delete';
        deleteBtn.setAttribute('aria-label', `Delete code block ${index + 1}`);

        label.append(icon, labelText);
        actions.append(collapseBtn, deleteBtn);
        header.append(label, actions);

        // ✅ Step 1 — insert wrapper into the DOM at pre's current position
        pre.parentNode?.insertBefore(wrapper, pre);

        // ✅ Step 2 — now move pre into body (pre.parentNode is now original parent, not wrapper)
        body.appendChild(pre);

        // ✅ Step 3 — finalize wrapper structure
        wrapper.append(header, body);

        addListener(collapseBtn, 'click', () => {
            const isCollapsed = body.classList.toggle('collapsed');
            icon.classList.toggle('collapsed', isCollapsed);
            collapseBtn.textContent = isCollapsed ? 'Expand' : 'Collapse';
            collapseBtn.setAttribute('aria-expanded', String(!isCollapsed));
        });

        addListener(deleteBtn, 'click', () => {
            onDelete({
                node:        wrapper,
                parent:      wrapper.parentElement!,
                nextSibling: wrapper.nextSibling,
            });
            wrapper.remove();
        });
    });

    const cleanup = () =>
        listeners.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));

    return { cleanup };
}

function createElement(tag: string, className?: string): HTMLElement {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
}
