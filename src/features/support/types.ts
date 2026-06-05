export interface AuditLogDto {
  id: string;
  user_id: string | null;
  role_id: string | null;
  action: string;
  object_type: string;
  object_id: string | null;
  object_number: string | null;
  summary: string | null;
  ip_address: string | null;
  created_at: string;
  user?: { id: string; name: string };
  role?: { id: string; name: string };
}

export interface ReminderDto {
  id: string;
  type: string;
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  division: string | null;
  schedule_at: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'snoozed' | 'completed';
  assigned_to: string | null;
  created_at?: string;
  updated_at?: string;
  assigned_to_user?: { id: string; name: string };
  assignedTo?: { id: string; name: string };
}

export interface DocumentExportDto {
  id: string;
  document_type: string;
  reference_type: string | null;
  reference_id: string | null;
  document_number: string | null;
  export_format: string;
  division: string | null;
  exported_by: string | null;
  exported_at: string | null;
  exported_by_user?: { id: string; name: string };
  exportedBy?: { id: string; name: string };
}

// React Clean Interfaces
export interface AuditLog {
  id: string;
  action: string;
  objectType: string;
  objectNumber: string;
  summary: string;
  ipAddress: string;
  userName: string;
  roleName: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  type: string;
  referenceType: string;
  referenceNumber: string;
  division: string;
  scheduleAt: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'snoozed' | 'completed';
  assignedToName: string;
  createdAt: string;
}

export interface DocumentExport {
  id: string;
  documentType: string;
  referenceType: string;
  documentNumber: string;
  exportFormat: string;
  division: string;
  exportedByName: string;
  exportedAt: string;
}
