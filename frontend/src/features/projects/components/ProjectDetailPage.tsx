import { useNavigate, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useProject } from '../hooks/useProject';
import { useBrand } from '@/features/brands/hooks/useBrand';
import { GenerationProgress } from '@/features/ai-generation/components/GenerationProgress';

/**
 * Full-screen takeover for revisiting an existing project (e.g. clicking a
 * card from the Dashboard's "Recent Projects" grid). Reuses
 * GenerationProgress with `skipGeneration` so it renders the project's
 * persisted content directly in the editable 'ready' phase instead of
 * firing a fresh generation.
 */
export function ProjectDetailPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading } = useProject(projectId);
  const { data: brand } = useBrand(project?.brand);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          {brand ? (
            <>
              <Avatar className="h-7 w-7 border border-border">
                <AvatarImage src={brand.logoUrl} alt={brand.name} />
                <AvatarFallback className="text-[10px]">{brand.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-textPrimary">{brand.name}</span>
            </>
          ) : (
            <span className="text-sm text-textTertiary">Loading brand…</span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} aria-label="Close">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        {isLoading || !project ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-96 w-full max-w-3xl rounded-lg" />
          </div>
        ) : (
          <GenerationProgress
            project={project}
            brandName={brand?.name ?? 'Your Brand'}
            brandLogoUrl={brand?.logoUrl}
            onDone={() => navigate('/dashboard')}
            skipGeneration
          />
        )}
      </div>
    </div>
  );
}
