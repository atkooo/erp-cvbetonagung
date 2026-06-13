/** Domain types: Project Management */

export interface Project {
  id: string;
  code: string;
  customerName: string;
  projectName: string;
  location: string;
  projectType: string;
  projectSpec: string;
  contractValue: number;
  deadline: string;
  progress: number; // 0 - 100
  status:
    | 'Survey'
    | 'Penawaran'
    | 'Deal'
    | 'Produksi'
    | 'Pengiriman'
    | 'Pemasangan'
    | 'Selesai'
    | 'Dibatalkan';
  timeline: {
    date: string;
    stage: string;
    description: string;
    icon: string;
  }[];
  termin: {
    phase: string;
    amount: number;
    dueDate: string;
    status: 'Belum Bayar' | 'Lunas';
  }[];
  documentation: {
    id: string;
    title: string;
    imageUrl: string;
    date: string;
  }[];
}
