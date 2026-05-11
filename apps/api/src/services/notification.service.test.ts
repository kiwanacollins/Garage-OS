import { describe, expect, it, vi } from 'vitest';
import { NotificationService } from './notification.service.js';

describe('NotificationService', () => {
  it('creates an in-app notification and emits a realtime event', async () => {
    const notification = {
      id: 'notification-1',
      recipientId: 'user-1',
      channel: 'in_app',
      title: 'Assigned',
      body: 'A job is ready',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const prisma = {
      notification: { create: vi.fn().mockResolvedValue(notification) },
    };
    const realtime = { emitNotification: vi.fn(), emitWorkOrderStatus: vi.fn() };
    const service = new NotificationService({
      prisma: prisma as never,
      mailer: { sendMail: vi.fn() },
      realtime,
    });

    await service.enqueue({
      type: 'in_app',
      channel: 'in_app',
      recipientId: 'user-1',
      title: 'Assigned',
      body: 'A job is ready',
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        recipientId: 'user-1',
        channel: 'in_app',
        title: 'Assigned',
        body: 'A job is ready',
      },
    });
    expect(realtime.emitNotification).toHaveBeenCalledWith({ recipientId: 'user-1', notification });
  });

  it('queues email delivery through the configured mailer', async () => {
    const mailer = { sendMail: vi.fn().mockResolvedValue(undefined) };
    const service = new NotificationService({
      prisma: {} as never,
      mailer,
      realtime: { emitNotification: vi.fn(), emitWorkOrderStatus: vi.fn() },
    });

    await service.enqueue({
      type: 'email',
      channel: 'email',
      recipientId: 'user-1',
      title: 'Invoice ready',
      body: 'Your invoice is ready.',
      to: 'customer@example.com',
    });

    expect(service.jobs).toHaveLength(1);
    expect(mailer.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@example.com',
        subject: 'Invoice ready',
        text: 'Your invoice is ready.',
      }),
    );
  });
});
