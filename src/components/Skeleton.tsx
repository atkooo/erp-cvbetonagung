import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200/80 rounded ${className}`} />
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/85 overflow-hidden shadow-sm">
      {/* Table Header Skeleton */}
      <div className="flex space-x-4 p-4 bg-slate-50 border-b border-slate-200/65">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Table Rows Skeleton */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4 p-4 items-center">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={`h-4 flex-1 ${colIndex === 0 ? 'w-3/4' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center space-x-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-6 w-2/3" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

interface ErrorCardProps {
  message: string;
  onRetry: () => void;
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto my-6">
      <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
        <AlertCircle size={22} />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-slate-800 text-sm font-sans">Gagal Memuat Data</h3>
        <p className="text-xs text-slate-500 font-sans leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
      >
        <RefreshCw size={12} className="animate-spin-hover" />
        <span>Coba Lagi</span>
      </button>
    </div>
  );
}
