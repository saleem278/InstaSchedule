import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedMock } from './FeedMock';
import { StoryMock } from './StoryMock';
import { CarouselMock } from './CarouselMock';
import type { InstagramMockProps } from './types';

export type { InstagramMockProps, InstagramPreviewContent } from './types';

/**
 * Parent preview component: pill segmented-control tabs (Feed / Story /
 * Carousel) over the three mock layouts. Reused by both GenerationProgress
 * (loading/staged-reveal mode) and the Preview & Edit step (fully live mode).
 */
export function InstagramPreview(content: InstagramMockProps): React.JSX.Element {
  return (
    <Tabs defaultValue={content.postType ?? 'feed'} className="flex w-full flex-col items-center gap-4">
      <TabsList className="rounded-full bg-backgroundMuted p-1">
        <TabsTrigger value="feed" className="rounded-full px-4">
          Feed
        </TabsTrigger>
        <TabsTrigger value="story" className="rounded-full px-4">
          Story
        </TabsTrigger>
        <TabsTrigger value="carousel" className="rounded-full px-4">
          Carousel
        </TabsTrigger>
      </TabsList>

      <TabsContent value="feed" className="w-full">
        <FeedMock {...content} />
      </TabsContent>
      <TabsContent value="story" className="w-full">
        <StoryMock {...content} />
      </TabsContent>
      <TabsContent value="carousel" className="w-full">
        <CarouselMock {...content} />
      </TabsContent>
    </Tabs>
  );
}
