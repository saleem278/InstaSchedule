import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { IMAGE_GENERATION_QUEUE } from './queueNames';

export const imageGenerationQueue = redisConnection
  ? new Queue(IMAGE_GENERATION_QUEUE, { connection: redisConnection })
  : null;
