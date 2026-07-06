import { apiClient } from '../../services/api';
import { Attendance, AttendanceDto, Leave, LeaveDto, LeaveType, LeaveTypeDto } from './types';
import { mapAttendanceFromDto, mapLeaveFromDto, mapLeaveToCreateDto, mapLeaveTypeFromDto } from './mappers';

export const hrdApi = {
  // Attendances
  async getAttendances(params?: Record<string, any>): Promise<Attendance[]> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get<{ data: AttendanceDto[] }>(`/hrd/attendances${qs}`);
    return response.data.map(mapAttendanceFromDto);
  },

  // Leaves
  async getLeaves(params?: Record<string, any>): Promise<Leave[]> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get<{ data: LeaveDto[] }>(`/hrd/leaves${qs}`);
    return response.data.map(mapLeaveFromDto);
  },

  async createLeave(data: Partial<Leave>): Promise<Leave> {
    const payload = mapLeaveToCreateDto(data);
    const response = await apiClient.post<{ data: LeaveDto }>('/hrd/leaves', payload);
    return mapLeaveFromDto(response.data);
  },

  async updateLeaveStatus(id: string, status: 'approved' | 'rejected' | 'cancelled'): Promise<Leave> {
    const response = await apiClient.put<{ data: LeaveDto }>(`/hrd/leaves/${id}`, { status });
    return mapLeaveFromDto(response.data);
  },

  // Leave Types
  async getLeaveTypes(): Promise<LeaveType[]> {
    const response = await apiClient.get<{ data: LeaveTypeDto[] }>('/hrd/leave-types');
    return response.data.map(mapLeaveTypeFromDto);
  },

  async createLeaveType(data: Partial<LeaveType>): Promise<LeaveType> {
    const payload = {
      code: data.code,
      name: data.name,
      is_paid: data.isPaid,
      max_days: data.maxDays
    };
    const response = await apiClient.post<{ data: LeaveTypeDto }>('/hrd/leave-types', payload);
    return mapLeaveTypeFromDto(response.data);
  },

  async updateLeaveType(id: string, data: Partial<LeaveType>): Promise<LeaveType> {
    const payload = {
      code: data.code,
      name: data.name,
      is_paid: data.isPaid,
      max_days: data.maxDays
    };
    const response = await apiClient.put<{ data: LeaveTypeDto }>(`/hrd/leave-types/${id}`, payload);
    return mapLeaveTypeFromDto(response.data);
  },

  async deleteLeaveType(id: string): Promise<void> {
    await apiClient.delete(`/hrd/leave-types/${id}`);
  }
};
