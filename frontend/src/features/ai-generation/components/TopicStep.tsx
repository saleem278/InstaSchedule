import { useEffect, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/cn';
import { usePrompts } from '@/features/prompts/hooks/usePrompts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EXAMPLE_TOPICS = [
  'Announce our new summer collection launch',
  'Behind-the-scenes look at how we roast our coffee',
  'Customer testimonial about our skincare routine',
  '5 tips for styling our best-selling denim jacket',
];

interface TopicStepProps {
  topic: string;
  onChangeTopic: (topic: string) => void;
  postType: 'feed' | 'story' | 'carousel';
  onChangePostType: (type: 'feed' | 'story' | 'carousel') => void;
  onSubmit: () => void;
}

/**
 * Large centered textarea with a rotating example placeholder (swaps every
 * 3s via AnimatePresence fade). Enter submits, Shift+Enter inserts a newline.
 */
export function TopicStep({
  topic,
  onChangeTopic,
  postType,
  onChangePostType,
  onSubmit,
}: TopicStepProps): React.JSX.Element {
  const { data: prompts = [] } = usePrompts();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % EXAMPLE_TOPICS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (topic.trim().length >= 3) {
        onSubmit();
      }
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accentSubtle text-accent">
          <Sparkles className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-semibold text-textPrimary sm:text-3xl">What are we posting about today?</h1>
        <p className="max-w-md text-sm text-textSecondary">
          Describe your topic in a sentence or two — we&apos;ll write the caption, hashtags, and generate an image.
        </p>
      </div>

      {prompts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-2 bg-surfaceMuted/20 p-1.5 px-3 rounded-full border border-border/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-textSecondary">Use Saved Template</span>
          <Select
            onValueChange={(val) => {
              const selected = prompts.find((p) => p._id === val);
              if (selected) {
                onChangeTopic(selected.promptText);
                onChangePostType(selected.postType);
              }
            }}
          >
            <SelectTrigger className="w-[200px] h-7 text-xs bg-surface border-border/60 rounded-full">
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent className="max-w-[280px]">
              {prompts.map((p) => (
                <SelectItem key={p._id} value={p._id} className="text-xs truncate">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="relative w-full max-w-xl">
        <Textarea
          autoFocus
          value={topic}
          onChange={(e) => onChangeTopic(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          className="resize-none text-base shadow-sm"
        />
        {topic.length === 0 && (
          <div className="pointer-events-none absolute left-3 top-2 right-3 overflow-hidden text-base text-textTertiary">
            <AnimatePresence mode="wait">
              <motion.span
                key={placeholderIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="block truncate"
              >
                {EXAMPLE_TOPICS[placeholderIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Post Type Segmented Control */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-textTertiary">Post Type</span>
        <div className="flex gap-1 rounded-full bg-backgroundMuted p-1 border border-border">
          {(['feed', 'story', 'carousel'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChangePostType(type)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-all capitalize',
                postType === type
                  ? 'bg-accent text-white shadow'
                  : 'text-textSecondary hover:text-textPrimary'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="accent-glow"
        size="lg"
        onClick={onSubmit}
        disabled={topic.trim().length < 3}
        className="min-w-40"
      >
        <Sparkles className="h-5 w-5" />
        Generate
      </Button>
      <p className="text-xs text-textTertiary">Press Enter to generate, Shift+Enter for a new line</p>
    </div>
  );
}
