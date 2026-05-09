import bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { signJwt } from '../lib/jwt.js';

const secrets = {
  jwtSecret: 'test-access-secret',
  refreshTokenSecret: 'test-refresh-secret',
};

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
}

describe('auth routes', () => {
  let app: FastifyInstance;
  let prisma: ReturnType<typeof createPrismaMock>;
  let mailer: { sendMail: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prisma = createPrismaMock();
    mailer = { sendMail: vi.fn().mockResolvedValue(undefined) };
    app = await buildApp({ prisma: prisma as never, mailer, ...secrets });
    await app.ready();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('POST /auth/register returns tokens for valid registration', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Alice Customer',
      email: 'alice@example.com',
      phone: '+256700000000',
      role: 'customer',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        name: 'Alice Customer',
        email: 'alice@example.com',
        phone: '+256700000000',
        password: 'Customer@1234',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      user: {
        id: 'user-1',
        email: 'alice@example.com',
        role: 'customer',
      },
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('POST /auth/register returns 409 for duplicate email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        name: 'Alice Customer',
        email: 'alice@example.com',
        password: 'Customer@1234',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('POST /auth/register returns 400 for invalid input', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'not-an-email',
        password: 'short',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('POST /auth/login returns tokens for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('Customer@1234', 12);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Alice Customer',
      email: 'alice@example.com',
      phone: null,
      passwordHash,
      role: 'customer',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'alice@example.com',
        password: 'Customer@1234',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: {
        id: 'user-1',
        email: 'alice@example.com',
      },
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('POST /auth/login returns 401 for a wrong password', async () => {
    const passwordHash = await bcrypt.hash('Customer@1234', 12);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash,
      role: 'customer',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'alice@example.com',
        password: 'WrongPass123',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('POST /auth/login returns 404 for a missing user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'missing@example.com',
        password: 'Customer@1234',
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('POST /auth/refresh returns a new token pair for valid refresh token', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Alice Customer',
      email: 'alice@example.com',
      phone: null,
      role: 'customer',
      isActive: true,
    });
    const refreshToken = signJwt(
      { sub: 'user-1', email: 'alice@example.com', role: 'customer', tokenType: 'refresh' },
      secrets.refreshTokenSecret,
      60,
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('POST /auth/refresh returns 401 for expired token', async () => {
    const refreshToken = signJwt(
      { sub: 'user-1', email: 'alice@example.com', role: 'customer', tokenType: 'refresh' },
      secrets.refreshTokenSecret,
      -1,
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });

    expect(response.statusCode).toBe(401);
  });

  it('POST /auth/forgot-password sends a reset email for an existing user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Alice Customer',
      email: 'alice@example.com',
      phone: null,
      role: 'customer',
      isActive: true,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'alice@example.com' },
    });

    expect(response.statusCode).toBe(202);
    expect(mailer.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
        subject: 'Reset your GarageOS password',
        text: expect.stringContaining('reset token'),
      }),
    );
  });

  it('POST /auth/forgot-password returns 202 without revealing missing users', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'missing@example.com' },
    });

    expect(response.statusCode).toBe(202);
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });
});
