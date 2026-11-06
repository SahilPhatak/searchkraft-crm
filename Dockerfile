FROM node:20-alpine

# Install build deps for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies first (cached layer)
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 10000
ENV NODE_ENV=production

CMD ["node", "server.js"]
