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
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 15;

  const filteredMovements = stockMovements.filter(
    (m) =>
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 if search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Clock size={16} className="text-cyan-500" />
          <span>Timeline Log Mutasi Fisik Sejarah Gudang</span>
        </h4>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              Prev
            </button>
            <span className="text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
        {paginatedMovements.length === 0 ? (
          <div className="text-xs text-slate-400 italic">Tidak ada log mutasi ditemukan.</div>
        ) : (
          paginatedMovements.map((m, idx) => (
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
          ))
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold"
          >
            Previous
          </button>
          <span className="text-slate-500 px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
