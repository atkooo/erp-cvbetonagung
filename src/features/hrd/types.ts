export interface AttendanceDto {
  id: string;
  employee_id: string;
  employee?: {
    id: string;
    name: string;
    employee_number: string;
  };
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: 'present' | 'late' | 'absent' | 'leave';
  late_minutes: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: 'present' | 'late' | 'absent' | 'leave';
  lateMinutes: number;
  notes: string | null;
}

export interface LeaveTypeDto {
  id: string;
  code: string;
  name: string;
  is_paid: boolean;
  max_days: number | null;
}

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  isPaid: boolean;
  maxDays: number | null;
}

export interface LeaveDto {
  id: string;
  employee_id: string;
  employee?: {
    id: string;
    name: string;
  };
  leave_type_id: string;
  leaveType?: {
    id: string;
    name: string;
  };
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: string | null;
  created_at?: string;
}

export interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy: string | null;
}
