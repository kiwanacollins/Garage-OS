import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { signJwt } from '../lib/jwt.js';

const secrets = {
  jwtSecret: 'test-access-secret',
  refreshTokenSecret: 'test-refresh-secret',
};
const mechanicId = '44444444-4444-4444-8444-444444444444';
const vehicleId = '33333333-3333-4333-8333-333333333333';

function tokenFor(role: string, id = `${role}-1`) {
  return signJwt(
    { sub: id, email: `${role}@example.com`, role, tokenType: 'access' },
    secrets.jwtSecret,
    60,
  );
}

function createPrismaMock() {
  return {
    user: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    customerProfile: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    vehicle: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    workOrder: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    appointment: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    invoice: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    payment: { findMany: vi.fn(), create: vi.fn() },
    inspection: { create: vi.fn(), update: vi.fn() },
    labourLog: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    partsRequest: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  };
}

describe('mechanic operation routes', () => {
  let app: FastifyInstance;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    app = await buildApp({ prisma: prisma as never, mailer: { sendMail: vi.fn() }, ...secrets });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates and updates inspections with findings and photos', async () => {
    prisma.inspection.create.mockResolvedValue({ id: 'inspection-1', findings: 'Pads worn' });
    prisma.inspection.update.mockResolvedValue({ id: 'inspection-1', recommendations: 'Replace pads' });

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/inspections',
      headers: { authorization: `Bearer ${tokenFor('mechanic', mechanicId)}` },
      payload: {
        workOrderId: 'work-order-1',
        findings: 'Pads worn',
        photos: ['https://example.com/pads.jpg'],
      },
    });
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: '/api/v1/inspections/inspection-1',
      headers: { authorization: `Bearer ${tokenFor('mechanic', mechanicId)}` },
      payload: { recommendations: 'Replace pads' },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(updateResponse.statusCode).toBe(200);
  });

  it('starts, stops, and lists labour logs scoped to the mechanic', async () => {
    prisma.labourLog.create.mockResolvedValue({ id: 'labour-1', mechanicId });
    prisma.labourLog.update.mockResolvedValue({ id: 'labour-1', endTime: new Date().toISOString() });
    prisma.labourLog.findMany.mockResolvedValue([{ id: 'labour-1' }]);

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/labour-logs',
      headers: { authorization: `Bearer ${tokenFor('mechanic', mechanicId)}` },
      payload: { workOrderId: 'work-order-1', description: 'Brake strip-down' },
    });
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: '/api/v1/labour-logs/labour-1',
      headers: { authorization: `Bearer ${tokenFor('mechanic', mechanicId)}` },
      payload: { endTime: '2026-05-10T12:00:00.000Z' },
    });
    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/labour-logs?workOrderId=work-order-1',
      headers: { authorization: `Bearer ${tokenFor('mechanic', mechanicId)}` },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(updateResponse.statusCode).toBe(200);
    expect(listResponse.json().labourLogs).toHaveLength(1);
    expect(prisma.labourLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workOrderId: 'work-order-1', mechanicId },
      }),
    );
  });

  it('creates parts requests, moves the work order awaiting parts, and allows admin status updates', async () => {
    prisma.partsRequest.create.mockResolvedValue({ id: 'parts-1', status: 'pending' });
    prisma.partsRequest.update.mockResolvedValue({ id: 'parts-1', status: 'approved' });
    prisma.workOrder.update.mockResolvedValue({ id: 'work-order-1', status: 'awaiting_parts' });

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/parts-requests',
      headers: { authorization: `Bearer ${tokenFor('mechanic', mechanicId)}` },
      payload: { workOrderId: 'work-order-1', partName: 'Front brake pads', quantity: 1 },
    });
    const approveResponse = await app.inject({
      method: 'PATCH',
      url: '/api/v1/parts-requests/parts-1/status',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
      payload: { status: 'approved' },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(approveResponse.statusCode).toBe(200);
    expect(prisma.workOrder.update).toHaveBeenCalledWith({
      where: { id: 'work-order-1' },
      data: { status: 'awaiting_parts' },
    });
  });

  it('completes a work order and returns it for quality check', async () => {
    prisma.workOrder.update.mockResolvedValue({
      id: 'work-order-1',
      status: 'completed',
      assignedMechanicId: mechanicId,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/work-orders/work-order-1/complete',
      headers: { authorization: `Bearer ${tokenFor('mechanic', mechanicId)}` },
      payload: { mechanicNotes: 'Road tested after pad replacement', recommendations: 'Recheck in 500km' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().workOrder.status).toBe('completed');
  });

  it('returns vehicle service history with nested mechanic context', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      id: vehicleId,
      workOrders: [{ id: 'work-order-1', inspection: {}, labourLogs: [], partsRequests: [], invoice: null }],
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/vehicles/${vehicleId}/history`,
      headers: { authorization: `Bearer ${tokenFor('mechanic', mechanicId)}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().history).toHaveLength(1);
  });
});
