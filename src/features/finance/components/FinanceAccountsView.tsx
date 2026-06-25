import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Wallet, RefreshCcw, Search } from 'lucide-react';
import { financeApi } from '../api';
import { AccountDto } from '../types';

export const FinanceAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'cash',
    currency: 'IDR',
    description: '',
    is_active: true
  });

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await financeApi.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenModal = (account?: AccountDto) => {
    if (account) {
      setEditingId(account.id);
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        currency: account.currency || 'IDR',
        description: account.description || '',
        is_active: account.is_active
      });
    } else {
      setEditingId(null);
      setFormData({
        code: `ACC-${Date.now().toString().slice(-4)}`,
        name: '',
        type: 'cash',
        currency: 'IDR',
        description: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        await financeApi.updateAccount(editingId, formData);
      } else {
        await financeApi.createAccount(formData);
      }
      setShowModal(false);
      fetchAccounts();
    } catch (error) {
      console.error('Failed to save account:', error);
      alert('Gagal menyimpan data akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Anda yakin ingin menghapus akun ${name}? Penghapusan akun yang sudah memiliki transaksi dapat menyebabkan error sistem.`)) {
      try {
        await financeApi.deleteAccount(id);
        fetchAccounts();
      } catch (error) {
        console.error('Failed to delete account:', error);
        alert('Gagal menghapus akun. Mungkin akun ini sudah terhubung dengan transaksi.');
      }
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6 text-xs font-sans">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg"><Wallet size={20} /></div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800">Buku Kas & Bank</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Kelola daftar rekening bank, kas kecil, dan dompet digital untuk pencatatan transaksi pembayaran.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari kode atau nama akun..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:border-cyan-500 outline-none w-64 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAccounts}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              Tambah Akun
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest font-mono text-slate-500">
                <th className="p-3.5 pl-5">Kode Akun</th>
                <th className="p-3.5">Nama Akun</th>
                <th className="p-3.5 text-center">Jenis</th>
                <th className="p-3.5 text-right">Saldo Saat Ini</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Memuat data akun...</td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Tidak ada akun yang ditemukan.</td>
                </tr>
              ) : (
                paginatedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-3.5 pl-5">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{account.code}</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{account.name}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        account.type === 'cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        account.type === 'bank' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {account.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                      {formatRupiah(parseFloat(account.balance.toString()))}
                    </td>
                    <td className="p-3.5 text-center">
                      {account.is_active ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">Aktif</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">Tidak Aktif</span>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(account)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Akun"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(account.id, account.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-200">
            <div className="text-[10px] text-slate-400 font-mono">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredAccounts.length)} dari {filteredAccounts.length} data
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
              >
                Prev
              </button>
              <span className="text-slate-500 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">
                {editingId ? 'Edit Akun Kas/Bank' : 'Tambah Akun Baru'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kode Akun *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-cyan-500 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jenis Akun</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-cyan-500 outline-none text-xs"
                    >
                      <option value="cash">Kas Tunai (Laci)</option>
                      <option value="bank">Rekening Bank</option>
                      <option value="ewallet">Dompet Digital (QRIS)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Akun *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kas Kecil, BCA 12345678"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-cyan-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Keterangan / Deskripsi</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-cyan-500 outline-none text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                    <span className="ml-3 text-[11px] font-bold text-slate-700">Akun Aktif (Muncul di Kasir)</span>
                  </label>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
