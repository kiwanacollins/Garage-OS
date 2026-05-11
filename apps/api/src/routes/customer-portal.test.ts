import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { signJwt } from "../lib/jwt.js";

const secrets = {
  jwtSecret: "test-access-secret",
  refreshTokenSecret: "test-refresh-secret",
};
const customerUserId = "22222222-2222-4222-8222-222222222222";
const customerProfileId = "11111111-1111-4111-8111-111111111111";
const vehicleId = "33333333-3333-4333-8333-333333333333";
const invoiceId = "44444444-4444-4444-8444-444444444444";
const workOrderId = "55555555-5555-4555-8555-555555555555";

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
    partsRequest: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
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
    attendance: { findMany: vi.fn(), create: vi.fn() },
    auditLog: { findMany: vi.fn(), create: vi.fn() },
    notification: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  };
}

function customerProfile() {
  return {
    id: customerProfileId,
    userId: customerUserId,
    address: "Ntinda",
    preferredContact: "whatsapp",
    user: {
      id: customerUserId,
      name: "Alice Customer",
      email: "alice@example.com",
      phone: "+256700000000",
    },
    vehicles: [],
    appointments: [],
    feedbacks: [],
  };
}

function ownVehicle() {
  return {
    id: vehicleId,
    customerId: customerProfileId,
    registrationPlate: "UAX 123A",
    customer: { id: customerProfileId, userId: customerUserId },
  };
}

function ownInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: invoiceId,
    workOrderId,
    grandTotal: 277300,
    status: "issued",
    payments: [],
    workOrder: {
      id: workOrderId,
      vehicle: {
        registrationPlate: "UAX 123A",
        customer: {
          userId: customerUserId,
          user: {
            name: "Alice Customer",
            email: "alice@example.com",
            phone: "+256700000000",
          },
        },
      },
    },
    ...overrides,
  };
}

describe("customer self-service portal routes", () => {
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

  it("lets a customer view their portal data and book only their own vehicle", async () => {
    prisma.customerProfile.findUnique.mockResolvedValue(customerProfile());
    prisma.workOrder.findMany.mockResolvedValue([
      { id: workOrderId, status: "in_progress" },
    ]);
    prisma.invoice.findMany.mockResolvedValue([ownInvoice()]);
    prisma.vehicle.findUnique.mockResolvedValue(ownVehicle());
    prisma.appointment.create.mockResolvedValue({
      id: "appointment-1",
      customerId: customerProfileId,
      vehicleId,
      scheduledAt: "2026-05-12T10:00:00.000Z",
      status: "scheduled",
    });

    const portalResponse = await app.inject({
      method: "GET",
      url: "/api/v1/customer/portal",
      headers: {
        authorization: `Bearer ${tokenFor("customer", customerUserId)}`,
      },
    });
    const appointmentResponse = await app.inject({
      method: "POST",
      url: "/api/v1/customer/appointments",
      headers: {
        authorization: `Bearer ${tokenFor("customer", customerUserId)}`,
      },
      payload: {
        vehicleId,
        scheduledAt: "2026-05-12T10:00:00.000Z",
        issueDescription: "Brake service",
      },
    });

    expect(portalResponse.statusCode).toBe(200);
    expect(portalResponse.json().invoices).toHaveLength(1);
    expect(appointmentResponse.statusCode).toBe(201);
    expect(prisma.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: customerProfileId,
          vehicleId,
        }),
      }),
    );
  });

  it("rejects appointments and invoice payments for another customer data", async () => {
    prisma.customerProfile.findUnique.mockResolvedValue(customerProfile());
    prisma.vehicle.findUnique.mockResolvedValue({
      ...ownVehicle(),
      customer: { userId: "other-user" },
    });
    prisma.invoice.findUnique.mockResolvedValue(
      ownInvoice({
        workOrder: { vehicle: { customer: { userId: "other-user" } } },
      }),
    );

    const appointmentResponse = await app.inject({
      method: "POST",
      url: "/api/v1/customer/appointments",
      headers: {
        authorization: `Bearer ${tokenFor("customer", customerUserId)}`,
      },
      payload: {
        vehicleId,
        scheduledAt: "2026-05-12T10:00:00.000Z",
      },
    });
    const paymentResponse = await app.inject({
      method: "POST",
      url: "/api/v1/payments/pesapal/initiate",
      headers: {
        authorization: `Bearer ${tokenFor("customer", customerUserId)}`,
      },
      payload: { invoiceId },
    });

    expect(appointmentResponse.statusCode).toBe(403);
    expect(paymentResponse.statusCode).toBe(403);
  });

  it("creates feedback for a completed customer work order and returns it by work order", async () => {
    prisma.workOrder.findUnique
      .mockResolvedValueOnce({
        id: workOrderId,
        status: "completed",
        vehicle: {
          customer: { id: customerProfileId, userId: customerUserId },
        },
        feedback: null,
      })
      .mockResolvedValueOnce({
        id: workOrderId,
        status: "completed",
        vehicle: {
          customer: { id: customerProfileId, userId: customerUserId },
        },
        feedback: { id: "feedback-1", rating: 5, comment: "Clear updates" },
      });
    prisma.feedback.create.mockResolvedValue({
      id: "feedback-1",
      rating: 5,
      comment: "Clear updates",
    });

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/v1/feedback",
      headers: {
        authorization: `Bearer ${tokenFor("customer", customerUserId)}`,
      },
      payload: {
        workOrderId,
        rating: 5,
        comment: "Clear updates",
      },
    });
    const readResponse = await app.inject({
      method: "GET",
      url: `/api/v1/feedback/by-work-order/${workOrderId}`,
      headers: {
        authorization: `Bearer ${tokenFor("customer", customerUserId)}`,
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(prisma.feedback.create).toHaveBeenCalledWith({
      data: {
        workOrderId,
        customerId: customerProfileId,
        rating: 5,
        comment: "Clear updates",
      },
    });
    expect(readResponse.json().feedback.rating).toBe(5);
  });

  it("initiates Pesapal payment, reuses active requests, and completes IPN idempotently", async () => {
    prisma.invoice.findUnique.mockResolvedValue(ownInvoice());
    prisma.pesapalTransaction.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          amount: 277300,
          redirectUrl: "https://pesapal.test/pay",
          orderTrackingId: "tracking-1",
          merchantReference: "GOS-1",
        },
      ]);
    prisma.pesapalTransaction.create.mockResolvedValue({
      invoiceId,
      amount: 277300,
      redirectUrl: "https://pesapal.test/pay",
      orderTrackingId: "tracking-1",
      merchantReference: "GOS-1",
      status: "pending",
    });
    prisma.pesapalTransaction.findUnique.mockResolvedValue({
      id: "pesapal-1",
      invoiceId,
      amount: 277300,
      orderTrackingId: "tracking-1",
      merchantReference: "GOS-1",
      invoice: { id: invoiceId },
    });
    prisma.pesapalTransaction.update.mockResolvedValue({
      id: "pesapal-1",
      status: "completed",
      orderTrackingId: "tracking-1",
      merchantReference: "GOS-1",
    });
    prisma.payment.findMany.mockResolvedValue([]);
    prisma.payment.create.mockResolvedValue({
      id: "payment-1",
      invoiceId,
      transactionRef: "tracking-1",
    });
    prisma.invoice.update.mockResolvedValue({ id: invoiceId, status: "paid" });

    const first = await app.inject({
      method: "POST",
      url: "/api/v1/payments/pesapal/initiate",
      headers: {
        authorization: `Bearer ${tokenFor("customer", customerUserId)}`,
      },
      payload: { invoiceId },
    });
    const duplicate = await app.inject({
      method: "POST",
      url: "/api/v1/payments/pesapal/initiate",
      headers: {
        authorization: `Bearer ${tokenFor("customer", customerUserId)}`,
      },
      payload: { invoiceId },
    });
    const ipn = await app.inject({
      method: "POST",
      url: "/api/v1/payments/pesapal/ipn",
      payload: { OrderTrackingId: "tracking-1", mockStatus: "completed" },
    });

    expect(first.statusCode).toBe(201);
    expect(duplicate.statusCode).toBe(200);
    expect(ipn.statusCode).toBe(200);
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          invoiceId,
          transactionRef: "tracking-1",
        }),
      }),
    );
    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: invoiceId },
      data: { status: "paid" },
    });
  });
});
