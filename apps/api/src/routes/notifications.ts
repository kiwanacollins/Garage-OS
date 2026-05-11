import type { FastifyPluginAsync } from 'fastify';
import { manualNotificationSchema, notificationSearchSchema } from '@garage-os/validation';
import { requireRoles } from '../middleware/rbac.js';

type NotificationRecord = {
  id: string;
  recipientId: string;
  channel: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string | Date;
};

function publicNotification(notification: NotificationRecord) {
  return {
    id: notification.id,
    recipientId: notification.recipientId,
    channel: notification.channel,
    title: notification.title,
    body: notification.body,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (request, reply) => {
    const parsed = notificationSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest('Invalid notification search');
    }

    const { page, pageSize, unreadOnly } = parsed.data;
    const notifications = await app.deps.prisma.notification.findMany({
      where: {
        recipientId: request.user?.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { notifications: notifications.map(publicNotification), page, pageSize };
  });

  app.patch('/:id/read', async (request) => {
    const params = request.params as { id: string };
    const existing = await app.deps.prisma.notification.findMany({
      where: { id: params.id, recipientId: request.user?.id },
      take: 1,
    });
    if (!existing.length) {
      return { notification: null };
    }

    const notification = await app.deps.prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    });

    return { notification: publicNotification(notification) };
  });

  app.post(
    '/manual-send',
    { preHandler: requireRoles('admin', 'front_desk') },
    async (request, reply) => {
      const parsed = manualNotificationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.badRequest('Invalid manual notification input');
      }

      const customer = await app.deps.prisma.customerProfile.findUnique({
        where: { id: parsed.data.customerId },
        include: { user: true },
      });
      if (!customer) {
        return reply.notFound('Customer was not found');
      }

      const user = customer.user as { id: string; name: string; email: string; phone: string | null };
      const inAppResult = await app.deps.notificationService?.enqueue({
        type: 'in_app',
        channel: 'in_app',
        recipientId: user.id,
        title: parsed.data.title,
        body: parsed.data.message,
        metadata: {
          source: 'manual-send',
          requestedBy: request.user?.id,
          customerId: customer.id,
        },
      });
      const deliveryResult = await app.deps.notificationService?.enqueue({
        type: parsed.data.channel,
        channel: parsed.data.channel,
        recipientId: user.id,
        title: parsed.data.title,
        body: parsed.data.message,
        to: parsed.data.channel === 'email' ? user.email : user.phone,
        metadata: {
          source: 'manual-send',
          requestedBy: request.user?.id,
          customerId: customer.id,
          email: user.email,
          phone: user.phone,
        },
      });

      await app.deps.prisma.auditLog.create({
        data: {
          userId: request.user?.id,
          entityType: 'customer_profile',
          entityId: customer.id,
          action: 'manual_notification_queued',
          changes: {
            channel: parsed.data.channel,
            title: parsed.data.title,
          },
        },
      });

      return reply.code(202).send({
        status: 'queued',
        customerId: customer.id,
        recipientId: user.id,
        channel: parsed.data.channel,
        inAppResult,
        deliveryResult,
      });
    },
  );
};
