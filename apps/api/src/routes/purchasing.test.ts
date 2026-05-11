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

describe("supplier and purchase order routes", () => {
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

  it("manages suppliers with linked purchase orders", async () => {
    prisma.supplier.create.mockResolvedValue({
      id: "supplier-1",
      name: "Kampala Parts",
      contactPhone: "+256700000001",
      contactEmail: "parts@example.com",
      purchaseOrders: [],
    });
    prisma.supplier.findMany.mockResolvedValue([
      {
        id: "supplier-1",
        name: "Kampala Parts",
        purchaseOrders: [{ id: "po-1", status: "ordered" }],
      },
    ]);
    prisma.supplier.update.mockResolvedValue({
      id: "supplier-1",
      name: "Kampala Genuine Parts",
      purchaseOrders: [],
    });
    prisma.supplier.delete.mockResolvedValue({ id: "supplier-1" });

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/v1/suppliers",
      headers: { authorization: `Bearer ${tokenFor("admin")}` },
      payload: {
        name: "Kampala Parts",
        contactPhone: "+256700000001",
        contactEmail: "parts@example.com",
      },
    });
    const listResponse = await app.inject({
      method: "GET",
      url: "/api/v1/suppliers?q=kampala",
      headers: { authorization: `Bearer ${tokenFor("admin")}` },
    });
    const updateResponse = await app.inject({
      method: "PATCH",
      url: "/api/v1/suppliers/supplier-1",
      headers: { authorization: `Bearer ${tokenFor("admin")}` },
      payload: { name: "Kampala Genuine Parts" },
    });
    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/api/v1/suppliers/supplier-1",
      headers: { authorization: `Bearer ${tokenFor("admin")}` },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(listResponse.json().suppliers[0].purchaseOrders).toHaveLength(1);
    expect(updateResponse.json().supplier.name).toBe("Kampala Genuine Parts");
    expect(deleteResponse.statusCode).toBe(204);
  });

  it("creates purchase orders from approved parts requests and enforces status transitions", async () => {
    prisma.partsRequest.findUnique.mockResolvedValue({
      id: "parts-1",
      status: "approved",
    });
    prisma.purchaseOrder.create.mockResolvedValue({
      id: "po-1",
      supplierId: "supplier-1",
      partsRequestId: "parts-1",
      status: "ordered",
      cost: 140000,
    });
    prisma.purchaseOrder.findUnique
      .mockResolvedValueOnce({
        id: "po-1",
        partsRequestId: "parts-1",
        status: "ordered",
      })
      .mockResolvedValueOnce({
        id: "po-1",
        partsRequestId: "parts-1",
        status: "received",
      });
    prisma.purchaseOrder.update
      .mockResolvedValueOnce({
        id: "po-1",
        partsRequestId: "parts-1",
        status: "shipped",
      })
      .mockResolvedValueOnce({
        id: "po-1",
        partsRequestId: "parts-1",
        status: "received",
      });
    prisma.partsRequest.update.mockResolvedValue({
      id: "parts-1",
      status: "fulfilled",
    });
    prisma.purchaseOrder.findMany.mockResolvedValue([
      { id: "po-1", status: "shipped" },
    ]);

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/v1/purchase-orders",
      headers: { authorization: `Bearer ${tokenFor("admin")}` },
      payload: {
        supplierId: "supplier-1",
        partsRequestId: "parts-1",
        cost: 140000,
      },
    });
    const shippedResponse = await app.inject({
      method: "PATCH",
      url: "/api/v1/purchase-orders/po-1/status",
      headers: { authorization: `Bearer ${tokenFor("admin")}` },
      payload: { status: "shipped" },
    });
    const invalidResponse = await app.inject({
      method: "PATCH",
      url: "/api/v1/purchase-orders/po-1/status",
      headers: { authorization: `Bearer ${tokenFor("admin")}` },
      payload: { status: "ordered" },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json().purchaseOrder.status).toBe("ordered");
    expect(shippedResponse.json().purchaseOrder.status).toBe("shipped");
    expect(invalidResponse.statusCode).toBe(400);
  });

  it("blocks non-admin supplier access", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/suppliers",
      headers: { authorization: `Bearer ${tokenFor("front_desk")}` },
    });

    expect(response.statusCode).toBe(403);
  });
});
