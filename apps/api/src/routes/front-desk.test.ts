import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { signJwt } from '../lib/jwt.js';

const secrets = {
  jwtSecret: 'test-access-secret',
  refreshTokenSecret: 'test-refresh-secret',
};
const vehicleId = '33333333-3333-4333-8333-333333333333';
const customerId = '11111111-1111-4111-8111-111111111111';
const invoiceId = 'invoice-1';

function tokenFor(role: string, id = `${role}-1`) {
  return signJwt(
    { sub: id, email: `${role}@example.com`, role, tokenType: 'access' },
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
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    invoice: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  };
}

describe('front desk operations', () => {
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

  it('checks in a vehicle and creates a work order with odometer and photos', async () => {
    prisma.vehicle.update.mockResolvedValue({ id: vehicleId, odometerReading: 88000 });
    prisma.workOrder.create.mockResolvedValue({
      id: 'work-order-1',
      vehicleId,
      status: 'created',
      inspection: { photos: ['https://example.com/front.jpg'] },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/check-ins',
      headers: { authorization: `Bearer ${tokenFor('front_desk', 'front-desk-1')}` },
      payload: {
        vehicleId,
        odometerReading: 88000,
        customerNotes: 'Customer reports steering shake.',
        photos: ['https://example.com/front.jpg'],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(prisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: vehicleId },
      data: { odometerReading: 88000 },
    });
    expect(response.json().workOrder.status).toBe('created');
  });

  it('checks out a vehicle by marking the work order collected', async () => {
    prisma.workOrder.update.mockResolvedValue({ id: 'work-order-1', status: 'collected' });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/check-outs/work-order-1',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
      payload: { collectedBy: 'Alice Nakato' },
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.workOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'work-order-1' },
        data: { status: 'collected' },
      }),
    );
  });

  it('creates appointments and returns available slots', async () => {
    prisma.appointment.create.mockResolvedValue({
      id: 'appointment-1',
      customerId,
      vehicleId,
      scheduledAt: '2026-05-11T10:00:00.000Z',
      status: 'scheduled',
    });

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/appointments',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
      payload: {
        customerId,
        vehicleId,
        scheduledAt: '2026-05-11T10:00:00.000Z',
        issueDescription: 'Routine service',
      },
    });
    const slotsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/appointments/available-slots?date=2026-05-11',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(slotsResponse.statusCode).toBe(200);
    expect(slotsResponse.json().slots).toContain('2026-05-11T10:00:00.000Z');
  });

  it('generates an invoice, transitions the work order, and returns a PDF endpoint', async () => {
    prisma.invoice.create.mockResolvedValue({
      id: invoiceId,
      workOrderId: 'work-order-1',
      labourTotal: 150000,
      partsTotal: 85000,
      tax: 42300,
      grandTotal: 277300,
      status: 'issued',
    });
    prisma.workOrder.update.mockResolvedValue({ id: 'work-order-1', status: 'invoiced' });
    prisma.invoice.findUnique.mockResolvedValue({ id: invoiceId });

    const invoiceResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/invoices',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
      payload: {
        workOrderId: 'work-order-1',
        labourTotal: 150000,
        partsTotal: 85000,
        tax: 42300,
      },
    });
    const pdfResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/invoices/${invoiceId}/pdf`,
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
    });

    expect(invoiceResponse.statusCode).toBe(201);
    expect(invoiceResponse.json().invoice.grandTotal).toBe(277300);
    expect(prisma.workOrder.update).toHaveBeenCalledWith({
      where: { id: 'work-order-1' },
      data: { status: 'invoiced' },
    });
    expect(pdfResponse.headers['content-type']).toContain('application/pdf');
  });

  it('records a payment and marks the invoice paid', async () => {
    prisma.payment.create.mockResolvedValue({
      id: 'payment-1',
      invoiceId,
      amount: 277300,
      method: 'mobile_money',
    });
    prisma.invoice.update.mockResolvedValue({ id: invoiceId, status: 'paid' });
    prisma.payment.findMany.mockResolvedValue([{ id: 'payment-1', invoiceId }]);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/payments',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
      payload: {
        invoiceId,
        amount: 277300,
        method: 'mobile_money',
        transactionRef: 'MTN-001',
      },
    });
    const listResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/payments/by-invoice/${invoiceId}`,
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().invoice.status).toBe('paid');
    expect(listResponse.json().payments).toHaveLength(1);
  });
});
