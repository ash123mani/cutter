declare module 'react-server-dom-webpack/server.node' {
  import { ReactElement } from 'react';
  import { Writable } from 'stream';

  export function renderToPipeableStream(
    element: ReactElement,
    clientModuleMap: Record<string, unknown>,
    options?: object,
  ): { pipe: (writable: Writable) => void };
}

declare module 'react-server-dom-webpack/client' {
  import { ReactElement } from 'react';

  export function createFromFetch(
    responsePromise: Promise<Response>,
  ): Promise<ReactElement>;
}

declare module 'react-server-dom-webpack/plugin' {
  import { Compiler } from 'webpack';
  export default class ReactServerWebpackPlugin {
    constructor(options?: { isServer: boolean });

    apply(compiler: Compiler): void;
  }
}
