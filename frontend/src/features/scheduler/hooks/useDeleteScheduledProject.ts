import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteProject } from '@/features/projects/api/project.api';
import { projectKeys } from '@/features/projects/hooks/projectKeys';
import { schedulerKeys } from './schedulerKeys';

/**
 * Deletes a project from the scheduler (day-detail popover / quick-view
 * "Delete" action). Thin wrapper around the shared projects API that also
 * invalidates scheduler calendar queries so the deleted card disappears from
 * the calendar/agenda immediately.
 */
export function useDeleteScheduledProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: schedulerKeys.calendars() });
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success('Post deleted');
    },
    onError: () => {
      toast.error('Could not delete post. Please try again.');
    },
  });
}
