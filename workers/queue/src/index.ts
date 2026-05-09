import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processNotificationJob } from './jobs/notification.job.js';
import { processPdfJob } from './jobs/pdf.job.js';

// ── Redis Connection ───────────────────────────────────────────────────────────

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

console.info('🔌 Connecting to Redis...');

// ── Notification Worker ────────────────────────────────────────────────────────

const notificationWorker = new Worker('notifications', processNotificationJob, {
  connection,
  concurrency: 5,
});

notificationWorker.on('completed', (job) => {
  console.info(`✅ Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`❌ Notification job ${job?.id} failed:`, err.message);
});

// ── PDF Worker ─────────────────────────────────────────────────────────────────

const pdfWorker = new Worker('pdf-generation', processPdfJob, {
  connection,
  concurrency: 2,
});

pdfWorker.on('completed', (job) => {
  console.info(`✅ PDF job ${job.id} completed`);
});

pdfWorker.on('failed', (job, err) => {
  console.error(`❌ PDF job ${job?.id} failed:`, err.message);
});

console.info('🚀 GarageOS Queue Workers started');
console.info('   📧 Notification worker: listening on "notifications" queue');
console.info('   📄 PDF worker: listening on "pdf-generation" queue');

// ── Graceful Shutdown ──────────────────────────────────────────────────────────

const shutdown = async () => {
  console.info('Shutting down workers...');
  await notificationWorker.close();
  await pdfWorker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
