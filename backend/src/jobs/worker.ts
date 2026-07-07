import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import { logger } from '../config/logger';
import { connectDb } from '../config/db';
import { IMAGE_GENERATION_QUEUE } from './queueNames';
import { processImageGenerationJob, GenerateImageJobData } from './processors/generateImage.processor';

async function start(): Promise<void> {
  if (!redisConnection) {
    logger.warn('REDIS_URL not set — worker process requires Redis to do anything useful. Exiting.');
    return;
  }

  await connectDb();

  const worker = new Worker<GenerateImageJobData>(
    IMAGE_GENERATION_QUEUE,
    async (job) => {
      await processImageGenerationJob({ data: job.data });
    },
    { connection: redisConnection }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Image generation job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Image generation job failed');
  });

  logger.info(`Worker listening on queue "${IMAGE_GENERATION_QUEUE}"`);
}

start().catch((error) => {
  logger.error({ err: error }, 'Worker failed to start');
  process.exit(1);
});
