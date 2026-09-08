# syntax=docker/dockerfile:1.7

# ============================================================
# Stage 1 — builder
# Produces dist/server.js + dist/workers/index.js and the
# generated Prisma client.
# ============================================================
FROM node:20-bookworm-slim AS builder

# OpenSSL 3 (required by Prisma engines on Debian) + build tools
# for native deps like argon2 + pdfkit.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++ \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all deps (including dev deps for the esbuild bundler).
COPY package.json package-lock.json ./
COPY packages ./packages
COPY prisma ./prisma
RUN npm ci

# Generate Prisma client (matches binaryTargets in schema.prisma:
# native, windows, debian-openssl-3.0.x).
RUN npx prisma generate

# Bundle TypeScript with esbuild. Output: dist/server.js, dist/workers/index.js
COPY tsconfig.base.json tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# ============================================================
# Stage 2 — runtime
# ============================================================
FROM node:20-bookworm-slim AS runtime

# OpenSSL for Prisma client at runtime.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000 \
    API_PREFIX=/api/v1 \
    LOG_LEVEL=info

# Production node_modules (no dev deps) — keeps image lean.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Prisma schema + migrations (needed by `npx prisma migrate deploy`
# which runs as the Fly release_command).
COPY --from=builder /app/prisma ./prisma

# Generated Prisma client (lives in node_modules/.prisma).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Bundled app code.
COPY --from=builder /app/dist ./dist

# Run as a non-root user for safety.
RUN useradd --create-home --uid 1001 nodejs
USER nodejs

# Health check on /api/v1/health (matches fly.toml http_check).
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+process.env.PORT+'/api/v1/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# CMD is overridden by the per-process command in fly.toml.
CMD ["node", "dist/server.js"]
