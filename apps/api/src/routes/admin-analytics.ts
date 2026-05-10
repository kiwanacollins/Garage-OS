import type { FastifyPluginAsync } from 'fastify';
import Redis from 'ioredis';
import {
  createAttendanceSchema,
  createExpenseSchema,
  createServiceSchema,
  expenseSearchSchema,
  reportDateRangeSchema,
  reportExportSchema,
  serviceSearchSchema,
  updateExpenseSchema,
  updateServiceSchema,
  updateStaffShiftSchema,
} from '@garage-os/validation';
import { requireRoles } from '../middleware/rbac.js';

const adminOnly = { preHandler: requireRoles('admin') };
const reportCacheTtlSeconds = 30;
let reportCache: Redis | null = null;

function getReportCache() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  reportCache ??= new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  return reportCache;
}

async function cachedReport<T>(key: string, producer: () => Promise<T>) {
  const cache = getReportCache();
  if (!cache) {
    return producer();
  }

  try {
    if (cache.status === 'wait') {
      await cache.connect();
    }
    const cached = await cache.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    const result = await producer();
    await cache.set(key, JSON.stringify(result), 'EX', reportCacheTtlSeconds);
    return result;
  } catch {
    return producer();
  }
}

function amount(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  if (value && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
    return value.toNumber();
  }

  return Number(value ?? 0);
}

function dateRangeWhere(dateFrom?: string, dateTo?: string, field = 'createdAt') {
  return dateFrom || dateTo
    ? {
        [field]: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      }
    : {};
}

function averageTurnaroundHours(workOrders: Array<{ createdAt?: string | Date; updatedAt?: string | Date }>) {
  const completed = workOrders.filter((workOrder) => workOrder.createdAt && workOrder.updatedAt);
  if (!completed.length) {
    return 0;
  }

  const totalHours = completed.reduce((total, workOrder) => {
    const start = new Date(workOrder.createdAt as string | Date).getTime();
    const end = new Date(workOrder.updatedAt as string | Date).getTime();
    return total + Math.max(0, end - start) / 36e5;
  }, 0);

  return Number((totalHours / completed.length).toFixed(1));
}

export const adminAnalyticsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/reports/revenue', adminOnly, async (request, reply) => {
    const parsed = reportDateRangeSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest('Invalid report date range');
    }

    return cachedReport(`reports:revenue:${JSON.stringify(parsed.data)}`, async () => {
      const invoices = await app.deps.prisma.invoice.findMany({
        where: dateRangeWhere(parsed.data.dateFrom, parsed.data.dateTo, 'issuedAt'),
      });
      const paid = invoices.filter((invoice) => invoice.status === 'paid');

      return {
        totals: {
          issuedRevenue: invoices.reduce((total, invoice) => total + amount(invoice.grandTotal), 0),
          paidRevenue: paid.reduce((total, invoice) => total + amount(invoice.grandTotal), 0),
          outstanding: invoices
            .filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled')
            .reduce((total, invoice) => total + amount(invoice.grandTotal), 0),
          invoiceCount: invoices.length,
        },
        invoices,
      };
    });
  });

  app.get('/reports/jobs', adminOnly, async (request, reply) => {
    const parsed = reportDateRangeSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest('Invalid report date range');
    }

    return cachedReport(`reports:jobs:${JSON.stringify(parsed.data)}`, async () => {
      const workOrders = await app.deps.prisma.workOrder.findMany({
        where: dateRangeWhere(parsed.data.dateFrom, parsed.data.dateTo),
      });
      const byStatus = workOrders.reduce<Record<string, number>>((counts, workOrder) => {
        counts[workOrder.status] = (counts[workOrder.status] ?? 0) + 1;
        return counts;
      }, {});

      return {
        total: workOrders.length,
        byStatus,
        averageTurnaroundHours: averageTurnaroundHours(
          workOrders.filter((workOrder) => ['completed', 'quality_check', 'invoiced', 'paid', 'collected'].includes(workOrder.status)),
        ),
      };
    });
  });

  app.get('/reports/staff-performance', adminOnly, async () => {
    const mechanics = await app.deps.prisma.user.findMany({
      where: { role: 'mechanic' },
      include: { assignedWorkOrders: true, labourLogs: true },
    });

    return {
      mechanics: mechanics.map((mechanic) => {
        const jobs = mechanic.assignedWorkOrders ?? [];
        const labourHours = (mechanic.labourLogs ?? []).reduce((total: number, log: { startTime?: Date; endTime?: Date }) => {
          if (!log.startTime || !log.endTime) {
            return total;
          }

          return total + Math.max(0, new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 36e5;
        }, 0);

        return {
          id: mechanic.id,
          name: mechanic.name,
          activeJobs: jobs.filter((job: { status: string }) => !['completed', 'collected'].includes(job.status)).length,
          completedJobs: jobs.filter((job: { status: string }) => ['completed', 'quality_check', 'invoiced', 'paid', 'collected'].includes(job.status)).length,
          labourHours: Number(labourHours.toFixed(1)),
          utilisation: Math.min(100, Math.round((labourHours / 40) * 100)),
        };
      }),
    };
  });

  app.get('/reports/dashboard-kpis', adminOnly, async (request, reply) => {
    const parsed = reportDateRangeSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest('Invalid report date range');
    }

    return cachedReport(`reports:dashboard-kpis:${JSON.stringify(parsed.data)}`, async () => {
      const [invoices, workOrders, partsRequests, appointments] = await Promise.all([
        app.deps.prisma.invoice.findMany({ where: dateRangeWhere(parsed.data.dateFrom, parsed.data.dateTo, 'issuedAt') }),
        app.deps.prisma.workOrder.findMany({ where: dateRangeWhere(parsed.data.dateFrom, parsed.data.dateTo) }),
        app.deps.prisma.partsRequest.findMany({ where: { status: 'pending' } }),
        app.deps.prisma.appointment.findMany({ where: dateRangeWhere(parsed.data.dateFrom, parsed.data.dateTo, 'scheduledAt') }),
      ]);

      const byStatus = workOrders.reduce<Record<string, number>>((counts, workOrder) => {
        counts[workOrder.status] = (counts[workOrder.status] ?? 0) + 1;
        return counts;
      }, {});

      return {
        revenueToday: invoices.filter((invoice) => invoice.status === 'paid').reduce((total, invoice) => total + amount(invoice.grandTotal), 0),
        revenueMonth: invoices.reduce((total, invoice) => total + amount(invoice.grandTotal), 0),
        outstandingInvoices: invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled').length,
        jobsByStatus: byStatus,
        averageTurnaroundHours: averageTurnaroundHours(workOrders),
        mechanicUtilisation: workOrders.length
          ? Math.round((((byStatus.in_progress ?? 0) + (byStatus.completed ?? 0)) / workOrders.length) * 100)
          : 0,
        partsAwaitingApproval: partsRequests.length,
        appointmentsToday: appointments.length,
        collectionReadyVehicles: byStatus.paid ?? 0,
      };
    });
  });

  app.get('/expenses', adminOnly, async (request, reply) => {
    const parsed = expenseSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest('Invalid expense search');
    }

    const expenses = await app.deps.prisma.expense.findMany({
      where: {
        ...dateRangeWhere(parsed.data.dateFrom, parsed.data.dateTo, 'incurredAt'),
        ...(parsed.data.category ? { category: parsed.data.category } : {}),
      },
      orderBy: { incurredAt: 'desc' },
    });

    return { expenses };
  });

  app.post('/expenses', adminOnly, async (request, reply) => {
    const parsed = createExpenseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid expense input');
    }

    const expense = await app.deps.prisma.expense.create({
      data: {
        ...parsed.data,
        incurredAt: parsed.data.incurredAt ? new Date(parsed.data.incurredAt) : new Date(),
      },
    });

    return reply.code(201).send({ expense });
  });

  app.patch('/expenses/:id', adminOnly, async (request, reply) => {
    const parsed = updateExpenseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid expense input');
    }

    const expense = await app.deps.prisma.expense.update({
      where: { id: (request.params as { id: string }).id },
      data: {
        ...parsed.data,
        incurredAt: parsed.data.incurredAt ? new Date(parsed.data.incurredAt) : undefined,
      },
    });

    return { expense };
  });

  app.delete('/expenses/:id', adminOnly, async (request, reply) => {
    await app.deps.prisma.expense.delete({ where: { id: (request.params as { id: string }).id } });
    return reply.code(204).send();
  });

  app.get('/reports/tax-summary', adminOnly, async (request, reply) => {
    const parsed = reportDateRangeSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest('Invalid report date range');
    }

    const [invoices, expenses] = await Promise.all([
      app.deps.prisma.invoice.findMany({ where: dateRangeWhere(parsed.data.dateFrom, parsed.data.dateTo, 'issuedAt') }),
      app.deps.prisma.expense.findMany({ where: dateRangeWhere(parsed.data.dateFrom, parsed.data.dateTo, 'incurredAt') }),
    ]);
    const revenue = invoices.reduce((total, invoice) => total + amount(invoice.grandTotal), 0);
    const taxCollected = invoices.reduce((total, invoice) => total + amount(invoice.tax), 0);
    const expenseTotal = expenses.reduce((total, expense) => total + amount(expense.amount), 0);

    return {
      revenue,
      expenses: expenseTotal,
      netRevenue: revenue - expenseTotal,
      taxCollected,
      exportReady: true,
    };
  });

  app.get('/services', adminOnly, async (request, reply) => {
    const parsed = serviceSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest('Invalid service search');
    }

    const services = await app.deps.prisma.service.findMany({
      where: {
        ...(parsed.data.category ? { category: parsed.data.category } : {}),
        ...(typeof parsed.data.isActive === 'boolean' ? { isActive: parsed.data.isActive } : {}),
      },
      orderBy: { name: 'asc' },
    });

    return { services };
  });

  app.post('/services', adminOnly, async (request, reply) => {
    const parsed = createServiceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid service input');
    }

    const service = await app.deps.prisma.service.create({ data: parsed.data });
    return reply.code(201).send({ service });
  });

  app.patch('/services/:id', adminOnly, async (request, reply) => {
    const parsed = updateServiceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid service input');
    }

    const service = await app.deps.prisma.service.update({
      where: { id: (request.params as { id: string }).id },
      data: parsed.data,
    });

    return { service };
  });

  app.delete('/services/:id', adminOnly, async (request, reply) => {
    await app.deps.prisma.service.delete({ where: { id: (request.params as { id: string }).id } });
    return reply.code(204).send();
  });

  app.patch('/users/:id/shifts', adminOnly, async (request, reply) => {
    const parsed = updateStaffShiftSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid staff shift');
    }

    const user = await app.deps.prisma.user.update({
      where: { id: (request.params as { id: string }).id },
      data: { shift: parsed.data.shift },
    });

    return { user };
  });

  app.post('/attendance', adminOnly, async (request, reply) => {
    const parsed = createAttendanceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid attendance input');
    }

    const attendance = await app.deps.prisma.attendance.create({
      data: {
        ...parsed.data,
        loggedAt: parsed.data.loggedAt ? new Date(parsed.data.loggedAt) : new Date(),
      },
    });

    return reply.code(201).send({ attendance });
  });

  app.get('/attendance', adminOnly, async () => {
    const attendance = await app.deps.prisma.attendance.findMany({
      orderBy: { loggedAt: 'desc' },
      include: { user: true },
    });

    return { attendance };
  });

  app.post('/reports/exports', adminOnly, async (request, reply) => {
    const parsed = reportExportSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid report export input');
    }

    return reply.code(202).send({
      exportJob: {
        id: `export-${parsed.data.type}-${Date.now()}`,
        status: 'queued',
        ...parsed.data,
      },
    });
  });
};
