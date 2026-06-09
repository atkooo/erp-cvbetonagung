import React, { useState, useEffect } from 'react';
import {
  WalletCards, Plus, RefreshCw, AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, X
} from './icons';
import Swal from 'sweetalert2';
import { financeApi } from '../features/finance/api';
import { AccountDto, CashTransactionDto, CreateCashTransactionDto } from '../features/finance/types';

interface CashExpenseViewProps {
  onTriggerNotification: (message: string) => void;
}

const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const formatIDR = (num: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

export default function CashExpenseView({ onTriggerNotification }: CashExpenseViewProps) {
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [transactions, setTransactions] = useState<CashTransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    account_id: '',
    type: 'out' as 'in' | 'out',
    amount: '',
    category: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const cashBank = await financeApi.getCashBank();
      setAccounts(cashBank.accounts);
      setTransactions(cashBank.cashTransactions);
    } catch (error) {
      console.error('Error fetching cash data:', error);
      onTriggerNotification('Gagal memuat data kas & biaya.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.amount || !formData.category) {
      Swal.fire('Error', 'Lengkapi semua field wajib!', 'error');
      return;
    }

    try {
      const payload: CreateCashTransactionDto = {
        transaction_number: `TRX-${new Date().getTime()}`,
        account_id: formData.account_id,
        transaction_date: formData.transaction_date,
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || undefined
      };

      await financeApi.createCashTransaction(payload);
      
      Swal.fire('Sukses', 'Transaksi berhasil dicatat.', 'success');
      onTriggerNotification(`Transaksi ${formData.type === 'in' ? 'pemasukan' : 'pengeluaran'} sebesar ${formatIDR(parseFloat(formData.amount))} berhasil dicatat.`);
      setShowModal(false);
      
      // Reset form
      setFormData({
        account_id: '',
        type: 'out',
        amount: '',
        category: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      
      fetchData();
    } catch (error) {
      console.error('Error creating transaction:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan transaksi.', 'error');
    }
  };

  const totalAssets = accounts
    .filter(a => a.type === 'asset')
    .reduce((sum, a) => sum + parseFloat(a.balance as string), 0);

  const thisMonthExpenses = transactions
    .filter(t => t.type === 'out' && new Date(t.transaction_date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

  return (
    <div className="space-y-6 text-xs font-sans">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg"><WalletCards size={20} /></div>
        <div>
          <h3 className="font-sans font-bold text-sm text-slate-800">Kas & Biaya Operasional</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Kelola arus kas masuk, pengeluaran pabrik, dan saldo rekening bank.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Panel className="p-4 bg-gradient-to-br from-cyan-600 to-cyan-800 text-white border-none">
          <span className="text-[10px] uppercase font-mono font-bold opacity-80">Total Saldo Kas & Bank</span>
          <div className="mt-1.5 flex items-center justify-between">
            <strong className="text-xl font-black">{formatIDR(totalAssets)}</strong>
          </div>
        </Panel>
        
        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Pengeluaran Bulan Ini</span>
          <div className="mt-1.5 flex items-center gap-2">
            <ArrowUpRight size={16} className="text-rose-500" />
            <strong className="text-base font-black text-slate-900">{formatIDR(thisMonthExpenses)}</strong>
          </div>
        </Panel>
      </div>

      {/* Saldo Akun Section */}
      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mt-6">Daftar Akun Kas & Bank</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.filter(a => a.type === 'asset').map(acc => (
          <Panel key={acc.id} className="p-4 flex flex-col justify-between hover:border-cyan-200 transition">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded">{acc.code}</span>
                <h5 className="font-bold text-slate-800 mt-2">{acc.name}</h5>
              </div>
            </div>
            <strong className="text-lg font-black text-slate-900 mt-3">{formatIDR(parseFloat(acc.balance as string))}</strong>
          </Panel>
        ))}
      </div>

      {/* Histori Transaksi Section */}
      <Panel className="overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Histori Transaksi Terakhir</h4>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="px-3 py-1.5 border bg-white hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition"
            >
              <Plus size={12} />
              <span>Catat Transaksi</span>
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="animate-spin text-slate-400" size={20} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <AlertTriangle size={20} className="mx-auto mb-1 text-slate-300" />
            <p>Belum ada transaksi dicatat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-widest font-mono text-slate-500">
                  <th className="p-3.5 pl-5">Tanggal</th>
                  <th className="p-3.5">No. Transaksi</th>
                  <th className="p-3.5">Akun</th>
                  <th className="p-3.5">Kategori / Keterangan</th>
                  <th className="p-3.5 text-right pr-5">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3.5 pl-5 font-mono text-slate-500">{t.transaction_date}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">{t.transaction_number}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border">
                        {t.account?.name || '-'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-700">{t.category}</div>
                      {t.description && <div className="text-slate-400 text-[10px] mt-0.5">{t.description}</div>}
                    </td>
                    <td className="p-3.5 text-right pr-5 font-mono font-black flex justify-end items-center gap-1.5">
                      {t.type === 'in' ? (
                        <span className="text-emerald-600 flex items-center gap-1"><ArrowDownRight size={12}/> + {formatIDR(parseFloat(t.amount as string))}</span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1"><ArrowUpRight size={12}/> - {formatIDR(parseFloat(t.amount as string))}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Modal Input Transaksi */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Catat Transaksi Kas</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTransaction} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Jenis Transaksi</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 bg-white"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'in' | 'out'})}
                  >
                    <option value="out">Uang Keluar (Expense)</option>
                    <option value="in">Uang Masuk (Income)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Tanggal</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 bg-white"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Akun Sumber / Tujuan</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 bg-white"
                  value={formData.account_id}
                  onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                  required
                >
                  <option value="">-- Pilih Akun --</option>
                  {accounts.filter(a => a.type === 'asset').map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} - {formatIDR(parseFloat(acc.balance as string))}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Kategori Transaksi</label>
                {formData.type === 'out' ? (
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 bg-white"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {accounts.filter(a => a.type === 'expense').map(acc => (
                      <option key={acc.id} value={acc.name}>{acc.name}</option>
                    ))}
                    <option value="Biaya Lainnya">Biaya Lainnya</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Cth: Pencairan Giro, Modal Tambahan"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Nominal (Rp)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Keterangan / Catatan</label>
                <input
                  type="text"
                  placeholder="Keterangan tambahan..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
