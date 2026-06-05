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
    const payload: any = {};
    if (data.employeeNumber !== undefined) payload.employee_number = data.employeeNumber;
    if (data.name !== undefined) payload.name = data.name;
    if (data.roleName !== undefined) payload.role_name = data.roleName;
    if (data.department !== undefined) payload.department = data.department;
    if (data.phone !== undefined) payload.phone = data.phone || null;
    if (data.address !== undefined) payload.address = data.address || null;
    if (data.joinDate !== undefined) payload.join_date = data.joinDate || null;
    if (data.employeeType !== undefined) {
      const typeMapInv: any = { 'Tetap': 'permanent', 'Kontrak': 'contract', 'Harian': 'daily', 'Borongan': 'borongan' };
      payload.employee_type = typeMapInv[data.employeeType];
    }
    if (data.dailyRate !== undefined) payload.daily_rate = data.dailyRate;
    if (data.pieceRate !== undefined) payload.piece_rate = data.pieceRate;
    if (data.status !== undefined) {
      payload.status = data.status === 'Aktif' ? 'active' : 'inactive';
    }

    const response = await apiClient.put<{ data: EmployeeDto }>(`/identity/employees/${id}`, payload);
    return mapEmployeeFromDto(response.data);
  },

  async deleteEmployee(id: string): Promise<void> {
    await apiClient.delete(`/identity/employees/${id}`);
  }
};
