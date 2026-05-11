import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { signJwt } from "../lib/jwt.js";

const secrets = {
  jwtSecret: "test-access-secret",
  refreshTokenSecret: "test-refresh-secret",
};

function tokenFor(role: string, id = `${role}-1`) {
  return signJwt(
    { sub: id, email: `${role}@example.com`, role, tokenType: "access" },
    secrets.jwtSecret,
    60,
  );
}

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customerProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    vehicle: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workOrder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    appointment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    invoice: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    payment: { findMany: vi.fn(), create: vi.fn() },
    pesapalTransaction: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    feedback: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    inspection: { create: vi.fn(), update: vi.fn() },
    labourLog: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    partsRequest: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    service: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    supplier: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    purchaseOrder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    attendance: { findMany: vi.fn(), create: vi.fn() },
    auditLog: { findMany: vi.fn(), create: vi.fn() },
    systemSetting: { findUnique: vi.fn(), upsert: vi.fn() },
    notification: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  };
}

describe("audit middleware and log routes", () => {
  let app: FastifyInstance;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    app = await buildApp({
      prisma: prisma as never,
      mailer: { sendMail: vi.fn() },
      ...secrets,
    });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("records state-changing requests with user, entity, action, and changes", async () => {
    prisma.workOrder.create.mockResolvedValue({
      id: "work-order-1",
      vehicleId: "33333333-3333-4333-8333-333333333333",
      assignedMechanicId: null,
      createdById: "admin-1",
      status: "created",
      customerNotes: "Brake noise",
      mechanicNotes: null,
    });
    prisma.auditLog.create.mockResolvedValue({ id: "audit-1" });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/work-orders",
      headers: { authorization: `Bearer ${tokenFor("admin")}` },
      payload: {
        vehicleId: "33333333-3333-4333-8333-333333333333",
        customerNotes: "Brake noise",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "admin-1",
        entityType: "work_order",
        entityId: "work-order-1",
        action: "create",
        changes: expect.objectContaining({
          request: expect.objectContaining({ customerNotes: "Brake noise" }),
          path: "/api/v1/work-orders",
        }),
      }),
    });
  });

  it("returns admin-only audit logs with filters and pagination", async () => {
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: "audit-1",
        userId: "admin-1",
        entityType: "work_order",
        entityId: "work-order-1",
        action: "update",
        changes: { request: { status: "assigned" } },
        createdAt: "2026-05-11T08:00:00.000Z",
      },
    ]);

    const adminResponse = await app.inject({
      method: "GET",
      url: "/api/v1/audit-logs?entityType=work_order&action=update&page=2&pageSize=10",
      headers: { authorization: `Bearer ${tokenFor("admin")}` },
    });
    const mechanicResponse = await app.inject({
      method: "GET",
      url: "/api/v1/audit-logs",
      headers: { authorization: `Bearer ${tokenFor("mechanic")}` },
    });

    expect(adminResponse.statusCode).toBe(200);
    expect(adminResponse.json().auditLogs).toHaveLength(1);
    expect(adminResponse.json()).toMatchObject({ page: 2, pageSize: 10 });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entityType: "work_order",
          action: "update",
        }),
        skip: 10,
        take: 10,
      }),
    );
    expect(mechanicResponse.statusCode).toBe(403);
  });
});
