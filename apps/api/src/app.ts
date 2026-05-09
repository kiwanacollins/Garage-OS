import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { authRoutes } from './routes/auth.js';
import type { AppPrisma } from './types.js';
import './types.js';

export type AppDependencies = {
  prisma?: AppPrisma;
  jwtSecret?: string;
  refreshTokenSecret?: string;
};

async function resolvePrisma(dependency?: AppPrisma) {
  if (dependency) {
    return dependency;
  }

  const database = await import('@garage-os/db');
  return database.prisma as unknown as AppPrisma;
}

export async function buildApp(dependencies: AppDependencies = {}) {
  const defaultPrisma = await resolvePrisma(dependencies.prisma);

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // ── Plugins ──────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(sensible);

  app.decorate('deps', {
    prisma: defaultPrisma,
    jwtSecret: dependencies.jwtSecret ?? process.env.JWT_SECRET ?? 'dev-access-token-secret',
    refreshTokenSecret:
      dependencies.refreshTokenSecret ?? process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-token-secret',
  });

  // ── Health Check ─────────────────────────────────────────────────────────
  app.get('/api/v1/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  return app;
}
