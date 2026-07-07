import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/core/utils/cn';

interface HashtagChipInputProps {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
  max?: number;
  disabled?: boolean;
}

const chipVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 22 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.12 } },
};

/**
 * Add/remove chip input for hashtags. New chips pop in with the same
 * spring-scale 0.8 -> 1 treatment used during the staged reveal.
 */
export function HashtagChipInput({ hashtags, onChange, max = 30, disabled = false }: HashtagChipInputProps): React.JSX.Element {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const clean = draft.trim().replace(/^#/, '');
    if (!clean || hashtags.includes(clean) || hashtags.length >= max) {
      setDraft('');
      return;
    }
    onChange([...hashtags, clean]);
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(hashtags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence initial={false}>
          {hashtags.map((tag) => (
            <motion.span
              key={tag}
              variants={chipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="inline-flex items-center gap-1 rounded-full bg-accentSubtle px-2.5 py-1 text-xs font-medium text-accent"
            >
              #{tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove hashtag ${tag}`}
                  className="rounded-full hover:bg-accent/20"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      {!disabled && hashtags.length < max && (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder="Add a hashtag and press Enter"
          className="h-8 text-xs"
        />
      )}
      <p className={cn('text-right text-[11px] text-textTertiary', hashtags.length >= max && 'text-warning')}>
        {hashtags.length}/{max}
      </p>
    </div>
  );
}
