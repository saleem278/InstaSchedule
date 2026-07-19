    import { config } from '../../config/env';
    import { logger } from '../../config/logger';
    import { ExternalServiceError, ValidationError } from '../../core/errors/AppError';
    import {
      InstagramPublisher,
      PublishImagePostInput,
      PublishStoryPostInput,
      PublishCarouselPostInput,
      PublishResult,
    } from './InstagramPublisher.interface';

    const GRAPH_BASE = 'https://graph.facebook.com';

    // Meta creates the media container asynchronously (it fetches image_url
    // server-side). Publishing before it reaches FINISHED fails with subcode
    // 9007 ("Media ID is not available"). Poll status_code with bounded backoff.
    const CONTAINER_POLL_MAX_ATTEMPTS = 10;
    const CONTAINER_POLL_INTERVAL_MS = 2_000;

    function sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * True if the host is an IPv4/IPv6 loopback or private (RFC1918 / link-local /
     * unique-local) address — none of which Meta's servers can fetch from. Guards
     * against a stored image URL that points at a non-public address slipping past
     * the hostname checks (e.g. 127.0.0.2, 10.x, 192.168.x, 169.254.x, ::1, fc00::/7).
     */
    function isLoopbackOrPrivateHost(host: string): boolean {
      // IPv4 dotted quad
      const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (ipv4) {
        const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
        if (a === 127 || a === 0 || a === 10) return true; // loopback, "this host", private-A
        if (a === 172 && b >= 16 && b <= 31) return true; // private-B
        if (a === 192 && b === 168) return true; // private-C
        if (a === 169 && b === 254) return true; // link-local
        return false;
      }
      // IPv6 loopback / unspecified / unique-local (fc00::/7) / link-local (fe80::/10)
      if (host === '::1' || host === '::') return true;
      if (host.startsWith('fc') || host.startsWith('fd')) return true;
      if (host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb')) {
        return true;
      }
      return false;
    }

    interface GraphError {
      error?: { message?: string; type?: string; code?: number; error_subcode?: number };
    }

    /**
     * Publishes an image post to Instagram via the Meta Graph API using the
     * two-step Content Publishing flow:
     *   1. POST /{ig-user-id}/media          -> returns a creation container id
     *   2. POST /{ig-user-id}/media_publish  -> publishes the container, returns the media id
     * then best-effort fetches the permalink for the published media.
     *
     * HARD REQUIREMENT: `imageUrl` must be a publicly reachable HTTPS URL — Meta
     * fetches the bytes server-side, so localhost / local-disk `/uploads` paths
     * fail. The publish service guards this before calling here, but we re-check
     * defensively so this provider is safe to call directly.
     */
    export class GraphApiPublisher implements InstagramPublisher {
      readonly name = 'graph';

      private get apiRoot(): string {
        return `${GRAPH_BASE}/${config.META_GRAPH_API_VERSION}`;
      }

      async publishImagePost(input: PublishImagePostInput): Promise<PublishResult> {
        this.assertPublicHttpsUrl(input.imageUrl);

        const creationId = await this.createMediaContainer(input);
        await this.waitForContainerReady(creationId, input.accessToken);
        const mediaId = await this.publishContainer(input, creationId);
        const permalink = await this.fetchPermalink(mediaId, input.accessToken);

        return { mediaId, permalink, provider: this.name };
      }

      async publishStoryPost(input: PublishStoryPostInput): Promise<PublishResult> {
        this.assertPublicHttpsUrl(input.imageUrl);

        const creationId = await this.createStoryMediaContainer(input);
        await this.waitForContainerReady(creationId, input.accessToken);
        const mediaId = await this.publishContainer(input, creationId);
        const permalink = await this.fetchPermalink(mediaId, input.accessToken);

        return { mediaId, permalink, provider: this.name };
      }

      async publishCarouselPost(input: PublishCarouselPostInput): Promise<PublishResult> {
        if (!input.imageUrls || input.imageUrls.length < 2 || input.imageUrls.length > 10) {
          throw new ValidationError('Instagram carousel posts require between 2 and 10 images.');
        }
        for (const url of input.imageUrls) {
          this.assertPublicHttpsUrl(url);
        }

        // 1. Create item containers for each image
        const childContainerIds: string[] = [];
        for (const url of input.imageUrls) {
          const childId = await this.createCarouselItemContainer(url, input.instagramUserId, input.accessToken);
          childContainerIds.push(childId);
        }

        // 2. Wait for all child containers to be ready
        for (const childId of childContainerIds) {
          await this.waitForContainerReady(childId, input.accessToken);
        }

        // 3. Create the parent carousel container
        const parentId = await this.createParentCarouselContainer(
          childContainerIds,
          input.caption,
          input.instagramUserId,
          input.accessToken
        );

        // 4. Wait for parent container to be ready
        await this.waitForContainerReady(parentId, input.accessToken);

        // 5. Publish the parent carousel container
        const mediaId = await this.publishContainer(input, parentId);
        const permalink = await this.fetchPermalink(mediaId, input.accessToken);

        return { mediaId, permalink, provider: this.name };
      }

      private assertPublicHttpsUrl(imageUrl: string): void {
        let parsed: URL;
        try {
          parsed = new URL(imageUrl);
        } catch {
          throw new ValidationError('Image URL is not a valid URL', { imageUrl });
        }
        // Strip brackets from IPv6 literals (URL.hostname keeps them).
        const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

        const isNonPublic =
          parsed.protocol !== 'https:' ||
          host === 'localhost' ||
          host.endsWith('.local') ||
          host.endsWith('.internal') ||
          isLoopbackOrPrivateHost(host);

        if (isNonPublic) {
          throw new ValidationError(
            'Instagram can only publish images hosted at a public HTTPS URL. Configure Cloudinary (or another public image host) so generated images get a publicly reachable URL before publishing.',
            { imageUrl }
          );
        }
      }

      private async createMediaContainer(input: PublishImagePostInput): Promise<string> {
        const body = new URLSearchParams({
          image_url: input.imageUrl,
          caption: input.caption,
          access_token: input.accessToken,
        });
        const data = await this.post<{ id: string }>(
          `${this.apiRoot}/${input.instagramUserId}/media`,
          body,
          'create media container'
        );
        if (!data.id) {
          throw new ExternalServiceError('Instagram did not return a media container id');
        }
        return data.id;
      }

      private async createStoryMediaContainer(input: PublishStoryPostInput): Promise<string> {
        const body = new URLSearchParams({
          image_url: input.imageUrl,
          media_type: 'STORIES',
          access_token: input.accessToken,
        });
        const data = await this.post<{ id: string }>(
          `${this.apiRoot}/${input.instagramUserId}/media`,
          body,
          'create story media container'
        );
        if (!data.id) {
          throw new ExternalServiceError('Instagram did not return a story media container id');
        }
        return data.id;
      }

      private async createCarouselItemContainer(
        imageUrl: string,
        instagramUserId: string,
        accessToken: string
      ): Promise<string> {
        const body = new URLSearchParams({
          image_url: imageUrl,
          is_carousel_item: 'true',
          access_token: accessToken,
        });
        const data = await this.post<{ id: string }>(
          `${this.apiRoot}/${instagramUserId}/media`,
          body,
          'create carousel item container'
        );
        if (!data.id) {
          throw new ExternalServiceError('Instagram did not return a carousel item container id');
        }
        return data.id;
      }

      private async createParentCarouselContainer(
        childrenIds: string[],
        caption: string,
        instagramUserId: string,
        accessToken: string
      ): Promise<string> {
        const body = new URLSearchParams({
          media_type: 'CAROUSEL',
          children: childrenIds.join(','),
          caption,
          access_token: accessToken,
        });
        const data = await this.post<{ id: string }>(
          `${this.apiRoot}/${instagramUserId}/media`,
          body,
          'create parent carousel container'
        );
        if (!data.id) {
          throw new ExternalServiceError('Instagram did not return a parent carousel container id');
        }
        return data.id;
      }

      /**
       * Polls the container's `status_code` until it's FINISHED (ready to
       * publish), or throws on ERROR / EXPIRED / timeout. Meta fetches the image
       * asynchronously after container creation, so publishing immediately can
       * race and fail with subcode 9007; this makes publish reliable.
       */
      private async waitForContainerReady(creationId: string, accessToken: string): Promise<void> {
        for (let attempt = 0; attempt < CONTAINER_POLL_MAX_ATTEMPTS; attempt += 1) {
          const url = `${this.apiRoot}/${creationId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`;
          let statusCode: string | undefined;
          try {
            const response = await fetch(url);
            if (response.ok) {
              const data = (await response.json()) as { status_code?: string; status?: string };
              statusCode = data.status_code;
            }
          } catch (error) {
            // Transient read error — log and retry within the attempt budget.
            logger.warn({ err: error, creationId }, 'Failed to read Instagram container status; will retry');
          }

          if (statusCode === 'FINISHED') return;
          if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
            throw new ExternalServiceError(
              `Instagram could not process the image (container status: ${statusCode}). Check that the image URL is publicly reachable and a supported format.`
            );
          }

          // IN_PROGRESS (or unknown/transient) — wait and poll again.
          await sleep(CONTAINER_POLL_INTERVAL_MS);
        }

        throw new ExternalServiceError(
          'Instagram did not finish processing the image in time. Please try publishing again in a moment.'
        );
      }

      private async publishContainer(
        input: { instagramUserId: string; accessToken: string },
        creationId: string
      ): Promise<string> {
        const body = new URLSearchParams({
          creation_id: creationId,
          access_token: input.accessToken,
        });
        const data = await this.post<{ id: string }>(
          `${this.apiRoot}/${input.instagramUserId}/media_publish`,
          body,
          'publish media container'
        );
        if (!data.id) {
          throw new ExternalServiceError('Instagram did not return a published media id');
        }
        return data.id;
      }

      private async fetchPermalink(mediaId: string, accessToken: string): Promise<string | undefined> {
        // Best-effort: a failure here must not fail an otherwise-successful publish.
        try {
          const url = `${this.apiRoot}/${mediaId}?fields=permalink&access_token=${encodeURIComponent(accessToken)}`;
          const response = await fetch(url);
          if (!response.ok) return undefined;
          const data = (await response.json()) as { permalink?: string };
          return data.permalink;
        } catch (error) {
          logger.warn({ err: error, mediaId }, 'Failed to fetch Instagram permalink after publish');
          return undefined;
        }
      }

      private async post<T>(url: string, body: URLSearchParams, action: string): Promise<T> {
        let response: Response;
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
          });
        } catch (cause) {
          throw new ExternalServiceError(`Network error while trying to ${action} on Instagram`, { cause });
        }

        const text = await response.text();
        let payload: unknown;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = { raw: text };
        }

        if (!response.ok) {
          const graphMessage = (payload as GraphError)?.error?.message;
          logger.error({ status: response.status, payload, action   }, 'Instagram Graph API error');
          throw new ExternalServiceError(
            `Instagram rejected the request to ${action}${graphMessage ? `: ${graphMessage}` : ` (HTTP ${response.status})`}`,
            payload
          );
        }

        return payload as T;
      }
    }
