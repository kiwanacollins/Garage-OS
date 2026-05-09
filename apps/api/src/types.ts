export type UserRecord = {
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
    findMany(args?: {
      orderBy?: { createdAt?: 'asc' | 'desc'; name?: 'asc' | 'desc' };
      select?: Record<string, boolean>;
    }): Promise<UserRecord[]>;
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
    update(args: {
      where: { id: string };
      data: Partial<
        Pick<UserRecord, 'name' | 'email' | 'phone' | 'passwordHash' | 'role' | 'isActive'>
      >;
    }): Promise<UserRecord>;
    delete(args: { where: { id: string } }): Promise<UserRecord>;
  };
};

export type AppMailer = {
  sendMail(message: {
    to: string;
    from?: string;
    subject: string;
    text: string;
  }): Promise<unknown>;
};

export type AppDeps = {
  prisma: AppPrisma;
  mailer: AppMailer;
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
