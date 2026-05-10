import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import nodemailer from 'nodemailer';
import { authPlugin } from './plugins/auth.js';
import { realtimePlugin } from './plugins/realtime.js';
import { authRoutes } from './routes/auth.js';
import { customerRoutes } from './routes/customers.js';
import { frontDeskRoutes } from './routes/front-desk.js';
import { userRoutes } from './routes/users.js';
import { vehicleRoutes } from './routes/vehicles.js';
import { workOrderRoutes } from './routes/work-orders.js';
import type { AppMailer, AppPrisma } from './types.js';
import './types.js';

export type AppDependencies = {
  prisma?: AppPrisma;
  mailer?: AppMailer;
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

function resolveMailer(dependency?: AppMailer) {
  if (dependency) {
    return dependency;
  }

  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL);
  }

  return nodemailer.createTransport({ jsonTransport: true });
}

export async function buildApp(dependencies: AppDependencies = {}) {
  const defaultPrisma = await resolvePrisma(dependencies.prisma);
  const defaultMailer = resolveMailer(dependencies.mailer);

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
    mailer: defaultMailer,
    jwtSecret: dependencies.jwtSecret ?? process.env.JWT_SECRET ?? 'dev-access-token-secret',
    refreshTokenSecret:
      dependencies.refreshTokenSecret ?? process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-token-secret',
  });
  await app.register(realtimePlugin);

  // ── Health Check ─────────────────────────────────────────────────────────
  app.get('/api/v1/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(async (secureApp) => {
    await secureApp.register(authPlugin);
    await secureApp.register(customerRoutes, { prefix: '/api/v1' });
    await secureApp.register(frontDeskRoutes, { prefix: '/api/v1' });
    await secureApp.register(userRoutes, { prefix: '/api/v1' });
    await secureApp.register(vehicleRoutes, { prefix: '/api/v1' });
    await secureApp.register(workOrderRoutes, { prefix: '/api/v1' });
  });

  return app;
}
