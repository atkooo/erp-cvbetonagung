/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Package,
  Wrench,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  TrendingDown,
  ShoppingBag,
  Bell,
  CheckCircle,
  Truck
} from '@/src/components/icons';
import { Customer, Supplier, Product, SalesOrder, Invoice, Project, ViewType } from '../types';
import { authStorage } from '../services/api';
import { productsApi } from '../features/products/api';
import { customersApi } from '../features/customers/api';
import { suppliersApi } from '../features/suppliers/api';
import { salesApi } from '../features/sales/api';
import { financeApi } from '../features/finance/api';
import { projectsApi } from '../features/projects/api';

interface DashboardViewProps {
  onNavigate: (view: ViewType) => void;
  onNavigateToProject: (view: ViewType, projectId: string) => void;
  onTriggerNotification: (message: string) => void;
}

export default function DashboardView({
  onNavigate,
  onNavigateToProject,
  onTriggerNotification,
}: DashboardViewProps) {
  // Local state for API mode
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, custRes, sups, sos, invs, projs] = await Promise.all([
        productsApi.getProducts(),
        customersApi.listCustomers(),
        suppliersApi.getSuppliers(),
        salesApi.getSalesOrders(),
        financeApi.getInvoices(),
        projectsApi.getProjects()
      ]);
      setProducts(prods);
      setCustomers(custRes.customers);
      setSuppliers(sups);
      setSalesOrders(sos);
      setInvoices(invs);
      setProjects(projs);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute dashboard metrics
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalSuppliers = suppliers.length;
  
  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock || p.status === 'Menipis' || p.status === 'Habis');
  const lowStockCount = lowStockProducts.length;

  const currentMonthSO = salesOrders.filter(so => so.status !== 'Dibatalkan');
  const salesThisMonth = currentMonthSO.reduce((acc, so) => acc + so.total, 0);

  const unpaidInvoices = invoices.filter(inv => inv.status === 'Belum Lunas' || inv.status === 'Sebagian Dibayar' || inv.status === 'Overdue');
  const filteredActiveProjects = projects.filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan');

  // Format currency helpers
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Best product calculation or mock ranks
  const bestSellers = [
    { name: 'Roster Beton Minimalis Motif Kotak Silang', category: 'Roster', percentage: 85, count: 1850 },
    { name: 'Lisplang Beton Klasik Lebar 30cm', category: 'Lisplang', percentage: 70, count: 300 },
    { name: 'Kubah Masjid GRC Motif Madinah D-6m', category: 'Kubah Masjid', percentage: 60, count: 4 },
    { name: 'Tanaman Hias Pucuk Merah Rimbun', category: 'Tanaman', percentage: 40, count: 105 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Abstract background graphics */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-cyan-400 font-bold uppercase bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800/50">
              SISTEM ERP INTERNAL 2026
            </span>
            <h1 className="font-sans font-black tracking-tight text-xl md:text-2xl mt-3 text-slate-100 flex items-center gap-2">
              Kembali Bekerja, Tim CV Beton Agung
              <span className="text-[9px] font-mono font-normal tracking-normal normal-case border border-cyan-400/35 bg-cyan-950/50 text-cyan-400 rounded px-1.5 py-0.5 ml-2">
                API MODE
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Platform ERP mengintegrasikan produksi workshop beton, manajemen proyek custom, logistik stok material, dan rekapitulasi pembayaran secara realtime.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onNavigate('scan-qr-product')}
              className="px-4 py-2 bg-gradient-to-br from-cyan-500 to-blue-600 hover:opacity-90 active:scale-95 text-xs text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              Simulasi Scan QR
            </button>
            <button
              onClick={() => onNavigate('projects')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-slate-200 font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              Lihat Proyek
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 text-center text-slate-400 font-sans border rounded-xl shadow-sm">
          Memperbarui statistik dashboard dari backend...
        </div>
      ) : (
        <>
          {/* 2. Core Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Stocks */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Total Unit Stok</span>
                <h3 className="text-xl font-bold font-sans text-slate-800 mt-1">{totalStock.toLocaleString()} <span className="text-xs text-slate-500 font-normal">Pcs/Mtr</span></h3>
                <button onClick={() => onNavigate('stock-management')} className="text-[10px] hover:underline text-cyan-600 flex items-center gap-1 mt-2.5 font-bold">
                  Check detail gudang &rarr;
                </button>
              </div>
              <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600">
                <Package size={20} />
              </div>
            </div>

            {/* Metric 2: Financial Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Omset Sales Mei</span>
                <h3 className="text-xl font-bold font-sans text-emerald-600 mt-1">{formatIDR(salesThisMonth)}</h3>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-2.5">
                  <TrendingUp size={12} className="text-emerald-500" />
                  <span className="font-bold text-emerald-600">+12.4%</span> dari bulan lalu
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp size={20} />
              </div>
            </div>

            {/* Metric 3: Active projects */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Proyek Aktif</span>
                <h3 className="text-xl font-bold font-sans text-slate-800 mt-1">{filteredActiveProjects.length} Proyek</h3>
                <button onClick={() => onNavigate('projects')} className="text-[10px] hover:underline text-amber-600 flex items-center gap-1 mt-2.5 font-bold">
                  Monitoring Workshop &rarr;
                </button>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <Wrench size={20} className="text-amber-500" />
              </div>
            </div>

            {/* Metric 4: Low stock warnings */}
            <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between transition-colors ${
              lowStockCount > 0 ? 'bg-red-50/50 border-red-200 text-red-950' : 'bg-white border-slate-200'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Gudang Kritis</span>
                <h3 className="text-xl font-bold font-sans text-red-600 mt-1">{lowStockCount} SKU Menipis</h3>
                <button onClick={() => onNavigate('stock-management')} className="text-[10px] hover:underline text-red-700 flex items-center gap-1 mt-2.5 font-bold">
                  Butuh Restock PO &rarr;
                </button>
              </div>
              <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                <AlertTriangle size={20} />
              </div>
            </div>
          </div>

          {/* Minor Stats Quick Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Customer count */}
            <div onClick={() => onNavigate('customers')} className="p-3.5 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-xl border border-slate-200 transition-colors flex items-center gap-3">
              <div className="p-2 bg-slate-200/60 rounded-lg text-slate-600">
                <Users size={16} />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">Total Customer</p>
                <p className="text-sm font-bold text-slate-800">{totalCustomers} Mandor/Takmir</p>
              </div>
            </div>

            {/* Supplier count */}
            <div onClick={() => onNavigate('suppliers')} className="p-3.5 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-xl border border-slate-200 transition-colors flex items-center gap-3">
              <div className="p-2 bg-slate-200/60 rounded-lg text-slate-600">
                <Users size={16} />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">Total Supplier</p>
                <p className="text-sm font-bold text-slate-800">{totalSuppliers} Produsen Bahan</p>
              </div>
            </div>

            {/* Unpaid Invoice warning */}
            <div onClick={() => onNavigate('invoices')} className="p-3.5 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-xl border border-slate-200 transition-colors flex items-center gap-3">
              <div className="p-2 bg-rose-100/50 rounded-lg text-rose-600">
                <Receipt size={16} />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">Invoice Unpaid</p>
                <p className="text-sm font-bold text-rose-700">{unpaidInvoices.length} Dokumen Tagihan</p>
              </div>
            </div>

            {/* Total products SKU */}
            <div onClick={() => onNavigate('products')} className="p-3.5 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-xl border border-slate-200 transition-colors flex items-center gap-3">
              <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-600">
                <Package size={16} />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">Katalog Aktif</p>
                <p className="text-sm font-bold text-indigo-800">{totalProducts} Variasi SKU</p>
              </div>
            </div>
          </div>

          {/* 3. Visual Charts & Bestseller Bento Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT CARD: Chart Penjualan Bulanan (Custom SVG Area + Bar combo) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-8 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-sans font-bold text-sm text-slate-800">Analisis Proyek & Penjualan Bulanan (Semester I 2026)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pendapatan kotor realisasi proyek custom dan beton pracetak</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded">
                  Periode: Jan - Jun
                </span>
              </div>

              {/* Simple Custom Fully Responsive SVG Area Chart to avoid any Recharts crash */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 flex-1 flex flex-col justify-between min-h-[220px]">
                <div className="flex justify-between items-center text-slate-400 text-[10px] font-mono border-b border-slate-200/50 pb-1 mb-2">
                  <span>Rp Milyar</span>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-cyan-500 rounded" />Proyek Custom</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" />Roster & Lisplang</span>
                  </div>
                </div>

                {/* Custom visual chart drawing using simple highly scalable vectors and layout */}
                <div className="flex-1 flex gap-3.5 items-end justify-between px-2 pt-2 relative">
                  {/* Horizontal Help lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                    <div className="w-full border-t border-dashed border-slate-300" />
                    <div className="w-full border-t border-dashed border-slate-300" />
                    <div className="w-full border-t border-dashed border-slate-300" />
                    <div className="w-full border-t border-dashed border-slate-200" />
                  </div>

                  {/* Data points mapping */}
                  {[
                    { month: 'Januari', custom: 40, pieces: 15, tag: 'Rp 55M' },
                    { month: 'Februari', custom: 50, pieces: 22, tag: 'Rp 72M' },
                    { month: 'Maret', custom: 35, pieces: 30, tag: 'Rp 65M' },
                    { month: 'April', custom: 80, pieces: 45, tag: 'Rp 125M' },
                    { month: 'Mei', custom: 75, pieces: 35, tag: 'Rp 110M' },
                    { month: 'Juni (Frc)', custom: 90, pieces: 60, tag: 'Rp 150M' }
                  ].map((dt, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group z-10">
                      <div className="w-full flex items-end justify-center gap-1 h-32 relative">
                        <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-transform bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded font-mono font-bold shadow-md z-20">
                          {dt.tag}
                        </div>
                        {/* Domes Bar */}
                        <div 
                          style={{ height: `${dt.custom}%` }}
                          className="w-4 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm shadow-inner transition-all group-hover:brightness-105"
                        />
                        {/* Pieces Bar */}
                        <div 
                          style={{ height: `${dt.pieces}%` }}
                          className="w-2.5 bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-sm transition-all group-hover:brightness-105"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{dt.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT CARD: Produk Terlaris (Performance indicators list) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-sans font-bold text-sm text-slate-800">Best Seller Performa</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Bulan Mei</span>
                </div>

                <div className="space-y-4">
                  {bestSellers.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 truncate max-w-[200px]" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-indigo-600 font-mono">{item.count.toLocaleString()} unit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${item.percentage}%` }}
                            className={`h-full rounded-full bg-gradient-to-r ${
                              idx === 0 ? 'from-cyan-500 to-blue-500' :
                              idx === 1 ? 'from-purple-500 to-indigo-500' :
                              idx === 2 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono w-8 text-right">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    onNavigate('reports');
                    onTriggerNotification('Membuka Laporan Analisis Penjualan Lengkap');
                  }}
                  className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1"
                >
                  <ArrowUpRight size={14} />
                  <span>Selengkapnya di Halaman Laporan</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Inventory Alert Grid & Recent Mosque Project Tracking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Side: Stok Menipis Warning Board */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-rose-500 animate-pulse" size={16} />
                  <h3 className="font-sans font-bold text-sm text-slate-800">Alert Stok Menipis (&le; Batas Minimum)</h3>
                </div>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">
                  {lowStockCount} SKU Kritis
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2.5 pr-1">
                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle className="mx-auto text-emerald-500 mb-2" size={32} />
                    <p className="text-xs font-semibold">Tingkat Stok Aman</p>
                    <p className="text-[10px]">Semua produk memiliki kuantitas melebihi batas minimum reorder.</p>
                  </div>
                ) : (
                  lowStockProducts.map((p, idx) => (
                    <div key={idx} className="p-3 bg-rose-50/50 hover:bg-rose-50 rounded-xl border border-rose-100/60 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          {p.sku}
                        </span>
                        <p className="text-xs font-bold text-slate-800 mt-1.5 leading-snug">{p.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Gudang Penyimpanan: <strong className="text-slate-600">{p.location}</strong></p>
                      </div>
                      <div className="flex items-center gap-3.5 shrink-0 pl-2">
                        <div className="text-right">
                          <p className="text-xs font-mono font-black text-rose-700 leading-none">
                            {p.stock} <span className="text-[10px] font-normal text-slate-500">{p.unit}</span>
                          </p>
                          <span className="text-[9px] text-slate-400">Min: {p.minStock}</span>
                        </div>
                        <button 
                          onClick={() => {
                            onTriggerNotification(`Mengirim Purchase Request (PO) otomatis untuk restock: ${p.sku}`);
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 active:scale-95 transition-all shadow"
                        >
                          Restock PO
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Side: Active project tracking */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h3 className="font-sans font-bold text-sm text-slate-800">Proyek & Rekayasa Workshop</h3>
                <span onClick={() => onNavigate('projects')} className="text-[10px] text-cyan-600 font-bold hover:underline cursor-pointer">
                  Kelola Semua &rarr;
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px]">
                {filteredActiveProjects.length === 0 ? (
                  <div className="text-center py-12 text-slate-405 text-xs text-slate-400">Tidak ada proyek aktif.</div>
                ) : (
                  filteredActiveProjects.map((proj) => {
                    // Custom CSS color mapped to stage
                    const statusColors: any = {
                      Survey: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                      Penawaran: 'bg-blue-100 text-blue-700 border-blue-200',
                      Deal: 'bg-teal-100 text-teal-700 border-teal-200',
                      Produksi: 'bg-amber-100 text-amber-700 border-amber-300 animate-pulse',
                      Pengiriman: 'bg-cyan-100 text-cyan-700 border-cyan-200',
                      Pemasangan: 'bg-purple-100 text-purple-700 border-purple-200',
                      Selesai: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    };

                    return (
                      <div 
                        key={proj.id} 
                        onClick={() => onNavigateToProject('project-detail', proj.id)}
                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-mono font-bold text-slate-500">
                              {proj.code}
                            </span>
                            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                              statusColors[proj.status] || 'bg-slate-100'
                            }`}>
                              {proj.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 mt-1">
                            {proj.projectName}
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            Jenis: <strong>{proj.projectType}</strong> | Spesifikasi: <strong>{proj.projectSpec}</strong> | Lokasi: {proj.location}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-slate-400">Konstruksi</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-black text-slate-700">{proj.progress}%</span>
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  style={{ width: `${proj.progress}%` }}
                                  className="bg-amber-500 h-full rounded-full"
                                />
                              </div>
                            </div>
                          </div>
                          <span className="p-1 px-1.5 bg-white text-slate-500 rounded border hover:bg-slate-50 text-xs">
                            Detil
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 5. Recent System Logs & Documents Timeline / Activity */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-sans font-bold text-sm text-slate-800">Aktivitas & Mutasi Material Terbaru</h3>
              <span className="text-[10px] text-slate-400 font-mono">Mei 25 - Mei 30</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sub block 1: Sales Order Status */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">PROSES PENJUALAN (SO)</h4>
                <div className="space-y-2">
                  {salesOrders.length === 0 ? (
                    <div className="text-slate-400 text-xs py-4 text-center">Belum ada Sales Order.</div>
                  ) : (
                    salesOrders.slice(0, 3).map((so, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/40 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-slate-500 block">{so.orderNumber}</span>
                          <strong className="text-slate-700 mt-0.5 block">{so.customerName}</strong>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-indigo-700 block">{formatIDR(so.total)}</span>
                          <span className={`text-[9px] font-bold ${
                            so.status === 'Selesai' ? 'text-emerald-600' :
                            so.status === 'Diproses' ? 'text-blue-500' : 'text-slate-505 text-slate-500'
                          }`}>{so.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sub block 2: Invoice & Aging Payments */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">DOKUMEN INVOICE JATUH TEMPO</h4>
                <div className="space-y-2">
                  {invoices.filter(inv => inv.status !== 'Lunas').length === 0 ? (
                    <div className="text-slate-400 text-xs py-4 text-center">Semua Invoice lunas.</div>
                  ) : (
                    invoices.filter(inv => inv.status !== 'Lunas').slice(0, 3).map((inv, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/40 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-slate-500 block">{inv.invoiceNumber}</span>
                          <strong className="text-slate-700 mt-0.5 block">{inv.customerName}</strong>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-rose-600 block">{formatIDR(inv.total - inv.paidAmount)}</span>
                          <span className="text-[9px] text-rose-500 font-bold block">Sisa Tagihan</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sub block 3: Workshop Production Timeline */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">LOG PRODUKSI & STOK</h4>
                <div className="space-y-2.5 border-l border-slate-200 pl-3.5 ml-1">
                  <div className="relative">
                    <span className="absolute -left-5 top-1 w-2.5 h-2.5 bg-cyan-500 rounded-full border border-white" />
                    <p className="text-[11px] font-bold text-slate-700">Lisplang Klasik C30 masuk 150 M</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Hari ini, 09:15 | Penerimaan PO-012</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-5 top-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                    <p className="text-[11px] font-bold text-slate-700">Roster Beton Silang keluar 350 Pcs</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Kemarin, 14:30 | Pengiriman SO-088</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-5 top-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                    <p className="text-[11px] font-bold text-slate-700">Modul proyek Baiturrahman selesai produksi</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">29 Mei 2026, 11:00 | Lokasi: Lab Cetaka A</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
