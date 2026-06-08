import React from "react";
import { User } from "../icons";

import { StockMovement } from "../../types";

interface OutwardTabProps {
  stockMovements: StockMovement[];
  search: string;
}

export const OutwardTab: React.FC<OutwardTabProps> = ({ stockMovements, search }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left font-sans text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-widest font-mono text-[10px]">
            <th className="p-3.5 pl-5">No Transaksi</th>
            <th className="p-3.5">Tanggal Keluar</th>
            <th className="p-3.5">Referensi SO No</th>
            <th className="p-3.5">SKU No.</th>
            <th className="p-3.5">Deskripsi Barang</th>
            <th className="p-3.5 text-center">Jumlah Keluar</th>
            <th className="p-3.5">Kurir / Handler</th>
            <th className="p-3.5 pr-5">Tujuan Distribusi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {stockMovements
            .filter(
              (m) =>
                m.type === "Keluar" &&
                (m.productName.toLowerCase().includes(search.toLowerCase()) ||
                  m.sku.toLowerCase().includes(search.toLowerCase()) ||
                  m.referenceDoc.toLowerCase().includes(search.toLowerCase())),
            )
            .map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/40">
                <td className="p-3.5 pl-5 font-mono text-slate-400">
                  {m.id}
                </td>
                <td className="p-3.5 font-mono text-slate-600">
                  {m.date}
                </td>
                <td className="p-3.5 font-mono font-bold text-indigo-600">
                  {m.referenceDoc}
                </td>
                <td className="p-3.5 font-mono font-semibold text-slate-700">
                  {m.sku}
                </td>
                <td className="p-3.5 font-bold text-slate-800">
                  {m.productName}
                </td>
                <td className="p-3.5 text-center font-semibold text-rose-600 font-mono">
                  -{m.quantity}
                </td>
                <td className="p-3.5 text-slate-600 flex items-center gap-1.5 pt-4">
                  <User size={12} className="text-slate-400" />
                  <span>{m.handler}</span>
                </td>
                <td
                  className="p-3.5 pr-5 text-slate-500 max-w-[150px] truncate"
                  title={m.notes}
                >
                  {m.notes}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
