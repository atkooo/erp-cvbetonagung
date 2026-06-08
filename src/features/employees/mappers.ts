import { EmployeeDto, CreateEmployeeDto } from './types';
import { Employee } from '../../types';

export const mapEmployeeFromDto = (dto: EmployeeDto): Employee => {
  const typeMap: Record<EmployeeDto['employee_type'], Employee['employeeType']> = {
    permanent: 'Tetap',
    contract: 'Kontrak',
    daily: 'Harian',
    borongan: 'Borongan',
  };

  const statusMap: Record<EmployeeDto['status'], Employee['status']> = {
    active: 'Aktif',
    inactive: 'Nonaktif',
  };

  return {
    id: dto.id,
    userId: dto.user_id,
    employeeNumber: dto.employee_number,
    name: dto.name,
    roleName: dto.role_name,
    department: dto.department,
    phone: dto.phone || '',
    address: dto.address || '',
    joinDate: dto.join_date ? dto.join_date.split('T')[0] : '',
    employeeType: typeMap[dto.employee_type] || 'Harian',
    dailyRate: Number(dto.daily_rate || 0),
    pieceRate: Number(dto.piece_rate || 0),
    status: statusMap[dto.status] || 'Aktif',
  };
};

export const mapEmployeeToCreateDto = (employee: Omit<Employee, 'id'>): CreateEmployeeDto => {
  const typeMapInv: Record<Employee['employeeType'], EmployeeDto['employee_type']> = {
    'Tetap': 'permanent',
    'Kontrak': 'contract',
    'Harian': 'daily',
    'Borongan': 'borongan',
  };

  const statusMapInv: Record<Employee['status'], EmployeeDto['status']> = {
    'Aktif': 'active',
    'Nonaktif': 'inactive',
  };

  return {
    employee_number: employee.employeeNumber,
    name: employee.name,
    role_name: employee.roleName,
    department: employee.department,
    phone: employee.phone || null,
    address: employee.address || null,
    join_date: employee.joinDate || null,
    employee_type: typeMapInv[employee.employeeType] || 'daily',
    daily_rate: employee.dailyRate,
    piece_rate: employee.pieceRate,
    status: statusMapInv[employee.status] || 'active',
  };
};
