/** Domain types: Employee / HRD */

export interface Employee {
  id: string;
  userId?: string | null;
  employeeNumber: string;
  name: string;
  roleName: string;
  department: string;
  phone: string;
  address: string;
  joinDate: string;
  employeeType: 'Tetap' | 'Kontrak' | 'Borongan' | 'Harian';
  dailyRate: number;
  pieceRate: number;
  status: 'Aktif' | 'Nonaktif';

  // HRD extended fields
  gender?: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  religion?: string;
  bloodType?: string;
  idCardNumber?: string;
  taxIdNumber?: string;
  bankName?: string;
  bankAccount?: string;
}
