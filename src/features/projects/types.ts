export interface ProjectTimelineDto {
  id: string;
  project_id: string;
  event_date: string;
  stage: string;
  description: string;
  icon: string | null;
  created_at: string;
}

export interface ProjectDocumentDto {
  id: string;
  project_id: string;
  title: string;
  file_url: string;
  document_date: string;
  created_at: string;
}

export interface ProjectTerminDto {
  id: string;
  project_id: string;
  phase: string;
  amount: number;
  due_date: string;
  status: string; // Belum Bayar, Lunas
  invoice_id: string | null;
  paid_at: string | null;
}

export interface ProjectDto {
  id: string;
  code: string;
  customer_id: string;
  quotation_id: string | null;
  sales_order_id: string | null;
  project_name: string;
  location: string;
  project_type: string;
  project_spec: string;
  contract_value: number;
  deadline: string;
  progress: number;
  status: string; // Survey, Penawaran, Deal, Produksi, Pengiriman, Pemasangan, Selesai, Dibatalkan
  customer?: {
    id: string;
    name: string;
  };
  timelines?: ProjectTimelineDto[];
  documents?: ProjectDocumentDto[];
  termins?: ProjectTerminDto[];
}

export interface CreateProjectTimelineDto {
  project_id: string;
  event_date: string;
  stage: string;
  description: string;
  icon?: string;
}
