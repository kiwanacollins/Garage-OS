import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { signJwt } from '../lib/jwt.js';

const secrets = {
  jwtSecret: 'test-access-secret',
  refreshTokenSecret: 'test-refresh-secret',
};

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    phone: null,
    passwordHash: 'hash',
    role: 'customer',
    isActive: true,
    ...overrides,
  };
}

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
  };
}

describe('user routes', () => {
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

  it('GET /me returns the authenticated user profile', async () => {
    prisma.user.findUnique.mockResolvedValue(user({ id: 'customer-1', email: 'customer@example.com' }));

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { authorization: `Bearer ${tokenFor('customer', 'customer-1')}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user).toMatchObject({
      id: 'customer-1',
      email: 'customer@example.com',
      role: 'customer',
    });
  });

  it('PATCH /me updates the authenticated user profile', async () => {
    prisma.user.update.mockResolvedValue(user({ id: 'customer-1', name: 'Updated Customer' }));

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: { authorization: `Bearer ${tokenFor('customer', 'customer-1')}` },
      payload: { name: 'Updated Customer' },
    });

    expect(response.statusCode).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'customer-1' },
      data: {
        name: 'Updated Customer',
        phone: undefined,
      },
    });
    expect(response.json().user.name).toBe('Updated Customer');
  });

  it('admin can list users', async () => {
    prisma.user.findMany.mockResolvedValue([
      user({ id: 'admin-1', role: 'admin' }),
      user({ id: 'customer-1', role: 'customer' }),
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().users).toHaveLength(2);
  });

  it('non-admin cannot list users', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${tokenFor('mechanic')}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it('admin can create users', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user({ id: 'mechanic-1', role: 'mechanic' }));

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
      payload: {
        name: 'New Mechanic',
        email: 'mechanic@example.com',
        password: 'Mechanic@123',
        role: 'mechanic',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().user).toMatchObject({ id: 'mechanic-1', role: 'mechanic' });
  });

  it('admin can update users', async () => {
    prisma.user.update.mockResolvedValue(user({ id: 'mechanic-1', role: 'front_desk' }));

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/mechanic-1',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
      payload: { role: 'front_desk' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user.role).toBe('front_desk');
  });

  it('admin can delete users', async () => {
    prisma.user.delete.mockResolvedValue(user({ id: 'mechanic-1' }));

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/mechanic-1',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
    });

    expect(response.statusCode).toBe(204);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'mechanic-1' } });
  });
});
