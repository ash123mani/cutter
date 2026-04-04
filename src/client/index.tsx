import React from 'react';
import { createRoot } from 'react-dom/client';
import { createFromFetch } from 'react-server-dom-webpack/client';
import '../styles/tokens.css';
import '../styles/typography.css';
import '../styles/utils.css';

async function main() {
    const responsePromise = fetch('/rsc');
    const root = await createFromFetch(responsePromise);
    const domRoot = createRoot(document.getElementById('root')!);
    domRoot.render(root as React.ReactElement);
}

main();
