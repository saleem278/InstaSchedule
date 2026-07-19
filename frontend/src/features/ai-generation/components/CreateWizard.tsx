import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useActiveBrandStore } from '@/features/brands/store/activeBrandStore';
import { useBrand } from '@/features/brands/hooks/useBrand';
import { useCreateProject } from '@/features/projects/hooks/useCreateProject';
import { TopicStep } from './TopicStep';
import { GenerationProgress } from './GenerationProgress';
import type { Project } from '@/features/projects/schemas/project.types';

type WizardStep = 'topic' | 'generating';

/**
 * Full-screen takeover wizard (fixed inset-0 overlay, NOT a shadcn Dialog
 * modal) with a step state machine: topic -> generating. The "generating"
 * step's element is GenerationProgress, which internally also owns the
 * Preview & Edit phase (see that file's doc comment).
 */
export function CreateWizard(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillTopic = searchParams.get('topic') ?? '';

  const activeBrandId = useActiveBrandStore((state) => state.activeBrandId);
  const { data: brand } = useBrand(activeBrandId);
  const createProjectMutation = useCreateProject();

  const [step, setStep] = useState<WizardStep>('topic');
  const [topic, setTopic] = useState(prefillTopic);
  const [postType, setPostType] = useState<'feed' | 'story' | 'carousel'>('feed');
  const [project, setProject] = useState<Project | null>(null);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  function closeWizard() {
    navigate('/dashboard');
  }

  function requestClose() {
    if (step === 'generating') {
      setConfirmCloseOpen(true);
      return;
    }
    closeWizard();
  }

  function handleSubmitTopic() {
    if (!activeBrandId || topic.trim().length < 3) return;
    createProjectMutation.mutate(
      { brandId: activeBrandId, topic: topic.trim(), postType },
      {
        onSuccess: (created) => {
          setProject(created);
          setStep('generating');
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Slim top bar */}
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
            <span className="text-sm text-textTertiary">No brand selected</span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={requestClose} aria-label="Close wizard">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Step content */}
      <div className="min-h-0 flex-1">
        {step === 'topic' && (
          <TopicStep
            topic={topic}
            onChangeTopic={setTopic}
            postType={postType}
            onChangePostType={setPostType}
            onSubmit={handleSubmitTopic}
          />
        )}
        {step === 'generating' && project && (
          <GenerationProgress
            project={project}
            brandName={brand?.name ?? 'Your Brand'}
            brandLogoUrl={brand?.logoUrl}
            onDone={closeWizard}
          />
        )}
      </div>

      <Dialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave without finishing?</DialogTitle>
            <DialogDescription>
              Your content generation is in progress. If you leave now, you can still find this project as a
              draft from your dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCloseOpen(false)}>
              Stay
            </Button>
            <Button variant="destructive" onClick={closeWizard}>
              Leave anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
