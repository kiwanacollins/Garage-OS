import fp from 'fastify-plugin';
import { Server as SocketIOServer } from 'socket.io';

export const realtimePlugin = fp(async (app) => {
  const io = new SocketIOServer(app.server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
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
