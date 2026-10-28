// Next's standalone output does not include .next/static or public/.
// Copy them next to server.js, as the Next.js standalone docs require.
import { cpSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const standalone = path.join(root, '.next', 'standalone');

if (!existsSync(path.join(standalone, 'server.js'))) {
  console.error('postbuild: .next/standalone/server.js not found, did the build run?');
  process.exit(1);
}

const copies = [
  [path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static')],
  [path.join(root, 'public'), path.join(standalone, 'public')],
];
for (const [from, to] of copies) {
  if (existsSync(from)) {
    cpSync(from, to, { recursive: true });
    console.log(`postbuild: copied ${path.relative(root, from)} -> ${path.relative(root, to)}`);
  }
}
