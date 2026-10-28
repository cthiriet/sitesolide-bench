# syntax=docker/dockerfile:1

# Build stage: generate the content, then build the static site into dist/.
FROM node:24-slim AS build
ENV ASTRO_TELEMETRY_DISABLED=1
WORKDIR /app

# Dependencies first, so this layer is reused until the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY astro.config.mjs tsconfig.json ./
COPY scripts ./scripts
COPY public ./public
COPY src ./src

# The prebuild step runs scripts/generate.mjs: about 300 pages and 100 PNG files.
RUN npm run build

# Serve stage: nginx serves the files, nothing else runs.
FROM nginx:stable
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
