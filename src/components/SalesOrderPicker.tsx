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
import { SalesOrder } from "../types";
import { salesApi } from "../features/sales/api";
import { formatDate } from "../utils/date";

interface SalesOrderPickerProps {
  value?: string; // Sales Order Number or ID
  onChange: (so: SalesOrder) => void;
  onClear?: () => void;
  statusFilter?: string; // e.g. "Disetujui"
  placeholder?: string;
  className?: string;
}

export default function SalesOrderPicker({
  value,
  onChange,
  onClear,
  statusFilter = "",
  placeholder = "Pilih Referensi Sales Order...",
  className = "",
}: SalesOrderPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // To display the selected SO in the button
  const selectedSo = salesOrders.find(
    (so) => so.orderNumber === value || so.id === value,
  );

  useEffect(() => {
    if ((isOpen || value) && salesOrders.length === 0) {
      loadData();
    }
  }, [isOpen, value, salesOrders.length]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Remove 'erp' filter to allow picking PO-generating Sales Orders from POS
      const data = await salesApi.getSalesOrders();

      // Only show open transactions (exclude completed and cancelled)
      let filtered = data.filter((so) => so.status !== 'Selesai' && so.status !== 'Dibatalkan');

      if (statusFilter) {
        filtered = filtered.filter((so) => so.status === statusFilter);
      }

      setSalesOrders(filtered);
    } catch (error) {
      console.error("Failed to load Sales Orders", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSOs = salesOrders.filter(
    (so) =>
      so.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      so.customerName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (so: SalesOrder) => {
    onChange(so);
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
          {isLoading && value && !selectedSo ? (
            <div className="h-4 bg-slate-200 animate-pulse rounded w-1/3"></div>
          ) : (
            <span
              className={`text-xs truncate ${selectedSo ? "text-slate-800 font-bold font-mono" : "text-slate-400"}`}
            >
              {selectedSo ? selectedSo.orderNumber : value || placeholder}
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
                    Pilih Referensi Sales Order{" "}
                    {statusFilter ? `(${statusFilter})` : ""}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Pilih dari daftar Sales Order
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
                  placeholder="Cari berdasarkan No SO, Nama Customer..."
                  className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  autoFocus
                />
              </div>
            </div>

            {/* SO List */}
            <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Memuat data Sales Order...
                </div>
              ) : filteredSOs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Data Sales Order tidak ditemukan.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredSOs.map((so) => (
                    <div
                      key={so.id}
                      onClick={() => handleSelect(so)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between
                        ${
                          value === so.id || value === so.orderNumber
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
                            {so.orderNumber}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {so.customerName}
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                              {so.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 mb-0.5">
                            Tanggal Order
                          </div>
                          <div className="text-xs font-bold text-slate-800">
                            {formatDate(so.date)}
                          </div>
                        </div>
                        {(value === so.id || value === so.orderNumber) && (
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
