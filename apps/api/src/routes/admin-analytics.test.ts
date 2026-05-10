import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { signJwt } from '../lib/jwt.js';

const secrets = {
  jwtSecret: 'test-access-secret',
  refreshTokenSecret: 'test-refresh-secret',
};

function tokenFor(role: string, id = `${role}-1`) {
  return signJwt(
    { sub: id, email: `${role}@example.com`, role, tokenType: 'access' },
    secrets.jwtSecret,
    60,
  );
}

function createPrismaMock() {
  return {
    user: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    customerProfile: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    vehicle: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    workOrder: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    appointment: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    invoice: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    payment: { findMany: vi.fn(), create: vi.fn() },
    inspection: { create: vi.fn(), update: vi.fn() },
    labourLog: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    partsRequest: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    expense: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    service: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    attendance: { findMany: vi.fn(), create: vi.fn() },
  };
}

describe('admin analytics routes', () => {
  let app: FastifyInstance;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    app = await buildApp({ prisma: prisma as never, mailer: { sendMail: vi.fn() }, ...secrets });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns revenue totals and job completion metrics', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      { id: 'invoice-1', status: 'paid', grandTotal: 300000 },
      { id: 'invoice-2', status: 'issued', grandTotal: 120000 },
    ]);
    prisma.workOrder.findMany.mockResolvedValue([
      {
        id: 'work-order-1',
        status: 'completed',
        createdAt: '2026-05-10T08:00:00.000Z',
        updatedAt: '2026-05-10T12:00:00.000Z',
      },
      {
        id: 'work-order-2',
        status: 'in_progress',
        createdAt: '2026-05-10T09:00:00.000Z',
        updatedAt: '2026-05-10T10:00:00.000Z',
      },
    ]);

    const revenueResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/revenue',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
    });
    const jobsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/jobs',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
    });

    expect(revenueResponse.statusCode).toBe(200);
    expect(revenueResponse.json().totals.paidRevenue).toBe(300000);
    expect(revenueResponse.json().totals.outstanding).toBe(120000);
    expect(jobsResponse.json().byStatus.completed).toBe(1);
    expect(jobsResponse.json().averageTurnaroundHours).toBe(4);
  });

  it('returns staff performance and dashboard KPIs', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'mechanic-1',
        name: 'Moses Kato',
        assignedWorkOrders: [{ status: 'in_progress' }, { status: 'completed' }],
        labourLogs: [
          { startTime: '2026-05-10T08:00:00.000Z', endTime: '2026-05-10T12:00:00.000Z' },
        ],
      },
    ]);
    prisma.invoice.findMany.mockResolvedValue([
      { id: 'invoice-1', status: 'paid', grandTotal: 300000 },
      { id: 'invoice-2', status: 'issued', grandTotal: 120000 },
    ]);
    prisma.workOrder.findMany.mockResolvedValue([
      { status: 'in_progress', createdAt: '2026-05-10T08:00:00.000Z', updatedAt: '2026-05-10T11:00:00.000Z' },
      { status: 'paid', createdAt: '2026-05-10T09:00:00.000Z', updatedAt: '2026-05-10T10:00:00.000Z' },
    ]);
    prisma.partsRequest.findMany.mockResolvedValue([{ id: 'parts-1' }]);
    prisma.appointment.findMany.mockResolvedValue([{ id: 'appointment-1' }, { id: 'appointment-2' }]);

    const staffResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/staff-performance',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
    });
    const kpiResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/dashboard-kpis',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
    });

    expect(staffResponse.json().mechanics[0]).toMatchObject({
      name: 'Moses Kato',
      activeJobs: 1,
      completedJobs: 1,
      labourHours: 4,
    });
    expect(kpiResponse.json()).toMatchObject({
      revenueToday: 300000,
      outstandingInvoices: 1,
      partsAwaitingApproval: 1,
      appointmentsToday: 2,
      collectionReadyVehicles: 1,
    });
  });

  it('creates expenses and returns tax summary totals', async () => {
    prisma.expense.create.mockResolvedValue({ id: 'expense-1', amount: 50000, category: 'Utilities' });
    prisma.expense.findMany.mockResolvedValue([{ id: 'expense-1', amount: 50000, category: 'Utilities' }]);
    prisma.invoice.findMany.mockResolvedValue([{ id: 'invoice-1', grandTotal: 300000, tax: 45000 }]);

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/expenses',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
      payload: { category: 'Utilities', description: 'Power bill', amount: 50000 },
    });
    const summaryResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/tax-summary',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(summaryResponse.json()).toMatchObject({
      revenue: 300000,
      expenses: 50000,
      netRevenue: 250000,
      taxCollected: 45000,
      exportReady: true,
    });
  });

  it('manages service catalogue entries', async () => {
    prisma.service.create.mockResolvedValue({ id: 'service-1', name: 'Oil service', price: 90000 });
    prisma.service.findMany.mockResolvedValue([{ id: 'service-1', name: 'Oil service', price: 90000 }]);
    prisma.service.update.mockResolvedValue({ id: 'service-1', price: 95000 });
    prisma.service.delete.mockResolvedValue({ id: 'service-1' });

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/services',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
      payload: { name: 'Oil service', category: 'Mechanical', price: 90000 },
    });
    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/services?category=Mechanical',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
    });
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: '/api/v1/services/service-1',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
      payload: { price: 95000 },
    });
    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: '/api/v1/services/service-1',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(listResponse.json().services).toHaveLength(1);
    expect(updateResponse.json().service.price).toBe(95000);
    expect(deleteResponse.statusCode).toBe(204);
  });

  it('updates staff shifts, logs attendance, and queues report exports', async () => {
    prisma.user.update.mockResolvedValue({ id: 'mechanic-1', shift: '08:00-17:00' });
    prisma.attendance.create.mockResolvedValue({ id: 'attendance-1', status: 'present' });
    prisma.attendance.findMany.mockResolvedValue([{ id: 'attendance-1' }]);

    const shiftResponse = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/mechanic-1/shifts',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
      payload: { shift: '08:00-17:00' },
    });
    const attendanceResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
      payload: { userId: 'mechanic-1', status: 'present' },
    });
    const exportResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/reports/exports',
      headers: { authorization: `Bearer ${tokenFor('admin')}` },
      payload: { type: 'tax-summary', format: 'pdf' },
    });

    expect(shiftResponse.json().user.shift).toBe('08:00-17:00');
    expect(attendanceResponse.statusCode).toBe(201);
    expect(exportResponse.statusCode).toBe(202);
    expect(exportResponse.json().exportJob.status).toBe('queued');
  });

  it('rejects non-admin access to business reports', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/dashboard-kpis',
      headers: { authorization: `Bearer ${tokenFor('mechanic')}` },
    });

    expect(response.statusCode).toBe(403);
  });
});
