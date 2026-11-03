/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  Tag,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from '@/src/components/icons';
import {
  CHANGELOG_RELEASES,
  CHANGELOG_CATEGORIES,
  type ChangelogCategory,
} from '../data/changelogData';

interface ChangelogViewProps {
  onTriggerNotification?: (message: string) => void;
  onNavigate?: (view: string) => void;
}

export default function ChangelogView({ onTriggerNotification, onNavigate }: ChangelogViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ChangelogCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'markdown'>('cards');
  const [copied, setCopied] = useState(false);

  // Filtered releases and items
  const filteredReleases = useMemo(() => {
    const q = search.trim().toLowerCase();

    return CHANGELOG_RELEASES.map((release) => {
      const filteredItems = release.items.filter((item) => {
        const matchesCategory =
          selectedCategory === 'all' || item.category === selectedCategory;

        if (!matchesCategory) return false;
        if (!q) return true;

        const inTitle = item.title.toLowerCase().includes(q);
        const inSummary = item.summary.toLowerCase().includes(q);
        const inModule = item.module.toLowerCase().includes(q);
        const inDetails = item.details.some((d) => d.toLowerCase().includes(q));
        const inFiles = item.affectedFiles?.some((f) => f.toLowerCase().includes(q));

        return inTitle || inSummary || inModule || inDetails || Boolean(inFiles);
      });

      return {
        ...release,
        items: filteredItems,
      };
    }).filter((release) => release.items.length > 0);
  }, [search, selectedCategory]);

  const totalItemsCount = useMemo(() => {
    return CHANGELOG_RELEASES.reduce((acc, rel) => acc + rel.items.length, 0);
  }, []);

  const rawMarkdownContent = useMemo(() => {
    let md = `# Log Pembaruan Sistem ERP CV. Beton Agung\n\n`;
    CHANGELOG_RELEASES.forEach((rel) => {
      md += `## [${rel.version}] - ${rel.releaseDate}\n`;
      md += `${rel.summary}\n\n`;
      rel.items.forEach((it) => {
        md += `### ${it.title} (${it.categoryLabel})\n`;
        md += `- **Modul:** ${it.module}\n`;
        md += `- **Ringkasan:** ${it.summary}\n`;
        md += `- **Rincian:**\n`;
        it.details.forEach((d) => {
          md += `  - ${d}\n`;
        });
        if (it.affectedFiles && it.affectedFiles.length > 0) {
          md += `- **File Terkait:** ${it.affectedFiles.join(', ')}\n`;
        }
        md += `\n`;
      });
      md += `---\n\n`;
    });
    return md;
  }, []);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(rawMarkdownContent);
    setCopied(true);
    onTriggerNotification?.('Salinan catatan pembaruan berhasil disalin ke clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryBadgeClass = (category: ChangelogCategory) => {
    switch (category) {
      case 'fitur-baru':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'alur-kerja':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'perbaikan':
        return 'bg-sky-100/70 text-sky-800 border-sky-200';
      case 'keamanan':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'desain-ui':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-xs text-slate-800 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-700 text-white p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
              Changelog Sistem
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 text-[10px] font-semibold flex items-center gap-1 border border-emerald-300/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Versi Stabil v2.1.0
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Pembaruan Sistem (Changelog)
          </h1>
          <p className="text-xs text-sky-100 max-w-2xl leading-relaxed">
            Dokumentasi berkala mengenai penambahan fitur baru, perbaikan bug, penyesuaian alur kerja operasional, dan standardisasi antarmuka ERP CV. Beton Agung.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-white/10 p-1 rounded-xl border border-white/20 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-sky-700 shadow-2xs'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Tampilan Kartu
            </button>
            <button
              type="button"
              onClick={() => setViewMode('markdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'markdown'
                  ? 'bg-white text-sky-700 shadow-2xs'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Format Teks (Markdown)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Ringkasan Metrik Singkat */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Versi Rilis
          </p>
          <p className="text-base font-bold text-slate-900 mt-0.5">v2.1.0</p>
          <p className="text-[10px] text-slate-500 mt-1">Edisi November 2026</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Total Catatan
          </p>
          <p className="text-base font-bold text-sky-700 mt-0.5">
            {totalItemsCount} Pembaruan
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Terdokumentasi lengkap</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Desain UI
          </p>
          <p className="text-base font-bold text-slate-900 mt-0.5">Soft Sky Blue</p>
          <p className="text-[10px] text-slate-500 mt-1">Single Unified Palette</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Status Operasional
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-base font-bold text-emerald-700">Aktif & Siap</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Produksi Terverifikasi</p>
        </div>
      </div>

      {/* 3. Toolbar Filter & Pencarian */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pembaruan, nama modul, atau kata kunci..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'markdown' && (
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? 'Tersalin' : 'Salin Markdown'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Kategori Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-2.5">
          {CHANGELOG_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-2xs shadow-sky-500/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-700 border border-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Konten Catatan Pembaruan */}
      {viewMode === 'cards' ? (
        <div className="space-y-6">
          {filteredReleases.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <Sparkles size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">Tidak Ditemukan Catatan Pembaruan</p>
              <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                Tidak ada entri catatan yang cocok dengan kata kunci &quot;{search}&quot;. Coba ubah kata kunci atau pilih kategori lain.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="mt-4 btn btn-secondary btn-sm inline-flex items-center gap-1.5"
              >
                <RotateCcw size={12} />
                <span>Reset Pencarian</span>
              </button>
            </div>
          ) : (
            filteredReleases.map((release) => (
              <div key={release.version} className="space-y-3.5">
                {/* Release Section Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-900 text-base">
                      {release.version}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar size={12} />
                      {release.releaseDate}
                    </span>
                    {release.isLatest && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        {release.statusLabel || 'Rilis Terkini'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {release.items.length} catatan
                  </span>
                </div>

                {release.summary && (
                  <p className="text-xs text-slate-600 bg-sky-50/40 p-3 rounded-xl border border-sky-100/80">
                    {release.summary}
                  </p>
                )}

                {/* Items Grid */}
                <div className="grid grid-cols-1 gap-3.5">
                  {release.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-sky-200 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${getCategoryBadgeClass(
                              item.category
                            )}`}
                          >
                            {item.categoryLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                            {item.module}
                          </span>
                        </div>

                        {item.affectedFiles && item.affectedFiles.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-mono">Berkas:</span>
                            {item.affectedFiles.map((file) => (
                              <span
                                key={file}
                                className="px-1.5 py-0.5 bg-slate-50 border border-slate-200/80 rounded font-mono text-[10px] text-slate-600"
                              >
                                {file}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>

                      {/* Detail points */}
                      {item.details && item.details.length > 0 && (
                        <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-100 space-y-1.5">
                          {item.details.map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-600">
                              <span className="text-sky-600 font-bold shrink-0 mt-0.5">•</span>
                              <span className="leading-relaxed">{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Markdown Raw View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="font-mono text-[11px]">CHANGELOG.md (Dokumentasi Asli)</span>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="btn btn-secondary btn-sm flex items-center gap-1"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? 'Tersalin' : 'Salin Semua'}</span>
            </button>
          </div>
          <pre className="p-5 font-mono text-xs text-slate-700 bg-slate-900/5 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[70vh]">
            {rawMarkdownContent}
          </pre>
        </div>
      )}
    </div>
  );
}

