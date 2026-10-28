# syntax=docker/dockerfile:1

# --- build: install dependencies and produce the standalone server ----------
FROM node:24-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime: the standalone server, nothing else ---------------------------
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATA_DIR=/data

# The standalone server (static files and public/ were copied in by postbuild),
# the launcher that maps HOST to HOSTNAME, and what scripts/seed.mjs imports.
COPY --from=build /app/.next/standalone ./.next/standalone
COPY --from=build /app/start.sh /app/run.sh /app/package.json ./
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/lib/schema.mjs /app/lib/password.mjs ./lib/
COPY --from=build /app/k6/vocab.js ./k6/vocab.js

RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000

# run.sh seeds the database when it is empty (idempotent), then starts the server.
CMD ["sh", "run.sh"]
