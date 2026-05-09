import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

describe('GET /api/v1/health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      prisma: {
        user: {
          findUnique: async () => null,
          create: async () => ({
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            phone: null,
            passwordHash: 'hash',
            role: 'customer',
            isActive: true,
          }),
        },
      } as never,
      mailer: { sendMail: async () => undefined },
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with status ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });
});
