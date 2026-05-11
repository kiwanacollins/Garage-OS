import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  availableSlotsSchema,
  checkInSchema,
  checkOutSchema,
  createAppointmentSchema,
  createInvoiceSchema,
  createPaymentSchema,
  updateAppointmentSchema,
  updateInvoiceStatusSchema,
} from '@garage-os/validation';
import { InvoiceStatus, WorkOrderStatus } from '@garage-os/shared-types';
import { requireRoles } from '../middleware/rbac.js';

const frontDeskOnly = { preHandler: requireRoles('admin', 'front_desk') };

function invoiceTotals(input: { labourTotal: number; partsTotal: number; tax: number }) {
  return {
    labourTotal: input.labourTotal,
    partsTotal: input.partsTotal,
    tax: input.tax,
    grandTotal: input.labourTotal + input.partsTotal + input.tax,
  };
}

async function enqueueCustomerNotification(
  app: FastifyInstance,
  customer:
    | { id: string; preferredContact?: string | null; user?: { id: string; email: string; phone: string | null } }
    | null
    | undefined,
  input: { title: string; body: string; trigger: string; entityId?: string },
) {
  const user = customer?.user;
  if (!user) {
    return;
  }

  await app.deps.notificationService?.enqueue({
    type: 'in_app',
    channel: 'in_app',
    recipientId: user.id,
    title: input.title,
    body: input.body,
    metadata: { trigger: input.trigger, entityId: input.entityId, customerId: customer?.id },
  });

  const preferred = customer?.preferredContact;
  if (preferred === 'sms' || preferred === 'email' || preferred === 'whatsapp') {
    await app.deps.notificationService?.enqueue({
      type: preferred,
      channel: preferred,
      recipientId: user.id,
      title: input.title,
      body: input.body,
      to: preferred === 'email' ? user.email : user.phone,
      metadata: { trigger: input.trigger, entityId: input.entityId, customerId: customer?.id },
    });
  }
}

export const frontDeskRoutes: FastifyPluginAsync = async (app) => {
  app.post('/check-ins', frontDeskOnly, async (request, reply) => {
    const parsed = checkInSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid check-in input');
    }

    await app.deps.prisma.vehicle.update({
      where: { id: parsed.data.vehicleId },
      data: { odometerReading: parsed.data.odometerReading },
    });

    const workOrder = await app.deps.prisma.workOrder.create({
      data: {
        vehicleId: parsed.data.vehicleId,
        createdById: request.user?.id,
        customerNotes: parsed.data.customerNotes,
        status: WorkOrderStatus.CREATED,
        inspection: {
          create: {
            photos: parsed.data.photos,
          },
        },
      },
      include: { vehicle: true, inspection: true },
    });

    app.realtime.emitWorkOrderStatus({ workOrderId: workOrder.id, status: workOrder.status });
    return reply.code(201).send({ workOrder });
  });

  app.patch('/check-outs/:workOrderId', frontDeskOnly, async (request, reply) => {
    const params = request.params as { workOrderId: string };
    const parsed = checkOutSchema.safeParse({ ...(request.body as object), workOrderId: params.workOrderId });
    if (!parsed.success) {
      return reply.badRequest('Invalid check-out input');
    }

    const workOrder = await app.deps.prisma.workOrder.update({
      where: { id: parsed.data.workOrderId },
      data: { status: WorkOrderStatus.COLLECTED },
      include: { vehicle: true },
    });

    app.realtime.emitWorkOrderStatus({ workOrderId: workOrder.id, status: workOrder.status });
    return { workOrder, collectedAt: new Date().toISOString(), collectedBy: parsed.data.collectedBy };
  });

  app.get('/appointments', frontDeskOnly, async () => {
    const appointments = await app.deps.prisma.appointment.findMany({
      orderBy: { scheduledAt: 'asc' },
      include: { customer: { include: { user: true } }, vehicle: true },
    });

    return { appointments };
  });

  app.post('/appointments', frontDeskOnly, async (request, reply) => {
    const parsed = createAppointmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid appointment input');
    }

    const appointment = await app.deps.prisma.appointment.create({
      data: {
        customerId: parsed.data.customerId,
        vehicleId: parsed.data.vehicleId,
        scheduledAt: new Date(parsed.data.scheduledAt),
        issueDescription: parsed.data.issueDescription,
      },
      include: { customer: { include: { user: true } }, vehicle: true },
    });
    await enqueueCustomerNotification(app, appointment.customer, {
      title: 'Appointment scheduled',
      body: `Your appointment is scheduled for ${new Date(appointment.scheduledAt).toISOString()}.`,
      trigger: 'appointment-created',
      entityId: appointment.id,
    });

    return reply.code(201).send({ appointment });
  });

  app.patch('/appointments/:id', frontDeskOnly, async (request, reply) => {
    const parsed = updateAppointmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid appointment input');
    }

    const appointment = await app.deps.prisma.appointment.update({
      where: { id: (request.params as { id: string }).id },
      data: {
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
        issueDescription: parsed.data.issueDescription,
        status: parsed.data.status,
      },
      include: { customer: { include: { user: true } }, vehicle: true },
    });

    return { appointment };
  });

  app.delete('/appointments/:id', frontDeskOnly, async (request, reply) => {
    await app.deps.prisma.appointment.delete({ where: { id: (request.params as { id: string }).id } });
    return reply.code(204).send();
  });

  app.get('/appointments/available-slots', frontDeskOnly, async (request, reply) => {
    const parsed = availableSlotsSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest('Invalid slot query');
    }

    return {
      date: parsed.data.date,
      slots: ['08:30', '10:00', '11:30', '14:00', '15:30'].map((time) => `${parsed.data.date}T${time}:00.000Z`),
    };
  });

  app.post('/invoices', frontDeskOnly, async (request, reply) => {
    const parsed = createInvoiceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid invoice input');
    }

    const totals = invoiceTotals(parsed.data);
    const invoice = await app.deps.prisma.invoice.create({
      data: {
        workOrderId: parsed.data.workOrderId,
        ...totals,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
      },
      include: { workOrder: { include: { vehicle: { include: { customer: { include: { user: true } } } } } } },
    });

    await app.deps.prisma.workOrder.update({
      where: { id: parsed.data.workOrderId },
      data: { status: WorkOrderStatus.INVOICED },
    });
    app.realtime.emitWorkOrderStatus({ workOrderId: parsed.data.workOrderId, status: WorkOrderStatus.INVOICED });
    await enqueueCustomerNotification(app, invoice.workOrder?.vehicle?.customer, {
      title: 'Invoice ready',
      body: `Your invoice is ready. Amount due: UGX ${invoice.grandTotal}.`,
      trigger: 'invoice-issued',
      entityId: invoice.id,
    });

    return reply.code(201).send({ invoice });
  });

  app.get('/invoices/:id/pdf', frontDeskOnly, async (request, reply) => {
    const invoice = await app.deps.prisma.invoice.findUnique({ where: { id: (request.params as { id: string }).id } });
    if (!invoice) {
      return reply.notFound('Invoice was not found');
    }

    return reply.header('content-type', 'application/pdf').send(Buffer.from(`GarageOS invoice ${invoice.id}`));
  });

  app.patch('/invoices/:id/status', frontDeskOnly, async (request, reply) => {
    const parsed = updateInvoiceStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid invoice status');
    }

    const invoice = await app.deps.prisma.invoice.update({
      where: { id: (request.params as { id: string }).id },
      data: { status: parsed.data.status },
    });

    return { invoice };
  });

  app.post('/payments', frontDeskOnly, async (request, reply) => {
    const parsed = createPaymentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid payment input');
    }

    const payment = await app.deps.prisma.payment.create({ data: parsed.data });
    const invoice = await app.deps.prisma.invoice.update({
      where: { id: parsed.data.invoiceId },
      data: { status: InvoiceStatus.PAID },
    });

    return reply.code(201).send({ payment, invoice });
  });

  app.get('/payments/by-invoice/:invoiceId', frontDeskOnly, async (request) => {
    const payments = await app.deps.prisma.payment.findMany({
      where: { invoiceId: (request.params as { invoiceId: string }).invoiceId },
      orderBy: { paidAt: 'desc' },
    });

    return { payments };
  });
};
