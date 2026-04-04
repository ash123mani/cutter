# React Server Components from Scratch

A custom RSC setup using **Node.js**, **TypeScript**, **React 19**, and **Webpack** — no Next.js, no framework magic.

---

## Table of Contents

- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [The Three Hard Problems](#the-three-hard-problems)
- [Installation](#installation)
- [File Reference](#file-reference)
- [Running the App](#running-the-app)
- [Key Concepts](#key-concepts)

---

## Project Structure

```
rsc-app/
├── src/
│   ├── server/
│   │   ├── index.ts                      # Express server
│   │   ├── rsc-handler.ts                # RSC rendering handler
│   │   ├── register.mjs                  # Node loader registration
│   │   └── client-reference-loader.mjs   # Intercepts 'use client' files
│   ├── components/
│   │   ├── App.server.tsx                # Server Component
│   │   └── Counter.client.tsx            # Client Component
│   └── client/
│       └── index.tsx                     # Browser entry point (hydration)
├── public/
│   └── index.html                        # HTML shell
├── webpack.client.cjs                    # Client Webpack config
├── tsconfig.json
└── package.json
```

---

## How It Works

### The Full Request Flow

```
1. Browser visits localhost:3001
         ↓
2. webpack-dev-server serves public/index.html
         ↓
3. index.html loads /client.bundle.js
         ↓
4. client/index.tsx runs → fetches /rsc from localhost:3000
         ↓
5. Express receives GET /rsc → calls renderRSC()
         ↓
6. Server renders App.server.tsx
   → encounters <Counter />
   → client-reference-loader already swapped Counter with a reference
   → emits a reference marker, NOT the component's HTML
   → streams RSC payload back to browser
         ↓
7. Browser decodes RSC payload via createFromFetch()
   → sees Counter reference → loads it from client.bundle.js
   → hydrates Counter with useState working in the browser
         ↓
8. Page renders with server content + interactive client components
```

### Two Ports in Development

| Port | Process | Purpose |
|------|---------|---------|
| `3000` | Express | Serves `/rsc` endpoint and static files |
| `3001` | webpack-dev-server | Serves client bundle with Hot Module Replacement |

In production only port `3000` is needed. Port `3001` is a development convenience for hot reloading.

---

## The Three Hard Problems

### Problem 1 — Server tried to run `useState`

When the server imported `Counter.client.tsx` it tried to execute `useState`, which only exists in the browser — causing a crash.

**Solution: `client-reference-loader.mjs`**

A custom Node module loader that intercepts every file import. If it sees `'use client'` at the top, it replaces the entire module with a `registerClientReference()` call instead of executing the component. The server never runs the component — it just emits a reference that the browser knows how to resolve.

```
Server imports Counter.client.tsx
    → loader sees 'use client'
    → swaps with registerClientReference()
    → server emits a reference marker
    → browser loads the real Counter from client.bundle.js
```

### Problem 2 — Node loaded the wrong React build

React 19 ships multiple builds:

| Condition | Build | Contains |
|-----------|-------|---------|
| default (browser) | `react.development.js` | `useState`, hooks, full API |
| `react-server` | `react.react-server.development.js` | Server-only APIs, no hooks |

Without telling Node which build to use, it loaded the default browser build inside the server — which throws an error because the server environment is not configured for it.

**Solution: `--conditions react-server` flag**

```json
"dev:server": "node --conditions react-server --import ./src/server/register.mjs src/server/index.ts"
```

This tells Node's module resolver to prefer the `react-server` export condition when loading any package, so React loads its correct server build.

### Problem 3 — ESM import resolution failures

With `"type": "module"` in `package.json`, all files are treated as ESM. Node's ESM resolver does not auto-append file extensions — every import must be explicit.

**Solution: Use `.js` extensions on all local imports**

Even though source files are `.tsx`, TypeScript compiles them to `.js`. ESM requires the compiled extension:

```ts
// Wrong
import Counter from './Counter.client';
import App from '../components/App.server';

// Correct
import Counter from './Counter.client.js';
import App from '../components/App.server.js';
```

---

## Installation

```bash
# 1. Create project
mkdir rsc-app && cd rsc-app
npm init -y

# 2. Runtime dependencies
npm install react@19 react-dom@19 react-server-dom-webpack@19 express@4

# 3. TypeScript + Node types
npm install -D typescript @types/react @types/react-dom @types/express @types/node

# 4. Webpack
npm install -D webpack webpack-cli webpack-node-externals

# 5. Babel (used by webpack loaders)
npm install -D babel-loader @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript

# 6. Dev tooling
npm install -D tsx ts-node nodemon concurrently webpack-dev-server
```

---

## File Reference

### `src/server/register.mjs`

Runs before anything else via Node's `--import` flag. Registers two loaders:
1. `ts-node/esm` — so Node can read TypeScript files
2. `client-reference-loader.mjs` — so `'use client'` files are intercepted

```js
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('ts-node/esm', pathToFileURL('./'));

register(
  pathToFileURL('./src/server/client-reference-loader.mjs').href,
  pathToFileURL('./')
);
```

### `src/server/client-reference-loader.mjs`

Intercepts every file Node imports. If the file starts with `'use client'`, it replaces the module with a client reference so the server never executes it.

```js
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);

  if (result.source) {
    const source = result.source.toString();
    if (source.startsWith("'use client'") || source.startsWith('"use client"')) {
      const newSource = `
        import { registerClientReference } from 'react-server-dom-webpack/server';
        export default registerClientReference(
          function() { throw new Error('Client component cannot be called on server'); },
          ${JSON.stringify(url)},
          'default'
        );
      `;
      return { ...result, source: newSource };
    }
  }

  return result;
}
```

### `src/server/rsc-handler.ts`

Reads the client manifest generated by Webpack and streams the RSC payload to the Express response.

```ts
import { renderToPipeableStream } from 'react-server-dom-webpack/server.node';
import React from 'react';
import App from '../components/App.server.js';
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
```

### `src/server/index.ts`

Express server with four routes.

```ts
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { renderRSC } from './rsc-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '../../public')));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.get('/rsc', (req, res) => {
  renderRSC(res);
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

### `src/components/App.server.tsx`

A Server Component. Can use `async/await` directly. Imports client components by reference.

```tsx
import React from 'react';
import Counter from './Counter.client.js';

async function getData() {
  return { message: 'Hello from the Server Component!' };
}

export default async function App() {
  const data = await getData();

  return (
    <main>
      <h1>{data.message}</h1>
      <p>This was rendered on the server.</p>
      <Counter />
    </main>
  );
}
```

### `src/components/Counter.client.tsx`

A Client Component. The `'use client'` directive must be the **first line**, with **single quotes**.

```tsx
'use client'

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

### `src/client/index.tsx`

Browser entry point. Fetches the RSC payload and hydrates the DOM.

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createFromFetch } from 'react-server-dom-webpack/client';

async function main() {
  const responsePromise = fetch('/rsc');
  const root = await createFromFetch(responsePromise);

  const domRoot = createRoot(document.getElementById('root')!);
  domRoot.render(root as React.ReactElement);
}

main();
```

### `webpack.client.cjs`

Bundles client components for the browser. The `ReactServerWebpackPlugin` generates `react-client-manifest.json` which maps client components to their bundle locations.

```js
const path = require('path');
const ReactServerWebpackPlugin = require('react-server-dom-webpack/plugin');

module.exports = {
  name: 'client',
  target: 'web',
  mode: 'development',
  entry: './src/client/index.tsx',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'client.bundle.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    conditionNames: ['browser', 'module', 'import', 'default'],
  },
  plugins: [
    new ReactServerWebpackPlugin({ isServer: false }),
  ],
  devServer: {
    port: 3001,
    hot: true,
    open: true,
    static: path.resolve(__dirname, 'public'),
    historyApiFallback: true,
    proxy: [
      {
        context: ['/rsc'],
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
};
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "rootDir": "./src",
    "ignoreDeprecations": "5.0",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "ts-node": {
    "transpileOnly": true,
    "esm": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### `package.json` scripts

```json
{
  "type": "module",
  "scripts": {
    "build:client": "webpack --config webpack.client.cjs",
    "dev:client": "webpack serve --config webpack.client.cjs",
    "dev:server": "nodemon --exec \"node --conditions react-server --import ./src/server/register.mjs src/server/index.ts\" --watch src --ext ts,tsx,mjs",
    "dev": "npm run build:client && concurrently \"npm run dev:client\" \"npm run dev:server\""
  }
}
```

---

## Running the App

```bash
npm run dev
```

Then open **http://localhost:3001** in your browser.

| URL | What you get |
|-----|-------------|
| `http://localhost:3001` | The app (webpack-dev-server) |
| `http://localhost:3000/rsc` | Raw RSC payload |
| `http://localhost:3000/health` | Server health check |

---

## Key Concepts

| Concept | What it means |
|---------|--------------|
| `'use client'` | Marks a component as a Client Component — must be single quotes, must be the first line |
| RSC payload (`text/x-component`) | A special streaming format describing the component tree — not HTML, not JSON |
| `react-client-manifest.json` | Generated by Webpack — maps every client component to its bundle location |
| `--conditions react-server` | Tells Node to load the server build of React instead of the browser build |
| `client-reference-loader.mjs` | Intercepts `'use client'` files so the server never executes them |
| `.js` extensions on imports | Required in ESM — Node won't auto-resolve `.ts` or `.tsx` |
| `registerClientReference()` | Replaces a client component on the server with a reference the browser can resolve |

---

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `react-server condition must be enabled` | Node loaded browser React on server | Add `--conditions react-server` to Node command |
| `useState is not a function` | Server executed a client component | Ensure `client-reference-loader.mjs` is registered and `'use client'` uses single quotes |
| `Cannot find module './Counter.client'` | Missing `.js` extension in ESM | Add `.js` to all local imports |
| `exports is not defined` | ts-node compiling to CJS in ESM project | Remove `"module": "CommonJS"` override from `ts-node` config in `tsconfig.json` |
| `Cannot GET /` | webpack-dev-server can't find `index.html` | Ensure `public/index.html` exists and `static` points to `public/` with absolute path |
| `Missing parameter name` | Express v5 wildcard syntax changed | Use `/{*path}` instead of `*`, or downgrade to Express v4 |
# cutter
