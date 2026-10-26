import React, { useState, useEffect } from "react";
import {
  WalletCards,
  Plus,
  RefreshCw,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from "./icons";
import Swal from "sweetalert2";
import { financeApi } from "../features/finance/api";
import {
  AccountDto,
  CashTransactionDto,
  CreateCashTransactionDto,
} from "../features/finance/types";
import CurrencyInput from "./CurrencyInput";
import { Button } from "./ui/Button";

interface CashExpenseViewProps {
  onTriggerNotification: (message: string) => void;
}

const Panel = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 shadow-xs ${className}`}
  >
    {children}
  </div>
);

const formatIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function CashExpenseView({
  onTriggerNotification,
}: CashExpenseViewProps) {
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [transactions, setTransactions] = useState<CashTransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "out" | "in">("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form State
  const [formData, setFormData] = useState({
    account_id: "",
    type: "out" as "in" | "out",
    amount: "",
    category: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
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
      console.error("Error fetching cash data:", error);
      onTriggerNotification("Gagal memuat data kas & biaya.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.amount || !formData.category) {
      Swal.fire("Error", "Lengkapi semua field wajib!", "error");
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
        description: formData.description || undefined,
      };

      await financeApi.createCashTransaction(payload);

      Swal.fire("Sukses", "Transaksi berhasil dicatat.", "success");
      onTriggerNotification(
        `Transaksi ${formData.type === "in" ? "pemasukan" : "pengeluaran"} sebesar ${formatIDR(parseFloat(formData.amount))} berhasil dicatat.`,
      );
      setShowModal(false);

      // Reset form
      setFormData({
        account_id: "",
        type: "out",
        amount: "",
        category: "",
        description: "",
        transaction_date: new Date().toISOString().split("T")[0],
      });

      fetchData();
    } catch (error) {
      console.error("Error creating transaction:", error);
      Swal.fire(
        "Gagal",
        "Terjadi kesalahan saat menyimpan transaksi.",
        "error",
      );
    }
  };

  const totalAssets = accounts
    .filter((a) => a.type === "asset")
    .reduce((sum, a) => sum + parseFloat(a.balance as string), 0);

  const thisMonthExpenses = transactions
    .filter(
      (t) =>
        t.type === "out" &&
        new Date(t.transaction_date).getMonth() === new Date().getMonth(),
    )
    .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.transaction_number.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.account?.name && t.account.name.toLowerCase().includes(q));

    const matchesType = typeFilter === "all" || t.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="space-y-6 text-xs font-sans">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
          <WalletCards size={20} />
        </div>
        <div>
          <h3 className="font-sans font-bold text-sm text-slate-800">
            Beban Operasional
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Pencatatan kas masuk, pengeluaran operasional pabrik, dan saldo kas bank.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Panel className="p-4 bg-gradient-to-br from-sky-600 to-sky-700 text-white border-sky-600 shadow-xs shadow-sky-500/20">
          <span className="text-[10px] uppercase font-mono font-bold opacity-80">
            Total Saldo Kas & Bank
          </span>
          <div className="mt-1.5 flex items-center justify-between">
            <strong className="text-xl font-black">
              {formatIDR(totalAssets)}
            </strong>
          </div>
        </Panel>

        <Panel className="p-4">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
            Pengeluaran Bulan Ini
          </span>
          <div className="mt-1.5 flex items-center gap-2">
            <ArrowUpRight size={16} className="text-rose-500" />
            <strong className="text-base font-black text-slate-900">
              {formatIDR(thisMonthExpenses)}
            </strong>
          </div>
        </Panel>
      </div>

      {/* Saldo Akun Section */}
      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mt-6">
        Daftar Akun Kas & Bank
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts
          .filter((a) => a.type === "asset")
          .map((acc) => (
            <Panel
              key={acc.id}
              className="p-4 flex flex-col justify-between hover:border-sky-300 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-sky-700 font-bold bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-lg">
                    {acc.code}
                  </span>
                  <h5 className="font-bold text-slate-800 mt-2">{acc.name}</h5>
                </div>
              </div>
              <strong className="text-lg font-black text-slate-900 mt-3 font-mono">
                {formatIDR(parseFloat(acc.balance as string))}
              </strong>
            </Panel>
          ))}
      </div>

      {/* Histori Transaksi Section */}
      <Panel className="overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
            Histori Transaksi Beban Operasional
          </h4>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchData}
              title="Refresh Data"
              icon={
                <RefreshCw
                  size={12}
                  className={isLoading ? "animate-spin" : ""}
                />
              }
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowModal(true)}
            >
              Catat Transaksi
            </Button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white">
          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari transaksi, kategori, akun..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:bg-white transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | "out" | "in")
              }
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">Semua Jenis</option>
              <option value="out">Pengeluaran (Beban)</option>
              <option value="in">Pemasukan (Kas Masuk)</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="animate-spin text-slate-400" size={20} />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <AlertTriangle size={20} className="mx-auto mb-1 text-slate-300" />
            <p>
              {transactions.length === 0
                ? "Belum ada transaksi dicatat."
                : "Tidak ada transaksi yang cocok dengan filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-175">
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
                {paginatedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3.5 pl-5 font-mono text-slate-500">
                      {t.transaction_date}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      {t.transaction_number}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {t.account?.name || "-"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-700">
                        {t.category}
                      </div>
                      {t.description && (
                        <div className="text-slate-400 text-[10px] mt-0.5">
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-right pr-5 font-mono font-black flex justify-end items-center gap-1.5">
                      {t.type === "in" ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <ArrowDownRight size={12} /> +{" "}
                          {formatIDR(parseFloat(t.amount as string))}
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <ArrowUpRight size={12} /> -{" "}
                          {formatIDR(parseFloat(t.amount as string))}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        {!isLoading && filteredTransactions.length > 0 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span>Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer text-xs"
              >
                <option value={10}>10 per halaman</option>
                <option value={25}>25 per halaman</option>
                <option value={50}>50 per halaman</option>
              </select>
              <span className="text-slate-300">|</span>
              <span>
                Menampilkan{" "}
                <strong className="text-slate-800 font-mono">
                  {startIndex + 1}
                </strong>{" "}
                -{" "}
                <strong className="text-slate-800 font-mono">
                  {Math.min(
                    startIndex + itemsPerPage,
                    filteredTransactions.length,
                  )}
                </strong>{" "}
                dari{" "}
                <strong className="text-slate-800 font-mono">
                  {filteredTransactions.length}
                </strong>{" "}
                transaksi
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={14} />
                <span>Sebelumnya</span>
              </button>

              <span className="px-3 text-slate-600 font-semibold text-xs">
                Hal {safePage} dari {Math.max(1, totalPages)}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage >= totalPages}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1"
                title="Halaman Berikutnya"
              >
                <span>Berikutnya</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Panel>

      {/* Modal Input Transaksi */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Catat Transaksi Kas & Beban
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTransaction} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Jenis Transaksi
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as "in" | "out",
                      })
                    }
                  >
                    <option value="out">Uang Keluar (Expense)</option>
                    <option value="in">Uang Masuk (Income)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white"
                    value={formData.transaction_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transaction_date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Akun Sumber / Tujuan
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white"
                  value={formData.account_id}
                  onChange={(e) =>
                    setFormData({ ...formData, account_id: e.target.value })
                  }
                  required
                >
                  <option value="">-- Pilih Akun --</option>
                  {accounts
                    .filter((a) => a.type === "asset")
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} -{" "}
                        {formatIDR(parseFloat(acc.balance as string))}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Kategori Transaksi
                </label>
                {formData.type === "out" ? (
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {accounts
                      .filter((a) => a.type === "expense")
                      .map((acc) => (
                        <option key={acc.id} value={acc.name}>
                          {acc.name}
                        </option>
                      ))}
                    <option value="Biaya Lainnya">Biaya Lainnya</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Cth: Pencairan Giro, Modal Tambahan"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Nominal (Rp)
                </label>
                <CurrencyInput
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={formData.amount}
                  onValueChange={(val) =>
                    setFormData({ ...formData, amount: val })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Keterangan / Catatan
                </label>
                <input
                  type="text"
                  placeholder="Keterangan tambahan..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                >
                  Simpan Transaksi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

