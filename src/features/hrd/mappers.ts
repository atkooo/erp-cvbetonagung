import { Attendance, AttendanceDto, Leave, LeaveDto, LeaveType, LeaveTypeDto } from './types';

export const mapAttendanceFromDto = (dto: AttendanceDto): Attendance => ({
  id: dto.id,
  employeeId: dto.employee_id,
  employeeName: dto.employee?.name || 'Unknown',
  date: dto.date,
  clockIn: dto.clock_in,
  clockOut: dto.clock_out,
  status: dto.status,
  lateMinutes: dto.late_minutes,
  notes: dto.notes,
});

export const mapLeaveTypeFromDto = (dto: LeaveTypeDto): LeaveType => ({
  id: dto.id,
  code: dto.code,
  name: dto.name,
  isPaid: dto.is_paid,
  maxDays: dto.max_days,
});

export const mapLeaveFromDto = (dto: LeaveDto): Leave => ({
  id: dto.id,
  employeeId: dto.employee_id,
  employeeName: dto.employee?.name || 'Unknown',
  leaveTypeId: dto.leave_type_id,
  leaveTypeName: dto.leaveType?.name || 'Unknown',
  startDate: dto.start_date,
  endDate: dto.end_date,
  reason: dto.reason,
  status: dto.status,
  approvedBy: dto.approved_by,
});

export const mapLeaveToCreateDto = (data: Partial<Leave>): Partial<LeaveDto> => ({
  employee_id: data.employeeId,
  leave_type_id: data.leaveTypeId,
  start_date: data.startDate,
  end_date: data.endDate,
  reason: data.reason,
  status: data.status,
});
