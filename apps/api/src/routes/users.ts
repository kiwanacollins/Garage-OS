import bcrypt from 'bcryptjs';
import type { FastifyPluginAsync } from 'fastify';
import { createUserSchema, updateMeSchema, updateUserSchema } from '@garage-os/validation';
import { requireRoles } from '../middleware/rbac.js';
import type { UserRecord } from '../types.js';

function publicUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
  };
}

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', async (request, reply) => {
    const user = await app.deps.prisma.user.findUnique({ where: { id: request.user?.id } });
    if (!user) {
      return reply.notFound('User was not found');
    }

    return { user: publicUser(user) };
  });

  app.patch('/me', async (request, reply) => {
    const parsed = updateMeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid profile input');
    }

    const data: Partial<Pick<UserRecord, 'name' | 'phone' | 'passwordHash'>> = {
      name: parsed.data.name,
      phone: parsed.data.phone,
    };

    if (parsed.data.password) {
      data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    }

    const user = await app.deps.prisma.user.update({
      where: { id: request.user?.id ?? '' },
      data,
    });

    return { user: publicUser(user) };
  });

  app.get('/users', { preHandler: requireRoles('admin') }, async () => {
    const users = await app.deps.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return { users: users.map(publicUser) };
  });

  app.post('/users', { preHandler: requireRoles('admin') }, async (request, reply) => {
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid user input');
    }

    const existing = await app.deps.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return reply.conflict('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await app.deps.prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash,
        role: parsed.data.role,
        isActive: parsed.data.isActive,
        ...(parsed.data.role === 'customer'
          ? {
              customerProfile: {
                create: {
                  preferredContact: 'email',
                },
              },
            }
          : {}),
      },
    });

    return reply.code(201).send({ user: publicUser(user) });
  });

  app.patch('/users/:id', { preHandler: requireRoles('admin') }, async (request, reply) => {
    const parsed = updateUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid user input');
    }

    const params = request.params as { id: string };
    const data: Partial<
      Pick<UserRecord, 'name' | 'email' | 'phone' | 'passwordHash' | 'role' | 'isActive'>
    > = {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    };

    if (parsed.data.password) {
      data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    }

    const user = await app.deps.prisma.user.update({
      where: { id: params.id },
      data,
    });

    return { user: publicUser(user) };
  });

  app.delete('/users/:id', { preHandler: requireRoles('admin') }, async (request, reply) => {
    const params = request.params as { id: string };
    await app.deps.prisma.user.delete({ where: { id: params.id } });

    return reply.code(204).send();
  });
};
