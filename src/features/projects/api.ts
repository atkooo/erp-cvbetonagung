import { apiClient } from '../../services/api';
import { Project } from '../../types';
import { ProjectDto, CreateProjectTimelineDto } from './types';
import { mapProjectFromDto } from './mappers';

export const projectsApi = {
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get<{ data: ProjectDto[] }>('/projects/projects?include=customer,timelines,documents,termins');
    return response.data.map(mapProjectFromDto);
  },

  async createTimelineEvent(data: CreateProjectTimelineDto): Promise<void> {
    await apiClient.post('/projects/project-timelines', data);
  },

  async updateProject(id: string, data: { progress: number; status: string }): Promise<Project> {
    const response = await apiClient.put<{ data: ProjectDto }>(`/projects/projects/${id}`, data);
    return mapProjectFromDto(response.data);
  }
};
