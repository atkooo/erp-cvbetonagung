/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  ShoppingCart,
  Check,
  FileText,
} from "@/src/components/icons";
import { Rfq } from "../types";
import { purchasingApi } from "../features/purchasing/api";
import { formatDate } from "../utils/date";

interface RfqPickerProps {
  value?: string; // RFQ Number that is currently selected
  onChange: (rfq: Rfq) => void;
  onClear?: () => void;
  statusFilter?: string; // e.g. "Selesai"
  placeholder?: string;
  className?: string;
}

export default function RfqPicker({
  value,
  onChange,
  onClear,
  statusFilter = "Selesai",
  placeholder = "Pilih Referensi RFQ...",
  className = "",
}: RfqPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // To display the selected RFQ in the button
  const selectedRfq = rfqs.find(
    (rfq) => rfq.rfqNumber === value || rfq.id === value,
  );

  useEffect(() => {
    if ((isOpen || value) && rfqs.length === 0) {
      loadData();
    }
  }, [isOpen, value, rfqs.length]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await purchasingApi.getRfqs();

      const filtered = statusFilter
        ? data.filter((rfq) => rfq.status === statusFilter)
        : data;

      setRfqs(filtered);
    } catch (error) {
      console.error("Failed to load RFQs", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRfqs = rfqs.filter(
    (rfq) =>
      rfq.rfqNumber.toLowerCase().includes(search.toLowerCase()) ||
      rfq.supplierName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (rfq: Rfq) => {
    onChange(rfq);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(true)}
        className={`w-full p-2.5 border rounded-lg flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50 transition-colors ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden w-full">
          <FileText size={16} className="text-slate-400 shrink-0" />
          {isLoading && value && !selectedRfq ? (
            <div className="h-4 bg-slate-200 animate-pulse rounded w-1/3"></div>
          ) : (
            <span
              className={`text-xs truncate ${selectedRfq ? "text-slate-800 font-bold font-mono" : "text-slate-400"}`}
            >
              {selectedRfq ? selectedRfq.rfqNumber : value || placeholder}
            </span>
          )}
        </div>
        {value && onClear && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-rose-500 rounded-full transition-colors ml-2 shrink-0"
            title="Batalkan Referensi"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Modal Picker */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-slate-50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-100 text-cyan-600 rounded">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Pilih Referensi RFQ{" "}
                    {statusFilter ? `(${statusFilter})` : ""}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Pilih dari daftar RFQ yang sudah Diterima / Selesai
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-2.5 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan No RFQ, Nama Vendor..."
                  className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  autoFocus
                />
              </div>
            </div>

            {/* RFQ List */}
            <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Memuat data RFQ...
                </div>
              ) : filteredRfqs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Data RFQ dengan status '{statusFilter}' tidak ditemukan.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredRfqs.map((rfq) => (
                    <div
                      key={rfq.id}
                      onClick={() => handleSelect(rfq)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between
                        ${
                          value === rfq.id || value === rfq.rfqNumber
                            ? "bg-cyan-50 border-cyan-300 ring-1 ring-cyan-500"
                            : "bg-white border-slate-200 hover:border-cyan-300 hover:shadow-sm"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 border flex items-center justify-center shrink-0">
                          <FileText size={20} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800 font-mono">
                            {rfq.rfqNumber}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {rfq.supplierName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 mb-0.5">
                            Berlaku Sampai
                          </div>
                          <div className="text-xs font-bold text-slate-800">
                            {formatDate(rfq.validUntil)}
                          </div>
                        </div>
                        {(value === rfq.id || value === rfq.rfqNumber) && (
                          <div className="text-cyan-600">
                            <Check size={20} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
