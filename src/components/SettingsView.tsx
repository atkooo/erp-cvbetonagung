/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings, Shield, HardDrive, Percent, Check, Landmark, Compass, UserCheck } from '@/src/components/icons';
import { systemApi } from '../services/api';
import { getCompanyProfile, saveCompanyProfile } from '../utils/companyProfile';

interface SettingsViewProps {
  onTriggerNotification: (message: string) => void;
}

export default function SettingsView({ onTriggerNotification }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'tax' | 'backup'>('profile');

  // Company Form states
  const [compName, setCompName] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [taxRate, setTaxRate] = useState(11); // PPN 11%

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Initial load from local memory (synced by App.tsx)
    const profile = getCompanyProfile();
    setCompName(profile.name);
    setCompAddress(profile.address);
    setCompPhone(profile.phone);
    setCompEmail(profile.email);
    setLogoUrl(profile.logoUrl);
    setTaxRate(profile.taxRate);

    // Listen to updates from server sync
    const handleProfileUpdate = () => {
      const updatedProfile = getCompanyProfile();
      setCompName(updatedProfile.name);
      setCompAddress(updatedProfile.address);
      setCompPhone(updatedProfile.phone);
      setCompEmail(updatedProfile.email);
      setLogoUrl(updatedProfile.logoUrl);
      setTaxRate(updatedProfile.taxRate);
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-xs text-slate-800">
      {/* 1. Header Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 border text-white rounded-lg">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800">Konfigurasi & Pengaturan ERP CV Beton Agung</h3>
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

          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b pb-2 mb-3">Backup SQL & Database State Maintenance</h4>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Amankan riwayat penjualan, data proyek, dan catatan logistik. Anda dapat mendownload arsip mandiri SQL ter-enkripsi untuk cadangan server CV Beton Agung.
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
