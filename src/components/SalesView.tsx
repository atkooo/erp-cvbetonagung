/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';
import {
  FileSpreadsheet,
  FileCheck,
  Search,
  Filter,
  Plus,
  Receipt,
  Printer,
  ChevronRight,
  TrendingUp,
  X,
  CreditCard,
  Building2,
  Calendar,
  Truck,
  Trash2
} from '@/src/components/icons';
import { Quotation, SalesOrder, ViewType, Customer, Product } from '../types';
import { authStorage } from '../services/api';
import { salesApi } from '../features/sales/api';
import { financeApi } from '../features/finance/api';
import { customersApi } from '../features/customers/api';
import CurrencyInput from './CurrencyInput';
import { productsApi } from '../features/products/api';
import { inventoryApi } from '../features/inventory/api';
import { SkeletonTable, ErrorCard } from './Skeleton';
import SearchableSelect from './SearchableSelect';
import ProductPicker from './ProductPicker';
import { getCompanyProfile, formatAddressForPrint, CompanyProfile } from '../utils/companyProfile';

interface SalesViewProps {
  type: 'quotation' | 'sales-order';
  onTriggerNotification: (message: string) => void;
  onNavigate: (view: ViewType) => void;
}

interface SalesFormItem {
  productId: string;
  pieceCount?: number;
  length?: number;
  quantity: number;
  unitPrice: number;
  unit?: string;
  stock?: number;
  description?: string;
  isCustomizable?: boolean;
  pricingMethod?: 'per_item' | 'per_dimension';
}

export default function SalesView({
  type,
  onTriggerNotification,
  onNavigate,
}: SalesViewProps) {
  const [search, setSearch] = useState('');
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());

  useEffect(() => {
    const handleProfileUpdate = () => {
      setCompanyProfile(getCompanyProfile());
    };
    window.addEventListener('erp_company_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('erp_company_profile_updated', handleProfileUpdate);
  }, []);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // API states
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isQuotation = type === 'quotation';
  const dataList = isQuotation ? quotations : salesOrders;
  const printTitle = selectedDoc
    ? `${isQuotation ? selectedDoc.quoteNumber : selectedDoc.orderNumber}`
    : 'sales-document';
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: printTitle,
  });

  // Form states to create a quick document
  const [custId, setCustId] = useState('');
  const [quotationId, setQuotationId] = useState('');
  const [documentNotes, setDocumentNotes] = useState('');
  const [formItems, setFormItems] = useState<SalesFormItem[]>([
    { productId: '', quantity: 1, unitPrice: 0 }
  ]);

  // Quick add customer states
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCity, setNewCustCity] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [docs, custsRes, prods, stocks] = await Promise.all([
        isQuotation ? salesApi.getQuotations() : salesApi.getSalesOrders(),
        customersApi.listCustomers(),
        productsApi.getProducts(),
        inventoryApi.getProductStocks()
      ]);
      const productsWithStock = prods.map((product) => {
        const productStocks = stocks.filter((stock) => stock.product_id === product.id);
        const totalStock = productStocks.reduce((sum, stock) => sum + Number(stock.quantity || 0), 0);
        return { ...product, stock: totalStock };
      });
      if (isQuotation) {
        setQuotations(docs as Quotation[]);
        setSalesOrders([]);
      } else {
        setSalesOrders(docs as SalesOrder[]);
      }
      setCustomers(custsRes.customers);
      setProducts(productsWithStock);

      if (custsRes.customers.length > 0 && !custId) setCustId(custsRes.customers[0].id);
      setFormItems((prev) => {
        if (prev.length > 0 && prev.some(item => item.productId)) return prev;
        const defaultProduct = productsWithStock.find(p => !isQuotation ? p.type === 'finished_good' : true) || productsWithStock[0];
        return defaultProduct
          ? [{ productId: defaultProduct.id, quantity: 1, unitPrice: defaultProduct.sellingPrice || 0, unit: defaultProduct.unit, stock: defaultProduct.stock }]
          : prev;
      });
    } catch (err) {
      console.error('Failed to load sales data', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data penjualan';
      setErrorMessage(msg);
      onTriggerNotification(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [type]);

  useEffect(() => {
    if (!showAddForm || isQuotation || quotations.length > 0) {
      return;
    }

    let cancelled = false;
    salesApi.getQuotations()
      .then((qs) => {
        if (!cancelled) setQuotations(qs);
      })
      .catch((err) => {
        onTriggerNotification(err instanceof Error ? err.message : 'Gagal memuat referensi quotation');
      });

    return () => {
      cancelled = true;
    };
  }, [showAddForm, isQuotation, quotations.length, onTriggerNotification]);

  // Workflow shortcut effect
  useEffect(() => {
    if (!isQuotation) {
      const pendingQuotationId = sessionStorage.getItem('action_create_so');
      if (pendingQuotationId) {
        sessionStorage.removeItem('action_create_so');
        setTimeout(() => {
          setShowAddForm(true);
          setQuotationId(pendingQuotationId);
        }, 500);
      }
    }
  }, [isQuotation]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const formTotal = formItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const updateFormItem = (index: number, patch: Partial<SalesFormItem>) => {
    setFormItems(prev => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )));
  };

  const addFormItem = () => {
    setFormItems(prev => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeFormItem = (index: number) => {
    setFormItems(prev => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const resetFormItems = () => {
    const defaultProduct = products.find(p => (isQuotation ? true : p.type === 'finished_good')) || products[0];
    setFormItems(defaultProduct
      ? [{ productId: defaultProduct.id, quantity: 1, unitPrice: defaultProduct.sellingPrice || 0, unit: defaultProduct.unit, stock: defaultProduct.stock }]
      : [{ productId: '', quantity: 1, unitPrice: 0 }]
    );
  };

  // Filter logic
  const filteredDocs = dataList.filter((doc: any) => {
    const docNum = isQuotation ? doc.quoteNumber : doc.orderNumber;
    const matchesSearch =
      docNum.toLowerCase().includes(search.toLowerCase()) ||
      doc.customerName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle create document
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = formItems.filter(item => item.productId);
    if (validItems.length === 0) {
      onTriggerNotification('Gagal: Minimal pilih satu produk.');
      return;
    }
    if (validItems.some(item => item.quantity <= 0 || item.unitPrice <= 0)) {
      onTriggerNotification('Gagal: Kuantitas dan harga semua produk harus positif!');
      return;
    }
    const requestedByProduct = validItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
      return acc;
    }, {});
    const insufficientStock = Object.entries(requestedByProduct)
      .map(([productId, requestedQty]) => {
        const item = validItems.find(formItem => formItem.productId === productId);
        const product = products.find(p => p.id === productId);
        const availableStock = item?.stock ?? product?.stock ?? 0;
        return {
          productName: product?.name || 'Produk',
          unit: item?.unit || product?.unit || 'unit',
          requestedQty,
          availableStock,
        };
      })
      .find(item => item.availableStock <= 0 || item.requestedQty > item.availableStock);

    try {
      const d = new Date();
      const todayStr = d.toISOString().split('T')[0];
      const validUntil = new Date(d);
      validUntil.setDate(d.getDate() + 14); // 14 days valid

      let successMsg = "";
      if (isQuotation) {
        await salesApi.createQuotation({
          customer_id: custId,
          quotation_date: todayStr,
          valid_until: validUntil.toISOString().split('T')[0],
          notes: documentNotes.trim() || undefined,
          items: validItems.map(item => ({
            product_id: item.productId,
            piece_count: item.pieceCount,
            length: item.length,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            description: item.description
          }))
        });
        successMsg = `Sukses menerbitkan Quotation.`;
      } else {
        await salesApi.createSalesOrder({
          customer_id: custId,
          quotation_id: quotationId ? quotationId : undefined,
          order_date: todayStr,
          notes: documentNotes.trim() || undefined,
          items: validItems.map(item => ({
            product_id: item.productId,
            piece_count: item.pieceCount,
            length: item.length,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            description: item.description
          }))
        });
        successMsg = `Sukses menerbitkan Sales Order.`;
      }

      if (insufficientStock) {
        successMsg += ` (⚠️ Peringatan: Stok ${insufficientStock.productName} kurang. Butuh ${insufficientStock.requestedQty}, sisa ${insufficientStock.availableStock}. Perlu diproduksi/restock.)`;
      }
      onTriggerNotification(successMsg);
      await loadData();
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal membuat dokumen');
    }

    setQuotationId('');
    setDocumentNotes('');
    resetFormItems();
    setShowAddForm(false);
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;

    try {
      const code = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCustomer = await customersApi.createCustomer({
        code,
        name: newCustName,
        phone: newCustPhone,
        email: '',
        city: newCustCity,
        address: newCustAddress,
        status: 'Aktif'
      });

      setCustomers(prev => [...prev, newCustomer]);
      setCustId(newCustomer.id);
      setShowAddCustomer(false);
      onTriggerNotification(`Berhasil menambahkan customer baru: ${newCustomer.name}`);

      setNewCustName('');
      setNewCustPhone('');
      setNewCustCity('');
      setNewCustAddress('');
    } catch (err) {
      onTriggerNotification(err instanceof Error ? err.message : 'Gagal menambah customer');
    }
  };

  const handleApproveQuotation = async (docId: string, quoteNum: string) => {
    const result = await Swal.fire({
      title: `Approve Quotation ${quoteNum}?`,
      text: "Quotation ini akan disetujui. Apakah Anda juga ingin mencetaknya?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#e2e8f0',
      cancelButtonText: '<span style="color:#475569">Batal</span>',
      confirmButtonText: 'Ya, Approve'
    });

    if (result.isConfirmed) {
      try {
        await salesApi.updateQuotation(docId, { status: 'approved' });
        onTriggerNotification(`Sukses menyetujui Quotation ${quoteNum}.`);
        await loadData();
        
        handlePrintAction();
        setTimeout(() => {
          setSelectedDoc(null);
        }, 500);
      } catch (err) {
        onTriggerNotification(err instanceof Error ? err.message : 'Gagal approve quotation');
      }
    }
  };

  const handleApproveSalesOrder = async (docId: string, docNum: string) => {
    const result = await Swal.fire({
      title: `Approve Sales Order ${docNum}?`,
      text: "Sales Order ini akan disetujui. Apakah Anda juga ingin mencetaknya?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#e2e8f0',
      cancelButtonText: '<span style="color:#475569">Batal</span>',
      confirmButtonText: 'Ya, Approve'
    });

    if (result.isConfirmed) {
      try {
        await salesApi.updateSalesOrder(docId, { status: 'approved' });
        onTriggerNotification(`Sukses menyetujui Sales Order ${docNum}.`);
        await loadData();

        handlePrintAction();
        setTimeout(() => {
          setSelectedDoc(null);
        }, 500);
      } catch (err) {
        onTriggerNotification(err instanceof Error ? err.message : 'Gagal approve sales order');
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* 1. Header Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
            {isQuotation ? <FileSpreadsheet size={20} /> : <FileCheck size={20} />}
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800">
              {isQuotation ? 'Siklus Penawaran (Quotation Platform)' : 'Manajemen Kontrak Sales Order (SO)'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isQuotation ? 'Kelola pipeline negosiasi biaya ornamen, precast, dan pekerjaan custom' : 'Kontrol pengiriman produksi workshop setelah DP tervalidasi terekam'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow hover:bg-slate-800 flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>{isQuotation ? 'Buat Penawaran' : 'Rilis SO Baru'}</span>
        </button>
      </div>

      {/* 2. Lookup Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isQuotation ? 'Cari Nomor Quotation atau Nama Customer...' : 'Cari Nomor Sales Order atau Nama Customer...'}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-sans text-slate-850 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 shrink-0">
          <Filter size={13} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[11px] text-slate-600 bg-transparent py-1 focus:outline-none text-xs cursor-pointer font-sans"
          >
            <option value="All">Semua Status</option>
            {isQuotation ? (
              <>
                <option value="Draft">Draft</option>
                <option value="Terkirim">Terkirim</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </>
            ) : (
              <>
                <option value="Draft">Draft</option>
                <option value="Diproses">Diproses</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Pending Delivery">Pending Delivery</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 3. Document Tables */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={isQuotation ? 7 : 6} />
      ) : errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={loadData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
                  <th className="p-3.5 pl-5">Nomor Dokumen</th>
                  <th className="p-3.5">Sumber</th>
                  <th className="p-3.5">Nama Relasi Customer</th>
                  <th className="p-3.5">Tanggal Dokumen</th>
                  {isQuotation && <th className="p-3.5">Masa Berlaku s/d</th>}
                  <th className="p-3.5">Nilai Transaksi (Gross)</th>
                  <th className="p-3.5">Status Alur</th>
                  <th className="p-3.5 pr-5 text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={isQuotation ? 8 : 7} className="text-center py-12 text-slate-400 font-medium">
                      Tidak ada dokumen transaksi terekam saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc: any, idx) => {
                    const docNum = isQuotation ? doc.quoteNumber : doc.orderNumber;
                    const statusColors: Record<string, string> = {
                      Draft: 'bg-slate-100 text-slate-600',
                      Terkirim: 'bg-blue-100 text-blue-700',
                      Disetujui: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      Ditolak: 'bg-red-100 text-red-700',
                      Diproses: 'bg-amber-100 text-amber-700 border-amber-300',
                      pending_delivery: 'bg-orange-100 text-orange-800 border-orange-300',
                      Selesai: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      Dibatalkan: 'bg-slate-100 text-slate-400',
                    };

                    return (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="p-3.5 pl-5 font-mono font-bold text-slate-800 flex items-center gap-2">
                          {isQuotation ? <FileSpreadsheet size={13} className="text-slate-400" /> : <FileCheck size={13} className="text-slate-400" />}
                          <span>{docNum}</span>
                        </td>
                        <td className="p-3.5">
                          {!isQuotation && doc.source === 'pos' ? (
                            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold uppercase tracking-wider">Kasir (POS)</span>
                          ) : !isQuotation ? (
                            <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[9px] font-bold uppercase tracking-wider">B2B (ERP)</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[9px] font-bold uppercase tracking-wider">-</span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">{doc.customerName}</td>
                        <td className="p-3.5 font-mono text-slate-500">{doc.date}</td>
                        {isQuotation && <td className="p-3.5 font-mono text-slate-450">{doc.validUntil}</td>}
                        <td className="p-3.5 font-mono font-black text-slate-900">{formatIDR(doc.total)}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[doc.status] || 'bg-slate-50'}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <button
                            onClick={() => {
                              setSelectedDoc(doc);
                              onTriggerNotification(`Membuka rincian item dokumen ${docNum}`);
                            }}
                            className="p-1 text-cyan-600 hover:text-cyan-700 bg-slate-50 hover:bg-slate-100 rounded border hover:border-slate-200 transition-all font-bold text-[10px] px-2"
                          >
                            Rincian Item
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Side Drawer Modal for Detailed Items overview */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-end z-50 p-4">
          <div className="bg-white h-full max-w-md w-full shadow-2xl border-l border-slate-200 overflow-y-auto p-6 flex flex-col justify-between animate-in slide-in-from-right duration-150 rounded-l-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-cyan-500" />
                  <h4 className="font-sans font-bold text-slate-800 text-sm">
                    Rincian Document {isQuotation ? selectedDoc.quoteNumber : selectedDoc.orderNumber}
                  </h4>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              {/* Informative details */}
              <div className="space-y-4 py-5 text-xs font-sans text-slate-700">
                <div className="flex justify-between border-b border-slate-150 pb-2">
                  <span className="text-slate-400 font-medium">Customer:</span>
                  <strong className="text-slate-800">{selectedDoc.customerName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-150 pb-2">
                  <span className="text-slate-400 font-medium">Tanggal Masuk:</span>
                  <span className="font-mono">{selectedDoc.date}</span>
                </div>
                {isQuotation ? (
                  <div className="flex justify-between border-b border-slate-150 pb-2">
                    <span className="text-slate-400 font-medium">Berlaku Hingga:</span>
                    <span className="font-mono text-amber-600">{selectedDoc.validUntil}</span>
                  </div>
                ) : selectedDoc.quotationNumber ? (
                  <div className="flex justify-between border-b border-slate-150 pb-2">
                    <span className="text-slate-400 font-medium">Ref. Quotation:</span>
                    <strong className="text-slate-800">{selectedDoc.quotationNumber}</strong>
                  </div>
                ) : null}
                <div className="flex justify-between border-b border-slate-150 pb-2">
                  <span className="text-slate-400 font-medium">Status Dokumen:</span>
                  <span className="font-bold text-indigo-700">{selectedDoc.status}</span>
                </div>
                {selectedDoc.notes && (
                  <div className="border-b border-slate-150 pb-2">
                    <span className="text-slate-400 font-medium block mb-1">Catatan:</span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">{selectedDoc.notes}</p>
                  </div>
                )}

                {/* Items loop */}
                <div className="mt-6">
                  <h5 className="font-mono font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-3">DAFTAR PENYUSUNAN BARANG</h5>
                  <div className="space-y-2">
                    {selectedDoc.items?.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-slate-800 block mb-1 leading-snug">{item.productName}</strong>
                          {item.description && (
                            <div className="text-[10px] text-slate-500 mb-1 leading-tight italic">{item.description}</div>
                          )}
                          <span className="text-slate-400 text-[11px] font-mono block">
                            {item.pieceCount && item.length ? (
                              <span className="text-indigo-600 font-bold mr-1">
                                [{item.pieceCount} Fisik @ {item.length} {item.unit || 'M'}]
                              </span>
                            ) : null}
                            {item.quantity} {item.unit || 'Unit'} x {formatIDR(item.price)}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono text-[11px]">{formatIDR(item.quantity * item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-800 mb-4 px-1">
                <span>TOTAL GROSS :</span>
                <span className="text-indigo-700 font-mono">{formatIDR(selectedDoc.total)}</span>
              </div>

              <div className={(isQuotation && (selectedDoc.status === 'Terkirim' || selectedDoc.status === 'Draft')) || (!isQuotation && (selectedDoc.status === 'Draft' || selectedDoc.status === 'Diproses')) ? "flex flex-col gap-2" : "grid grid-cols-2 gap-2"}>
                {!(isQuotation && (selectedDoc.status === 'Terkirim' || selectedDoc.status === 'Draft')) && !(!isQuotation && (selectedDoc.status === 'Draft' || selectedDoc.status === 'Diproses')) && (
                  <button
                    onClick={() => {
                      onTriggerNotification(`Mencetak Print Preview dokumen ${isQuotation ? selectedDoc.quoteNumber : selectedDoc.orderNumber}`);
                      setTimeout(() => handlePrintAction(), 150);
                    }}
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-all hover:bg-slate-100 flex items-center justify-center gap-1.5"
                  >
                    <Printer size={13} />
                    <span>Cetak PDF</span>
                  </button>
                )}

                {isQuotation && (selectedDoc.status === 'Terkirim' || selectedDoc.status === 'Draft') ? (
                  <>
                    <button
                      onClick={() => handleApproveQuotation(selectedDoc.id, selectedDoc.quoteNumber)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck size={13} className="text-white" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => setSelectedDoc(null)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                    >
                      Tutup
                    </button>
                  </>
                ) : !isQuotation && (selectedDoc.status === 'Draft' || selectedDoc.status === 'Diproses' || selectedDoc.status === 'Disetujui') ? (
                  <div className="flex flex-col gap-2 w-full">
                    {selectedDoc.status === 'Draft' || selectedDoc.status === 'Diproses' ? (
                      <button
                        onClick={() => handleApproveSalesOrder(selectedDoc.id, selectedDoc.orderNumber)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <FileCheck size={13} className="text-white" />
                        <span>Approve</span>
                      </button>
                    ) : null}



                    <button
                      onClick={() => setSelectedDoc(null)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                ) : (
                    <button
                      onClick={() => setSelectedDoc(null)}
                      className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold text-[11px] transition-all hover:bg-slate-800 cursor-pointer"
                    >
                      Tutup
                    </button>
                )}
                
                {isQuotation && selectedDoc.status === 'Disetujui' && (
                  <button
                    onClick={() => {
                      sessionStorage.setItem('action_create_so', selectedDoc.id);
                      setSelectedDoc(null);
                      onNavigate('sales-orders');
                    }}
                    className="w-full col-span-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Lanjut Buat Sales Order (SO)</span>
                    <ChevronRight size={14} />
                  </button>
                )}

                {!isQuotation && selectedDoc.status === 'Disetujui' && (
                  <button
                    onClick={() => {
                      sessionStorage.setItem('action_create_invoice', selectedDoc.id);
                      setSelectedDoc(null);
                      onNavigate('invoices');
                    }}
                    className="w-full col-span-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Lanjut Buat Tagihan (Invoice)</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hidden print:block">
        <div ref={printRef} className="print:block p-8 font-sans text-sm text-black bg-white">
          {selectedDoc && (() => {
            const docNumber = isQuotation ? selectedDoc.quoteNumber : selectedDoc.orderNumber;
            const docTitle = isQuotation ? 'QUOTATION' : 'SALES ORDER';
            const docDateLabel = isQuotation ? 'Tanggal Penawaran' : 'Tanggal Sales Order';
            const signatureTitle = isQuotation ? 'Disetujui Oleh,' : 'Dikonfirmasi Oleh,';

            return (
              <div className="max-w-200 mx-auto">
                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                  <div className="flex items-center gap-4">
                    {companyProfile.logoUrl ? (
                      <img src={companyProfile.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white font-black text-2xl tracking-tighter">
                        {companyProfile.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h1 className="text-2xl font-black tracking-tight">{companyProfile.name.toUpperCase()}</h1>
                      <p className="font-bold text-xs">General Contractor & Supplier Material Alam</p>
                      <p className="text-[11px] mt-1">{formatAddressForPrint(companyProfile.address)}</p>
                      <p className="text-[10px] mt-0.5">Telp: {companyProfile.phone} | Email: {companyProfile.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="border px-4 py-1 font-black tracking-[0.2em] text-slate-500 text-lg">{docTitle}</div>
                    <p className="font-mono font-bold mt-2 text-lg">{docNumber}</p>
                    {!isQuotation && selectedDoc.quotationNumber && (
                      <p className="text-sm font-bold text-slate-600">Ref Quotation: {selectedDoc.quotationNumber}</p>
                    )}
                    <p className="text-sm">{docDateLabel}: {selectedDoc.date}</p>
                    {isQuotation && <p className="text-sm">Berlaku Hingga: {selectedDoc.validUntil}</p>}
                  </div>
                </div>

                <div className="border border-black rounded-md p-4 w-[45%] mb-6">
                  <p className="text-[10px] font-mono font-bold text-slate-500 tracking-widest">KEPADA YTH. (CUSTOMER)</p>
                  <p className="font-bold text-lg mt-1">{selectedDoc.customerName}</p>
                </div>

                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black p-2 w-10">NO</th>
                      <th className="border border-black p-2 text-left">NAMA PRODUK / PEKERJAAN</th>
                      <th className="border border-black p-2 w-20 text-right">QTY</th>
                      <th className="border border-black p-2 w-32 text-right">HARGA SATUAN</th>
                      <th className="border border-black p-2 w-32 text-right">JUMLAH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDoc.items?.map((item: any, idx: number) => (
                      <tr key={`${item.productName}-${idx}`}>
                        <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                        <td className="border border-black p-2 align-top">
                          <span className="font-bold block">{item.productName}</span>
                          {item.pieceCount && item.length && (
                            <div className="text-[10px] text-slate-800 font-bold mt-1">Ukuran Custom: {item.pieceCount} Fisik x {item.length} {item.unit || 'M'}</div>
                          )}
                          {item.description && (
                            <div className="text-[10px] text-slate-600 mt-1 italic">{item.description}</div>
                          )}
                        </td>
                        <td className="border border-black p-2 text-right font-mono align-top">
                          {item.quantity} <span className="text-[10px] ml-1 font-sans font-normal uppercase">{item.unit || ''}</span>
                        </td>
                        <td className="border border-black p-2 text-right font-mono align-top">{formatIDR(item.price)}</td>
                        <td className="border border-black p-2 text-right font-mono font-bold align-top">{formatIDR(item.quantity * item.price)}</td>
                      </tr>
                    ))}
                    {!selectedDoc.items?.length && (
                      <tr>
                        <td className="border border-black p-4 text-center text-slate-500" colSpan={5}>Tidak ada item.</td>
                      </tr>
                    )}
                    <tr className="bg-slate-100">
                      <td colSpan={4} className="border border-black p-3 text-right font-black">TOTAL KESELURUHAN</td>
                      <td className="border border-black p-3 text-right font-black font-mono text-base">{formatIDR(selectedDoc.total)}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-[11px] mt-6">
                  <strong>Catatan:</strong> {selectedDoc.notes || 'Dokumen ini diterbitkan sebagai dasar administrasi penjualan, produksi, pengiriman, dan penagihan customer.'}
                </p>

                <div className="grid grid-cols-3 gap-10 mt-10 text-center text-xs">
                  <div>
                    <p>Dibuat Oleh,</p>
                    <div className="h-20"></div>
                    <p className="border-t border-black pt-2 font-bold">SALES DEPT.</p>
                    <p>{companyProfile.name}</p>
                  </div>
                  <div>
                    <p>{signatureTitle}</p>
                    <div className="h-20"></div>
                    <p className="border-t border-black pt-2 font-bold">{selectedDoc.customerName}</p>
                  </div>
                  <div>
                    <p>Mengetahui,</p>
                    <div className="h-20"></div>
                    <p className="border-t border-black pt-2 font-bold">DIREKTUR UTAMA</p>
                    <p>{companyProfile.name}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 5. Create Draft Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Entri Memo {isQuotation ? 'Quotation Baru' : 'Sales Order Baru'}</h3>
              </div>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {!isQuotation && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Referensi Quotation</label>
                    <SearchableSelect
                      value={quotationId}
                      onChange={(qId) => {
                        setQuotationId(qId);
                        if (qId) {
                          const selectedQuo = quotations.find(q => q.id === qId);
                          if (selectedQuo) {
                            if (selectedQuo.customerId) setCustId(selectedQuo.customerId);
                            if (selectedQuo.items && selectedQuo.items.length > 0) {
                              setFormItems(selectedQuo.items.map(item => {
                                const product = products.find(p => p.id === item.productId) || products.find(p => p.name === item.productName);
                                return {
                                  productId: product?.id || item.productId || '',
                                  quantity: item.quantity,
                                  unitPrice: item.price,
                                  unit: product?.unit,
                                  stock: product?.stock,
                                  description: item.description,
                                  isCustomizable: product?.isCustomizable,
                                  pricingMethod: product?.pricingMethod,
                                  pieceCount: item.pieceCount,
                                  length: item.length,
                                };
                              }));
                            }
                          }
                        } else {
                          resetFormItems();
                          setCustId('');
                        }
                      }}
                      options={[
                        { value: "", label: "-- Tanpa Referensi Quotation --" },
                        ...quotations
                          .filter(q => q.status === 'Disetujui')
                          .map(q => ({ value: q.id, label: `${q.quoteNumber} - ${q.customerName} - ${formatIDR(q.total)}` }))
                      ]}
                      placeholder="Pilih Referensi Quotation..."
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Pilih Relasi Pelanggan</label>
                    <button type="button" onClick={() => setShowAddCustomer(true)} className="text-[10px] text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 cursor-pointer">
                      <Plus size={10} /> Tambah Baru
                    </button>
                  </div>
                  {customers.length > 0 ? (
                    <SearchableSelect
                      value={custId}
                      onChange={(val) => setCustId(val)}
                      options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.city})` }))}
                      placeholder="Pilih Customer..."
                    />
                  ) : (
                    <SearchableSelect
                      value=""
                      onChange={() => { }}
                      options={[]}
                      placeholder="Memuat Customer..."
                      disabled
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Item Produk</label>
                    <button
                      type="button"
                      onClick={addFormItem}
                      className="text-[10px] text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={10} /> Tambah Baris
                    </button>
                  </div>

                  <div className="space-y-3 pr-1">
                    {formItems.map((item, index) => (
                      <div key={index} className="p-3 border border-slate-200 rounded-xl bg-slate-50/70 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Baris {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeFormItem(index)}
                            disabled={formItems.length === 1}
                            className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-white"
                            title="Hapus baris"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <ProductPicker
                          value={item.productId}
                          showCategoryFilter
                          onChange={(product) => {
                            updateFormItem(index, {
                              productId: product.id,
                              unitPrice: product.sellingPrice || 0,
                              quantity: item.quantity > 0 ? item.quantity : 1,
                              unit: product.unit,
                              stock: product.stock,
                              isCustomizable: product.isCustomizable,
                              pricingMethod: product.pricingMethod,
                            });
                          }}
                          typeFilter={isQuotation ? undefined : "finished_good"}
                          placeholder="Pilih Produk..."
                        />

                        <div className="bg-slate-100/50 border border-slate-200 rounded-lg p-3 space-y-3 mt-3">
                          {item.isCustomizable ? (
                            <div className="p-3 bg-white border border-indigo-100 rounded-lg shadow-sm">
                              <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                Detail Dimensi Custom
                              </h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600">Jml Fisik (Batang/Pcs)</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.pieceCount || ''}
                                    onChange={(e) => {
                                      const val = e.target.value ? Number(e.target.value) : undefined;
                                      const l = item.length || 1;
                                      const p = val || 1;
                                      updateFormItem(index, {
                                        pieceCount: val,
                                        quantity: item.pricingMethod === 'per_dimension' ? parseFloat((p * l).toFixed(2)) : p
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-xs"
                                    placeholder="Jml"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600">Ukuran per Fisik ({item.unit || 'M'})</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.length || ''}
                                    onChange={(e) => {
                                      const val = e.target.value ? Number(e.target.value) : undefined;
                                      const p = item.pieceCount || 1;
                                      const l = val || 1;
                                      updateFormItem(index, {
                                        length: val,
                                        quantity: item.pricingMethod === 'per_dimension' ? parseFloat((p * l).toFixed(2)) : p
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-xs"
                                    placeholder="Ukuran"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-indigo-700">Total Tagihan ({item.pricingMethod === 'per_dimension' ? item.unit || 'M' : 'Item'})</label>
                                  <input
                                    type="number"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    value={item.quantity || ''}
                                    readOnly={true}
                                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono bg-indigo-50 border-indigo-200 text-indigo-700 cursor-not-allowed font-bold focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Total {item.unit || 'Qty'}</label>
                                <input
                                  type="number"
                                  required
                                  min="0.01"
                                  step="0.01"
                                  value={item.quantity || ''}
                                  onChange={(e) => updateFormItem(index, { quantity: Number(e.target.value) })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white placeholder:text-slate-300 text-xs"
                                  placeholder="Misal: 10"
                                />
                                {typeof item.stock === 'number' && (
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    Stok: {item.stock} {item.unit || 'unit'}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">
                              Harga Satuan {item.unit ? `(Rp / ${item.unit})` : '(Rp)'}
                            </label>
                            <CurrencyInput
                              required
                              value={item.unitPrice || ''}
                              onValueChange={(val) => updateFormItem(index, { unitPrice: Number(val) })}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 mt-3">
                          <label className="text-[11px] font-bold text-slate-600">Keterangan Tambahan</label>
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => updateFormItem(index, { description: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white placeholder:text-slate-300 text-xs"
                            placeholder="Opsional (catatan khusus...)"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Catatan {isQuotation ? 'Quotation' : 'Sales Order'}
                  </label>
                  <textarea
                    value={documentNotes}
                    onChange={(e) => setDocumentNotes(e.target.value)}
                    rows={3}
                    placeholder="Tambahkan catatan transaksi, instruksi khusus, atau keterangan pembayaran..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="p-4 border-t bg-slate-50 flex justify-between items-center shrink-0">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-400">Total Proyeksi Kontrak</span>
                  <p className="text-sm font-black text-indigo-750 font-mono leading-none mt-0.5">{formatIDR(formTotal)}</p>
                </div>
                <div className="flex gap-2 text-xs font-bold">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-100">Batal</button>
                  <button type="submit" className="px-5 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg shadow-sm hover:bg-slate-800">Penerbitan Draft</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Quick Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-60 p-4 font-sans text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-indigo-600" />
                <h3 className="font-bold text-indigo-900 text-sm">Tambah Customer Baru</h3>
              </div>
              <button onClick={() => setShowAddCustomer(false)} className="text-indigo-400 hover:text-indigo-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleQuickAddCustomer} className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Nama Customer *</label>
                <input required type="text" value={newCustName} onChange={e => setNewCustName(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-400 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">No. Telepon / WhatsApp</label>
                <input type="text" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-400 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Kota</label>
                <input type="text" value={newCustCity} onChange={e => setNewCustCity(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-400 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Alamat Lengkap</label>
                <textarea rows={2} value={newCustAddress} onChange={e => setNewCustAddress(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-400 focus:outline-none resize-none" />
              </div>
              <div className="pt-2 border-t flex justify-end gap-2 text-xs font-bold mt-2">
                <button type="button" onClick={() => setShowAddCustomer(false)} className="px-3 py-1.5 border rounded text-slate-600 hover:bg-slate-50 cursor-pointer">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm cursor-pointer">Simpan Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
