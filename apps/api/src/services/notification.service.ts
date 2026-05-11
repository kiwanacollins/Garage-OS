import type { AppMailer, AppPrisma, AppRealtime } from '../types.js';
import { Queue, Worker, type JobsOptions } from 'bullmq';

export type NotificationJobType = 'in_app' | 'email' | 'sms' | 'whatsapp';

export type NotificationJob = {
  type: NotificationJobType;
  recipientId: string;
  channel: NotificationJobType;
  title: string;
  body: string;
  to?: string | null;
  metadata?: Record<string, unknown>;
};

type NotificationServiceOptions = {
  prisma: AppPrisma;
  mailer: AppMailer;
  realtime: AppRealtime;
};

export class NotificationService {
  readonly jobs: NotificationJob[] = [];
  private readonly queue?: Queue<NotificationJob>;
  private readonly worker?: Worker<NotificationJob>;

  constructor(private readonly options: NotificationServiceOptions) {}

  async enqueue(job: NotificationJob) {
    this.jobs.push(job);
    if (this.queue) {
      await this.queue.add(job.type, job, retryOptions);
      return { status: 'queued', provider: 'bullmq' };
    }

    return this.process(job);
  }

  async notifyInApp(input: Omit<NotificationJob, 'type' | 'channel'>) {
    return this.enqueue({ ...input, type: 'in_app', channel: 'in_app' });
  }

  private async process(job: NotificationJob) {
    if (job.type === 'in_app') {
      if (!this.options.prisma.notification?.create) {
        return { status: 'queued', notification: null };
      }

      const notification = await this.options.prisma.notification.create({
        data: {
          recipientId: job.recipientId,
          channel: 'in_app',
          title: job.title,
          body: job.body,
        },
      });
      this.options.realtime.emitNotification({ recipientId: job.recipientId, notification });
      return { status: 'created', notification };
    }

    if (job.type === 'email') {
      await this.options.mailer.sendMail({
        to: job.to ?? String(job.metadata?.email ?? ''),
        from: process.env.MAIL_FROM ?? 'no-reply@garageos.local',
        subject: job.title,
        text: job.body,
      });
      return { status: 'sent', provider: 'email' };
    }

    return {
      status: process.env[`${job.type.toUpperCase()}_API_URL`] ? 'queued' : 'queued_without_provider',
      provider: job.type,
    };
  }
}

const retryOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 30_000 },
  removeOnComplete: 100,
  removeOnFail: 200,
};

export function createNotificationService(options: NotificationServiceOptions) {
  const service = new NotificationService(options);
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return service;
  }

  const connection = { url: redisUrl };
  const queue = new Queue<NotificationJob>('garageos-notifications', { connection });
  const worker = new Worker<NotificationJob>(
    'garageos-notifications',
    async (job) => {
      await service['process'](job.data);
    },
    { connection },
  );
  Object.assign(service, { queue, worker });
  return service;
}
