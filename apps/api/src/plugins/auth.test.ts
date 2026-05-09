import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import { authPlugin } from './auth.js';
import { signJwt } from '../lib/jwt.js';

describe('auth plugin', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(sensible);
    app.decorate('deps', {
      prisma: {},
      jwtSecret: 'test-access-secret',
      refreshTokenSecret: 'test-refresh-secret',
    });
    await app.register(authPlugin);
    app.get('/private', async (request) => ({ user: request.user }));
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when no token is provided', async () => {
    const response = await app.inject({ method: 'GET', url: '/private' });

    expect(response.statusCode).toBe(401);
  });

  it('returns 401 when token is invalid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/private',
      headers: { authorization: 'Bearer invalid-token' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('attaches the user when token is valid', async () => {
    const token = signJwt(
      { sub: 'user-1', email: 'admin@example.com', role: 'admin', tokenType: 'access' },
      'test-access-secret',
      60,
    );

    const response = await app.inject({
      method: 'GET',
      url: '/private',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user).toEqual({
      id: 'user-1',
      email: 'admin@example.com',
      role: 'admin',
    });
  });
});
