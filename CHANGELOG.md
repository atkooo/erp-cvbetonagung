# Changelog

All notable changes to the Frontend ERP CV. Beton Agung will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- **Pengaturan Zona Waktu Dinamis Indonesia (`WIB`, `WITA`, `WIT`, `Auto`)**:
  - Sentralisasi formatting tanggal dan jam di `src/utils/date.ts` dengan konversi otomatis dari UTC database ke zona waktu lokal pengguna.
  - Penambahan tab **Zona Waktu & Jam** di `SettingsView.tsx` dengan pilihan WIB, WITA, WIT, atau Otomatis (Browser) serta live preview jam berdetak real-time.
  - Penambahan badge indikator zona waktu aktif di `Topbar.tsx` yang dapat diklik untuk langsung membuka Pengaturan.
  - Dukungan penyimpanan preferensi zona waktu di `CompanyProfile` dan `localStorage`.
- **Pembaruan Navigasi & Pintasan Modul Finance & Accounting**:
  - Penambahan menu **Kas & Biaya Operasional** (`/finance/cash-bank`) dan **Laporan Keuangan & Omset** (`/finance/reports`) pada navigasi sidebar.
  - Penambahan tombol pintasan langsung ke **Kas & Biaya Operasional** dan **Laporan Arus Kas & Saldo Berjalan** di header `FinanceAccountsView.tsx`.
- **Fitur Restok Barang Kosong & Menipis (`RestockModal.tsx`)**:
  - Modal interaktif untuk meninjau barang di bawah batas minimum stok (habis / menipis).
  - Tampilan ringkasan defisit stok, harga beli acuan, input kuantitas order yang dapat disesuaikan, serta pemilihan supplier pemasok.
  - Integrasi tombol "Restok Barang Kosong" dengan badge jumlah kebutuhan restok pada toolbar `PurchaseView.tsx`.
  - Integrasi API `getRestockSuggestions` dan `generateRestockPo` pada `features/purchasing/api.ts`.
- **Integrasi Antrian Produksi & Auto WO dari Sales Order**:
  - Tampilan visual label "Auto WO dari SO" dan status "Antrian (Draft)" pada daftar Work Order di `ProductionWorkOrderView.tsx`.
  - Tombol aksi cepat "Mulai Produksi" untuk memajukan SPK dari antrian draft langsung ke tahap "Cetak & Curing".
  - Tombol "Kirim ke Antrian Produksi (WO)" pada detail Sales Order di `SalesView.tsx`.

### Fixed
- **Modal Faktur & Pembayaran Scrollable (`InvoicesView.tsx` & `PaymentsView.tsx`)**:
  - Memperbaiki modal slip detail faktur penagihan (Billing) yang terpotong pada layar atau tab kecil dengan menerapkan `max-h-[92vh]`, `overflow-y-auto` pada isi faktur, serta membuat bilah tombol aksi (termasuk tombol "Lanjut Terima Pembayaran") berstatus `sticky`/`shrink-0` di bagian bawah modal.
- **Perbaikan Missing Imports pada `SalesView.tsx`**:
  - Menambahkan import `CompanyProfile`, `getCompanyProfile`, dan `formatAddressForPrint` dari `utils/companyProfile` yang menyebabkan error kompilasi TypeScript.
  - Memperbaiki modal kasir terima pembayaran di `PaymentsView.tsx` agar form dan tombol "Simpan Penerimaan" dapat di-scroll dan selalu terlihat di semua resolusi layar.
- Fixed `Unknown API resource` when creating Goods Receipt Note (GRN) by updating the endpoint path to `/purchasing/goods-receipt-notes` in `purchasing/api.ts`.
- Fixed POS item status label displaying "Sudah Diambil / Selesai" for PO/Inden items by handling DeliveryOrder status `'draft'` in frontend mappers (`mappers.ts`), types (`sales.ts`), `SalesView.tsx`, `PurchaseView.tsx`, `ProductionWorkOrderView.tsx`, and `DeliveryOrdersView.tsx`.
- Fixed PO item price / selling price resolving to 0/empty when creating Purchase Orders from Sales Orders or checking out POS transactions by adding fallbacks across `PurchaseView.tsx`, `PosView.tsx`, and `SalesView.tsx`.
- Fixed unhandled `Unexpected token '<'` JSON parse errors when the API server or reverse proxy returns HTML error / fallback pages by adding HTML response detection and descriptive error messages in [api.ts](file:///d:/Okta/Project/2025-ALURIN-system/2026-ALURIN-System-ERP/frontend/src/services/api.ts).
- Fixed 404 / "Halaman tidak ditemukan atau sedang dalam konstruksi" when clicking "Lanjut ke Penerimaan Barang (GRN)" from Purchase Order (`/purchasing/receiving`) by registering the route in `AppRouter.tsx` mapping to `InventoryView` (`initialTab: 'masuk'`), adding navigation item in `navigation.tsx`, and making PO lookup robust in `InventoryView.tsx`.


## [1.0.0] - 2026-07-31
### Added
- Initial project setup & ERP Frontend features.
