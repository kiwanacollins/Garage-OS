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

describe("system settings routes", () => {
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

  it("returns default settings and lets admins patch nested settings", async () => {
    prisma.systemSetting.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        key: "garage-os",
        value: {
          garage: {
            name: "GarageOS Service Centre",
            phone: "+256700000000",
            email: "frontdesk@garageos.local",
            address: "Kampala, Uganda",
          },
          tax: { vatRate: 18, tin: "", invoicePrefix: "GOS" },
          notifications: {
            appointmentReminders: true,
            invoiceAlerts: true,
            preferredChannels: ["in_app", "sms"],
          },
          backups: { enabled: true, retentionDays: 30, runAt: "02:00" },
        },
      });
    prisma.systemSetting.upsert.mockResolvedValue({
      key: "garage-os",
      value: {
        garage: {
          name: "Kiwana Auto Works",
          phone: "+256700000000",
          email: "frontdesk@garageos.local",
          address: "Kampala, Uganda",
        },
        tax: { vatRate: 18, tin: "100200300", invoicePrefix: "GOS" },
        notifications: {
          appointmentReminders: true,
          invoiceAlerts: true,
          preferredChannels: ["in_app", "sms"],
        },
        backups: { enabled: true, retentionDays: 30, runAt: "02:00" },
      },
    });

    const getResponse = await app.inject({
      method: "GET",
      url: "/api/v1/settings",
      headers: { authorization: `Bearer ${tokenFor("admin")}` },
    });
    const patchResponse = await app.inject({
      method: "PATCH",
      url: "/api/v1/settings",
      headers: { authorization: `Bearer ${tokenFor("admin")}` },
      payload: {
        garage: { name: "Kiwana Auto Works" },
        tax: { tin: "100200300" },
      },
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().settings.tax.vatRate).toBe(18);
    expect(patchResponse.statusCode).toBe(200);
    expect(prisma.systemSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          value: expect.objectContaining({
            garage: expect.objectContaining({ name: "Kiwana Auto Works" }),
            tax: expect.objectContaining({ tin: "100200300" }),
          }),
        }),
      }),
    );
  });

  it("blocks non-admin settings access", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/settings",
      headers: { authorization: `Bearer ${tokenFor("front_desk")}` },
    });

    expect(response.statusCode).toBe(403);
  });
});
