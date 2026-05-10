import bcrypt from 'bcryptjs';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import {
  createCustomerSchema,
  customerSearchSchema,
  updateCustomerSchema,
} from '@garage-os/validation';
import { requireRoles } from '../middleware/rbac.js';

type CustomerWithUser = {
  id: string;
  userId: string;
  address: string | null;
  preferredContact: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  };
  vehicles?: unknown[];
};

function publicCustomer(customer: CustomerWithUser) {
  return {
    id: customer.id,
    userId: customer.userId,
    name: customer.user.name,
    email: customer.user.email,
    phone: customer.user.phone,
    address: customer.address,
    preferredContact: customer.preferredContact,
    isActive: customer.user.isActive,
    vehicles: customer.vehicles,
  };
}

function canManageCustomers(request: FastifyRequest) {
  return request.user?.role === 'admin' || request.user?.role === 'front_desk';
}

async function authorizeCustomerAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  customer: CustomerWithUser | null,
) {
  if (!customer) {
    reply.notFound('Customer was not found');
    return false;
  }

  if (canManageCustomers(request) || customer.userId === request.user?.id) {
    return true;
  }

  reply.forbidden('You do not have access to this customer');
  return false;
}

export const customerRoutes: FastifyPluginAsync = async (app) => {
  app.get('/customers', { preHandler: requireRoles('admin', 'front_desk') }, async (request, reply) => {
    const parsed = customerSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest('Invalid customer search');
    }

    const { q, page, pageSize } = parsed.data;
    const customers = await app.deps.prisma.customerProfile.findMany({
      where: q
        ? {
            OR: [
              { user: { name: { contains: q, mode: 'insensitive' } } },
              { user: { email: { contains: q, mode: 'insensitive' } } },
              { user: { phone: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      include: { user: true, vehicles: true },
      orderBy: { user: { name: 'asc' } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { customers: customers.map(publicCustomer), page, pageSize };
  });

  app.post('/customers', { preHandler: requireRoles('admin', 'front_desk') }, async (request, reply) => {
    const parsed = createCustomerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid customer input');
    }

    const existing = await app.deps.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return reply.conflict('Email is already registered');
    }

    const passwordHash = await bcrypt.hash('GarageOS@1234', 12);
    const user = await app.deps.prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash,
        role: 'customer',
        isActive: true,
        customerProfile: {
          create: {
            address: parsed.data.address,
            preferredContact: parsed.data.preferredContact ?? 'email',
          },
        },
      },
      include: { customerProfile: { include: { user: true, vehicles: true } } },
    });

    return reply.code(201).send({ customer: publicCustomer(user.customerProfile) });
  });

  app.get('/customers/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const customer = await app.deps.prisma.customerProfile.findUnique({
      where: { id: params.id },
      include: { user: true, vehicles: true },
    });

    if (!(await authorizeCustomerAccess(request, reply, customer))) {
      return reply;
    }

    return { customer: publicCustomer(customer) };
  });

  app.patch('/customers/:id', async (request, reply) => {
    const parsed = updateCustomerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid customer input');
    }

    const params = request.params as { id: string };
    const existing = await app.deps.prisma.customerProfile.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!(await authorizeCustomerAccess(request, reply, existing))) {
      return reply;
    }

    const customer = await app.deps.prisma.customerProfile.update({
      where: { id: params.id },
      data: {
        address: parsed.data.address,
        preferredContact: parsed.data.preferredContact,
        user: {
          update: {
            name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone,
          },
        },
      },
      include: { user: true, vehicles: true },
    });

    return { customer: publicCustomer(customer) };
  });

  app.delete('/customers/:id', { preHandler: requireRoles('admin', 'front_desk') }, async (request, reply) => {
    const params = request.params as { id: string };
    await app.deps.prisma.customerProfile.delete({ where: { id: params.id } });

    return reply.code(204).send();
  });
};
