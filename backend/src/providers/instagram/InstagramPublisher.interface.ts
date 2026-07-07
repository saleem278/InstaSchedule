export interface PublishImagePostInput {
  /** Publicly reachable HTTPS image URL. Meta fetches this server-side, so it must NOT be localhost/local-disk. */
  imageUrl: string;
  /** Full caption text (caption + CTA + hashtags already composed by the caller). */
  caption: string;
  /** IG Business/Creator account id (the publish target). */
  instagramUserId: string;
  /** Long-lived access token authorized for content publishing on that account. */
  accessToken: string;
}

export interface PublishResult {
  /** The published Instagram media id. */
  mediaId: string;
  /** Public permalink to the published post, if the provider returns one. */
  permalink?: string;
  /** Which publisher produced this result ('graph' | 'mock'). */
  provider: string;
}

export interface InstagramPublisher {
  readonly name: string;
  publishImagePost(input: PublishImagePostInput): Promise<PublishResult>;
}
