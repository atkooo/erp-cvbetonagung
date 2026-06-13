import React from "react";
import { Clock, ArrowDownCircle, ArrowUpCircle } from "../icons";

import { StockMovement } from "../../types";

interface HistoryTabProps {
  stockMovements: StockMovement[];
  search: string;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  stockMovements,
  search,
}) => {
  return (
    <div className="p-6">
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
        <Clock size={16} className="text-cyan-500" />
        <span>Timeline Log Mutasi Fisik Sejarah Gudang</span>
      </h4>

      <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
        {stockMovements
          .filter(
            (m) =>
              m.productName.toLowerCase().includes(search.toLowerCase()) ||
              m.sku.toLowerCase().includes(search.toLowerCase()),
          )
          .map((m, idx) => (
            <div key={idx} className="relative text-xs">
              {/* Circle indicators */}
              <span
                className={`absolute -left-7.5 top-0 p-1 rounded-full text-white ${
                  m.type === "Masuk" ? "bg-emerald-500" : "bg-rose-500"
                }`}
              >
                {m.type === "Masuk" ? (
                  <ArrowDownCircle size={12} />
                ) : (
                  <ArrowUpCircle size={12} />
                )}
              </span>

              {/* Timeline box layout */}
              <div className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-xl border border-slate-200 max-w-2xl transition-colors">
                <div className="flex md:items-center justify-between flex-col md:flex-row gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] bg-slate-200/60 font-black text-slate-700 px-1.5 py-0.5 rounded">
                      {m.sku}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                        m.type === "Masuk"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      MUTASI {m.type.toUpperCase()}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {m.date}
                  </span>
                </div>

                <h5 className="font-bold text-slate-800 mt-2">
                  {m.productName}
                </h5>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kuantitas:{" "}
                  <strong className="text-slate-700">
                    {m.quantity} Pcs / Unit
                  </strong>{" "}
                  | Dokumen:{" "}
                  <strong className="text-cyan-600 font-mono">
                    {m.referenceDoc}
                  </strong>
                </p>

                {m.notes && (
                  <div className="mt-2.5 pt-1.5 border-t border-slate-200/50 text-[10px] text-slate-400 italic">
                    Catatan: {m.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
