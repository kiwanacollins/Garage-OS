import type { FastifyPluginAsync } from 'fastify';
import {
  completeWorkOrderSchema,
  createInspectionSchema,
  createLabourLogSchema,
  createPartsRequestSchema,
  updateInspectionSchema,
  updateLabourLogSchema,
  updatePartsRequestStatusSchema,
} from '@garage-os/validation';
import { PartsRequestStatus, WorkOrderStatus } from '@garage-os/shared-types';
import { requireRoles } from '../middleware/rbac.js';

const mechanicOrAdmin = { preHandler: requireRoles('admin', 'mechanic') };
const adminOnly = { preHandler: requireRoles('admin') };

export const mechanicRoutes: FastifyPluginAsync = async (app) => {
  app.post('/inspections', mechanicOrAdmin, async (request, reply) => {
    const parsed = createInspectionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid inspection input');
    }

    const inspection = await app.deps.prisma.inspection.create({
      data: parsed.data,
    });

    return reply.code(201).send({ inspection });
  });

  app.patch('/inspections/:id', mechanicOrAdmin, async (request, reply) => {
    const parsed = updateInspectionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid inspection input');
    }

    const inspection = await app.deps.prisma.inspection.update({
      where: { id: (request.params as { id: string }).id },
      data: parsed.data,
    });

    return { inspection };
  });

  app.post('/labour-logs', mechanicOrAdmin, async (request, reply) => {
    const parsed = createLabourLogSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid labour log input');
    }

    const labourLog = await app.deps.prisma.labourLog.create({
      data: {
        workOrderId: parsed.data.workOrderId,
        mechanicId: request.user?.id,
        description: parsed.data.description,
        startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : new Date(),
      },
    });

    return reply.code(201).send({ labourLog });
  });

  app.patch('/labour-logs/:id', mechanicOrAdmin, async (request, reply) => {
    const parsed = updateLabourLogSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid labour log input');
    }

    const labourLog = await app.deps.prisma.labourLog.update({
      where: { id: (request.params as { id: string }).id },
      data: {
        description: parsed.data.description,
        endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : new Date(),
      },
    });

    return { labourLog };
  });

  app.get('/labour-logs', mechanicOrAdmin, async (request) => {
    const query = request.query as { workOrderId?: string };
    const labourLogs = await app.deps.prisma.labourLog.findMany({
      where: {
        ...(query.workOrderId ? { workOrderId: query.workOrderId } : {}),
        ...(request.user?.role === 'mechanic' ? { mechanicId: request.user.id } : {}),
      },
      orderBy: { startTime: 'desc' },
    });

    return { labourLogs };
  });

  app.post('/parts-requests', mechanicOrAdmin, async (request, reply) => {
    const parsed = createPartsRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid parts request input');
    }

    const partsRequest = await app.deps.prisma.partsRequest.create({
      data: {
        workOrderId: parsed.data.workOrderId,
        requestedById: request.user?.id,
        partName: parsed.data.partName,
        quantity: parsed.data.quantity,
        status: PartsRequestStatus.PENDING,
      },
    });

    await app.deps.prisma.workOrder.update({
      where: { id: parsed.data.workOrderId },
      data: { status: WorkOrderStatus.AWAITING_PARTS },
    });
    app.realtime.emitWorkOrderStatus({
      workOrderId: parsed.data.workOrderId,
      status: WorkOrderStatus.AWAITING_PARTS,
    });

    return reply.code(201).send({ partsRequest });
  });

  app.get('/parts-requests', mechanicOrAdmin, async (request) => {
    const query = request.query as { workOrderId?: string };
    const partsRequests = await app.deps.prisma.partsRequest.findMany({
      where: query.workOrderId ? { workOrderId: query.workOrderId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return { partsRequests };
  });

  app.patch('/parts-requests/:id/status', adminOnly, async (request, reply) => {
    const parsed = updatePartsRequestStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid parts request status');
    }

    const partsRequest = await app.deps.prisma.partsRequest.update({
      where: { id: (request.params as { id: string }).id },
      data: { status: parsed.data.status },
    });

    return { partsRequest };
  });

  app.post('/work-orders/:id/complete', mechanicOrAdmin, async (request, reply) => {
    const parsed = completeWorkOrderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid completion input');
    }

    const workOrder = await app.deps.prisma.workOrder.update({
      where: { id: (request.params as { id: string }).id },
      data: {
        status: WorkOrderStatus.COMPLETED,
        mechanicNotes: parsed.data.mechanicNotes,
      },
    });
    app.realtime.emitWorkOrderStatus({
      workOrderId: workOrder.id,
      status: WorkOrderStatus.COMPLETED,
      assignedMechanicId: workOrder.assignedMechanicId,
    });

    return { workOrder, recommendations: parsed.data.recommendations };
  });

  app.get('/vehicles/:id/history', mechanicOrAdmin, async (request) => {
    const vehicle = await app.deps.prisma.vehicle.findUnique({
      where: { id: (request.params as { id: string }).id },
      include: {
        workOrders: {
          include: {
            inspection: true,
            labourLogs: true,
            partsRequests: true,
            invoice: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return { history: vehicle?.workOrders ?? [] };
  });
};
