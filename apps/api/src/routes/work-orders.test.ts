import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { signJwt } from '../lib/jwt.js';

const secrets = {
  jwtSecret: 'test-access-secret',
  refreshTokenSecret: 'test-refresh-secret',
};
const vehicleId = '33333333-3333-4333-8333-333333333333';
const mechanicId = '44444444-4444-4444-8444-444444444444';
const customerUserId = '55555555-5555-4555-8555-555555555555';

function tokenFor(role: string, id = `${role}-1`) {
  return signJwt(
    { sub: id, email: `${role}@example.com`, role, tokenType: 'access' },
    secrets.jwtSecret,
    60,
  );
}

function workOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'work-order-1',
    vehicleId,
    assignedMechanicId: null,
    createdById: 'front-desk-1',
    status: 'created',
    customerNotes: 'Brake vibration above 80 km/h',
    mechanicNotes: null,
    createdAt: new Date('2026-05-10T08:00:00.000Z'),
    updatedAt: new Date('2026-05-10T08:00:00.000Z'),
    vehicle: {
      id: vehicleId,
      registrationPlate: 'UAX 123A',
      make: 'Toyota',
      model: 'Harrier',
      year: 2018,
      customer: {
        id: 'customer-profile-1',
        userId: customerUserId,
        user: {
          name: 'Alice Customer',
          email: 'alice@example.com',
          phone: '+256700000000',
        },
      },
    },
    assignedMechanic: null,
    inspection: null,
    labourLogs: [],
    partsRequests: [],
    ...overrides,
  };
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
  };
}

describe('work order routes', () => {
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

  it('front desk can create a work order', async () => {
    prisma.workOrder.create.mockResolvedValue(workOrder());

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/work-orders',
      headers: { authorization: `Bearer ${tokenFor('front_desk', 'front-desk-1')}` },
      payload: {
        vehicleId,
        customerNotes: 'Brake vibration above 80 km/h',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(prisma.workOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          vehicleId,
          createdById: 'front-desk-1',
          status: 'created',
        }),
      }),
    );
    expect(response.json().workOrder.status).toBe('created');
  });

  it('lists mechanic work orders scoped to the authenticated mechanic', async () => {
    prisma.workOrder.findMany.mockResolvedValue([workOrder({ assignedMechanicId: mechanicId })]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/work-orders?status=assigned',
      headers: { authorization: `Bearer ${tokenFor('mechanic', mechanicId)}` },
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.workOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          assignedMechanicId: mechanicId,
          status: 'assigned',
        }),
      }),
    );
  });

  it('returns detail with nested inspection, labour, parts, vehicle, and customer context', async () => {
    prisma.workOrder.findUnique.mockResolvedValue(
      workOrder({
        inspection: { id: 'inspection-1', findings: 'Pads worn' },
        labourLogs: [{ id: 'labour-1' }],
        partsRequests: [{ id: 'parts-1' }],
      }),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/work-orders/work-order-1',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().workOrder).toMatchObject({
      vehicle: { registrationPlate: 'UAX 123A', customer: { name: 'Alice Customer' } },
      inspection: { id: 'inspection-1' },
      labourLogs: [{ id: 'labour-1' }],
      partsRequests: [{ id: 'parts-1' }],
    });
  });

  it('allows valid status transitions', async () => {
    prisma.workOrder.findUnique.mockResolvedValue(workOrder({ status: 'created' }));
    prisma.workOrder.update.mockResolvedValue(
      workOrder({ status: 'assigned', assignedMechanicId: mechanicId }),
    );

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/work-orders/work-order-1/status',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
      payload: { status: 'assigned' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().workOrder.status).toBe('assigned');
  });

  it('rejects invalid status transitions', async () => {
    prisma.workOrder.findUnique.mockResolvedValue(workOrder({ status: 'created' }));

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/work-orders/work-order-1/status',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
      payload: { status: 'paid' },
    });

    expect(response.statusCode).toBe(400);
    expect(prisma.workOrder.update).not.toHaveBeenCalled();
  });

  it('admin can assign a mechanic and move work order to assigned', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: mechanicId,
      name: 'Moses Mechanic',
      email: 'moses@example.com',
      role: 'mechanic',
      isActive: true,
    });
    prisma.workOrder.update.mockResolvedValue(
      workOrder({
        status: 'assigned',
        assignedMechanicId: mechanicId,
        assignedMechanic: {
          id: mechanicId,
          name: 'Moses Mechanic',
          email: 'moses@example.com',
        },
      }),
    );

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/work-orders/work-order-1/assign',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
      payload: { mechanicId },
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.workOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          assignedMechanicId: mechanicId,
          status: 'assigned',
        },
      }),
    );
    expect(response.json().workOrder.assignedMechanic.name).toBe('Moses Mechanic');
  });
});
