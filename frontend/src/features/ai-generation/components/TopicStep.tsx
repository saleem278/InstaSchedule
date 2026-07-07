import { useEffect, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const EXAMPLE_TOPICS = [
  'Announce our new summer collection launch',
  'Behind-the-scenes look at how we roast our coffee',
  'Customer testimonial about our skincare routine',
  '5 tips for styling our best-selling denim jacket',
];

interface TopicStepProps {
  topic: string;
  onChangeTopic: (topic: string) => void;
  onSubmit: () => void;
}

/**
 * Large centered textarea with a rotating example placeholder (swaps every
 * 3s via AnimatePresence fade). Enter submits, Shift+Enter inserts a newline.
 */
export function TopicStep({ topic, onChangeTopic, onSubmit }: TopicStepProps): React.JSX.Element {
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
