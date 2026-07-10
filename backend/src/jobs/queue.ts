import { Queue } from 'bullmq';
import { config } from '../config/env';
import { IMAGE_GENERATION_QUEUE } from './queueNames';

export const imageGenerationQueue = config.REDIS_URL
  ? new Queue(IMAGE_GENERATION_QUEUE, { connection: { url: config.REDIS_URL } })
  : null;
