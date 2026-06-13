import { apiClient } from '../../services/api';
import { formatDateTime, formatDateTimeShort } from '../../utils/date';
import {
  AuditLogDto, ReminderDto, DocumentExportDto,
  AuditLog, Reminder, DocumentExport
} from './types';

export const mapAuditLogFromDto = (dto: AuditLogDto): AuditLog => ({
  id: dto.id,
  action: dto.action,
  objectType: dto.object_type,
  objectNumber: dto.object_number || '-',
  summary: dto.summary || '',
  ipAddress: dto.ip_address || '-',
  userName: dto.user?.name || 'Sistem',
  roleName: dto.role?.name || '-',
  createdAt: formatDateTime(dto.created_at),
});

export const mapReminderFromDto = (dto: ReminderDto): Reminder => ({
  id: dto.id,
  type: dto.type,
  referenceType: dto.reference_type || '-',
  referenceNumber: dto.reference_number || '-',
  division: dto.division || '-',
  scheduleAt: formatDateTimeShort(dto.schedule_at),
  priority: dto.priority,
  status: dto.status,
  assignedToName: dto.assignedTo?.name || dto.assigned_to_user?.name || 'Sistem',
  createdAt: formatDateTimeShort(dto.created_at),
});

export const mapDocumentExportFromDto = (dto: DocumentExportDto): DocumentExport => ({
  id: dto.id,
  documentType: dto.document_type,
  referenceType: dto.reference_type || '-',
  documentNumber: dto.document_number || '-',
  exportFormat: dto.export_format.toUpperCase(),
  division: dto.division || '-',
  exportedByName: dto.exportedBy?.name || dto.exported_by_user?.name || 'Sistem',
  exportedAt: formatDateTimeShort(dto.exported_at),
});

export const supportApi = {
  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const response = await apiClient.get<{ data: AuditLogDto[] }>('/support/audit-logs?include=user,role&sort=-created_at');
    return response.data.map(mapAuditLogFromDto);
  },

  // Reminders
  async getReminders(): Promise<Reminder[]> {
    const response = await apiClient.get<{ data: ReminderDto[] }>('/support/reminders?include=assignedTo&sort=-schedule_at');
    return response.data.map(mapReminderFromDto);
  },

  async updateReminderStatus(id: string, status: 'open' | 'snoozed' | 'completed'): Promise<Reminder> {
    const response = await apiClient.put<{ data: ReminderDto }>(`/support/reminders/${id}`, {
      status
    });
    return mapReminderFromDto(response.data);
  },

  // Document Exports
  async getDocumentExports(): Promise<DocumentExport[]> {
    const response = await apiClient.get<{ data: DocumentExportDto[] }>('/support/document-exports?include=exportedBy&sort=-exported_at');
    return response.data.map(mapDocumentExportFromDto);
  },

  async createDocumentExport(data: {
    document_type: string;
    reference_type?: string;
    reference_id?: string;
    document_number?: string;
    export_format: string;
    division?: string;
  }): Promise<DocumentExport> {
    const response = await apiClient.post<{ data: DocumentExportDto }>('/support/document-exports', {
      ...data,
      exported_at: new Date().toISOString()
    });
    return mapDocumentExportFromDto(response.data);
  }
};
