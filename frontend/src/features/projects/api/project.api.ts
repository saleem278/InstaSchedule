import { apiClient } from '@/core/api/apiClient';
import { PROJECT_ENDPOINTS } from '@/core/api/endpoints';
import type {
  CreateProjectPayload,
  ListProjectsQuery,
  ListProjectsResult,
  Project,
  PublishProjectResult,
  UpdateProjectPayload,
  UpdateProjectStatusPayload,
} from '../schemas/project.types';
import type { WithMeta } from '@/core/api/apiClient';

/**
 * Project API calls. `apiClient`'s response interceptor already unwraps the
 * `{ success, data }` envelope, so every call below resolves directly to the
 * typed payload — never re-unwrap `.data.data` here.
 */

export async function listProjects(query: ListProjectsQuery = {}): Promise<ListProjectsResult> {
  const items = await apiClient
    .get<Project[]>(PROJECT_ENDPOINTS.list, { params: query })
    .then((res) => res.data);
  const meta = (items as unknown as WithMeta).__meta as ListProjectsResult['meta'] | undefined;
  return {
    items,
    meta: meta ?? { page: query.page ?? 1, limit: query.limit ?? 20, total: items.length },
  };
}

export async function getProject(projectId: string): Promise<Project> {
  return apiClient.get<Project>(PROJECT_ENDPOINTS.detail(projectId)).then((res) => res.data);
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  return apiClient.post<Project>(PROJECT_ENDPOINTS.create, payload).then((res) => res.data);
}

export async function updateProject(projectId: string, payload: UpdateProjectPayload): Promise<Project> {
  return apiClient.patch<Project>(PROJECT_ENDPOINTS.update(projectId), payload).then((res) => res.data);
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiClient.delete(PROJECT_ENDPOINTS.delete(projectId));
}

export async function duplicateProject(projectId: string): Promise<Project> {
  return apiClient.post<Project>(PROJECT_ENDPOINTS.duplicate(projectId)).then((res) => res.data);
}

export async function updateProjectStatus(
  projectId: string,
  payload: UpdateProjectStatusPayload
): Promise<Project> {
  return apiClient.patch<Project>(PROJECT_ENDPOINTS.updateStatus(projectId), payload).then((res) => res.data);
}

export async function publishProject(projectId: string): Promise<PublishProjectResult> {
  return apiClient.post<PublishProjectResult>(PROJECT_ENDPOINTS.publish(projectId)).then((res) => res.data);
}
