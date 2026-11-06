# ── Stage 1: Builder ─────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

# Install ALL deps (including dev) for prisma generate
COPY backend/package*.json ./
RUN npm ci

# Copy prisma schema + generate client
COPY backend/prisma ./prisma
RUN npx prisma generate

# ── Stage 2: Production image ─────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

# Only production deps
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy generated prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy app source
COPY backend/ .

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 10000
ENV NODE_ENV=production
ENV PORT=10000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:10000/health || exit 1

CMD ["node", "server.js"]
