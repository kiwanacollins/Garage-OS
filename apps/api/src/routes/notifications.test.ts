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
    auditLog: { findMany: vi.fn(), create: vi.fn() },
    notification: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  };
}

describe('notification routes', () => {
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

  it('returns notifications for the logged-in user and marks one as read', async () => {
    prisma.notification.findMany
      .mockResolvedValueOnce([
        {
          id: 'notification-1',
          recipientId: 'front-desk-1',
          channel: 'in_app',
          title: 'Ready',
          body: 'Vehicle is ready',
          isRead: false,
          createdAt: '2026-05-11T08:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([{ id: 'notification-1' }]);
    prisma.notification.update.mockResolvedValue({
      id: 'notification-1',
      recipientId: 'front-desk-1',
      channel: 'in_app',
      title: 'Ready',
      body: 'Vehicle is ready',
      isRead: true,
      createdAt: '2026-05-11T08:00:00.000Z',
    });

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications?unreadOnly=true',
      headers: { authorization: `Bearer ${tokenFor('front_desk', 'front-desk-1')}` },
    });
    const readResponse = await app.inject({
      method: 'PATCH',
      url: '/api/v1/notifications/notification-1/read',
      headers: { authorization: `Bearer ${tokenFor('front_desk', 'front-desk-1')}` },
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().notifications).toHaveLength(1);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { recipientId: 'front-desk-1', isRead: false } }),
    );
    expect(readResponse.json().notification.isRead).toBe(true);
  });

  it('allows front desk to queue a manual customer notification', async () => {
    prisma.customerProfile.findUnique.mockResolvedValue({
      id: 'customer-profile-1',
      user: {
        id: 'customer-user-1',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '+256700000000',
      },
    });
    prisma.notification.create.mockResolvedValue({
      id: 'notification-1',
      recipientId: 'customer-user-1',
      channel: 'in_app',
      title: 'Pickup',
      body: 'Your vehicle is ready.',
      isRead: false,
      createdAt: '2026-05-11T08:00:00.000Z',
    });
    prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/notifications/manual-send',
      headers: { authorization: `Bearer ${tokenFor('front_desk', 'front-desk-1')}` },
      payload: {
        customerId: 'customer-profile-1',
        channel: 'whatsapp',
        title: 'Pickup',
        message: 'Your vehicle is ready.',
      },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json().status).toBe('queued');
    expect(prisma.notification.create).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'front-desk-1',
          action: 'manual_notification_queued',
        }),
      }),
    );
  });

  it('rejects invalid manual channels, missing customers, and unauthorized roles', async () => {
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/v1/notifications/manual-send',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
      payload: { customerId: 'customer-profile-1', channel: 'fax', message: 'Hello' },
    });

    prisma.customerProfile.findUnique.mockResolvedValue(null);
    const missing = await app.inject({
      method: 'POST',
      url: '/api/v1/notifications/manual-send',
      headers: { authorization: `Bearer ${tokenFor('front_desk')}` },
      payload: { customerId: 'customer-profile-1', channel: 'sms', message: 'Hello' },
    });

    const forbidden = await app.inject({
      method: 'POST',
      url: '/api/v1/notifications/manual-send',
      headers: { authorization: `Bearer ${tokenFor('mechanic')}` },
      payload: { customerId: 'customer-profile-1', channel: 'sms', message: 'Hello' },
    });

    expect(invalid.statusCode).toBe(400);
    expect(missing.statusCode).toBe(404);
    expect(forbidden.statusCode).toBe(403);
  });
});
