import React, { useState, useEffect } from 'react';
import {
  WalletCards, RefreshCw, AlertTriangle, Coins, CheckCircle, HandCoins
} from '@/src/components/icons';
import Swal from 'sweetalert2';
import { financeApi } from '../features/finance/api';
import { Invoice } from '../types';
import { SupplierPayable, AccountDto } from '../features/finance/types';
import { formatDate, toApiDate } from '../utils/date';
import {
  X, Search, ChevronLeft, ChevronRight, Eye, Building2, Banknote, QrCode,
  DollarSign, CheckCircle2, AlertCircle, Calendar
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import CurrencyInput from './CurrencyInput';

interface ReceivablesPayablesViewProps {
  initialMode?: 'ar' | 'ap';
  onTriggerNotification: (message: string) => void;
}

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
      <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">{icon}</div>
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
    cyan: 'bg-sky-50 text-sky-700 border-sky-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${tones[tone]}`}>
      {children}
    </span>
  );
};

const formatIDR = (num: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

const dateOnly = (value: string | null | undefined) => {
  if (!value || value === '-') return '';
  return toApiDate(new Date(value));
};

const getMethodForAccount = (acc?: AccountDto | null): 'cash' | 'transfer' | 'qris' => {
  if (!acc) return 'transfer';
  const type = (acc.type || '').toLowerCase();
  if (type.includes('cash') || type.includes('kas')) return 'cash';
  if (type.includes('wallet') || type.includes('qris')) return 'qris';
  return 'transfer';
};

const PaymentMethodSelector = ({
  value,
  onChange,
}: {
  value: 'cash' | 'transfer' | 'qris';
  onChange: (method: 'cash' | 'transfer' | 'qris') => void;
}) => {
  const methods = [
    {
      id: 'transfer' as const,
      label: 'Transfer Bank',
      desc: 'BCA, Mandiri, BRI, dll.',
      icon: <Building2 size={16} />,
    },
    {
      id: 'cash' as const,
      label: 'Kas Tunai',
      desc: 'Uang fisik kasir / operasional',
      icon: <Banknote size={16} />,
    },
    {
      id: 'qris' as const,
      label: 'QRIS / E-Wallet',
      desc: 'QRIS statis / e-wallet',
      icon: <QrCode size={16} />,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {methods.map((m) => {
        const isSelected = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              isSelected
                ? 'bg-sky-50/90 border-sky-500 ring-2 ring-sky-500/20 text-sky-900 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {m.icon}
              </span>
              {isSelected && <span className="w-2 h-2 rounded-full bg-sky-600"></span>}
            </div>
            <div>
              <div className="font-bold text-xs leading-tight">{m.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{m.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const QuickPercentButtons = ({
  totalAmount,
  onSelectAmount,
}: {
  totalAmount: number;
  onSelectAmount: (val: number) => void;
}) => (
  <div className="flex items-center gap-1.5 pt-1">
    <span className="text-[10px] text-slate-400 font-medium">Pilihan cepat:</span>
    <button
      type="button"
      onClick={() => onSelectAmount(totalAmount)}
      className="px-2 py-0.5 text-[10px] bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded font-semibold transition cursor-pointer"
    >
      Lunas (100%)
    </button>
    <button
      type="button"
      onClick={() => onSelectAmount(Math.round(totalAmount * 0.5))}
      className="px-2 py-0.5 text-[10px] bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded font-medium transition cursor-pointer"
    >
      50%
    </button>
    <button
      type="button"
      onClick={() => onSelectAmount(Math.round(totalAmount * 0.25))}
      className="px-2 py-0.5 text-[10px] bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded font-medium transition cursor-pointer"
    >
      25%
    </button>
  </div>
);

export default function ReceivablesPayablesView({ initialMode, onTriggerNotification }: ReceivablesPayablesViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payables, setPayables] = useState<SupplierPayable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ledgerMode, setLedgerMode] = useState<'ar' | 'ap'>(initialMode || 'ar');
  
  // Tabs
  const [payablesTab, setPayablesTab] = useState<'outstanding' | 'lunas'>('outstanding');
  const [receivablesTab, setReceivablesTab] = useState<'outstanding' | 'lunas'>('outstanding');
  
  const [accounts, setAccounts] = useState<AccountDto[]>([]);

  // Search & Pagination
  const [arSearch, setArSearch] = useState('');
  const [apSearch, setApSearch] = useState('');
  const [arPage, setArPage] = useState(1);
  const [apPage, setApPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // AP Modals & States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<SupplierPayable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('transfer');
  const [paymentDate, setPaymentDate] = useState(toApiDate());
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // AR Modals & States
  const [showArPaymentModal, setShowArPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [arPaymentAmount, setArPaymentAmount] = useState(0);
  const [arSelectedAccountId, setArSelectedAccountId] = useState('');
  const [arPaymentMethod, setArPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('transfer');
  const [arPaymentDate, setArPaymentDate] = useState(toApiDate());
  const [arPaymentNotes, setArPaymentNotes] = useState('');
  const [arAutoVerify, setArAutoVerify] = useState(true);
  const [isSubmittingArPayment, setIsSubmittingArPayment] = useState(false);

  // Detail Modals
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<Invoice | null>(null);
  
  const [showPayableDetail, setShowPayableDetail] = useState(false);
  const [selectedPayableDetail, setSelectedPayableDetail] = useState<SupplierPayable | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialMode) {
      setLedgerMode(initialMode);
    }
  }, [initialMode]);

  // Reset page when tab or search changes
  useEffect(() => { setArPage(1); }, [receivablesTab, arSearch]);
  useEffect(() => { setApPage(1); }, [payablesTab, apSearch]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invs, pays, accs] = await Promise.all([
        financeApi.getInvoices(),
        financeApi.getSupplierPayables(),
        financeApi.getAccounts()
      ]);
      setInvoices(invs);
      setPayables(pays);
      setAccounts(accs);
      if (accs.length > 0) {
        if (!selectedAccountId) {
          setSelectedAccountId(accs[0].id);
          setPaymentMethod(getMethodForAccount(accs[0]));
        }
        if (!arSelectedAccountId) {
          setArSelectedAccountId(accs[0].id);
          setArPaymentMethod(getMethodForAccount(accs[0]));
        }
      }
    } catch (error) {
      console.error('Error fetching receivables/payables:', error);
      onTriggerNotification('Gagal memuat data keuangan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvoice = async (id: string, number: string) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Batalkan Invoice?',
      text: `Masukkan alasan pembatalan untuk invoice ${number}.`,
      input: 'text',
      inputPlaceholder: 'Batal pesanan, salah input, dll',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Tutup',
      inputValidator: (value) => {
        if (!value) return 'Alasan pembatalan wajib diisi!';
        return null;
      }
    });

    if (isConfirmed && reason) {
      try {
        await financeApi.cancelInvoice(id, reason);
        onTriggerNotification(`Berhasil membatalkan invoice ${number}`);
        setShowInvoiceDetail(false);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        await fetchData();
      } catch (err) {
        onTriggerNotification(err instanceof Error ? err.message : 'Gagal membatalkan invoice');
      }
    }
  };

  useEffect(() => {
    const pendingPoNumber = sessionStorage.getItem('action_pay_ap');
    if (pendingPoNumber) {
      sessionStorage.removeItem('action_pay_ap');
      setLedgerMode('ap');
      
      const checkAndOpen = setInterval(() => {
        setPayables((currentPayables) => {
          if (currentPayables.length > 0) {
            clearInterval(checkAndOpen);
            setTimeout(() => {
              const payable = currentPayables.find((p) => p.poNumber === pendingPoNumber);
              if (payable) {
                handlePaySupplier(payable);
              }
            }, 500);
          }
          return currentPayables;
        });
      }, 500);
      
      setTimeout(() => clearInterval(checkAndOpen), 10000);
    }
  }, []);

  const handlePaySupplier = (payable: SupplierPayable) => {
    const remaining = payable.amount - payable.paidAmount;
    if (remaining <= 0) {
      Swal.fire('Info', 'AP ini sudah lunas.', 'info');
      return;
    }

    setSelectedPayable(payable);
    setPaymentAmount(remaining);
    setPaymentDate(toApiDate());
    setPaymentNotes(`Pembayaran hutang supplier ${payable.payableNumber}`);
    
    // Auto sync method from selected account
    const acc = accounts.find(a => a.id === selectedAccountId);
    if (acc) {
      setPaymentMethod(getMethodForAccount(acc));
    }

    setShowPaymentModal(true);
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    const acc = accounts.find(a => a.id === accountId);
    if (acc) {
      setPaymentMethod(getMethodForAccount(acc));
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable || !selectedAccountId || paymentAmount <= 0) {
      onTriggerNotification('Pilih Rekening dan isi nominal dengan benar.');
      return;
    }

    const remaining = selectedPayable.amount - selectedPayable.paidAmount;
    if (paymentAmount > remaining) {
      onTriggerNotification(`Nominal pembayaran tidak boleh melebihi sisa outstanding payable (${formatIDR(remaining)}).`);
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await financeApi.paySupplierPayable(selectedPayable.id, {
        account_id: selectedAccountId,
        amount: paymentAmount,
        method: paymentMethod,
        notes: paymentNotes,
        paid_at: paymentDate,
      });

      onTriggerNotification(`Pembayaran outstanding payable ${selectedPayable.payableNumber} sebesar ${formatIDR(paymentAmount)} berhasil.`);
      setShowPaymentModal(false);
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat memproses pembayaran outstanding payable.', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // AR (Receivables) Payment handlers
  const handleOpenReceivePayment = (inv: Invoice) => {
    const remaining = inv.total - inv.paidAmount;
    if (remaining <= 0) {
      Swal.fire('Info', 'Faktur invoice ini sudah lunas.', 'info');
      return;
    }

    setSelectedInvoiceForPayment(inv);
    setArPaymentAmount(remaining);
    setArPaymentDate(toApiDate());
    setArPaymentNotes(`Penerimaan pembayaran faktur ${inv.invoiceNumber}`);
    setArAutoVerify(true);

    const defaultAccId = arSelectedAccountId || (accounts.length > 0 ? accounts[0].id : '');
    if (defaultAccId) {
      setArSelectedAccountId(defaultAccId);
      const acc = accounts.find(a => a.id === defaultAccId);
      if (acc) {
        setArPaymentMethod(getMethodForAccount(acc));
      }
    }
    setShowArPaymentModal(true);
  };

  const handleArAccountChange = (accountId: string) => {
    setArSelectedAccountId(accountId);
    const acc = accounts.find(a => a.id === accountId);
    if (acc) {
      setArPaymentMethod(getMethodForAccount(acc));
    }
  };

  const submitArPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment || !arSelectedAccountId || arPaymentAmount <= 0) {
      onTriggerNotification('Pilih Akun Rekening/Kas dan masukkan nominal dengan benar.');
      return;
    }

    const remaining = selectedInvoiceForPayment.total - selectedInvoiceForPayment.paidAmount;
    if (arPaymentAmount > remaining) {
      onTriggerNotification(`Nominal pembayaran tidak boleh melebihi sisa piutang (${formatIDR(remaining)}).`);
      return;
    }

    setIsSubmittingArPayment(true);
    try {
      const todayTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const paymentDate = arPaymentDate ? `${arPaymentDate} 12:00:00` : todayTime;

      await financeApi.createPayment({
        invoice_id: selectedInvoiceForPayment.id,
        account_id: arSelectedAccountId,
        payment_date: paymentDate,
        method: arPaymentMethod,
        amount: arPaymentAmount,
        notes: arPaymentNotes,
        auto_verify: arAutoVerify,
      });

      onTriggerNotification(`Penerimaan pembayaran faktur ${selectedInvoiceForPayment.invoiceNumber} sebesar ${formatIDR(arPaymentAmount)} berhasil.`);
      setShowArPaymentModal(false);
      if (showInvoiceDetail) {
        setShowInvoiceDetail(false);
      }
      fetchData();
    } catch (error) {
      console.error('Error submitting AR payment:', error);
      const msg = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pembayaran piutang.';
      Swal.fire('Gagal', msg, 'error');
    } finally {
      setIsSubmittingArPayment(false);
    }
  };

  // Calculations
  const today = toApiDate();

  const isInvoiceActive = (inv: Invoice) => inv.status !== 'cancelled' && inv.status !== 'Dibatalkan';
  const isPayableActive = (p: SupplierPayable) => p.status !== 'Dibatalkan';

  const outstandingInvoices = invoices.filter(inv => isInvoiceActive(inv) && inv.status !== 'Lunas');
  
  const overdueReceivables = outstandingInvoices
    .filter(inv => dateOnly(inv.dueDate) < today)
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const activeReceivables = outstandingInvoices
    .filter(inv => dateOnly(inv.dueDate) >= today)
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const totalPayables = payables
    .filter(p => isPayableActive(p) && p.status !== 'Lunas')
    .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  const overduePayables = payables
    .filter(p => isPayableActive(p) && p.status !== 'Lunas' && !!p.dueDate && dateOnly(p.dueDate) < today)
    .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  const activePayables = payables
    .filter(p => isPayableActive(p) && p.status !== 'Lunas' && (!p.dueDate || dateOnly(p.dueDate) >= today))
    .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  const netCashExposure = (activeReceivables + overdueReceivables) - totalPayables;

  const getInvoiceTone = (status: string) => {
    switch (status) {
      case 'Lunas': return 'emerald';
      case 'Sebagian Dibayar': return 'cyan';
      case 'Belum Lunas': return 'amber';
      case 'Overdue': return 'rose';
      default: return 'slate';
    }
  };

  // AR Filter & Pagination
  const filteredAr = invoices.filter(inv => {
    if (!isInvoiceActive(inv)) return false;
    const isTabMatch = receivablesTab === 'outstanding' ? inv.status !== 'Lunas' : inv.status === 'Lunas';
    const isSearchMatch = inv.invoiceNumber.toLowerCase().includes(arSearch.toLowerCase()) || 
                          inv.customerName.toLowerCase().includes(arSearch.toLowerCase());
    return isTabMatch && isSearchMatch;
  });
  const totalArPages = Math.ceil(filteredAr.length / ITEMS_PER_PAGE);
  const paginatedAr = filteredAr.slice((arPage - 1) * ITEMS_PER_PAGE, arPage * ITEMS_PER_PAGE);

  // AP Filter & Pagination
  const filteredAp = payables.filter(p => {
    if (!isPayableActive(p)) return false;
    const isTabMatch = payablesTab === 'outstanding' ? p.status !== 'Lunas' : p.status === 'Lunas';
    const isSearchMatch = p.payableNumber.toLowerCase().includes(apSearch.toLowerCase()) || 
                          p.supplierName.toLowerCase().includes(apSearch.toLowerCase());
    return isTabMatch && isSearchMatch;
  });
  const totalApPages = Math.ceil(filteredAp.length / ITEMS_PER_PAGE);
  const paginatedAp = filteredAp.slice((apPage - 1) * ITEMS_PER_PAGE, apPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 text-xs font-sans">
      <Header
        icon={<WalletCards size={20} />}
        title={initialMode === 'ar' ? 'Outstanding Receivable (AR)' : initialMode === 'ap' ? 'Outstanding Payable (AP)' : 'Outstanding Receivable (AR) & Payable (AP)'}
        desc={initialMode === 'ar' ? 'Ledger posisi outstanding receivable dari Billing.' : initialMode === 'ap' ? 'Ledger posisi outstanding payable dari Purchasing.' : 'Ledger posisi outstanding receivable dari Billing dan payable dari Purchasing untuk kontrol cashflow.'}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(ledgerMode === 'ar' ? [
          ['AR Overdue Customer', formatIDR(overdueReceivables), 'rose', 'Receivable Telat'],
          ['AR Belum Jatuh Tempo', formatIDR(activeReceivables), 'cyan', 'Receivable Aktif'],
          ['Total Outstanding AR', formatIDR(overdueReceivables + activeReceivables), 'amber', 'Total Tagihan']
        ] : [
          ['AP Overdue Supplier', formatIDR(overduePayables), 'rose', 'Payable Telat'],
          ['AP Belum Jatuh Tempo', formatIDR(activePayables), 'cyan', 'Payable Aktif'],
          ['Total Outstanding AP', formatIDR(totalPayables), 'amber', 'Total Kewajiban']
        ]).map(([label, value, tone, sub]) => (
          <Panel key={label as string} className="p-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{label as string}</span>
            <div className="mt-1.5 flex items-center justify-between">
              <strong className="text-base font-black text-slate-900">{value as string}</strong>
              <StatusPill tone={tone as any}>{sub as string}</StatusPill>
            </div>
          </Panel>
        ))}
      </div>

      <div className="flex justify-end">
        {!initialMode && (
          <div className="mr-auto flex border border-slate-200 rounded-lg overflow-hidden bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setLedgerMode('ar')}
              className={`px-4 py-2 rounded-md text-[10px] font-bold transition-all ${ledgerMode === 'ar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Outstanding Receivable (AR)
            </button>
            <button
              type="button"
              onClick={() => setLedgerMode('ap')}
              className={`px-4 py-2 rounded-md text-[10px] font-bold transition-all ${ledgerMode === 'ap' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Outstanding Payable (AP)
            </button>
          </div>
        )}
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-2 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>Segarkan Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Receivables Table */}
        {ledgerMode === 'ar' && <Panel className="overflow-hidden">
          <div className="flex flex-col bg-slate-50/50">
            <div className="p-4 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">AR Aging - Outstanding Receivable</h4>
              <StatusPill tone={receivablesTab === 'outstanding' ? 'cyan' : 'emerald'}>
                {receivablesTab === 'outstanding' ? 'Sumber: Billing Invoice' : 'AR Lunas'}
              </StatusPill>
            </div>
            <div className="px-4 flex gap-6 border-b border-slate-200 justify-between items-center">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setReceivablesTab('outstanding')}
                  className={`py-2 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all ${receivablesTab === 'outstanding' ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Belum Lunas ({invoices.filter(i => i.status !== 'Lunas').length})
                </button>
                <button
                  type="button"
                  onClick={() => setReceivablesTab('lunas')}
                  className={`py-2 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all ${receivablesTab === 'lunas' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Riwayat Lunas ({invoices.filter(i => i.status === 'Lunas').length})
                </button>
              </div>
              <div className="pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari Invoice / Customer..."
                    value={arSearch}
                    onChange={(e) => setArSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-500 min-w-[200px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin text-slate-400" size={20} />
            </div>
          ) : paginatedAr.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle size={20} className="mx-auto mb-1 text-emerald-500" />
              <p>{receivablesTab === 'outstanding' ? 'Tidak ada outstanding receivable.' : 'Tidak ada riwayat receivable lunas.'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                      <th className="p-3.5 pl-5">No. Invoice</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Jatuh Tempo</th>
                      <th className="p-3.5">{receivablesTab === 'outstanding' ? 'Sisa Receivable' : 'Total Invoice'}</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 pr-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedAr.map((inv) => {
                      const remaining = inv.total - inv.paidAmount;
                      const isOverdue = dateOnly(inv.dueDate) < today && inv.status !== 'Lunas';

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">{inv.invoiceNumber}</td>
                          <td className="p-3.5 font-bold text-slate-700">{inv.customerName}</td>
                          <td className={`p-3.5 font-mono ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                            {formatDate(inv.dueDate)}
                          </td>
                          <td className="p-3.5 font-mono font-black text-slate-900">
                            {receivablesTab === 'outstanding' ? formatIDR(remaining) : formatIDR(inv.total)}
                          </td>
                          <td className="p-3.5">
                            <StatusPill tone={isOverdue ? 'rose' : getInvoiceTone(inv.status)}>
                              {isOverdue ? 'Overdue' : 
                               inv.status === 'Lunas' ? 'Lunas' : 
                               inv.status === 'Sebagian Dibayar' ? 'Sebagian Dibayar' : 
                               inv.status === 'Belum Lunas' ? 'Belum Lunas' : inv.status}
                            </StatusPill>
                          </td>
                          <td className="p-3.5 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {remaining > 0 && inv.status !== 'Dibatalkan' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={<DollarSign size={13} />}
                                  onClick={() => handleOpenReceivePayment(inv)}
                                >
                                  Terima Pembayaran
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={<Eye size={13} />}
                                onClick={() => { setSelectedInvoiceDetail(inv); setShowInvoiceDetail(true); }}
                              >
                                Detail
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalArPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                  <span className="text-slate-500 text-[11px]">Halaman {arPage} dari {totalArPages}</span>
                  <div className="flex gap-1">
                    <button 
                      disabled={arPage === 1}
                      onClick={() => setArPage(prev => prev - 1)}
                      className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button 
                      disabled={arPage === totalArPages}
                      onClick={() => setArPage(prev => prev + 1)}
                      className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Panel>}

        {/* Payables Table */}
        {ledgerMode === 'ap' && <Panel className="overflow-hidden">
          <div className="flex flex-col bg-slate-50/50">
            <div className="p-4 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">AP Aging - Outstanding Payable</h4>
              <StatusPill tone={payablesTab === 'outstanding' ? 'amber' : 'emerald'}>
                {payablesTab === 'outstanding' ? 'Pembayaran Keluar' : 'AP Lunas'}
              </StatusPill>
            </div>
            <div className="px-4 flex gap-6 border-b border-slate-200 justify-between items-center">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setPayablesTab('outstanding')}
                  className={`py-2 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all ${payablesTab === 'outstanding' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Belum Dibayar ({payables.filter(p => p.status !== 'Lunas').length})
                </button>
                <button
                  type="button"
                  onClick={() => setPayablesTab('lunas')}
                  className={`py-2 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all ${payablesTab === 'lunas' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Riwayat Lunas ({payables.filter(p => p.status === 'Lunas').length})
                </button>
              </div>
              <div className="pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari No AP / Supplier..."
                    value={apSearch}
                    onChange={(e) => setApSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 min-w-[200px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin text-slate-400" size={20} />
            </div>
          ) : paginatedAp.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle size={20} className="mx-auto mb-1 text-emerald-500" />
              <p>{payablesTab === 'outstanding' ? 'Tidak ada outstanding payable.' : 'Tidak ada riwayat outstanding payable lunas.'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                      <th className="p-3.5 pl-5">No. AP</th>
                      <th className="p-3.5">Supplier</th>
                      <th className="p-3.5">Jatuh Tempo</th>
                      <th className="p-3.5">{payablesTab === 'outstanding' ? 'Sisa Payable' : 'Total Lunas'}</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 pr-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedAp.map((payable) => {
                      const remaining = payable.amount - payable.paidAmount;
                      const isOverdue = !!payable.dueDate && dateOnly(payable.dueDate) < today && payable.status !== 'Lunas';

                      return (
                        <tr key={payable.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 pl-5 font-mono font-bold text-cyan-600">{payable.payableNumber}</td>
                          <td className="p-3.5 font-bold text-slate-700">{payable.supplierName}</td>
                          <td className={`p-3.5 font-mono ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                            {formatDate(payable.dueDate)}
                          </td>
                          <td className="p-3.5 font-mono font-black text-slate-900">
                            {payablesTab === 'outstanding' ? formatIDR(remaining) : formatIDR(payable.amount)}
                          </td>
                          <td className="p-3.5">
                            <StatusPill tone={isOverdue ? 'rose' : payable.status === 'Lunas' ? 'emerald' : payable.status === 'Open' ? 'amber' : 'cyan'}>
                              {isOverdue ? 'Overdue' : 
                               payable.status === 'Lunas' ? 'Lunas' : 
                               payable.status === 'Open' ? 'Belum Dibayar' : 'Sebagian Dibayar'}
                            </StatusPill>
                          </td>
                          <td className="p-3.5 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {payablesTab === 'outstanding' && remaining > 0 && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={<HandCoins size={13} />}
                                  onClick={() => handlePaySupplier(payable)}
                                >
                                  Bayar Hutang
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={<Eye size={13} />}
                                onClick={() => { setSelectedPayableDetail(payable); setShowPayableDetail(true); }}
                              >
                                Detail
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalApPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                  <span className="text-slate-500 text-[11px]">Halaman {apPage} dari {totalApPages}</span>
                  <div className="flex gap-1">
                    <button 
                      disabled={apPage === 1}
                      onClick={() => setApPage(prev => prev - 1)}
                      className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button 
                      disabled={apPage === totalApPages}
                      onClick={() => setApPage(prev => prev + 1)}
                      className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Panel>}
      </div>

      {/* AP Payment Modal */}
      {showPaymentModal && selectedPayable && (() => {
        const remainingAp = selectedPayable.amount - selectedPayable.paidAmount;
        const currentAccount = accounts.find((a) => a.id === selectedAccountId);
        const currentBalance = currentAccount ? Number(currentAccount.balance || 0) : 0;
        const isBalanceInsufficient = currentAccount && currentBalance < paymentAmount;

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans text-xs">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <HandCoins size={16} className="text-sky-400" />
                  Bayar Hutang Supplier (AP)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={submitPayment}>
                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                  {/* Summary Card */}
                  <div className="bg-sky-50/60 border border-sky-100 p-3.5 rounded-xl text-slate-700">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-500 font-medium">Dokumen Hutang (AP):</span>
                      <span className="font-mono font-bold text-sky-700">{selectedPayable.payableNumber}</span>
                    </div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-500 font-medium">Supplier:</span>
                      <span className="font-bold text-slate-800">{selectedPayable.supplierName}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-sky-100">
                      <span className="font-bold text-slate-800">Sisa Hutang:</span>
                      <span className="font-mono font-black text-rose-600">{formatIDR(remainingAp)}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      Metode Pembayaran <span className="text-rose-500">*</span>
                    </label>
                    <PaymentMethodSelector
                      value={paymentMethod}
                      onChange={(method) => setPaymentMethod(method)}
                    />
                  </div>

                  {/* Account Selector */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                        Sumber Rekening Bank / Kas <span className="text-rose-500">*</span>
                      </label>
                      {currentAccount && (
                        <span className={`text-[10px] font-mono font-semibold ${isBalanceInsufficient ? 'text-rose-600' : 'text-slate-500'}`}>
                          Saldo: {formatIDR(currentBalance)}
                        </span>
                      )}
                    </div>
                    <select
                      required
                      value={selectedAccountId}
                      onChange={(e) => handleAccountChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-medium text-slate-700"
                    >
                      <option value="" disabled>-- Pilih Rekening Sumber --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          [{acc.type === 'Bank' || acc.type === 'bank' ? 'BANK' : acc.type?.toUpperCase() || 'KAS'}] {acc.name} - Saldo: {formatIDR(Number(acc.balance))}
                        </option>
                      ))}
                    </select>
                    {isBalanceInsufficient && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <AlertCircle size={14} className="shrink-0 text-amber-600" />
                        <span>Peringatan: Saldo rekening saat ini ({formatIDR(currentBalance)}) lebih kecil dari nominal yang akan dibayarkan.</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Amount */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      Nominal Pembayaran <span className="text-rose-500">*</span>
                    </label>
                    <CurrencyInput
                      required
                      value={paymentAmount || ''}
                      onValueChange={(val) => setPaymentAmount(Number(val))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-mono font-bold text-slate-900"
                      placeholder="0"
                    />
                    <QuickPercentButtons
                      totalAmount={remainingAp}
                      onSelectAmount={(val) => setPaymentAmount(val)}
                    />
                  </div>

                  {/* Payment Date & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                        Tanggal Pembayaran
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                        Catatan Pembayaran
                      </label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Contoh: Pembayaran termin 1"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmittingPayment}
                    icon={<HandCoins size={14} />}
                  >
                    Bayar Sekarang
                  </Button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* AR Payment Modal */}
      {showArPaymentModal && selectedInvoiceForPayment && (() => {
        const remainingAr = selectedInvoiceForPayment.total - selectedInvoiceForPayment.paidAmount;
        const currentAccount = accounts.find((a) => a.id === arSelectedAccountId);
        const currentBalance = currentAccount ? Number(currentAccount.balance || 0) : 0;

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans text-xs">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <DollarSign size={16} className="text-sky-400" />
                  Terima Pembayaran Piutang (AR)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowArPaymentModal(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={submitArPayment}>
                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                  {/* Summary Card */}
                  <div className="bg-sky-50/60 border border-sky-100 p-3.5 rounded-xl text-slate-700">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-500 font-medium">No. Faktur (Invoice):</span>
                      <span className="font-mono font-bold text-sky-700">{selectedInvoiceForPayment.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-500 font-medium">Customer:</span>
                      <span className="font-bold text-slate-800">{selectedInvoiceForPayment.customerName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-sky-100/70 text-[11px]">
                      <div>
                        <span className="text-slate-400">Total Faktur:</span>
                        <div className="font-mono font-bold text-slate-800">{formatIDR(selectedInvoiceForPayment.total)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Sudah Dibayar:</span>
                        <div className="font-mono font-bold text-emerald-700">{formatIDR(selectedInvoiceForPayment.paidAmount)}</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm pt-1">
                      <span className="font-bold text-slate-800">Sisa Piutang:</span>
                      <span className="font-mono font-black text-rose-600">{formatIDR(remainingAr)}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      Metode Pembayaran Pelanggan <span className="text-rose-500">*</span>
                    </label>
                    <PaymentMethodSelector
                      value={arPaymentMethod}
                      onChange={(method) => setArPaymentMethod(method)}
                    />
                  </div>

                  {/* Destination Account */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                        Rekening / Kas Penerima Setoran <span className="text-rose-500">*</span>
                      </label>
                      {currentAccount && (
                        <span className="text-[10px] font-mono font-semibold text-slate-500">
                          Saldo saat ini: {formatIDR(currentBalance)}
                        </span>
                      )}
                    </div>
                    <select
                      required
                      value={arSelectedAccountId}
                      onChange={(e) => handleArAccountChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-medium text-slate-700"
                    >
                      <option value="" disabled>-- Pilih Rekening Penerima --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          [{acc.type === 'Bank' || acc.type === 'bank' ? 'BANK' : acc.type?.toUpperCase() || 'KAS'}] {acc.name} - Saldo: {formatIDR(Number(acc.balance))}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Amount */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      Nominal Pembayaran Diterima <span className="text-rose-500">*</span>
                    </label>
                    <CurrencyInput
                      required
                      value={arPaymentAmount || ''}
                      onValueChange={(val) => setArPaymentAmount(Number(val))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-mono font-bold text-slate-900"
                      placeholder="0"
                    />
                    <QuickPercentButtons
                      totalAmount={remainingAr}
                      onSelectAmount={(val) => setArPaymentAmount(val)}
                    />
                  </div>

                  {/* Date & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                        Tanggal Penerimaan
                      </label>
                      <input
                        type="date"
                        value={arPaymentDate}
                        onChange={(e) => setArPaymentDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                        Catatan Penerimaan
                      </label>
                      <input
                        type="text"
                        value={arPaymentNotes}
                        onChange={(e) => setArPaymentNotes(e.target.value)}
                        placeholder="Contoh: Setoran transfer customer"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Auto-verify Toggle */}
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl text-emerald-800">
                    <input
                      type="checkbox"
                      id="arAutoVerify"
                      checked={arAutoVerify}
                      onChange={(e) => setArAutoVerify(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="arAutoVerify" className="text-[11px] font-medium cursor-pointer">
                      <strong>Verifikasi Otomatis:</strong> Langsung membukukan transaksi kas masuk dan memotong sisa piutang faktur.
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setShowArPaymentModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmittingArPayment}
                    icon={<DollarSign size={14} />}
                  >
                    Simpan Pembayaran
                  </Button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* AR Detail Modal */}
      {showInvoiceDetail && selectedInvoiceDetail && (() => {
        const remainingAr = selectedInvoiceDetail.total - selectedInvoiceDetail.paidAmount;

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans text-xs">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-bold">Detail AR (Invoice)</h3>
                <button
                  type="button"
                  onClick={() => setShowInvoiceDetail(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">No. Invoice</div>
                    <div className="font-mono font-bold text-sky-600 text-sm">{selectedInvoiceDetail.invoiceNumber}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Customer</div>
                    <div className="font-bold text-slate-800">{selectedInvoiceDetail.customerName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Tanggal Invoice</div>
                    <div>{formatDate(selectedInvoiceDetail.date)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Jatuh Tempo</div>
                    <div className="font-bold">{formatDate(selectedInvoiceDetail.dueDate)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Faktur</div>
                    <div className="font-mono font-bold">{formatIDR(selectedInvoiceDetail.total)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Sudah Dibayar</div>
                    <div className="font-mono font-bold text-emerald-700">{formatIDR(selectedInvoiceDetail.paidAmount)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Sisa Piutang</div>
                    <div className="font-mono font-bold text-rose-600">{formatIDR(remainingAr)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
                    <div className="mt-1">
                      <StatusPill tone={selectedInvoiceDetail.status === 'Lunas' ? 'emerald' : 'amber'}>
                        {selectedInvoiceDetail.status}
                      </StatusPill>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setShowInvoiceDetail(false)}
                  >
                    Tutup
                  </Button>
                  {selectedInvoiceDetail.status !== 'Dibatalkan' && remainingAr > 0 && (
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      icon={<DollarSign size={14} />}
                      onClick={() => {
                        handleOpenReceivePayment(selectedInvoiceDetail);
                      }}
                    >
                      Terima Pembayaran
                    </Button>
                  )}
                  {selectedInvoiceDetail.status !== 'Dibatalkan' && (
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      onClick={() => handleCancelInvoice(selectedInvoiceDetail.id, selectedInvoiceDetail.invoiceNumber)}
                    >
                      Batalkan Invoice
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* AP Detail Modal */}
      {showPayableDetail && selectedPayableDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans text-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
              <h3 className="font-bold">Detail AP (Payable)</h3>
              <button onClick={() => setShowPayableDetail(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">No. AP</div>
                  <div className="font-mono font-bold text-cyan-600 text-sm">{selectedPayableDetail.payableNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Supplier</div>
                  <div className="font-bold text-slate-800">{selectedPayableDetail.supplierName}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Jatuh Tempo</div>
                  <div className="font-bold">{formatDate(selectedPayableDetail.dueDate)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
                  <div className="mt-1">
                    <StatusPill tone={selectedPayableDetail.status === 'Lunas' ? 'emerald' : 'amber'}>
                      {selectedPayableDetail.status}
                    </StatusPill>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                  <div className="font-mono font-bold">{formatIDR(selectedPayableDetail.amount)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sisa Payable</div>
                  <div className="font-mono font-bold text-rose-600">{formatIDR(selectedPayableDetail.amount - selectedPayableDetail.paidAmount)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Catatan</div>
                  <div>{(selectedPayableDetail as any).notes || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
