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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Wallet className="w-8 h-8 text-indigo-500" />
          Buku Kas & Bank
        </h1>
        <p className="text-slate-500 mt-2">Kelola daftar rekening bank, kas kecil, dan dompet digital untuk pencatatan transaksi pembayaran.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari kode atau nama akun..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none w-80"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchAccounts}
              className="p-2 border-2 border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Tambah Akun
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-600">Kode Akun</th>
                <th className="p-4 font-semibold text-slate-600">Nama Akun</th>
                <th className="p-4 font-semibold text-slate-600">Jenis</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Saldo Saat Ini</th>
                <th className="p-4 font-semibold text-slate-600 text-center">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Memuat data akun...</td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Tidak ada akun yang ditemukan.</td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <span className="font-mono text-slate-600 font-medium">{account.code}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{account.name}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        account.type === 'cash' ? 'bg-emerald-100 text-emerald-700' : 
                        account.type === 'bank' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {account.type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-indigo-600">
                      {formatRupiah(parseFloat(account.balance.toString()))}
                    </td>
                    <td className="p-4 text-center">
                      {account.is_active ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Aktif</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Tidak Aktif</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(account)}
                          className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                          title="Edit Akun"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(account.id, account.name)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
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
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Akun Kas/Bank' : 'Tambah Akun Baru'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Kode Akun *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full p-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Jenis Akun</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full p-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                    >
                      <option value="cash">Kas Tunai (Laci)</option>
                      <option value="bank">Rekening Bank</option>
                      <option value="ewallet">Dompet Digital (QRIS)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nama Akun *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kas Kecil, BCA 12345678"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Keterangan / Deskripsi</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ml-3 text-sm font-bold text-slate-700">Akun Aktif (Muncul di Kasir)</span>
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
