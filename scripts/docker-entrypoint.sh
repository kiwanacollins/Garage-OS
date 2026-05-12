#!/bin/sh
# Container entrypoint — ensures deps and Prisma client are ready,
# then runs whatever CMD was passed.
set -e

if [ ! -d /app/node_modules ] || [ -z "$(ls -A /app/node_modules 2>/dev/null)" ]; then
  echo "📦 node_modules not found — running npm install..."
  npm install
fi

# Ensure Prisma Client is generated (safe to re-run, very fast if already done)
if [ -f /app/packages/db/prisma/schema.prisma ]; then
  echo "🔧 Generating Prisma client..."
  npx prisma generate --schema=packages/db/prisma/schema.prisma --no-hints 2>&1 | grep -v "^npm" || true
fi

echo "🚀 Starting: $@"
exec "$@"