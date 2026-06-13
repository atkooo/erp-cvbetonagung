import React from "react";
import { CheckCircle, AlertCircle, ChevronDown, History, Warehouse, ClipboardCheck } from "../icons";
import { Product } from "../../types";

interface StockTabProps {
  products: Product[];
  search: string;
  stockStatusFilter: string;
  categoryFilter: string;
  openStockActionId: string | null;
  setOpenStockActionId: (id: string | null) => void;
  openStockDetailModal: (product: Product) => void;
  onNavigate?: (path: string) => void;
}

export const StockTab: React.FC<StockTabProps> = ({
  products,
  search,
  stockStatusFilter,
  categoryFilter,
  openStockActionId,
  setOpenStockActionId,
  openStockDetailModal,
  onNavigate,
}) => {
  return (
    <div className="overflow-x-auto pb-32">
      <table className="w-full text-left font-sans text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
            <th className="p-3.5 pl-5">SKU No.</th>
            <th className="p-3.5">Nama Item Produk</th>
            <th className="p-3.5">Kategori</th>
            <th className="p-3.5">Sebaran Lokasi</th>
            <th className="p-3.5 text-center">Total Stok</th>
            <th className="p-3.5 text-center">Minimum Stok</th>
            <th className="p-3.5">Status Alaram</th>
            <th className="p-3.5 pr-5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products
            .filter((p) => {
              const matchSrc =
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.sku.toLowerCase().includes(search.toLowerCase());
              const matchStt =
                stockStatusFilter === "All" ||
                p.status === stockStatusFilter;
              const matchCat =
                categoryFilter === "All" ||
                p.category === categoryFilter;
              return matchSrc && matchStt && matchCat;
            })
            .map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/40">
                <td className="p-3.5 pl-5 font-mono font-bold text-slate-700">
                  {p.sku}
                </td>
                <td className="p-3.5 font-bold text-slate-800">
                  {p.name}
                </td>
                <td className="p-3.5 text-slate-500 font-semibold">
                  {p.category}
                </td>
                <td className="p-3.5 text-slate-500 font-medium">
                  {p.location}
                </td>
                <td className="p-3.5 text-center font-mono font-bold text-slate-900 bg-slate-50/10">
                  {p.stock}{" "}
                  <span className="font-normal text-slate-400 text-[10px]">
                    {p.unit}
                  </span>
                </td>
                <td className="p-3.5 text-center font-mono text-slate-400">
                  {p.minStock} {p.unit}
                </td>
                <td className="p-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === "Aman"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : p.status === "Menipis"
                          ? "bg-amber-50 text-amber-700 border border-amber-200 font-semibold"
                          : "bg-red-50 text-red-700 border border-red-200 font-bold"
                    }`}
                  >
                    {p.status === "Aman" && <CheckCircle size={10} />}
                    {p.status === "Menipis" && (
                      <AlertCircle size={10} />
                    )}
                    {p.status === "Habis" && <AlertCircle size={10} />}
                    {p.status}
                  </span>
                </td>
                <td className="p-3.5 pr-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setOpenStockActionId(null);
                        openStockDetailModal(p);
                      }}
                      className="px-2.5 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white rounded text-[10px] font-bold"
                    >
                      Detail
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenStockActionId(
                            openStockActionId === p.id ? null : p.id,
                          )
                        }
                        className="h-7 w-7 inline-flex items-center justify-center border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white rounded transition-colors"
                        title="Aksi lainnya"
                        aria-label={`Aksi lainnya untuk ${p.name}`}
                        aria-expanded={openStockActionId === p.id}
                      >
                        <ChevronDown size={12} />
                      </button>

                      {openStockActionId === p.id && (
                        <div className="absolute right-0 mt-1 z-20 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenStockActionId(null);
                              onNavigate?.("stock-movement-history");
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <History size={12} />
                            <span>Log</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenStockActionId(null);
                              onNavigate?.("multi-warehouse");
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Warehouse size={12} />
                            <span>Transfer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenStockActionId(null);
                              onNavigate?.("stock-opname");
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold text-amber-700 hover:bg-amber-50"
                          >
                            <ClipboardCheck size={12} />
                            <span>Opname</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
