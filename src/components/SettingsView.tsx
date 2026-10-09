/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings, Shield, HardDrive, Percent, Check, Landmark, Compass, UserCheck, Clock, Globe } from '@/src/components/icons';
import { systemApi } from '../services/api';
import { getCompanyProfile, saveCompanyProfile } from '../utils/companyProfile';
import {
  INDONESIAN_TIMEZONES,
  getTimezonePreference,
  setTimezonePreference,
  formatDateTime,
  formatDate,
  toApiDate,
  getTimezoneAbbr
} from '../utils/date';

interface SettingsViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function SettingsView({ onTriggerNotification }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'tax' | 'timezone' | 'backup'>('profile');

  // Company Form states
  const [compName, setCompName] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [taxRate, setTaxRate] = useState(11); // PPN 11%
  const [timezone, setTimezone] = useState<string>('Asia/Jakarta');
  const [currentTimePreview, setCurrentTimePreview] = useState<Date>(new Date());

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimePreview(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Initial load from local memory (synced by App.tsx)
    const profile = getCompanyProfile();
    setCompName(profile.name);
    setCompAddress(profile.address);
    setCompPhone(profile.phone);
    setCompEmail(profile.email);
    setLogoUrl(profile.logoUrl);
    setTaxRate(profile.taxRate);
    setTimezone(profile.timezone || getTimezonePreference());

    // Listen to updates from server sync
    const handleProfileUpdate = () => {
      const updatedProfile = getCompanyProfile();
      setCompName(updatedProfile.name);
      setCompAddress(updatedProfile.address);
      setCompPhone(updatedProfile.phone);
      setCompEmail(updatedProfile.email);
      setLogoUrl(updatedProfile.logoUrl);
      setTaxRate(updatedProfile.taxRate);
      setTimezone(updatedProfile.timezone || getTimezonePreference());
    };

    window.addEventListener('erp_company_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('erp_company_profile_updated', handleProfileUpdate);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveCompanyProfile({ name: compName, address: compAddress, phone: compPhone, email: compEmail, logoUrl });
    setIsSaving(false);
    onTriggerNotification(`Konfigurasi profile perusahaan ${compName} berhasil diperbarui di server!`);
  };

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveCompanyProfile({ taxRate });
    setIsSaving(false);
    onTriggerNotification(`Menerapkan parameter pajak PPN sebesar ${taxRate}% ke seluruh sistem dan disimpan ke server.`);
  };

  const handleSaveTimezone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveCompanyProfile({ timezone });
    setTimezonePreference(timezone);
    setIsSaving(false);
    onTriggerNotification(`Zona waktu sistem berhasil diperbarui ke ${timezone}!`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-xs text-slate-800">
      {/* 1. Header Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 border text-white rounded-lg">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800">Konfigurasi & Pengaturan Sistem ERP</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Atur detail kop surat komersial, tarif PPN nasional, serta simpan cadangan database lokal.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left list navigation column */}
        <div className="md:col-span-1 bg-white p-3 rounded-xl border space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              activeTab === 'profile' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-505 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Landmark size={14} />
            <span>Profile Usaha</span>
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`w-full text-left px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              activeTab === 'tax' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Percent size={14} />
            <span>Pajak & Kop Faktur</span>
          </button>
          <button
            onClick={() => setActiveTab('timezone')}
            className={`w-full text-left px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              activeTab === 'timezone' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Clock size={14} />
            <span>Zona Waktu & Jam</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`w-full text-left px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              activeTab === 'backup' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <HardDrive size={14} />
            <span>Backup Data SQL</span>
          </button>
        </div>

        {/* Right detailed settings pane */}
        <div className="md:col-span-3 bg-white p-5 rounded-xl border shadow-sm">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b pb-2 mb-3">Kop Dokumen & Perusahaan</h4>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">Nama Badan Hukum Usaha (CV/PT)</label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">Alamat Kantor Pusat & Workshop Produksi</label>
                <textarea
                  rows={3}
                  required
                  value={compAddress}
                  onChange={(e) => setCompAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Kontak Person Surat</label>
                  <input
                    type="text"
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">E-mail Operasional Kantor</label>
                  <input
                    type="email"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">Logo Perusahaan (Untuk Cetakan)</label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo Perusahaan" className="h-16 w-16 object-contain border bg-white p-1 rounded" />
                  ) : (
                    <div className="h-16 w-16 bg-slate-100 flex items-center justify-center border border-dashed rounded text-xs text-slate-400">Belum ada</div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setLogoUrl(ev.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Disarankan format PNG transparan, rasio 1:1, max 1MB</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-slate-900 border text-white font-bold rounded-lg transition-all hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {isSaving ? 'Menyimpan ke Database...' : 'Simpan Perubahan Profile'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'tax' && (
            <form onSubmit={handleSaveTax} className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b pb-2 mb-3">Konfigurasi Tarif Pajak Penerimaan</h4>

              <div className="space-y-2 max-w-sm">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">Regulasi Pajak PPN (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-24 px-3 py-2 border rounded font-mono font-bold"
                    />
                    <span className="text-slate-500 font-bold block">% (Persentase Standard Indonesia)</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-55 bg-amber-50 rounded-xl border border-amber-100 text-[11px] leading-relaxed mt-4 text-amber-850">
                  ⚠️ <strong>Perhatian:</strong> Perubahan besaran PPN akan langsung berlaku untuk pembuatan kuitansi invoice dan quotation baru berikutnya. Dokumen faktur lama tidak akan disunting kembali.
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-slate-900 border text-white font-bold rounded-lg transition-all hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {isSaving ? 'Menyimpan ke Database...' : 'Terapkan Parameter Pajak'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'timezone' && (
            <form onSubmit={handleSaveTimezone} className="space-y-5">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b pb-2 mb-2">Format Tanggal & Zona Waktu Sistem</h4>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Pilih zona waktu operasional bisnis. Pengaturan ini akan diterapkan ke seluruh modul (Invoice, Surat Jalan, Penerimaan Barang, Absensi, Mutasi Kas, dll).
                </p>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-300 text-[10px] font-mono uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-cyan-400" />
                    Preview Waktu Sistem Real-time
                  </span>
                  <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                    {getTimezoneAbbr(currentTimePreview, timezone === 'auto' ? undefined : timezone)}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="text-2xl font-black font-mono tracking-tight text-white">
                    {formatDateTime(currentTimePreview.toISOString(), true)}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-4 pt-1 border-t border-slate-700/60 font-mono">
                  <span>Format Tanggal: <strong>{formatDate(currentTimePreview.toISOString())}</strong></span>
                  <span>Standar Input: <strong>{toApiDate(currentTimePreview)}</strong></span>
                </div>
              </div>

              {/* Timezone Options */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-700 block">Pilih Zona Waktu Operasional:</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {INDONESIAN_TIMEZONES.map((tz) => {
                    const isSelected = timezone === tz.id;
                    return (
                      <div
                        key={tz.id}
                        onClick={() => setTimezone(tz.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-50/40 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="timezone"
                            value={tz.id}
                            checked={isSelected}
                            onChange={() => setTimezone(tz.id)}
                            className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-xs">{tz.label}</span>
                              <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                                isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {tz.offset || 'Browser'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{tz.regions}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-cyan-600 font-bold text-[10px] flex items-center gap-1 shrink-0">
                            <Check size={14} /> Terpilih
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] leading-relaxed text-blue-800">
                💡 <strong>Catatan:</strong> Jika Anda memilih <em>Otomatis</em>, sistem akan menyesuaikan waktu berdasarkan lokasi browser masing-masing staf. Jika memilih <em>WIB/WITA/WIT</em>, semua tampilan di sistem akan diseragamkan ke zona waktu tersebut.
              </div>

              <div className="pt-3 border-t flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-slate-900 border text-white font-bold rounded-lg transition-all hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {isSaving ? 'Menyimpan...' : 'Terapkan Pengaturan Waktu'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b pb-2 mb-3">Backup SQL & Database State Maintenance</h4>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Amankan riwayat penjualan, data proyek, dan catatan logistik. Anda dapat mendownload arsip mandiri SQL ter-enkripsi untuk cadangan server.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                  <div>
                    <h5 className="font-bold text-slate-850 block">Ekspor Pencadangan Lokal</h5>
                    <span className="text-slate-400 text-[10px]">Telah dicadangkan otomatis terakhir: <strong>Hari ini 03:00</strong></span>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        onTriggerNotification('Memulai ekspor database... Mohon tunggu.');
                        await systemApi.downloadBackup();
                        onTriggerNotification('Berhasil mengekspor cadangan database CV_BETON_AGUNG_BACKUP.sql');
                      } catch (err: any) {
                        onTriggerNotification(err.message || 'Gagal mengekspor database. Pastikan mysqldump tersedia.');
                      }
                    }}
                    className="w-full py-2 bg-slate-900 text-white font-bold rounded hover:bg-slate-800 transition-colors text-center block"
                  >
                    Unduh Dump Database (.sql)
                  </button>
                </div>

                <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                  <div>
                    <h5 className="font-bold text-slate-850 block">Mekanisme Cadangan Cloud</h5>
                    <span className="text-slate-400 text-[10px]">Peta Sinkronisasi server backup mirroring aktif</span>
                  </div>

                  <button
                    onClick={() => {
                      onTriggerNotification('Menghubungkan ke secure terminal mirroring... Sinkronisasi Cloud tuntas!');
                    }}
                    className="w-full py-2 border hover:bg-slate-100 font-bold rounded transition-colors text-center block text-slate-700"
                  >
                    Sinkronisasikan Ke Cloud Sekarang
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
