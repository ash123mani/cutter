# React Server Components — Custom Setup

No Next.js. No framework. React 19 RSC from scratch with Node.js, TypeScript, and Webpack.

---

## How It Works

```
Node.js server (port 3000)          webpack-dev-server (port 3001)
       │                                       │
       │  GET /rsc                             │
       │  renders App.server.tsx               │  serves client.bundle.js
       │  streams RSC payload ─────────────────▶  decodes via createFromFetch()
       │                                       │  hydrates interactive components
```

### The Two Key Problems We Solved

**1. Server must never execute client components**

Any file with `'use client'` would crash on the server because `useState` doesn't exist in Node. We use a custom Node module loader that intercepts these files before they execute and replaces them with a reference marker the browser resolves instead.

**2. Node must load the correct React build**

React 19 ships two builds — one for browsers, one for servers. Without telling Node which to use it loads the wrong one. The `--conditions react-server` flag on the Node command forces the correct build.

---

## Project Structure

```
rsc-app/
├── src/
│   ├── server/
│   │   ├── index.ts                     # Express server
│   │   ├── rsc-handler.ts               # Renders RSC payload
│   │   ├── register.mjs                 # Registers Node loaders
│   │   └── client-reference-loader.mjs  # Intercepts 'use client' files
│   ├── components/
│   │   ├── App.server.tsx               # Server Component (async, no hooks)
│   │   └── Counter.client.tsx           # Client Component ('use client')
│   └── client/
│       └── index.tsx                    # Browser entry — hydration
├── public/
│   └── index.html
├── webpack.client.cjs
├── tsconfig.json
└── package.json
```

---

## How Server and Client Are Linked

### 1. `register.mjs` — runs before everything via `--import`

```js
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('ts-node/esm', pathToFileURL('./'));
register(pathToFileURL('./src/server/client-reference-loader.mjs').href, pathToFileURL('./'));
```

### 2. `client-reference-loader.mjs` — intercepts `'use client'` files

```js
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.source?.toString().startsWith("'use client'")) {
    return {
      ...result,
      source: `
        import { registerClientReference } from 'react-server-dom-webpack/server';
        export default registerClientReference(
          function() { throw new Error('Client only'); },
          ${JSON.stringify(url)}, 'default'
        );
      `
    };
  }
  return result;
}
```

### 3. `rsc-handler.ts` — streams the component tree

```ts
export function renderRSC(res: Response) {
  const clientModuleMap = JSON.parse(fs.readFileSync('public/react-client-manifest.json', 'utf-8'));
  const { pipe } = renderToPipeableStream(React.createElement(App), clientModuleMap);
  res.setHeader('Content-Type', 'text/x-component');
  pipe(res);
}
```

### 4. `client/index.tsx` — browser fetches and decodes the RSC payload

```tsx
const root = await createFromFetch(fetch('/rsc'));
createRoot(document.getElementById('root')!).render(root);
```

### 5. `webpack.client.cjs` — generates the client manifest

`ReactServerWebpackPlugin` scans for `'use client'` files and writes `public/react-client-manifest.json` — a map the server uses to know where each client component lives in the bundle.

---

## Libraries

| Package | Purpose |
|---------|---------|
| `react@19` `react-dom@19` | Core React |
| `react-server-dom-webpack@19` | RSC streaming renderer + client decoder |
| `express@4` | HTTP server |
| `ts-node` | Run TypeScript directly in Node |
| `webpack` `webpack-cli` | Client bundle |
| `webpack-dev-server` | Dev server with HMR on port 3001 |
| `babel-loader` `@babel/core` `@babel/preset-*` | Transpile TSX in Webpack |
| `typescript` `@types/*` | TypeScript support |
| `nodemon` `concurrently` | Dev runner tooling |

---

## Run Locally

```bash
# 1. Install
npm install

# 2. Start
npm run dev
```

Open **`http://localhost:3001`** in your browser.

| Port | What |
|------|------|
| `3001` | App — webpack-dev-server with HMR |
| `3000` | Express — RSC endpoint + static files |
| `3000/health` | Server health check |

### Scripts

```json
"build:client": "webpack --config webpack.client.cjs",
"dev:client":   "webpack serve --config webpack.client.cjs",
"dev:server":   "nodemon --exec \"node --conditions react-server --import ./src/server/register.mjs src/server/index.ts\" --watch src --ext ts,tsx,mjs",
"dev":          "npm run build:client && concurrently \"npm run dev:client\" \"npm run dev:server\""
```


### Auth

User clicks "Sign in with GitHub"
↓
Browser → GET http://localhost:3000/auth/github
↓
Passport redirects to github.com/login/oauth/authorize
↓
User approves on GitHub
↓
GitHub → GET http://localhost:3000/auth/github/callback
↓
Passport exchanges code → fetches GitHub profile
↓
Saves/finds user in MongoDB users collection
↓
Stores session in MongoDB sessions collection
↓
Sets session cookie in browser
↓
Redirects to http://localhost:3001
↓
UserMenu fetches /auth/session → gets user back
↓
Shows avatar + name
