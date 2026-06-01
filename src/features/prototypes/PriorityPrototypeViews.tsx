/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  BellRing,
  Calculator,
  ClipboardCheck,
  FileDown,
  Factory,
  FileClock,
  FileSearch,
  Layers,
  LockKeyhole,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
  UserCog,
  WalletCards,
  Warehouse,
} from 'lucide-react';

interface PrototypeViewProps {
  onTriggerNotification: (message: string) => void;
}

const formatIDR = (num: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Header = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <Panel className="p-5">
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">{icon}</div>
      <div>
        <h3 className="font-sans font-bold text-sm text-slate-800">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
      </div>
    </div>
  </Panel>
);

const StatusPill = ({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'indigo' }) => {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${tones[tone]}`}>
      {children}
    </span>
  );
};

export function RolePermissionView({ onTriggerNotification }: PrototypeViewProps) {
  const roles = [
    { name: 'Owner', users: 2, access: ['Dashboard', 'Finance', 'Approval', 'Audit', 'Settings'], tone: 'indigo' },
    { name: 'Admin', users: 3, access: ['Master Data', 'Inventory', 'Purchase', 'Reports'], tone: 'cyan' },
    { name: 'Sales', users: 5, access: ['Customer', 'Quotation', 'Sales Order', 'Invoice Read'], tone: 'emerald' },
    { name: 'Gudang', users: 4, access: ['Stok', 'Barang Masuk', 'Barang Keluar', 'Stock Opname'], tone: 'amber' },
    { name: 'Finance', users: 2, access: ['Invoice', 'Payment', 'Piutang', 'Approval Payment'], tone: 'rose' },
  ];

  const modules = ['Customer', 'Supplier', 'Produk', 'Inventory', 'Purchase', 'Sales', 'Invoice', 'Payment', 'Produksi', 'Laporan'];

  return (
    <div className="space-y-6 text-xs">
      <Header
        icon={<ShieldCheck size={20} />}
        title="Role & Permission Matrix"
        desc="Prototype tampilan pembagian hak akses per divisi. Belum ada enforcement logic."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {roles.map((role) => (
          <Panel key={role.name} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCog size={16} className="text-slate-500" />
                <h4 className="font-bold text-slate-800">{role.name}</h4>
              </div>
              <StatusPill tone={role.tone as any}>{role.users} user</StatusPill>
            </div>
            <div className="space-y-1.5">
              {role.access.map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <BadgeCheck size={12} className="text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">Modul</th>
              <th className="p-3.5 text-center">Owner</th>
              <th className="p-3.5 text-center">Admin</th>
              <th className="p-3.5 text-center">Sales</th>
              <th className="p-3.5 text-center">Gudang</th>
              <th className="p-3.5 pr-5 text-center">Finance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {modules.map((mod, idx) => (
              <tr key={mod} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-bold text-slate-800">{mod}</td>
                {['Full', idx % 3 === 0 ? 'Edit' : 'Full', idx % 2 === 0 ? 'Read' : '-', idx % 2 === 1 ? 'Edit' : 'Read', idx % 4 === 0 ? 'Full' : 'Read'].map((access, accessIdx) => (
                  <td key={accessIdx} className="p-3.5 text-center">
                    <button
                      onClick={() => onTriggerNotification(`Prototype: hak akses ${mod} disiapkan untuk konfigurasi.`)}
                      className={`px-2 py-1 rounded border text-[10px] font-bold ${
                        access === '-' ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
                      }`}
                    >
                      {access}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function ApprovalWorkflowView({ onTriggerNotification }: PrototypeViewProps) {
  const requests = [
    { id: 'APR-2026-0601', type: 'Koreksi Stok', requester: 'Gudang - Wahyu', doc: 'SKU RST-001', amount: 'Stok 1850 -> 1760', status: 'Menunggu Owner', tone: 'amber' },
    { id: 'APR-2026-0602', type: 'Diskon Quotation', requester: 'Sales - Rina', doc: 'QT-2026-05-011', amount: 'Diskon 12%', status: 'Review Finance', tone: 'cyan' },
    { id: 'APR-2026-0603', type: 'Pembatalan Invoice', requester: 'Finance - Lia', doc: 'INV-2026-05-106', amount: formatIDR(18500000), status: 'Perlu Alasan', tone: 'rose' },
    { id: 'APR-2026-0604', type: 'PO Supplier', requester: 'Admin - Dimas', doc: 'PO-2026-05-014', amount: formatIDR(46000000), status: 'Disetujui', tone: 'emerald' },
  ];

  return (
    <div className="space-y-6 text-xs">
      <Header
        icon={<ClipboardCheck size={20} />}
        title="Approval Workflow Center"
        desc="Daftar simulasi permintaan persetujuan untuk aksi penting ERP."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          ['Menunggu Approval', '8', 'amber'],
          ['Disetujui Bulan Ini', '24', 'emerald'],
          ['Ditolak', '3', 'rose'],
          ['SLA Rata-rata', '1.8 jam', 'cyan'],
        ].map(([label, value, tone]) => (
          <Panel key={label} className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{label}</span>
            <div className="mt-1.5 flex items-center justify-between">
              <strong className="text-lg font-black text-slate-900">{value}</strong>
              <StatusPill tone={tone as any}>Prototype</StatusPill>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">No Approval</th>
              <th className="p-3.5">Jenis Request</th>
              <th className="p-3.5">Pemohon</th>
              <th className="p-3.5">Dokumen</th>
              <th className="p-3.5">Nilai / Perubahan</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 pr-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">{req.id}</td>
                <td className="p-3.5 font-bold text-slate-700">{req.type}</td>
                <td className="p-3.5 text-slate-500">{req.requester}</td>
                <td className="p-3.5 font-mono text-cyan-600">{req.doc}</td>
                <td className="p-3.5 text-slate-700">{req.amount}</td>
                <td className="p-3.5"><StatusPill tone={req.tone as any}>{req.status}</StatusPill></td>
                <td className="p-3.5 pr-5 text-right">
                  <button
                    onClick={() => onTriggerNotification(`Prototype: membuka detail approval ${req.id}`)}
                    className="px-2.5 py-1 border rounded bg-slate-50 hover:bg-white text-[10px] font-bold text-slate-600"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function StockOpnameView({ onTriggerNotification }: PrototypeViewProps) {
  const rows = [
    ['RST-001', 'Roster Beton Motif Kotak', 'Gudang A-03', '1850', '1760', '-90', 'Selisih hitung proyek'],
    ['KBG-006', 'Kubah GRC D 6 Meter', 'Workshop Bay 1', '2', '2', '0', 'Sesuai'],
    ['SMN-050', 'Semen Portland OPC 50Kg', 'Bahan Baku', '420', '397', '-23', 'Sak rusak / menggumpal'],
    ['BWM-M8', 'Besi Wiremesh M8', 'Bahan Baku', '85', '89', '+4', 'Sisa potongan belum dicatat'],
  ];

  return (
    <div className="space-y-6 text-xs">
      <Header
        icon={<PackageCheck size={20} />}
        title="Stock Opname Gudang"
        desc="Prototype form perbandingan stok sistem dan stok fisik sebelum koreksi disetujui."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Sesi Opname</span>
          <h4 className="mt-1 text-base font-black text-slate-900">OPN-2026-06-001</h4>
          <p className="text-[10px] text-slate-400 mt-1">Gudang utama dan bahan baku</p>
        </Panel>
        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Progress Hitung</span>
          <h4 className="mt-1 text-base font-black text-cyan-700">74%</h4>
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full w-[74%] bg-cyan-500" />
          </div>
        </Panel>
        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Butuh Approval</span>
          <h4 className="mt-1 text-base font-black text-amber-600">3 Selisih</h4>
          <p className="text-[10px] text-slate-400 mt-1">Akan masuk ke Approval Workflow</p>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">SKU</th>
              <th className="p-3.5">Nama Barang</th>
              <th className="p-3.5">Lokasi</th>
              <th className="p-3.5 text-center">Stok Sistem</th>
              <th className="p-3.5 text-center">Stok Fisik</th>
              <th className="p-3.5 text-center">Selisih</th>
              <th className="p-3.5">Catatan</th>
              <th className="p-3.5 pr-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([sku, name, loc, sys, phys, diff, note]) => (
              <tr key={sku} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">{sku}</td>
                <td className="p-3.5 font-bold text-slate-700">{name}</td>
                <td className="p-3.5 text-slate-500">{loc}</td>
                <td className="p-3.5 text-center font-mono">{sys}</td>
                <td className="p-3.5 text-center font-mono font-bold">{phys}</td>
                <td className={`p-3.5 text-center font-mono font-black ${diff === '0' ? 'text-emerald-600' : 'text-rose-600'}`}>{diff}</td>
                <td className="p-3.5 text-slate-500">{note}</td>
                <td className="p-3.5 pr-5 text-right">
                  <button
                    onClick={() => onTriggerNotification(`Prototype: koreksi opname ${sku} dikirim ke approval.`)}
                    className="px-2.5 py-1 border rounded bg-slate-50 hover:bg-white text-[10px] font-bold text-slate-600"
                  >
                    Ajukan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function AuditLogView({ onTriggerNotification }: PrototypeViewProps) {
  const logs = [
    ['2026-06-01 09:12', 'Owner', 'APPROVE', 'APR-2026-0604', 'PO supplier disetujui'],
    ['2026-06-01 08:45', 'Gudang', 'UPDATE', 'SKU RST-001', 'Stok 1850 menjadi 1760'],
    ['2026-05-31 16:20', 'Finance', 'VERIFY', 'PAY-2026-05-021', 'Pembayaran invoice diverifikasi'],
    ['2026-05-31 13:05', 'Sales', 'CREATE', 'QT-2026-05-011', 'Quotation proyek kubah dibuat'],
    ['2026-05-30 10:18', 'Admin', 'EXPORT', 'Laporan Inventory', 'Export XLSX stok gudang'],
  ];

  return (
    <div className="space-y-6 text-xs">
      <Header
        icon={<FileSearch size={20} />}
        title="Audit Log Aktivitas Sistem"
        desc="Prototype jejak perubahan data penting: siapa, kapan, aksi, dan objek terdampak."
      />

      <Panel className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileClock size={16} className="text-cyan-600" />
          <span className="font-bold text-slate-700">Filter audit: semua modul, 7 hari terakhir</span>
        </div>
        <button
          onClick={() => onTriggerNotification('Prototype: export audit log ke CSV disiapkan.')}
          className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold"
        >
          Export CSV
        </button>
      </Panel>

      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">Waktu</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Aksi</th>
              <th className="p-3.5">Objek</th>
              <th className="p-3.5 pr-5">Ringkasan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(([time, role, action, object, summary]) => (
              <tr key={`${time}-${object}`} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-mono text-slate-500">{time}</td>
                <td className="p-3.5 font-bold text-slate-700">{role}</td>
                <td className="p-3.5"><StatusPill tone={action === 'UPDATE' ? 'amber' : action === 'APPROVE' ? 'emerald' : 'cyan'}>{action}</StatusPill></td>
                <td className="p-3.5 font-mono text-cyan-600">{object}</td>
                <td className="p-3.5 pr-5 text-slate-600">{summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function ProductionWorkOrderView({ onTriggerNotification }: PrototypeViewProps) {
  const orders = [
    ['WO-2026-0601', 'Kubah GRC D 6 Meter', 'Masjid Baiturrahman', 'Produksi Cetak', '45%', '2026-06-10'],
    ['WO-2026-0602', 'Roster Motif Kotak', 'Stok Gudang', 'Curing', '70%', '2026-06-04'],
    ['WO-2026-0603', 'Lisplang Beton M20', 'SO-2026-05-033', 'Finishing', '85%', '2026-06-03'],
  ];

  return (
    <div className="space-y-6 text-xs">
      <Header
        icon={<Factory size={20} />}
        title="Production / Work Order"
        desc="Prototype antrian produksi beton: cetak, curing, finishing, QC, sampai siap kirim."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {['Draft', 'Cetak', 'Curing', 'Finishing', 'QC'].map((stage, idx) => (
          <Panel key={stage} className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{stage}</span>
            <h4 className="mt-1 text-base font-black text-slate-900">{[2, 5, 4, 3, 1][idx]} WO</h4>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">No WO</th>
              <th className="p-3.5">Produk</th>
              <th className="p-3.5">Sumber Order</th>
              <th className="p-3.5">Tahap</th>
              <th className="p-3.5">Progress</th>
              <th className="p-3.5">Target Selesai</th>
              <th className="p-3.5 pr-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(([wo, product, source, stage, progress, due]) => (
              <tr key={wo} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">{wo}</td>
                <td className="p-3.5 font-bold text-slate-700">{product}</td>
                <td className="p-3.5 text-slate-500">{source}</td>
                <td className="p-3.5"><StatusPill tone="cyan">{stage}</StatusPill></td>
                <td className="p-3.5">
                  <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: progress }} />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 inline-block">{progress}</span>
                </td>
                <td className="p-3.5 font-mono text-slate-500">{due}</td>
                <td className="p-3.5 pr-5 text-right">
                  <button
                    onClick={() => onTriggerNotification(`Prototype: membuka kartu produksi ${wo}`)}
                    className="px-2.5 py-1 border rounded bg-slate-50 hover:bg-white text-[10px] font-bold text-slate-600"
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function BomCostingView({ onTriggerNotification }: PrototypeViewProps) {
  const bomRows = [
    ['Semen Portland OPC 50Kg', '8 sak', 65000, 520000],
    ['Pasir Lumajang', '0.8 m3', 280000, 224000],
    ['Besi Wiremesh M8', '1 lembar', 385000, 385000],
    ['Pigmen / Additive', '2 kg', 45000, 90000],
    ['Tenaga Kerja Cetak', '1 batch', 350000, 350000],
    ['Overhead Workshop', '1 batch', 180000, 180000],
  ];
  const totalCost = bomRows.reduce((sum, row) => sum + Number(row[3]), 0);
  const sellingPrice = 2450000;
  const margin = sellingPrice - totalCost;

  return (
    <div className="space-y-6 text-xs">
      <Header
        icon={<Layers size={20} />}
        title="Bill of Materials & HPP"
        desc="Prototype resep bahan, biaya produksi, harga pokok, dan estimasi margin per produk."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Produk Simulasi</span>
          <h4 className="mt-1 font-black text-slate-900">Roster Beton Motif Kotak</h4>
        </Panel>
        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total HPP</span>
          <h4 className="mt-1 text-base font-black text-rose-600">{formatIDR(totalCost)}</h4>
        </Panel>
        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Harga Jual</span>
          <h4 className="mt-1 text-base font-black text-slate-900">{formatIDR(sellingPrice)}</h4>
        </Panel>
        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Estimasi Margin</span>
          <h4 className="mt-1 text-base font-black text-emerald-600">{formatIDR(margin)}</h4>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">Komponen BOM</th>
              <th className="p-3.5">Kebutuhan</th>
              <th className="p-3.5">Harga Satuan</th>
              <th className="p-3.5 pr-5 text-right">Subtotal HPP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bomRows.map(([name, qty, price, subtotal]) => (
              <tr key={String(name)} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-bold text-slate-700">{name}</td>
                <td className="p-3.5 font-mono text-slate-500">{qty}</td>
                <td className="p-3.5 font-mono text-slate-700">{formatIDR(Number(price))}</td>
                <td className="p-3.5 pr-5 text-right font-mono font-black text-slate-900">{formatIDR(Number(subtotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-600">
          <AlertTriangle size={16} className="text-amber-500" />
          <span>Semua angka masih simulasi UI. Formula HPP aktual belum dihubungkan ke stok, pembelian, atau produksi.</span>
        </div>
        <button
          onClick={() => onTriggerNotification('Prototype: revisi BOM akan masuk approval sebelum memengaruhi HPP.')}
          className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5"
        >
          <LockKeyhole size={13} />
          <span>Ajukan Revisi BOM</span>
        </button>
      </Panel>
    </div>
  );
}

export function ReceivablesPayablesView({ onTriggerNotification }: PrototypeViewProps) {
  const receivables = [
    ['INV-2026-05-106', 'H. Ahmad Syukur', '2026-05-30', formatIDR(18500000), 'Overdue', 'rose'],
    ['INV-2026-05-108', 'Masjid Baiturrahman', '2026-06-15', formatIDR(42000000), 'Belum Lunas', 'amber'],
    ['INV-2026-05-109', 'PT Karya Beton Raya', '2026-06-28', formatIDR(12500000), 'Sebagian', 'cyan'],
  ];
  const payables = [
    ['AP-2026-0601', 'PT Semen Indonesia Group', '2026-06-07', formatIDR(46000000), 'Open', 'amber'],
    ['AP-2026-0602', 'CV Pasir Lumajang', '2026-06-12', formatIDR(12800000), 'Terjadwal', 'cyan'],
    ['AP-2026-0603', 'PT Baja Wiremesh Nusantara', '2026-06-20', formatIDR(28500000), 'Open', 'amber'],
  ];

  const renderTable = (title: string, rows: string[][]) => (
    <Panel className="overflow-hidden">
      <div className="p-4 border-b">
        <h4 className="font-bold text-slate-800">{title}</h4>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
            <th className="p-3.5 pl-5">Dokumen</th>
            <th className="p-3.5">Relasi</th>
            <th className="p-3.5">Jatuh Tempo</th>
            <th className="p-3.5">Nominal</th>
            <th className="p-3.5 pr-5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(([doc, name, due, amount, status, tone]) => (
            <tr key={doc} className="hover:bg-slate-50/50">
              <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">{doc}</td>
              <td className="p-3.5 font-bold text-slate-700">{name}</td>
              <td className="p-3.5 font-mono text-slate-500">{due}</td>
              <td className="p-3.5 font-mono font-black text-slate-900">{amount}</td>
              <td className="p-3.5 pr-5"><StatusPill tone={tone as any}>{status}</StatusPill></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );

  return (
    <div className="space-y-6 text-xs">
      <Header
        icon={<WalletCards size={20} />}
        title="Piutang & Hutang"
        desc="Prototype aging piutang customer dan hutang supplier untuk kontrol cashflow."
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          ['Piutang Overdue', formatIDR(18500000), 'rose'],
          ['Piutang Aktif', formatIDR(54500000), 'cyan'],
          ['Hutang Supplier', formatIDR(87300000), 'amber'],
          ['Net Cash Exposure', formatIDR(-32800000), 'indigo'],
        ].map(([label, value, tone]) => (
          <Panel key={label} className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{label}</span>
            <div className="mt-1.5 flex items-center justify-between">
              <strong className="text-base font-black text-slate-900">{value}</strong>
              <StatusPill tone={tone as any}>Aging</StatusPill>
            </div>
          </Panel>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {renderTable('Aging Piutang Customer', receivables)}
        {renderTable('Aging Hutang Supplier', payables)}
      </div>
      <Panel className="p-4 flex items-center justify-between gap-3">
        <span className="text-slate-600">Reminder tagihan dan jadwal pembayaran masih simulasi tampilan.</span>
        <button onClick={() => onTriggerNotification('Prototype: reminder piutang dikirim ke daftar notifikasi.')} className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold">Buat Reminder</button>
      </Panel>
    </div>
  );
}

export function DeliveryOrdersView({ onTriggerNotification }: PrototypeViewProps) {
  const rows = [
    ['DO-2026-0601', 'SO-2026-05-033', 'Masjid Baiturrahman', 'Kubah GRC D 6 Meter', 'Dikirim', 'amber'],
    ['DO-2026-0602', 'SO-2026-05-035', 'PT Karya Beton Raya', 'Roster 1.500 pcs', 'Diterima', 'emerald'],
    ['DO-2026-0603', 'SO-2026-05-036', 'H. Ahmad Syukur', 'Lisplang M20 80 m', 'Siap Muat', 'cyan'],
  ];

  return (
    <div className="space-y-6 text-xs">
      <Header icon={<Truck size={20} />} title="Delivery Order / Surat Jalan" desc="Prototype dokumen pengiriman, status barang, dan bukti penerimaan customer." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {['Siap Muat', 'Dalam Pengiriman', 'Sudah Diterima'].map((label, idx) => (
          <Panel key={label} className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{label}</span>
            <h4 className="mt-1 text-base font-black text-slate-900">{[4, 2, 9][idx]} Surat Jalan</h4>
          </Panel>
        ))}
      </div>
      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">No DO</th>
              <th className="p-3.5">Sales Order</th>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Muatan</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 pr-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([doc, so, customer, load, status, tone]) => (
              <tr key={doc} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">{doc}</td>
                <td className="p-3.5 font-mono text-slate-600">{so}</td>
                <td className="p-3.5 font-bold text-slate-700">{customer}</td>
                <td className="p-3.5 text-slate-600">{load}</td>
                <td className="p-3.5"><StatusPill tone={tone as any}>{status}</StatusPill></td>
                <td className="p-3.5 pr-5 text-right">
                  <button onClick={() => onTriggerNotification(`Prototype: cetak surat jalan ${doc}.`)} className="px-2.5 py-1 border rounded bg-slate-50 text-[10px] font-bold text-slate-600">Cetak</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function ReturnsView({ onTriggerNotification }: PrototypeViewProps) {
  const rows = [
    ['RET-2026-0601', 'Customer', 'Roster retak saat diterima', '12 pcs', 'Menunggu QC', 'amber'],
    ['RET-2026-0602', 'Supplier', 'Semen menggumpal', '23 sak', 'Klaim Supplier', 'rose'],
    ['RET-2026-0603', 'Customer', 'Warna ornamen tidak sesuai', '4 pcs', 'Disetujui', 'emerald'],
  ];

  return (
    <div className="space-y-6 text-xs">
      <Header icon={<RotateCcw size={20} />} title="Retur Barang" desc="Prototype retur customer dan retur ke supplier lengkap dengan alasan dan status QC." />
      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">No Retur</th>
              <th className="p-3.5">Jenis</th>
              <th className="p-3.5">Alasan</th>
              <th className="p-3.5">Qty</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 pr-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([id, type, reason, qty, status, tone]) => (
              <tr key={id} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">{id}</td>
                <td className="p-3.5 font-bold text-slate-700">{type}</td>
                <td className="p-3.5 text-slate-600">{reason}</td>
                <td className="p-3.5 font-mono text-slate-700">{qty}</td>
                <td className="p-3.5"><StatusPill tone={tone as any}>{status}</StatusPill></td>
                <td className="p-3.5 pr-5 text-right">
                  <button onClick={() => onTriggerNotification(`Prototype: membuka QC retur ${id}.`)} className="px-2.5 py-1 border rounded bg-slate-50 text-[10px] font-bold text-slate-600">QC</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function MultiWarehouseView({ onTriggerNotification }: PrototypeViewProps) {
  const rows = [
    ['Gudang Utama', 'Roster Beton Motif Kotak', '1.850 pcs', 'A-03'],
    ['Workshop Bay 1', 'Kubah GRC D 6 Meter', '2 set', 'Bay-01'],
    ['Gudang Bahan Baku', 'Semen Portland OPC', '420 sak', 'BB-02'],
    ['Lokasi Proyek', 'Lisplang Beton M20', '80 m', 'Masjid Baiturrahman'],
  ];

  return (
    <div className="space-y-6 text-xs">
      <Header icon={<Warehouse size={20} />} title="Multi Warehouse / Lokasi Stok" desc="Prototype pemetaan stok per gudang, workshop, rak, dan lokasi proyek." />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {['Gudang Utama', 'Workshop', 'Bahan Baku', 'Lokasi Proyek'].map((label, idx) => (
          <Panel key={label} className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{label}</span>
            <h4 className="mt-1 text-base font-black text-slate-900">{[128, 18, 42, 7][idx]} SKU</h4>
          </Panel>
        ))}
      </div>
      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">Lokasi</th>
              <th className="p-3.5">Barang</th>
              <th className="p-3.5">Saldo</th>
              <th className="p-3.5">Rak / Titik</th>
              <th className="p-3.5 pr-5 text-right">Transfer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([loc, item, qty, rack]) => (
              <tr key={`${loc}-${item}`} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-bold text-slate-700">{loc}</td>
                <td className="p-3.5 text-slate-600">{item}</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">{qty}</td>
                <td className="p-3.5 font-mono text-cyan-600">{rack}</td>
                <td className="p-3.5 pr-5 text-right">
                  <button onClick={() => onTriggerNotification(`Prototype: form transfer lokasi ${item} dibuka.`)} className="px-2.5 py-1 border rounded bg-slate-50 text-[10px] font-bold text-slate-600">Transfer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function ProjectBudgetingView({ onTriggerNotification }: PrototypeViewProps) {
  const rows = [
    ['Material GRC', formatIDR(38000000), formatIDR(41200000), '+8.4%', 'amber'],
    ['Tenaga Kerja', formatIDR(24000000), formatIDR(22100000), '-7.9%', 'emerald'],
    ['Transport & Crane', formatIDR(12500000), formatIDR(13800000), '+10.4%', 'rose'],
    ['Overhead Proyek', formatIDR(9000000), formatIDR(8500000), '-5.6%', 'emerald'],
  ];

  return (
    <div className="space-y-6 text-xs">
      <Header icon={<Calculator size={20} />} title="Project Budgeting" desc="Prototype estimasi vs realisasi biaya proyek kubah dan pekerjaan custom." />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          ['Nilai Kontrak', formatIDR(185000000), 'indigo'],
          ['Budget Biaya', formatIDR(83500000), 'cyan'],
          ['Realisasi', formatIDR(85600000), 'amber'],
          ['Margin Proyeksi', formatIDR(99400000), 'emerald'],
        ].map(([label, value, tone]) => (
          <Panel key={label} className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{label}</span>
            <div className="mt-1.5 flex items-center justify-between">
              <strong className="text-base font-black text-slate-900">{value}</strong>
              <StatusPill tone={tone as any}>Proyek</StatusPill>
            </div>
          </Panel>
        ))}
      </div>
      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">Komponen</th>
              <th className="p-3.5">Budget</th>
              <th className="p-3.5">Realisasi</th>
              <th className="p-3.5 pr-5">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([name, budget, actual, variance, tone]) => (
              <tr key={name} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-bold text-slate-700">{name}</td>
                <td className="p-3.5 font-mono text-slate-700">{budget}</td>
                <td className="p-3.5 font-mono font-bold text-slate-900">{actual}</td>
                <td className="p-3.5 pr-5"><StatusPill tone={tone as any}>{variance}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function RemindersView({ onTriggerNotification }: PrototypeViewProps) {
  const rows = [
    ['Invoice overdue', 'INV-2026-05-106', 'Finance', 'Hari ini 15:00', 'Tinggi', 'rose'],
    ['Stok minimum', 'Lisplang M20', 'Gudang', 'Besok 08:00', 'Sedang', 'amber'],
    ['PO belum diterima', 'PO-2026-05-014', 'Purchasing', '2026-06-03', 'Sedang', 'amber'],
    ['Deadline proyek', 'Kubah Baiturrahman', 'Produksi', '2026-06-05', 'Tinggi', 'rose'],
  ];

  return (
    <div className="space-y-6 text-xs">
      <Header icon={<BellRing size={20} />} title="Notifikasi & Reminder" desc="Prototype pusat pengingat untuk stok, invoice, PO, dan deadline proyek." />
      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">Jenis</th>
              <th className="p-3.5">Objek</th>
              <th className="p-3.5">Divisi</th>
              <th className="p-3.5">Jadwal</th>
              <th className="p-3.5">Prioritas</th>
              <th className="p-3.5 pr-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([type, object, division, schedule, priority, tone]) => (
              <tr key={`${type}-${object}`} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-bold text-slate-700">{type}</td>
                <td className="p-3.5 font-mono text-cyan-600">{object}</td>
                <td className="p-3.5 text-slate-600">{division}</td>
                <td className="p-3.5 font-mono text-slate-500">{schedule}</td>
                <td className="p-3.5"><StatusPill tone={tone as any}>{priority}</StatusPill></td>
                <td className="p-3.5 pr-5 text-right">
                  <button onClick={() => onTriggerNotification(`Prototype: reminder ${object} ditandai selesai.`)} className="px-2.5 py-1 border rounded bg-slate-50 text-[10px] font-bold text-slate-600">Selesai</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export function DocumentExportsView({ onTriggerNotification }: PrototypeViewProps) {
  const docs = [
    ['Quotation', 'QT-2026-05-011', 'PDF / Print', 'Sales'],
    ['Sales Order', 'SO-2026-05-033', 'PDF', 'Sales'],
    ['Invoice', 'INV-2026-05-106', 'PDF / Email', 'Finance'],
    ['Surat Jalan', 'DO-2026-0601', 'PDF / Print', 'Gudang'],
    ['Purchase Order', 'PO-2026-05-014', 'PDF', 'Purchasing'],
    ['Laporan Stok', 'STOCK-2026-06', 'XLSX', 'Admin'],
  ];

  return (
    <div className="space-y-6 text-xs">
      <Header icon={<FileDown size={20} />} title="Export / Print Dokumen" desc="Prototype pusat cetak dan export dokumen ERP ke PDF, XLSX, atau email." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['PDF siap cetak', 'Export spreadsheet', 'Template kop surat'].map((label, idx) => (
          <Panel key={label} className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{label}</span>
            <h4 className="mt-1 text-base font-black text-slate-900">{[18, 6, 4][idx]} Template</h4>
          </Panel>
        ))}
      </div>
      <Panel className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
              <th className="p-3.5 pl-5">Dokumen</th>
              <th className="p-3.5">Nomor</th>
              <th className="p-3.5">Format</th>
              <th className="p-3.5">Divisi</th>
              <th className="p-3.5 pr-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docs.map(([type, number, format, division]) => (
              <tr key={number} className="hover:bg-slate-50/50">
                <td className="p-3.5 pl-5 font-bold text-slate-700">{type}</td>
                <td className="p-3.5 font-mono text-cyan-600">{number}</td>
                <td className="p-3.5 text-slate-600">{format}</td>
                <td className="p-3.5 text-slate-500">{division}</td>
                <td className="p-3.5 pr-5 text-right">
                  <button onClick={() => onTriggerNotification(`Prototype: export ${type} ${number}.`)} className="px-2.5 py-1 border rounded bg-slate-50 text-[10px] font-bold text-slate-600">Export</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
