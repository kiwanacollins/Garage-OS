# Queue Worker Dockerfile
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
COPY workers/queue/package.json ./workers/queue/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm install --only=production && npm cache clean --force

# ============================================================================
# Builder stage
# ============================================================================
FROM base AS builder

# Copy package files
COPY package.json package-lock.json* ./
COPY workers/queue/package.json ./workers/queue/
COPY packages/*/package.json ./packages/*/

# Install all dependencies
RUN npm install

# Copy source code
COPY packages/ ./packages/
COPY workers/queue/ ./workers/queue/

# Build shared packages
RUN npm run build --workspace=@garage-os/db --workspace=@garage-os/shared-types --workspace=@garage-os/validation

# Build queue worker
RUN npm run build --workspace=@garage-os/queue

# ============================================================================
# Runtime stage
# ============================================================================
FROM base AS runtime

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./

# Copy built application
COPY --from=builder /app/workers/queue/dist ./workers/queue/dist
COPY --from=builder /app/packages ./packages

# Set user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

CMD ["node", "workers/queue/dist/index.js"]