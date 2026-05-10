import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { createVehicleSchema, updateVehicleSchema, vehicleSearchSchema } from '@garage-os/validation';
import { requireRoles } from '../middleware/rbac.js';

type VehicleWithCustomer = {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  colour: string | null;
  registrationPlate: string;
  odometerReading: number | null;
  customer?: {
    id: string;
    userId: string;
    user?: {
      name: string;
      email: string;
      phone: string | null;
    };
  };
  workOrders?: unknown[];
};

function publicVehicle(vehicle: VehicleWithCustomer) {
  return {
    id: vehicle.id,
    customerId: vehicle.customerId,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    colour: vehicle.colour,
    registrationPlate: vehicle.registrationPlate,
    odometerReading: vehicle.odometerReading,
    customer: vehicle.customer?.user
      ? {
          id: vehicle.customer.id,
          name: vehicle.customer.user.name,
          email: vehicle.customer.user.email,
          phone: vehicle.customer.user.phone,
        }
      : undefined,
  };
}

function canManageVehicles(request: FastifyRequest) {
  return request.user?.role === 'admin' || request.user?.role === 'front_desk';
}

async function authorizeVehicleAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  vehicle: VehicleWithCustomer | null,
) {
  if (!vehicle) {
    reply.notFound('Vehicle was not found');
    return false;
  }

  if (
    canManageVehicles(request) ||
    request.user?.role === 'mechanic' ||
    vehicle.customer?.userId === request.user?.id
  ) {
    return true;
  }

  reply.forbidden('You do not have access to this vehicle');
  return false;
}

async function authorizeCustomerOwner(app: Parameters<FastifyPluginAsync>[0], request: FastifyRequest, customerId: string) {
  if (canManageVehicles(request)) {
    return true;
  }

  const customer = await app.deps.prisma.customerProfile.findUnique({
    where: { id: customerId },
    include: { user: true },
  });

  return request.user?.role === 'customer' && customer?.userId === request.user.id;
}

export const vehicleRoutes: FastifyPluginAsync = async (app) => {
  app.get('/vehicles', async (request, reply) => {
    const parsed = vehicleSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest('Invalid vehicle search');
    }

    const { q, customerId, page, pageSize } = parsed.data;
    const customerScope =
      request.user?.role === 'customer'
        ? {
            customer: { userId: request.user.id },
          }
        : customerId
          ? { customerId }
          : undefined;

    const vehicles = await app.deps.prisma.vehicle.findMany({
      where: {
        ...customerScope,
        ...(q
          ? {
              OR: [
                { make: { contains: q, mode: 'insensitive' } },
                { model: { contains: q, mode: 'insensitive' } },
                { registrationPlate: { contains: q, mode: 'insensitive' } },
                { customer: { user: { name: { contains: q, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      include: { customer: { include: { user: true } } },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { vehicles: vehicles.map(publicVehicle), page, pageSize };
  });

  app.post('/vehicles', async (request, reply) => {
    const parsed = createVehicleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid vehicle input');
    }

    if (!(await authorizeCustomerOwner(app, request, parsed.data.customerId))) {
      return reply.forbidden('You cannot register a vehicle for this customer');
    }

    const vehicle = await app.deps.prisma.vehicle.create({
      data: parsed.data,
      include: { customer: { include: { user: true } } },
    });

    return reply.code(201).send({ vehicle: publicVehicle(vehicle) });
  });

  app.get('/vehicles/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const vehicle = await app.deps.prisma.vehicle.findUnique({
      where: { id: params.id },
      include: { customer: { include: { user: true } } },
    });

    if (!(await authorizeVehicleAccess(request, reply, vehicle))) {
      return reply;
    }

    return { vehicle: publicVehicle(vehicle) };
  });

  app.patch('/vehicles/:id', async (request, reply) => {
    const parsed = updateVehicleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid vehicle input');
    }

    const params = request.params as { id: string };
    const existing = await app.deps.prisma.vehicle.findUnique({
      where: { id: params.id },
      include: { customer: { include: { user: true } } },
    });

    if (!(await authorizeVehicleAccess(request, reply, existing))) {
      return reply;
    }

    const vehicle = await app.deps.prisma.vehicle.update({
      where: { id: params.id },
      data: parsed.data,
      include: { customer: { include: { user: true } } },
    });

    return { vehicle: publicVehicle(vehicle) };
  });

  app.delete('/vehicles/:id', { preHandler: requireRoles('admin', 'front_desk') }, async (request, reply) => {
    const params = request.params as { id: string };
    await app.deps.prisma.vehicle.delete({ where: { id: params.id } });

    return reply.code(204).send();
  });

  app.get('/vehicles/:id/work-orders', async (request, reply) => {
    const params = request.params as { id: string };
    const vehicle = await app.deps.prisma.vehicle.findUnique({
      where: { id: params.id },
      include: { customer: { include: { user: true } }, workOrders: true },
    });

    if (!(await authorizeVehicleAccess(request, reply, vehicle))) {
      return reply;
    }

    return { workOrders: vehicle.workOrders ?? [] };
  });
};
