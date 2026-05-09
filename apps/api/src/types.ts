type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: string;
  isActive: boolean;
};

export type AppPrisma = {
  user: {
    findUnique(args: { where: { id?: string; email?: string } }): Promise<UserRecord | null>;
    create(args: {
      data: {
        name: string;
        email: string;
        phone?: string;
        passwordHash: string;
        role: string;
        isActive: boolean;
        customerProfile?: {
          create: {
            preferredContact: string;
          };
        };
      };
    }): Promise<UserRecord>;
  };
};

export type AppDeps = {
  prisma: AppPrisma;
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
