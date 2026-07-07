import IORedis, { Redis } from 'ioredis';
import { config } from './env';
import { logger } from './logger';

let connection: Redis | null = null;

if (config.features.redisEnabled) {
  connection = new IORedis(config.REDIS_URL as string, {
    maxRetriesPerRequest: null,
  });
  connection.on('error', (err) => logger.error({ err }, 'Redis connection error'));
  logger.info('Redis enabled — image generation will run via BullMQ queue');
} else {
  logger.warn('REDIS_URL not set — image generation will run synchronously (no queue)');
}

export const redisConnection = connection;
