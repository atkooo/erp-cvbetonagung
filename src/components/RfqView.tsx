import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, Printer, X, FileText, ChevronDown, ChevronRight, Building2, Trash2 } from '@/src/components/icons';
import { Rfq, Supplier } from '../types';
import { suppliersApi } from '../features/suppliers/api';
import { purchasingApi } from '../features/purchasing/api';
import PurchaseRequestPicker from './PurchaseRequestPicker';
import ProductPicker from './ProductPicker';
import { useReactToPrint } from 'react-to-print';
import { formatDate } from '../utils/date';

interface RfqViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function RfqView({ onTriggerNotification }: RfqViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRfqId, setExpandedRfqId] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'RFQ_CV_Beton_Agung'
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatingPoRfqId, setCreatingPoRfqId] = useState<string | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [prId, setPrId] = useState<string>('');
  const [prNumberDisplay, setPrNumberDisplay] = useState<string>('');
  const [rfqDate, setRfqDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  
  const [formItems, setFormItems] = useState<{ id: string; productId: string; quantity: number; quotedUnitPrice: number; unit?: string }[]>([
    { id: '1', productId: '', quantity: 1, quotedUnitPrice: 0 }
  ]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sups, rfqData] = await Promise.all([
        suppliersApi.getSuppliers(),
        purchasingApi.getRfqs()
      ]);
      setSuppliers(sups);
      if (sups.length > 0) setSupplierId(sups[0].id);
      setRfqs(rfqData);
    } catch (err) {
      console.error(err);
      onTriggerNotification('Gagal memuat data RFQ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = () => {
    setFormItems([...formItems, { id: `form-item-${Date.now()}`, productId: '', quantity: 1, quotedUnitPrice: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setFormItems(formItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.some(item => !item.productId || item.quantity <= 0)) {
      onTriggerNotification('Pilih produk dan pastikan kuantitas lebih dari 0');
      return;
    }

    if (!supplierId || !rfqDate || !validUntil || !prId) {
      alert('Harap isi semua field wajib termasuk Referensi PR.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        purchase_request_id: prId || undefined,
        supplier_id: supplierId,
        rfq_date: rfqDate,
        valid_until: validUntil,
        status: 'Dikirim',
        items: formItems.map(it => ({
          product_id: it.productId,
          quantity: it.quantity,
          quoted_unit_price: it.quotedUnitPrice,
          subtotal: it.quantity * it.quotedUnitPrice
        }))
      };

      await purchasingApi.createRfq(payload);
      onTriggerNotification('RFQ berhasil dikirim ke Vendor');
      setShowAddModal(false);
      
      // Reset form
      setFormItems([{ id: `form-item-${Date.now()}`, productId: '', quantity: 1, quotedUnitPrice: 0 }]);
      setPrId('');
      setPrNumberDisplay('');
      
      await loadData();
    } catch (err) {
      console.error(err);
      onTriggerNotification('Gagal menyimpan RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePo = async (rfq: any) => {
    if (creatingPoRfqId) {
      return;
    }

    setCreatingPoRfqId(rfq.id);
    try {
      const d = new Date();
      const todayStr = d.toISOString().split('T')[0];
      const expectedDate = new Date(d);
      expectedDate.setDate(d.getDate() + 7); // assume 7 days

      await purchasingApi.createPurchaseOrder({
        supplier_id: rfq.supplierId,
        order_date: todayStr,
        expected_date: expectedDate.toISOString().split('T')[0],
        rfq_id: rfq.id,
        purchase_request_id: rfq.purchaseRequestId !== '-' ? rfq.purchaseRequestId : undefined,
        items: rfq.items.map((it: any) => ({
          product_id: it.productId,
          quantity: it.quantity,
          unit_price: it.quotedUnitPrice,
          description: it.productName
        }))
      });
      onTriggerNotification(`Tawaran dari ${rfq.rfqNumber} disetujui, PO berstatus Draft berhasil digenerate!`);
      // Update RFQ status to Selesai
      await purchasingApi.updateRfqStatus(rfq.id, 'Selesai');
      await loadData();
    } catch (err) {
      console.error(err);
      onTriggerNotification(err instanceof Error ? err.message : `Gagal membuat PO dari tawaran ${rfq.rfqNumber}`);
    } finally {
      setCreatingPoRfqId(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await purchasingApi.updateRfqStatus(id, status);
      onTriggerNotification(`Status tawaran berhasil diubah menjadi ${status}`);
      await loadData();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal mengubah status RFQ');
    }
  };

  const filteredRfqs = rfqs.filter((r) => {
    const matchesSearch = r.rfqNumber.toLowerCase().includes(search.toLowerCase()) || r.supplierName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  return (
    <>
    <div className="print:hidden space-y-6 font-sans text-xs">
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Request For Quotation (RFQ)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Penawaran harga dari supplier untuk pengadaan barang</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold shadow hover:bg-slate-800 flex items-center gap-1.5">
          <Plus size={16} /><span>Kirim RFQ Baru</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari No RFQ atau Supplier..." className="w-full pl-9 pr-4 py-2 border rounded-lg" />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border">
          <Filter size={13} className="text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent py-1 outline-none text-slate-600">
            <option value="All">Semua RFQ</option>
            <option value="Dikirim">Dikirim</option>
            <option value="Diterima">Diterima (Ada Balasan)</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Memuat data RFQ...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                  <th className="p-3.5 pl-5">No RFQ</th>
                  <th className="p-3.5">Vendor / Supplier</th>
                  <th className="p-3.5">Referensi PR</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right pr-5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRfqs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">Belum ada data RFQ.</td>
                  </tr>
                ) : (
                  filteredRfqs.map((rfq) => {
                    const isExpanded = expandedRfqId === rfq.id;
                    return (
                      <React.Fragment key={rfq.id}>
                        <tr className="hover:bg-slate-50/40">
                          <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">
                            <button onClick={() => setExpandedRfqId(isExpanded ? null : rfq.id)} className="flex items-center gap-1.5 focus:outline-none text-left">
                              {isExpanded ? <ChevronDown size={14} className="text-cyan-500" /> : <ChevronRight size={14} className="text-slate-400" />} <span>{rfq.rfqNumber}</span>
                            </button>
                          </td>
                          <td className="p-3.5 font-bold flex items-center gap-1.5 text-slate-700"><Building2 size={14} className="text-slate-400"/> {rfq.supplierName}</td>
                          <td className="p-3.5 font-mono text-cyan-600">{rfq.purchaseRequestId !== '-' ? rfq.purchaseRequestId : '-'}</td>
                          <td className="p-3.5 font-mono text-slate-500">{formatDate(rfq.rfqDate)}</td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${rfq.status === 'Diterima' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>{rfq.status}</span>
                          </td>
                          <td className="p-3.5 text-right pr-5 whitespace-nowrap">
                            {rfq.status === 'Dikirim' && (
                              <>
                                <button onClick={() => handleUpdateStatus(rfq.id, 'Diterima')} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded mr-1.5 text-[10px] font-bold shadow-sm">Terima</button>
                                <button onClick={() => handleUpdateStatus(rfq.id, 'Ditolak')} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded mr-2 text-[10px] font-bold shadow-sm">Tolak</button>
                              </>
                            )}

                            <button onClick={() => {
                              if (expandedRfqId !== rfq.id) {
                                setExpandedRfqId(rfq.id);
                              }
                              onTriggerNotification(`Menyiapkan dokumen ${rfq.rfqNumber} untuk dicetak...`);
                              setTimeout(() => handlePrintAction(), 300);
                            }} className="p-1 px-2 border rounded bg-slate-50 hover:bg-slate-100 hover:border-slate-200 text-xs text-slate-650">Cetak</button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={6} className="p-4 pl-12">
                              <div className="space-y-2 max-w-lg">
                                <div className="font-bold text-[10px] text-slate-400 mb-2">PENAWARAN HARGA ITEM</div>
                                {rfq.items.map(it => (
                                  <div key={it.id} className="p-2.5 border bg-white rounded flex justify-between items-center">
                                    <div>
                                      <span className="font-bold block">{it.productName}</span>
                                      <span className="text-[10px] text-slate-500">{it.quantity} {it.unit || 'Unit'} x {formatIDR(it.quotedUnitPrice)}</span>
                                    </div>
                                    <span className="font-mono text-slate-800 font-bold">{formatIDR(it.subtotal)}</span>
                                  </div>
                                ))}
                                <div className="mt-3 pt-2 border-t flex justify-between font-bold text-sm">
                                  <span>Total Estimasi</span>
                                  <span>{formatIDR(rfq.items.reduce((acc, curr) => acc + curr.subtotal, 0))}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Kirim Permintaan Kuotasi (RFQ) Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            
            <div className="overflow-y-auto p-5">
              <form id="rfq-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pilih Supplier / Vendor *</label>
                      <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all" required>
                        <option value="">Pilih Supplier...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Referensi PR *</label>
                      <PurchaseRequestPicker 
                        value={prNumberDisplay}
                        onChange={(pr) => {
                          setPrId(pr.id);
                          setPrNumberDisplay(pr.prNumber);
                          if (pr.items && pr.items.length > 0) {
                            setFormItems(pr.items.map((item, index) => ({
                              id: `form-item-${Date.now()}-${index}`,
                              productId: item.productId,
                              quantity: item.quantity,
                              quotedUnitPrice: 0,
                              unit: item.unit
                            })));
                          }
                        }}
                        statusFilter="Disetujui"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal RFQ *</label>
                      <input type="date" value={rfqDate} onChange={e => setRfqDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Berlaku Sampai *</label>
                      <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" required />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800">Daftar Material (Request Harga)</h4>
                    <button type="button" onClick={handleAddItem} className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border rounded-lg font-bold flex items-center gap-1 transition-colors">
                      <Plus size={14} /> Tambah Baris
                    </button>
                  </div>

                  <div className="bg-slate-50 border rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 border-b">
                        <tr>
                          <th className="p-3 w-1/2">Material / Produk</th>
                          <th className="p-3 w-1/5">Qty</th>
                          <th className="p-3 w-1/4">Target Harga (Satuan)</th>
                          <th className="p-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {formItems.map((item, idx) => (
                          <tr key={item.id} className="bg-white">
                            <td className="p-2">
                              <ProductPicker
                                value={item.productId}
                                onChange={(prod) => {
                                  handleItemChange(item.id, 'productId', prod.id);
                                  handleItemChange(item.id, 'unit', prod.unit);
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number" 
                                  min="1" 
                                  className="w-full p-2 border rounded outline-none focus:border-cyan-500"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                  required
                                />
                                <span className="text-[10px] text-slate-500 font-bold uppercase w-8">
                                  {item.unit || '-'}
                                </span>
                              </div>
                            </td>
                            <td className="p-2">
                              <input 
                                type="number" 
                                min="0" 
                                className="w-full p-2 border rounded outline-none focus:border-cyan-500"
                                value={item.quotedUnitPrice}
                                onChange={(e) => handleItemChange(item.id, 'quotedUnitPrice', parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={formItems.length === 1}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3 mt-auto">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 border rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors">Batal</button>
              <button 
                type="submit" 
                form="rfq-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-bold shadow-md hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSubmitting ? 'Menyimpan...' : 'Kirim RFQ'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>

    {/* PRINT TEMPLATE (Hidden by default, used by react-to-print) */}
    <div style={{ display: 'none' }}>
      <div ref={printRef} className="bg-white text-black p-8 font-sans w-[800px] mx-auto print:block">
        {(() => {
          const rfq = rfqs.find(p => p.id === expandedRfqId);
          if (!rfq) return <div className="p-8 text-center text-gray-500">Pilih RFQ untuk dicetak</div>;
          return (
            <div className="print-container">
              <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-widest text-black">CV BETON AGUNG</h1>
                  <p className="text-xs text-black font-medium mt-1">General Contractor & Supplier Material Alam</p>
                  <p className="text-[10px] text-gray-700 mt-0.5">Jl. Raya Puspiptek No. 88, Tangerang Selatan</p>
                  <p className="text-[10px] text-gray-700">Telp: (021) 123-4567 | Email: info@cvbetonagung.com</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black uppercase tracking-widest border-b border-black pb-1 mb-1">Request For Quotation</h2>
                  <p className="font-mono text-sm font-bold">{rfq.rfqNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
                <div>
                  <table className="w-full">
                    <tbody>
                      <tr><td className="py-1 w-32 font-bold">Kepada Vendor</td><td className="py-1 font-bold">: {rfq.supplierName}</td></tr>
                      <tr><td className="py-1 font-bold">Ref PR</td><td className="py-1 font-mono">: {rfq.purchaseRequestId !== '-' ? rfq.purchaseRequestId : 'Tanpa Referensi'}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <table className="w-full">
                    <tbody>
                      <tr><td className="py-1 w-32 font-bold">Tanggal Terbit</td><td className="py-1">: {formatDate(rfq.rfqDate)}</td></tr>
                      <tr><td className="py-1 font-bold">Berlaku Sampai</td><td className="py-1">: {formatDate(rfq.validUntil)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-4 text-xs">
                <p>Bersama surat ini, kami memohon agar pihak Vendor dapat memberikan penawaran harga terbaik untuk daftar kebutuhan material berikut:</p>
              </div>

              <table className="w-full text-left border-collapse border border-black text-xs mb-4">
                <thead>
                  <tr className="border-b border-black bg-gray-100">
                    <th className="p-3 border-r border-black w-12 text-center font-bold">No</th>
                    <th className="p-3 border-r border-black font-bold">Deskripsi Material / Produk</th>
                    <th className="p-3 border-r border-black w-28 text-center font-bold">Kuantitas</th>
                    <th className="p-3 border-r border-black w-36 text-right font-bold">Target Harga Satuan</th>
                    <th className="p-3 w-40 text-right font-bold">Subtotal Estimasi</th>
                  </tr>
                </thead>
                <tbody>
                  {rfq.items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-black">
                      <td className="p-3 border-r border-black text-center">{idx + 1}</td>
                      <td className="p-3 border-r border-black font-medium">{item.productName}</td>
                      <td className="p-3 border-r border-black text-center">{item.quantity} {item.unit || 'Unit'}</td>
                      <td className="p-3 border-r border-black text-right font-mono text-gray-700">{formatIDR(item.quotedUnitPrice)}</td>
                      <td className="p-3 text-right font-mono font-bold">{formatIDR(item.quantity * item.quotedUnitPrice)}</td>
                    </tr>
                  ))}
                  {rfq.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center italic text-gray-500">Tidak ada item</td>
                    </tr>
                  )}
                </tbody>
                {rfq.items.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-100">
                      <td colSpan={4} className="p-3 border-r border-t border-black text-right font-bold">Grand Total Estimasi</td>
                      <td className="p-3 border-t border-black text-right font-bold font-mono text-sm">
                        {formatIDR(rfq.items.reduce((sum, item) => sum + (item.quantity * item.quotedUnitPrice), 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>

              <div className="mb-12 text-xs">
                <p>Mohon kirimkan balasan penawaran resmi (Quotation) sebelum batas waktu yang telah ditentukan di atas.</p>
                <p className="mt-2">Demikian Request For Quotation ini kami sampaikan, atas kerja samanya kami ucapkan terima kasih.</p>
              </div>

              <div className="flex justify-between text-center mt-12 px-12 text-xs">
                <div>
                  <p className="mb-20">Hormat Kami,</p>
                  <p className="font-bold border-b border-black pb-1 inline-block min-w-[150px] uppercase">Purchasing Dept.</p>
                  <p className="mt-1">CV Beton Agung</p>
                </div>
                <div>
                  <p className="mb-20">Pihak Vendor,</p>
                  <p className="font-bold border-b border-black pb-1 inline-block min-w-[150px] text-white">.</p>
                  <p className="mt-1">{rfq.supplierName}</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
    </>
  );
}
