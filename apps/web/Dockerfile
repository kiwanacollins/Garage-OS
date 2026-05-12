# Web App Dockerfile (Next.js)
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# ============================================================================
# Dependencies stage
# ============================================================================
FROM base AS deps

# Copy package files for workspace setup
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm install --only=production && npm cache clean --force

# ============================================================================
# Builder stage
# ============================================================================
FROM base AS builder

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/

# Install all dependencies
RUN npm install

# Copy source code
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build shared packages
RUN npm run build --workspace=@garage-os/shared-types --workspace=@garage-os/validation

# Build Next.js app with standalone output
RUN npm run build --workspace=@garage-os/web

# ============================================================================
# Runtime stage
# ============================================================================
FROM base AS runtime

# Copy the standalone app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Copy public folder if it exists
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]