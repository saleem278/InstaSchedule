import { logger } from '../../config/logger';
import {
  InstagramPublisher,
  PublishImagePostInput,
  PublishStoryPostInput,
  PublishCarouselPostInput,
  PublishResult,
} from './InstagramPublisher.interface';

/**
 * Simulates a successful Instagram publish without any external call. Selected
 * when INSTAGRAM_PUBLISHER=mock, so the full publish + scheduling flow can be
 * exercised locally/in demos without Meta credentials or a public image host.
 * The returned media id is derived deterministically from the input so it's
 * stable and obviously fake (prefixed `mock-`).
 */
export class MockPublisher implements InstagramPublisher {
  readonly name = 'mock';

  async publishImagePost(input: PublishImagePostInput): Promise<PublishResult> {
    // Derive a stable pseudo-id from the target account + a hash of the caption
    // so repeated calls in tests are deterministic (no Date.now/random).
    let hash = 0;
    for (let i = 0; i < input.caption.length; i += 1) {
      hash = (hash * 31 + input.caption.charCodeAt(i)) | 0;
    }
    const mediaId = `mock-${input.instagramUserId}-${Math.abs(hash)}`;
    logger.info({ mediaId, instagramUserId: input.instagramUserId }, 'MockPublisher simulated an Instagram publish');
    return {
      mediaId,
      permalink: `https://instagram.com/p/${mediaId}`,
      provider: this.name,
    };
  }

  async publishStoryPost(input: PublishStoryPostInput): Promise<PublishResult> {
    const mediaId = `mock-story-${input.instagramUserId}-${Math.floor(Math.random() * 100000)}`;
    logger.info({ mediaId, instagramUserId: input.instagramUserId }, 'MockPublisher simulated an Instagram Story publish');
    return {
      mediaId,
      permalink: `https://instagram.com/stories/mock/${mediaId}`,
      provider: this.name,
    };
  }

  async publishCarouselPost(input: PublishCarouselPostInput): Promise<PublishResult> {
    let hash = 0;
    for (let i = 0; i < input.caption.length; i += 1) {
      hash = (hash * 31 + input.caption.charCodeAt(i)) | 0;
    }
    const mediaId = `mock-carousel-${input.instagramUserId}-${Math.abs(hash)}`;
    logger.info({ mediaId, instagramUserId: input.instagramUserId }, 'MockPublisher simulated an Instagram Carousel publish');
    return {
      mediaId,
      permalink: `https://instagram.com/p/${mediaId}`,
      provider: this.name,
    };
  }
}
