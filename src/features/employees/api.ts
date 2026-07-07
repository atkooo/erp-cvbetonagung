import { apiClient } from '../../services/api';
import { Employee } from '../../types';
import { EmployeeDto } from './types';
import { mapEmployeeFromDto, mapEmployeeToCreateDto } from './mappers';

export const employeesApi = {
  async getEmployees(): Promise<Employee[]> {
    const response = await apiClient.get<{ data: EmployeeDto[] }>('/identity/employees');
    return response.data.map(mapEmployeeFromDto);
  },

  async createEmployee(data: Omit<Employee, 'id'>): Promise<Employee> {
    const payload = mapEmployeeToCreateDto(data);
    const response = await apiClient.post<{ data: EmployeeDto }>('/identity/employees', payload);
    return mapEmployeeFromDto(response.data);
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    // Build a full DTO from the partial data (filling defaults from an empty base) then
    // drop keys whose source field was undefined so we only PATCH what was provided.
    const full = mapEmployeeToCreateDto({ ...data } as Omit<Employee, 'id'>);
    const payload = Object.fromEntries(
      Object.entries(full).filter(([, v]) => v !== undefined)
    );

    const response = await apiClient.put<{ data: EmployeeDto }>(`/identity/employees/${id}`, payload);
    return mapEmployeeFromDto(response.data);
  },

  async deleteEmployee(id: string): Promise<void> {
    await apiClient.delete(`/identity/employees/${id}`);
  },

  async generateAccount(id: string): Promise<{ user: { id: string, name: string, email: string }, password: string }> {
    const response = await apiClient.post<{ data: { user: any, password: string } }>(`/identity/employees/${id}/generate-account`, {});
    return response.data;
  }
};
