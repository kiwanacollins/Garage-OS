# Multi-stage Dockerfile for the entire GarageOS monorepo
# This builds all applications and creates separate runtime images

# ============================================================================
# Base stage for all Node.js applications
# ============================================================================
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# ============================================================================
# Dependencies stage - install all dependencies
# ============================================================================
FROM base AS deps

# Copy package files for dependency installation
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY workers/queue/package.json ./workers/queue/
COPY packages/*/package.json ./packages/*/

# Install all dependencies
RUN npm install --only=production && npm cache clean --force

# ============================================================================
# Builder stage - build all applications
# ============================================================================
FROM base AS builder

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY workers/queue/package.json ./workers/queue/
COPY packages/*/package.json ./packages/*/

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Build shared packages first
RUN npm run build --workspace=@garage-os/db
RUN npm run build --workspace=@garage-os/shared-types
RUN npm run build --workspace=@garage-os/validation

# Build applications
RUN npm run build --workspace=@garage-os/api
RUN npm run build --workspace=@garage-os/web
RUN npm run build --workspace=@garage-os/queue

# ============================================================================
# API Runtime
# ============================================================================
FROM base AS api

# Copy built dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Create uploads directory
RUN mkdir -p /app/uploads

# Set user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001
CMD ["node", "dist/server.js"]

# ============================================================================
# Web App Runtime
# ============================================================================
FROM base AS web

# Copy built dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/packages ./packages

# Set user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
CMD ["node", "apps/web/server.js"]

# ============================================================================
# Queue Worker Runtime
# ============================================================================
FROM base AS queue-worker

# Copy built dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/workers/queue/dist ./dist
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./
COPY --from=builder /app/workers/queue/package.json ./workers/queue/

# Set user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

CMD ["node", "dist/index.js"]