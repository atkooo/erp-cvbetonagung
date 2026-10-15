# Changelog

All notable changes to the Frontend ERP CV. Beton Agung will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- **Konfigurasi Setup Production cPanel Shared Hosting (`app.cvbetonagung.com`)**:
  - `frontend/.env.production`: Mengatur `VITE_API_BASE_URL="https://api.cvbetonagung.com/api"` dan `APP_URL="https://app.cvbetonagung.com"`.
  - Build output terverifikasi siap deploy (`dist/`) lengkap dengan `.htaccess` URL rewrite untuk SPA routing di Apache cPanel.
- **Penyembunyian Menu Sidebar Secara Dinamis Sesuai Izin Akses View (RBAC)**:
  - Menu sidebar kini otomatis disembunyikan jika role pengguna tidak memiliki izin akses (aksi `view` dengan `access_level` aktif), mencegah kemunculan pesan error *"Gagal Memuat Data - Akses ditolak untuk role akun ini"*.
  - Helper fungsi `hasViewAccess` di [`permissions.ts`](file:///d:/Okta/Project/2025-ALURIN-system/2026-ALURIN-System-ERP/frontend/src/utils/permissions.ts) untuk memverifikasi hak akses `module`, `action: 'view'`, serta level hak akses (`read`, `edit`, `full`).
  - Pembaruan mapping `requiredModule` pada [`navigation.tsx`](file:///d:/Okta/Project/2025-ALURIN-system/2026-ALURIN-System-ERP/frontend/src/config/navigation.tsx) untuk seluruh item menu ERP (termasuk `dashboard`, `report-center`, `reminders`, `audit-logs`, dan `users`).
  - Penyesuaian `NavigateToHome` pada [`AppRouter.tsx`](file:///d:/Okta/Project/2025-ALURIN-system/2026-ALURIN-System-ERP/frontend/src/AppRouter.tsx) yang secara cerdas mengarahkan pengguna ke menu modul pertama yang diizinkan apabila role tidak memiliki hak akses ke Dashboard Utama.
- **Pembeda Metode Pengadaan Produk (Sourcing Type: Produksi Pabrik vs Beli Jadi Supplier)**:
  - Penambahan input **Metode Pengadaan (Sourcing)** pada modal Tambah / Edit Produk (`ProductsView.tsx`):
    - *Produksi Pabrik Sendiri (Work Order)* (`manufacture`): Diteruskan ke Work Order (SPK Pabrik) saat Sales Order diapprove.
    - *Beli Jadi dari Pemasok / Trading (Purchase Order)* (`purchase`): Pengadaan dari supplier, tidak membuat Work Order.
  - Tampilan visual badge pengadaan pada tabel master produk: `Produksi Pabrik (WO)`, `Beli Jadi (PO)`, dan `Bahan Baku (PO)`.
  - Tampilan visual badge pengadaan pada setiap rincian item Sales Order di detail modal (`SalesView.tsx`) agar pengguna dapat langsung mengidentifikasi item fabrikasi pabrik vs item beli jadi/supplier.
  - Pembaruan types (`Product`, `ProductDto`, `ProductFormData`, `SalesOrder.items.product`, `Quotation.items.product`) dan mappers produk serta penjualan.
- **Dukungan Ongkos Kirim (Gratis & Berbayar) pada Surat Jalan (Delivery Order)**:
  - Antarmuka pembuatan Surat Jalan (`DeliveryOrdersView.tsx`) dilengkapi toggle pilihan jenis pengiriman: **Gratis Ongkir** (Rp 0) dan **Berbayar (Ongkir)**.
  - Untuk pengiriman berbayar, disediakan input nominal Rupiah dan pilihan metode beban:
    - *Ditagih ke Tagihan Invoice* (otomatis mengakumulasikan biaya ongkir ke invoice Sales Order pelanggan),
    - *Bayar di Tempat (COD / Tunai ke Supir)*,
    - *Ditanggung Perusahaan (Subsidi)*.
  - Input informasi armada & logistik: Nama Supir / Driver dan Nomor Plat Kendaraan (Nopol).
  - Kolom **Ongkir & Armada** pada tabel daftar Surat Jalan dengan badge visual status ongkir dan nama supir/nopol.
  - Kartu ringkasan informasi ongkos kirim dan supir/nopol pada modal detail Surat Jalan.
  - Pembaruan layout cetak Surat Jalan (A4) yang mencantumkan status biaya ongkir, metode penanggung, serta nama supir dan nomor plat kendaraan pada kolom tanda tangan supir.
  - Pembaruan tampilan detail dan cetak Invoice (`InvoicesView.tsx`) untuk menampilkan rincian baris biaya ongkos kirim pengiriman DO bila ada.
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
- **Pembatasan Duplikasi Pengiriman Antrian Work Order (WO)**:
  - Pada `SalesView.tsx`, tombol "Kirim ke Antrian Produksi (WO)" kini hanya muncul jika Sales Order belum memiliki Work Order aktif (`!selectedDoc.hasActiveWorkOrder`).
  - Jika Work Order sudah pernah digenerate dan statusnya masih aktif (belum dibatalkan), tombol tidak akan ditampilkan agar tidak terjadi pembuatan data ganda.
  - Jika seluruh Work Order terkait sebelumnya telah dibatalkan (`cancelled`), tombol secara otomatis kembali muncul sehingga pengguna dapat membuat Work Order baru bila diperlukan.
  - Menambahkan relasi `productionWorkOrders` dan pemetaan `hasActiveWorkOrder` pada `types/sales.ts`, `features/sales/types.ts`, `features/sales/api.ts`, dan `features/sales/mappers.ts`.

### Fixed
- **Perbaikan WebSocket Reverb Connection Failed di Lingkungan Hosting**:
  - Mengubah konfigurasi [echo.ts](file:///d:/Okta/Project/2025-ALURIN-system/2026-ALURIN-System-ERP/frontend/src/services/echo.ts) agar tidak lagi menggunakan hardcode `localhost:8080`, melainkan membaca konfigurasi `VITE_REVERB_*` secara dinamis.
  - Menjadikan inisialisasi Laravel Echo bersifat opsional (null-safe): koneksi WebSocket hanya akan dijalankan jika kredensial `VITE_REVERB_APP_KEY` dan `VITE_REVERB_HOST` didefinisikan di environment, mencegah error `WebSocket connection to wss://localhost:8080 failed` di browser klien saat hosting production.
  - Memperbarui [NotificationBell.tsx](file:///d:/Okta/Project/2025-ALURIN-system/2026-ALURIN-System-ERP/frontend/src/components/NotificationBell.tsx) dengan pengecekan aman agar tetap berjalan mulus menggunakan REST API notifikasi jika WebSocket tidak aktif.
- **Pembersihan Catatan Alert Box di Modal Sales Order (`SalesView.tsx`)**:
  - Menghapus kotak notifikasi/catatan draft (`Sales Order masih Draft...`) dan catatan beli jadi pada tombol aksi modal detail Sales Order untuk menjaga antarmuka tetap bersih dan ringkas. Tombol "Kirim ke Antrian Produksi (WO)" kini hanya muncul saat Sales Order sudah bukan draft dan memiliki item produksi pabrik.
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
