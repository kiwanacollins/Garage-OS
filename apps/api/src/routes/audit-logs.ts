import type { FastifyPluginAsync } from "fastify";
import { auditLogSearchSchema } from "@garage-os/validation";
import { requireRoles } from "../middleware/rbac.js";

const adminOnly = { preHandler: requireRoles("admin") };

function dateRangeWhere(dateFrom?: string, dateTo?: string) {
  return dateFrom || dateTo
    ? {
        createdAt: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      }
    : {};
}

export const auditLogRoutes: FastifyPluginAsync = async (app) => {
  app.get("/audit-logs", adminOnly, async (request, reply) => {
    const parsed = auditLogSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest("Invalid audit log search");
    }

    const {
      entityType,
      entityId,
      userId,
      action,
      dateFrom,
      dateTo,
      page,
      pageSize,
    } = parsed.data;
    const auditLogs = await app.deps.prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(userId ? { userId } : {}),
        ...(action ? { action } : {}),
        ...dateRangeWhere(dateFrom, dateTo),
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      auditLogs,
      page,
      pageSize,
      filters: { entityType, entityId, userId, action, dateFrom, dateTo },
    };
  });
};
