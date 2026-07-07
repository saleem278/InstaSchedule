import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/core/api/extractErrorMessage';
import { publishProject } from '../api/project.api';
import { projectKeys } from './projectKeys';

/**
 * Publishes a project to Instagram immediately ("Publish now"). On success the
 * backend flips the project to 'published' and stores the IG media id +
 * permalink; we invalidate caches and toast a link to the live post. On
 * failure we surface the backend's descriptive message (e.g. brand not
 * connected, image not publicly hosted) rather than a generic error.
 */
export function usePublishProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => publishProject(projectId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(result.project._id) });
      if (result.permalink) {
        toast.success('Published to Instagram', {
          action: { label: 'View post', onClick: () => window.open(result.permalink, '_blank', 'noopener') },
        });
      } else {
        toast.success('Published to Instagram');
      }
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, 'Could not publish to Instagram. Please try again.'));
    },
  });
}
