import { Badge } from '@/components/ui/badge';
import type { ProjectStatus } from '../schemas/project.types';

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' }
> = {
  draft: { label: 'Draft', variant: 'neutral' },
  scheduled: { label: 'Scheduled', variant: 'accent' },
  publishing: { label: 'Publishing…', variant: 'warning' },
  published: { label: 'Published', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }): React.JSX.Element {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
