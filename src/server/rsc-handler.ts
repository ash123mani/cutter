import { renderToPipeableStream } from 'react-server-dom-webpack/server.node';
import React from 'react';
import App from '../components/App.server.js'; // 👈 .js extension in ESM
import type { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getClientManifest() {
    const manifestPath = path.join(__dirname, '../../public/react-client-manifest.json');

    if (!fs.existsSync(manifestPath)) {
        console.warn('Client manifest not found!');
        return {};
    }

    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

export function renderRSC(res: Response) {
    const clientModuleMap = getClientManifest();

    const { pipe } = renderToPipeableStream(
        React.createElement(App),
        clientModuleMap
    );

    res.setHeader('Content-Type', 'text/x-component');
    pipe(res);
}
