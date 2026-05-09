import type { FastifyReply, FastifyRequest } from 'fastify';

export function requireRoles(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.unauthorized('Authentication is required');
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.forbidden('You do not have permission to access this resource');
    }
  };
}
