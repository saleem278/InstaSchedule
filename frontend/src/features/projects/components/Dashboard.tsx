import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useActiveBrandStore } from '@/features/brands/store/activeBrandStore';
import { useBrands } from '@/features/brands/hooks/useBrands';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';

const EXAMPLE_CHIPS = [
  'Announce a flash sale',
  'Share a customer testimonial',
  'Behind-the-scenes at our studio',
];

/**
 * Three states, checked in order:
 *  1. No brands at all -> prompt to create a brand.
 *  2. Active brand exists but has no projects -> hero with inline topic
 *     input + example chips that open CreateWizard pre-filled.
 *  3. Populated -> greeting header, inline create bar, recent projects
 *     grid, "Scheduled next" strip.
 */
export function Dashboard(): React.JSX.Element {
  const navigate = useNavigate();
  const activeBrandId = useActiveBrandStore((state) => state.activeBrandId);
  const setActiveBrandId = useActiveBrandStore((state) => state.setActiveBrandId);
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const [topic, setTopic] = useState('');

  const effectiveBrandId = activeBrandId ?? brands?.[0]?._id ?? null;

  // Auto-select the first brand as active if none chosen yet (keeps
  // dashboard usable immediately after brand creation). Runs as an effect,
  // not during render, to avoid mutating external (Zustand) state mid-render.
  useEffect(() => {
    if (!activeBrandId && brands && brands.length > 0 && brands[0]) {
      setActiveBrandId(brands[0]._id);
    }
  }, [activeBrandId, brands, setActiveBrandId]);

  const { data: projectsResult, isLoading: projectsLoading } = useProjects(
    effectiveBrandId ? { brandId: effectiveBrandId, limit: 12 } : {}
  );

  function goToWizard(prefill?: string) {
    const query = prefill ? `?topic=${encodeURIComponent(prefill)}` : '';
    navigate(`/projects/new${query}`);
  }

  if (brandsLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // State 1: no brands yet.
  if (!brands || brands.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accentSubtle text-accent">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-textPrimary">Let&apos;s set up your first brand</h1>
        <p className="max-w-md text-sm text-textSecondary">
          Before you can generate Instagram content, tell us about your brand — its name, voice, and visual
          style.
        </p>
        <Button size="lg" onClick={() => navigate('/brands/new')}>
          <Plus className="h-4 w-4" />
          Create a Brand
        </Button>
      </div>
    );
  }

  const projects = projectsResult?.items ?? [];
  const nextScheduled = projects
    .filter((p) => p.status === 'scheduled' && p.schedule.scheduledAt)
    .sort((a, b) => new Date(a.schedule.scheduledAt!).getTime() - new Date(b.schedule.scheduledAt!).getTime())[0];

  // State 2: brand exists, no projects yet.
  if (!projectsLoading && projects.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-5 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accentSubtle text-accent">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-textPrimary">Create your first Instagram post</h1>
        <p className="max-w-md text-sm text-textSecondary">
          Describe a topic and we&apos;ll generate a caption, hashtags, and an image for you.
        </p>
        <div className="flex w-full max-w-lg gap-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What are we posting about?"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && topic.trim().length >= 3) goToWizard(topic.trim());
            }}
          />
          <Button onClick={() => goToWizard(topic.trim())} disabled={topic.trim().length < 3}>
            <Sparkles className="h-4 w-4" />
            Generate
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => goToWizard(chip)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-textSecondary transition-colors hover:border-accent hover:text-accent"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // State 3: populated.
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-textPrimary">Welcome back</h1>
        <p className="text-sm text-textSecondary">Here&apos;s what&apos;s happening with your content.</p>
      </div>

      <div className="flex gap-2">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Start a new post — what's the topic?"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && topic.trim().length >= 3) goToWizard(topic.trim());
          }}
        />
        <Button onClick={() => goToWizard(topic.trim())} disabled={topic.trim().length < 3}>
          <Sparkles className="h-4 w-4" />
          Generate
        </Button>
      </div>

      {nextScheduled && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-accentSubtle/40 px-4 py-3">
          <CalendarClock className="h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm text-textPrimary">
            Scheduled next: <span className="font-medium">{nextScheduled.topic}</span> on{' '}
            {new Date(nextScheduled.schedule.scheduledAt!).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-textPrimary">Recent Projects</h2>
        {projectsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
