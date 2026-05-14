import fp from 'fastify-plugin';
import { Server as SocketIOServer } from 'socket.io';

export const realtimePlugin = fp(async (app) => {
  const corsOrigin = process.env.CORS_ORIGIN?.trim();
  const resolvedCorsOrigin =
    corsOrigin && corsOrigin.length > 0
      ? corsOrigin.split(',').map((origin) => origin.trim())
      : 'http://localhost:3000';

  const io = new SocketIOServer(app.server, {
    cors: {
      origin: resolvedCorsOrigin,
      credentials: true,
    },
  });

  app.decorate('realtime', {
    emitWorkOrderStatus(payload: {
      workOrderId: string;
      status: string;
      assignedMechanicId?: string | null;
    }) {
      io.emit('work-order:status-updated', payload);
    },
    emitNotification(payload: { recipientId: string; notification: unknown }) {
      io.to(payload.recipientId).emit('notification:created', payload.notification);
      io.emit('notification:created', payload);
    },
  });

  app.addHook('onClose', (_instance, done) => {
    io.close(() => done());
  });
});
