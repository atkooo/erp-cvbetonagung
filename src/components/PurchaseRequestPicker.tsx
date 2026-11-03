/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, X, ShoppingCart, Check, FileText } from '@/src/components/icons';
import { PurchaseRequest } from '../types';
import { purchasingApi } from '../features/purchasing/api';
import { formatDate } from '../utils/date';

interface PurchaseRequestPickerProps {
  value?: string; // PR Number that is currently selected
  onChange: (pr: PurchaseRequest) => void;
  statusFilter?: string; // e.g. "Disetujui"
  placeholder?: string;
  className?: string;
}

export default function PurchaseRequestPicker({
  value,
  onChange,
  statusFilter = 'Disetujui',
  placeholder = 'Pilih Referensi PR...',
  className = ''
}: PurchaseRequestPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // To display the selected PR in the button
  const selectedPr = purchaseRequests.find(pr => 
    pr.prNumber === value || 
    pr.id === value ||
    (Boolean(value) && (pr.prNumber.toLowerCase() === value?.toLowerCase() || pr.id.toLowerCase() === value?.toLowerCase()))
  );

  useEffect(() => {
    if ((isOpen || value) && purchaseRequests.length === 0) {
      loadData();
    }
  }, [isOpen, value, purchaseRequests.length]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await purchasingApi.getPurchaseRequests();
      
      const filtered = statusFilter 
        ? data.filter(pr => pr.status === statusFilter)
        : data;
        
      setPurchaseRequests(filtered);
    } catch (error) {
      console.error('Failed to load PRs', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPRs = purchaseRequests.filter(pr => 
    pr.prNumber.toLowerCase().includes(search.toLowerCase()) || 
    pr.department.toLowerCase().includes(search.toLowerCase()) ||
    pr.requesterName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (pr: PurchaseRequest) => {
    onChange(pr);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <>
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(true)}
        className={`w-full p-2.5 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer bg-white hover:bg-sky-50/40 hover:border-sky-200 transition-all ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden w-full">
          <FileText size={16} className="text-slate-400 shrink-0" />
          {isLoading && value && !selectedPr ? (
            <div className="h-4 bg-slate-200 animate-pulse rounded w-1/3"></div>
          ) : (
            <span className={`text-xs truncate ${selectedPr ? 'text-slate-800 font-bold font-mono' : 'text-slate-400'}`}>
              {selectedPr ? selectedPr.prNumber : value || placeholder}
            </span>
          )}
        </div>
      </div>

      {/* Modal Picker */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-100">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Pilih Referensi PR {statusFilter ? `(${statusFilter})` : ''}</h3>
                  <p className="text-[11px] text-slate-500">Pilih dari daftar Purchase Request yang sudah disetujui</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan No PR, Divisi, atau Pemohon..." 
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* PR List */}
            <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50 space-y-2">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">Memuat data PR...</div>
              ) : filteredPRs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Data PR dengan status '{statusFilter}' tidak ditemukan.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredPRs.map(pr => {
                    const isSelected = value === pr.id || value === pr.prNumber || (Boolean(value) && (pr.id.toLowerCase() === value.toLowerCase() || pr.prNumber.toLowerCase() === value.toLowerCase()));
                    return (
                      <div 
                        key={pr.id}
                        onClick={() => handleSelect(pr)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between
                          ${isSelected
                            ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-500' 
                            : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/20 hover:shadow-2xs'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <FileText size={20} className="text-slate-400" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-800 font-mono">{pr.prNumber}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{pr.department}</span>
                              <span className="text-[10px] text-slate-500">{pr.requesterName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 mb-0.5">Tanggal Butuh</div>
                            <div className="text-xs font-bold text-slate-800 font-mono">
                              {formatDate(pr.requiredDate)}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="text-sky-600">
                              <Check size={20} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
