import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

const entityResponseKeys = [
  "workOrder",
  "vehicle",
  "customer",
  "appointment",
  "invoice",
  "payment",
  "inspection",
  "labourLog",
  "partsRequest",
  "supplier",
  "purchaseOrder",
  "service",
  "expense",
  "attendance",
  "notification",
  "user",
  "settings",
];

function actionFor(method: string) {
  if (method === "POST") {
    return "create";
  }
  if (method === "PATCH" || method === "PUT") {
    return "update";
  }
  if (method === "DELETE") {
    return "delete";
  }
  return method.toLowerCase();
}

function entityTypeFromUrl(url: string) {
  const segment = url
    .split("?")[0]
    .split("/")
    .filter(Boolean)
    .filter((part) => part !== "api" && part !== "v1")[0];

  if (!segment) {
    return "unknown";
  }

  return segment.replace(/-/g, "_").replace(/s$/, "");
}

function entityIdFromParams(request: FastifyRequest) {
  const params = request.params as Record<string, unknown> | undefined;
  if (!params) {
    return undefined;
  }

  for (const key of ["id", "workOrderId", "invoiceId", "vehicleId"]) {
    if (typeof params[key] === "string" && params[key]) {
      return params[key] as string;
    }
  }

  return undefined;
}

function entityFromPayload(payload: unknown) {
  if (!payload) {
    return {};
  }

  const text = Buffer.isBuffer(payload)
    ? payload.toString("utf8")
    : typeof payload === "string"
      ? payload
      : JSON.stringify(payload);
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    for (const key of entityResponseKeys) {
      const value = parsed[key] as { id?: unknown } | undefined;
      if (value && typeof value === "object" && typeof value.id === "string") {
        return {
          entityType: key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`),
          entityId: value.id,
        };
      }
    }
  } catch {
    return {};
  }

  return {};
}

const auditPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onSend", async (request, reply, payload) => {
    if (
      !["POST", "PATCH", "PUT", "DELETE"].includes(request.method) ||
      reply.statusCode >= 400 ||
      !request.user
    ) {
      return payload;
    }

    if (
      request.url.includes("/audit-logs") ||
      !app.deps.prisma.auditLog?.create
    ) {
      return payload;
    }

    const payloadEntity = entityFromPayload(payload);
    const entityType =
      payloadEntity.entityType ?? entityTypeFromUrl(request.url);
    const entityId =
      payloadEntity.entityId ?? entityIdFromParams(request) ?? request.user.id;

    try {
      await app.deps.prisma.auditLog.create({
        data: {
          userId: request.user.id,
          entityType,
          entityId,
          action: actionFor(request.method),
          changes: {
            request: request.body ?? null,
            path: request.url.split("?")[0],
          },
        },
      });
    } catch (error) {
      request.log.warn({ err: error }, "Audit log write failed");
    }

    return payload;
  });
};

export const auditMiddleware = fp(auditPlugin, {
  name: "garage-os-audit",
});
