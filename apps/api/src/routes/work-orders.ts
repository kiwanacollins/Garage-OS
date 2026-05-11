import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import {
  assignMechanicSchema,
  createWorkOrderSchema,
  updateWorkOrderStatusSchema,
  workOrderSearchSchema,
} from '@garage-os/validation';
import { WORK_ORDER_TRANSITIONS, WorkOrderStatus } from '@garage-os/shared-types';
import { requireRoles } from '../middleware/rbac.js';

type WorkOrderWithRelations = {
  id: string;
  vehicleId: string;
  assignedMechanicId: string | null;
  createdById: string;
  status: WorkOrderStatus | string;
  customerNotes: string | null;
  mechanicNotes: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  vehicle?: {
    id: string;
    registrationPlate: string;
    make: string;
    model: string;
    year: number;
    customer?: {
      id: string;
      userId: string;
      user?: {
        name: string;
        email: string;
        phone: string | null;
      };
    };
  };
  assignedMechanic?: {
    id: string;
    name: string;
    email: string;
  } | null;
  inspection?: unknown;
  labourLogs?: unknown[];
  partsRequests?: unknown[];
};

const workOrderInclude = {
  vehicle: { include: { customer: { include: { user: true } } } },
  assignedMechanic: true,
  inspection: true,
  labourLogs: true,
  partsRequests: true,
};

function publicWorkOrder(workOrder: WorkOrderWithRelations) {
  return {
    id: workOrder.id,
    vehicleId: workOrder.vehicleId,
    assignedMechanicId: workOrder.assignedMechanicId,
    createdById: workOrder.createdById,
    status: workOrder.status,
    customerNotes: workOrder.customerNotes,
    mechanicNotes: workOrder.mechanicNotes,
    createdAt: workOrder.createdAt,
    updatedAt: workOrder.updatedAt,
    vehicle: workOrder.vehicle
      ? {
          id: workOrder.vehicle.id,
          registrationPlate: workOrder.vehicle.registrationPlate,
          make: workOrder.vehicle.make,
          model: workOrder.vehicle.model,
          year: workOrder.vehicle.year,
          customer: workOrder.vehicle.customer?.user
            ? {
                id: workOrder.vehicle.customer.id,
                name: workOrder.vehicle.customer.user.name,
                email: workOrder.vehicle.customer.user.email,
                phone: workOrder.vehicle.customer.user.phone,
              }
            : undefined,
        }
      : undefined,
    assignedMechanic: workOrder.assignedMechanic
      ? {
          id: workOrder.assignedMechanic.id,
          name: workOrder.assignedMechanic.name,
          email: workOrder.assignedMechanic.email,
        }
      : null,
    inspection: workOrder.inspection,
    labourLogs: workOrder.labourLogs,
    partsRequests: workOrder.partsRequests,
  };
}

function canSeeAllWorkOrders(request: FastifyRequest) {
  return request.user?.role === 'admin' || request.user?.role === 'front_desk';
}

async function authorizeWorkOrderAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  workOrder: WorkOrderWithRelations | null,
) {
  if (!workOrder) {
    reply.notFound('Work order was not found');
    return false;
  }

  if (
    canSeeAllWorkOrders(request) ||
    workOrder.assignedMechanicId === request.user?.id ||
    workOrder.vehicle?.customer?.userId === request.user?.id
  ) {
    return true;
  }

  reply.forbidden('You do not have access to this work order');
  return false;
}

export const workOrderRoutes: FastifyPluginAsync = async (app) => {
  app.post('/work-orders', { preHandler: requireRoles('admin', 'front_desk') }, async (request, reply) => {
    const parsed = createWorkOrderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid work order input');
    }

    const workOrder = await app.deps.prisma.workOrder.create({
      data: {
        vehicleId: parsed.data.vehicleId,
        customerNotes: parsed.data.customerNotes,
        createdById: request.user?.id,
        status: WorkOrderStatus.CREATED,
      },
      include: workOrderInclude,
    });

    return reply.code(201).send({ workOrder: publicWorkOrder(workOrder) });
  });

  app.get('/work-orders', async (request, reply) => {
    const parsed = workOrderSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest('Invalid work order search');
    }

    const { status, mechanicId, vehicleId, dateFrom, dateTo, page, pageSize } = parsed.data;
    const roleScope =
      request.user?.role === 'mechanic'
        ? { assignedMechanicId: request.user.id }
        : request.user?.role === 'customer'
          ? { vehicle: { customer: { userId: request.user.id } } }
          : {};

    const workOrders = await app.deps.prisma.workOrder.findMany({
      where: {
        ...roleScope,
        ...(status ? { status } : {}),
        ...(vehicleId ? { vehicleId } : {}),
        ...(mechanicId && canSeeAllWorkOrders(request) ? { assignedMechanicId: mechanicId } : {}),
        ...(dateFrom || dateTo
          ? {
              createdAt: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {}),
              },
            }
          : {}),
      },
      include: workOrderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { workOrders: workOrders.map(publicWorkOrder), page, pageSize };
  });

  app.get('/work-orders/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const workOrder = await app.deps.prisma.workOrder.findUnique({
      where: { id: params.id },
      include: workOrderInclude,
    });

    if (!(await authorizeWorkOrderAccess(request, reply, workOrder))) {
      return reply;
    }

    return { workOrder: publicWorkOrder(workOrder) };
  });

  app.patch('/work-orders/:id/status', async (request, reply) => {
    const parsed = updateWorkOrderStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid work order status');
    }

    const params = request.params as { id: string };
    const existing = await app.deps.prisma.workOrder.findUnique({
      where: { id: params.id },
      include: workOrderInclude,
    });

    if (!(await authorizeWorkOrderAccess(request, reply, existing))) {
      return reply;
    }

    const allowedNext = WORK_ORDER_TRANSITIONS[existing.status as WorkOrderStatus] ?? [];
    if (!allowedNext.includes(parsed.data.status as WorkOrderStatus)) {
      return reply.badRequest('Invalid work order status transition');
    }

    const workOrder = await app.deps.prisma.workOrder.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
      include: workOrderInclude,
    });
    app.realtime.emitWorkOrderStatus({
      workOrderId: workOrder.id,
      status: workOrder.status,
      assignedMechanicId: workOrder.assignedMechanicId,
    });
    const customerUserId = workOrder.vehicle?.customer?.userId;
    if (customerUserId) {
      await app.deps.notificationService?.enqueue({
        type: 'in_app',
        channel: 'in_app',
        recipientId: customerUserId,
        title: 'Work order updated',
        body: `Your vehicle status is now ${workOrder.status.replaceAll('_', ' ')}.`,
        metadata: { workOrderId: workOrder.id, trigger: 'status-change' },
      });
    }

    return { workOrder: publicWorkOrder(workOrder) };
  });

  app.patch(
    '/work-orders/:id/assign',
    { preHandler: requireRoles('admin') },
    async (request, reply) => {
      const parsed = assignMechanicSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.badRequest('Invalid mechanic assignment');
      }

      const mechanic = await app.deps.prisma.user.findUnique({ where: { id: parsed.data.mechanicId } });
      if (!mechanic || mechanic.role !== 'mechanic') {
        return reply.badRequest('Assigned user must be a mechanic');
      }

      const workOrder = await app.deps.prisma.workOrder.update({
        where: { id: (request.params as { id: string }).id },
        data: {
          assignedMechanicId: parsed.data.mechanicId,
          status: WorkOrderStatus.ASSIGNED,
        },
        include: workOrderInclude,
      });
      app.realtime.emitWorkOrderStatus({
        workOrderId: workOrder.id,
        status: workOrder.status,
        assignedMechanicId: workOrder.assignedMechanicId,
      });
      await app.deps.notificationService?.enqueue({
        type: 'in_app',
        channel: 'in_app',
        recipientId: parsed.data.mechanicId,
        title: 'New job assigned',
        body: `Work order ${workOrder.id} has been assigned to you.`,
        metadata: { workOrderId: workOrder.id, trigger: 'job-assignment' },
      });

      return { workOrder: publicWorkOrder(workOrder) };
    },
  );
};
