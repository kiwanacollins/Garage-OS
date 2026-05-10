import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { signJwt } from '../lib/jwt.js';

const secrets = {
  jwtSecret: 'test-access-secret',
  refreshTokenSecret: 'test-refresh-secret',
};
const customerProfileId = '11111111-1111-4111-8111-111111111111';
const customerUserId = '22222222-2222-4222-8222-222222222222';

function tokenFor(role: string, id = `${role}-1`) {
  return signJwt(
    { sub: id, email: `${role}@example.com`, role, tokenType: 'access' },
    secrets.jwtSecret,
    60,
  );
}

function vehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vehicle-1',
    customerId: customerProfileId,
    make: 'Toyota',
    model: 'Harrier',
    year: 2018,
    colour: 'Pearl',
    registrationPlate: 'UAX 123A',
    odometerReading: 54210,
    customer: {
      id: customerProfileId,
      userId: customerUserId,
      user: {
        name: 'Alice Customer',
        email: 'alice@example.com',
        phone: '+256700000000',
      },
    },
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
  };
}

describe('vehicle routes', () => {
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

  it('front desk can register a vehicle linked to a customer', async () => {
    prisma.vehicle.create.mockResolvedValue(vehicle());

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/vehicles',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
      payload: {
        customerId: customerProfileId,
        make: 'Toyota',
        model: 'Harrier',
        year: 2018,
        colour: 'Pearl',
        registrationPlate: 'UAX 123A',
        odometerReading: 54210,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().vehicle).toMatchObject({
      id: 'vehicle-1',
      customerId: customerProfileId,
      registrationPlate: 'UAX 123A',
    });
  });

  it('returns a vehicle by id', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(vehicle());

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/vehicles/vehicle-1',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().vehicle.customer.name).toBe('Alice Customer');
  });

  it('returns vehicle work order history', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(
      vehicle({
        workOrders: [{ id: 'work-order-1', status: 'completed' }],
      }),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/vehicles/vehicle-1/work-orders',
      headers: { authorization: `Bearer ${tokenFor('mechanic')}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().workOrders).toHaveLength(1);
  });

  it('customers cannot read another customer vehicle', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(
      vehicle({
        customer: { id: 'customer-profile-2', userId: 'other-user' },
      }),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/vehicles/vehicle-1',
      headers: { authorization: `Bearer ${tokenFor('customer', customerUserId)}` },
    });

    expect(response.statusCode).toBe(403);
  });
});
