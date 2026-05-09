import type prisma from '@garage-os/db';

export type AppDeps = {
  prisma: typeof prisma;
  jwtSecret: string;
  refreshTokenSecret: string;
};

declare module 'fastify' {
  interface FastifyInstance {
    deps: AppDeps;
  }

  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}
