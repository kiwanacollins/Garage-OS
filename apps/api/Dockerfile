# API Service Dockerfile
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
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm install --only=production && npm cache clean --force

# ============================================================================
# Builder stage
# ============================================================================
FROM base AS builder

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/

# Install all dependencies
RUN npm install

# Copy source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build shared packages
RUN npm run build --workspace=@garage-os/db --workspace=@garage-os/shared-types --workspace=@garage-os/validation

# Build API
RUN npm run build --workspace=@garage-os/api

# ============================================================================
# Runtime stage
# ============================================================================
FROM base AS runtime

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "apps/api/dist/server.js"]