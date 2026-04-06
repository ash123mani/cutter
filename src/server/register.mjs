import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ts-node ESM loader so TypeScript files work
register('ts-node/esm', pathToFileURL('./'));

// Register our custom client reference loader
register(
  pathToFileURL('./src/server/client-reference-loader.mjs').href,
  pathToFileURL('./'),
);
