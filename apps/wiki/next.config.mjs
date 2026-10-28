import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Pin the tracing root so a lockfile in a parent folder cannot move
  // server.js to a nested path inside .next/standalone.
  outputFileTracingRoot: root,
  // node:sqlite is a Node builtin, never bundle it.
  serverExternalPackages: ['node:sqlite'],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
