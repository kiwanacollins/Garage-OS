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

function customer(overrides: Record<string, unknown> = {}) {
  return {
    id: customerProfileId,
    userId: customerUserId,
    address: 'Kampala Road',
    preferredContact: 'whatsapp',
    user: {
      id: customerUserId,
      name: 'Alice Customer',
      email: 'alice@example.com',
      phone: '+256700000000',
      isActive: true,
    },
    vehicles: [],
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

describe('customer routes', () => {
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

  it('front desk can create a customer', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ customerProfile: customer() });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/customers',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
      payload: {
        name: 'Alice Customer',
        email: 'alice@example.com',
        phone: '+256700000000',
        address: 'Kampala Road',
        preferredContact: 'whatsapp',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().customer).toMatchObject({
      id: customerProfileId,
      name: 'Alice Customer',
      email: 'alice@example.com',
    });
  });

  it('searches customers with pagination', async () => {
    prisma.customerProfile.findMany.mockResolvedValue([customer()]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/customers?q=alice&page=2&pageSize=10',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.customerProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    );
    expect(response.json().customers).toHaveLength(1);
  });

  it('returns a customer profile with linked vehicles', async () => {
    prisma.customerProfile.findUnique.mockResolvedValue(
      customer({
        vehicles: [{ id: 'vehicle-1', registrationPlate: 'UAX 123A' }],
      }),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/customers/customer-profile-1',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().customer.vehicles).toHaveLength(1);
  });

  it('customers cannot read another customer profile', async () => {
    prisma.customerProfile.findUnique.mockResolvedValue(customer({ userId: 'other-user' }));

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/customers/customer-profile-1',
      headers: { authorization: `Bearer ${tokenFor('customer', customerUserId)}` },
    });

    expect(response.statusCode).toBe(403);
  });
});
