import { config } from '../../config/env';
import { InstagramPublisher } from './InstagramPublisher.interface';
import { GraphApiPublisher } from './GraphApiPublisher';
import { MockPublisher } from './MockPublisher';

let cachedPublisher: InstagramPublisher | null = null;

export function getInstagramPublisher(): InstagramPublisher {
  if (!cachedPublisher) {
    cachedPublisher =
      config.INSTAGRAM_PUBLISHER === 'mock' ? new MockPublisher() : new GraphApiPublisher();
  }
  return cachedPublisher;
}
