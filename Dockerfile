# syntax=docker/dockerfile:1
#
# Single-container Willyboxd: builds the client and serves API + static
# client from one Node process (Hono). SQLite lives in /app/data — mount
# a volume there.

# --- build stage: install deps, build the client ---------------------------
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps apps
COPY packages packages

RUN npm ci && npm run build -w @willyboxd/client

# --- runtime stage: deps + source + client dist ----------------------------
FROM node:22-slim AS runtime
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps apps
COPY packages packages
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/client/dist apps/client/dist

# The server runs TypeScript via tsx; set NODE_ENV via the compose env file
# (development for plain-HTTP LAN use, production behind TLS).
EXPOSE 3000
CMD ["npx", "tsx", "apps/server/src/index.ts"]
