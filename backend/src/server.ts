import { createApp } from './app';
import { config } from './config/env';
import { connectDb, disconnectDb } from './config/db';
import { logger } from './config/logger';
import { startScheduledPublishEngine } from './jobs/scheduledPublish.engine';

async function main(): Promise<void> {
  await connectDb();

  const app = createApp();

  const server = app.listen(config.PORT, () => {
    logger.info(`Server listening on http://localhost:${config.PORT}`);
  });

  // Poll for due scheduled posts and publish them (in-process; no Redis needed).
  const stopScheduler = startScheduledPublishEngine();

  const shutdown = (signal: string): void => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      try {
        // Await any in-flight publish tick before tearing down the DB connection.
        await stopScheduler();
        await disconnectDb();
        logger.info('Shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, 'Error during shutdown');
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});
