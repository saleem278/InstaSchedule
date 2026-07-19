import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageIcon, MoreVertical, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { useDeleteProject } from '../hooks/useDeleteProject';
import type { Project } from '../schemas/project.types';

interface ProjectCardProps {
  project: Project;
}

/**
 * Compact project card for the dashboard's "Recent Projects" grid:
 * thumbnail, topic, and status badge. Clicking opens the project back into
 * the wizard's Preview & Edit step. An overflow menu in the corner offers
 * Delete, kept out of the card's main click target.
 */
export function ProjectCard({ project }: ProjectCardProps): React.JSX.Element {
  const navigate = useNavigate();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const deleteProjectMutation = useDeleteProject();

  function handleDeleteConfirmed() {
    deleteProjectMutation.mutate(project._id, {
      onSuccess: () => setConfirmDeleteOpen(false),
    });
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/projects/${project._id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/projects/${project._id}`);
        }
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden transition-shadow duration-150 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="absolute right-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="More actions"
              className="h-7 w-7 bg-surface/90 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setConfirmDeleteOpen(true)}
              className="text-danger focus:bg-dangerSubtle focus:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-backgroundMuted">
        {project.imageAsset ? (
          <img
            src={project.imageAsset.url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-textTertiary" />
        )}
      </div>
      <div className="flex flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-medium text-textPrimary">{project.topic}</p>
        <div className="flex items-center justify-between">
          <ProjectStatusBadge status={project.status} />
          <span className="text-[11px] text-textTertiary">
            {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription className="space-y-3 pt-2 text-left">
              <span className="block text-xs leading-relaxed text-textSecondary">
                This will permanently delete this project and its generated content. This cannot be undone.
              </span>
              <div className="max-h-36 overflow-y-auto rounded-md bg-backgroundMuted p-2 text-[11px] leading-relaxed font-mono text-textSecondary border border-border/40 scrollbar-none">
                {project.topic}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} disabled={deleteProjectMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed} disabled={deleteProjectMutation.isPending}>
              {deleteProjectMutation.isPending ? 'Deleting…' : 'Delete project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
