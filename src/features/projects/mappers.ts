import { Project } from '../../types';
import { ProjectDto } from './types';

export const mapProjectFromDto = (dto: ProjectDto): Project => ({
  id: dto.id,
  code: dto.code,
  customerName: dto.customer?.name || 'Unknown Customer',
  projectName: dto.project_name,
  location: dto.location,
  projectType: dto.project_type,
  projectSpec: dto.project_spec,
  contractValue: Number(dto.contract_value),
  deadline: dto.deadline,
  progress: Number(dto.progress),
  status: mapProjectStatus(dto.status),
  timeline: (dto.timelines || []).map((t) => ({
    date: t.event_date,
    stage: t.stage,
    description: t.description,
    icon: t.icon || 'CheckCircle',
  })),
  termin: (dto.termins || []).map((term) => ({
    phase: term.phase,
    amount: Number(term.amount),
    dueDate: term.due_date,
    status: mapTerminStatus(term.status),
  })),
  documentation: (dto.documents || []).map((doc) => ({
    id: doc.id,
    title: doc.title,
    imageUrl: doc.file_url,
    date: doc.document_date,
  })),
});

const mapProjectStatus = (status: string): Project['status'] => {
  const s = status.toLowerCase();
  if (s === 'survey') return 'Survey';
  if (s === 'penawaran') return 'Penawaran';
  if (s === 'deal') return 'Deal';
  if (s === 'produksi') return 'Produksi';
  if (s === 'pengiriman') return 'Pengiriman';
  if (s === 'pemasangan') return 'Pemasangan';
  if (s === 'selesai') return 'Selesai';
  if (s === 'dibatalkan') return 'Dibatalkan';
  return 'Survey'; // fallback
};

const mapTerminStatus = (status: string): 'Belum Bayar' | 'Lunas' => {
  const s = status.toLowerCase();
  if (s === 'lunas' || s === 'paid') return 'Lunas';
  return 'Belum Bayar';
};
