import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProjectSchedule } from '../api/scheduler.api';
import { schedulerKeys } from './schedulerKeys';
import { projectKeys } from '@/features/projects/hooks/projectKeys';
import type { Project } from '@/features/projects/schemas/project.types';
import type { UpdateScheduleVariables } from '../schemas/scheduler.types';

/**
 * Reschedules (or unschedules, when `scheduledAt` is null) a project.
 *
 * Optimistically patches every cached `scheduler.calendar(...)` query so
 * drag-and-drop in CalendarView/AgendaView feels instant: the dragged card
 * moves to its new day immediately, then either settles quietly on success
 * or is rolled back (with a toast) on failure.
 */
export function useRescheduleProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, scheduledAt }: UpdateScheduleVariables) =>
      updateProjectSchedule(projectId, scheduledAt),

    onMutate: async ({ projectId, scheduledAt }) => {
      await queryClient.cancelQueries({ queryKey: schedulerKeys.calendars() });

      const previousCalendars = queryClient.getQueriesData<Project[]>({
        queryKey: schedulerKeys.calendars(),
      });

      previousCalendars.forEach(([queryKey, projects]) => {
        if (!projects) return;
        queryClient.setQueryData<Project[]>(
          queryKey,
          projects.map((project) =>
            project._id === projectId
              ? {
                  ...project,
                  status: scheduledAt === null ? 'draft' : 'scheduled',
                  schedule: { ...project.schedule, scheduledAt },
                }
              : project
          )
        );
      });

      return { previousCalendars };
    },

    onError: (_error, _variables, context) => {
      context?.previousCalendars.forEach(([queryKey, projects]) => {
        queryClient.setQueryData(queryKey, projects);
      });
      toast.error('Could not reschedule post. Please try again.');
    },

    onSuccess: () => {
      toast.success('Post rescheduled');
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: schedulerKeys.calendars() });
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
