import { apiClient } from '../../services/api';
import { Project } from '../../types';
import { 
  ProjectDto, CreateProjectTimelineDto, 
  ProjectBudgetItemDto, ProjectBudgetItem, CreateProjectBudgetItemDto 
} from './types';
import { mapProjectFromDto, mapProjectBudgetItemFromDto } from './mappers';

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
  },

  async createProject(data: {
    project_name: string;
    customer_id: string;
    code?: string;
    location?: string;
    project_type?: string;
    project_spec?: string;
    contract_value?: number;
    deadline?: string;
    status?: string;
  }): Promise<Project> {
    const response = await apiClient.post<{ data: ProjectDto }>('/projects/projects', data);
    return mapProjectFromDto(response.data);
  },

  async getProjectBudgets(): Promise<ProjectBudgetItem[]> {
    const response = await apiClient.get<{ data: ProjectBudgetItemDto[] }>('/projects/project-budget-items?include=project');
    return response.data.map(mapProjectBudgetItemFromDto);
  },

  async createProjectBudget(data: CreateProjectBudgetItemDto): Promise<ProjectBudgetItem> {
    const response = await apiClient.post<{ data: ProjectBudgetItemDto }>('/projects/project-budget-items', data);
    return mapProjectBudgetItemFromDto(response.data);
  },

  async deleteProjectBudget(id: string): Promise<void> {
    await apiClient.delete(`/projects/project-budget-items/${id}`);
  }
};

