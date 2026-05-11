import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import nodemailer from "nodemailer";
import { authPlugin } from "./plugins/auth.js";
import { realtimePlugin } from "./plugins/realtime.js";
import { adminAnalyticsRoutes } from "./routes/admin-analytics.js";
import { auditLogRoutes } from "./routes/audit-logs.js";
import { authRoutes } from "./routes/auth.js";
import { customerPortalRoutes } from "./routes/customer-portal.js";
import { customerRoutes } from "./routes/customers.js";
import { feedbackRoutes } from "./routes/feedback.js";
import { frontDeskRoutes } from "./routes/front-desk.js";
import { mechanicRoutes } from "./routes/mechanic-operations.js";
import { notificationRoutes } from "./routes/notifications.js";
import { pesapalIpnRoutes, pesapalRoutes } from "./routes/pesapal.js";
import { purchasingRoutes } from "./routes/purchasing.js";
import { settingsRoutes } from "./routes/settings.js";
import { uploadRoutes } from "./routes/uploads.js";
import { userRoutes } from "./routes/users.js";
import { vehicleRoutes } from "./routes/vehicles.js";
import { workOrderRoutes } from "./routes/work-orders.js";
import { auditMiddleware } from "./middleware/audit.js";
import { createNotificationService } from "./services/notification.service.js";
import { createLocalObjectStorageAdapter } from "./services/upload.service.js";
import type { AppMailer, AppPrisma, ObjectStorageAdapter } from "./types.js";
import "./types.js";

export type AppDependencies = {
  prisma?: AppPrisma;
  mailer?: AppMailer;
  jwtSecret?: string;
  refreshTokenSecret?: string;
  uploadStorage?: ObjectStorageAdapter;
  uploadMaxBytes?: number;
};

async function resolvePrisma(dependency?: AppPrisma) {
  if (dependency) {
    return dependency;
  }

  const database = await import("@garage-os/db");
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
    bodyLimit: 15 * 1024 * 1024,
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  // ── Plugins ──────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(sensible);

  app.setErrorHandler((error, request, reply) => {
    const appError = error as Error & { statusCode?: number; code?: string };
    const statusCode = appError.statusCode ?? 500;
    request.log[statusCode >= 500 ? "error" : "info"](
      { err: appError },
      appError.message,
    );

    return reply.status(statusCode).send({
      statusCode,
      error: statusCode >= 500 ? "Internal Server Error" : appError.name,
      code: appError.code ?? "GARAGE_OS_ERROR",
      message:
        statusCode >= 500 ? "Unable to complete request" : appError.message,
      path: request.url,
    });
  });

  app.decorate("deps", {
    prisma: defaultPrisma,
    mailer: defaultMailer,
    jwtSecret:
      dependencies.jwtSecret ??
      process.env.JWT_SECRET ??
      "dev-access-token-secret",
    refreshTokenSecret:
      dependencies.refreshTokenSecret ??
      process.env.JWT_REFRESH_SECRET ??
      "dev-refresh-token-secret",
    uploadStorage:
      dependencies.uploadStorage ?? createLocalObjectStorageAdapter(),
    uploadMaxBytes:
      dependencies.uploadMaxBytes ??
      Number(process.env.UPLOAD_MAX_BYTES ?? 10 * 1024 * 1024),
  });
  await app.register(realtimePlugin);
  app.deps.notificationService = createNotificationService({
    prisma: app.deps.prisma,
    mailer: app.deps.mailer,
    realtime: app.realtime,
  });

  // ── Health Check ─────────────────────────────────────────────────────────
  app.get("/api/v1/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(pesapalIpnRoutes, { prefix: "/api/v1/payments/pesapal" });
  await app.register(async (secureApp) => {
    await secureApp.register(authPlugin);
    await secureApp.register(auditMiddleware);
    await secureApp.register(adminAnalyticsRoutes, { prefix: "/api/v1" });
    await secureApp.register(auditLogRoutes, { prefix: "/api/v1" });
    await secureApp.register(customerPortalRoutes, {
      prefix: "/api/v1/customer",
    });
    await secureApp.register(customerRoutes, { prefix: "/api/v1" });
    await secureApp.register(feedbackRoutes, { prefix: "/api/v1" });
    await secureApp.register(frontDeskRoutes, { prefix: "/api/v1" });
    await secureApp.register(mechanicRoutes, { prefix: "/api/v1" });
    await secureApp.register(notificationRoutes, {
      prefix: "/api/v1/notifications",
    });
    await secureApp.register(pesapalRoutes, {
      prefix: "/api/v1/payments/pesapal",
    });
    await secureApp.register(purchasingRoutes, { prefix: "/api/v1" });
    await secureApp.register(settingsRoutes, { prefix: "/api/v1" });
    await secureApp.register(uploadRoutes, { prefix: "/api/v1" });
    await secureApp.register(userRoutes, { prefix: "/api/v1" });
    await secureApp.register(vehicleRoutes, { prefix: "/api/v1" });
    await secureApp.register(workOrderRoutes, { prefix: "/api/v1" });
  });

  return app;
}
