import type { FastifyPluginAsync } from 'fastify';
import { verifyJwt } from '../lib/jwt.js';

type AccessPayload = {
  sub: string;
  email: string;
  role: string;
  tokenType: 'access' | 'refresh';
};

export const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest('user', undefined);

  app.addHook('preHandler', async (request, reply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.unauthorized('Authentication token is required');
    }

    try {
      const payload = verifyJwt<AccessPayload>(header.slice('Bearer '.length), app.deps.jwtSecret);
      if (payload.tokenType !== 'access') {
        return reply.unauthorized('Authentication token is invalid');
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return reply.unauthorized('Authentication token is invalid');
    }
  });
};
