import React, { useState } from 'react';
import { Search, X, FileText, Check } from '@/src/components/icons';

export interface ReferenceOption {
  id: string;
  number: string;
  label: string;
  subLabel: string;
}

interface ReferencePickerProps {
  value?: string;
  onChange: (value: string) => void;
  options: ReferenceOption[];
  title: string;
  placeholder?: string;
  className?: string;
}

export default function ReferencePicker({
  value,
  onChange,
  options,
  title,
  placeholder = 'Pilih Referensi...',
  className = ''
}: ReferencePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [manualInput, setManualInput] = useState('');

  const selectedOption = options.find(opt => opt.number === value);

  const filteredOptions = options.filter(opt => 
    opt.number.toLowerCase().includes(search.toLowerCase()) || 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (opt: ReferenceOption) => {
    onChange(opt.number);
    setIsOpen(false);
    setSearch('');
  };

  const handleManualUse = () => {
    if (manualInput.trim()) {
      onChange(manualInput.trim());
      setIsOpen(false);
      setManualInput('');
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className={`w-full px-3 py-2 border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50 transition-colors ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText size={16} className="text-slate-400 shrink-0" />
          <span className={`text-xs truncate ${value ? 'text-slate-800 font-bold font-mono' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.number : value || placeholder}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-100 text-cyan-600 rounded">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
                  <p className="text-[10px] text-slate-500">Pilih dari daftar atau input manual</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan No Dokumen atau Nama..." 
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
              {filteredOptions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Dokumen tidak ditemukan.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredOptions.map(opt => (
                    <div 
                      key={opt.id}
                      onClick={() => handleSelect(opt)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between
                        ${(value === opt.number)
                          ? 'bg-cyan-50 border-cyan-300 ring-1 ring-cyan-500' 
                          : 'bg-white border-slate-200 hover:border-cyan-300 hover:shadow-sm'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-bold text-xs text-slate-800 font-mono">{opt.number}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{opt.label} • {opt.subLabel}</div>
                        </div>
                      </div>
                      {(value === opt.number) && (
                        <div className="text-cyan-600 shrink-0">
                          <Check size={18} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-white flex flex-col sm:flex-row justify-between items-center rounded-b-xl gap-3">
               <span className="text-[10px] text-slate-400 italic">Tidak ada di daftar? Gunakan input manual:</span>
               <div className="flex items-center gap-2 w-full sm:w-auto">
                 <input 
                   type="text" 
                   value={manualInput}
                   onChange={(e) => setManualInput(e.target.value)}
                   className="text-xs border border-slate-200 px-3 py-1.5 rounded-lg w-full sm:w-40 focus:outline-none focus:border-cyan-400 font-mono" 
                   placeholder="Ketik manual..."
                 />
                 <button 
                   type="button"
                   onClick={handleManualUse}
                   disabled={!manualInput.trim()}
                   className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-xs disabled:opacity-50 transition-colors"
                 >
                   Pakai
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
