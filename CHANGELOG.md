# Changelog

All notable changes to the Frontend ERP CV. Beton Agung will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- **Halaman Catatan Pembaruan Sistem di Website (`ChangelogView.tsx`, `changelogData.ts`, `AppRouter.tsx`, `Sidebar.tsx`, `Topbar.tsx`)**:
  - Menghadirkan halaman antarmuka terdedikasi untuk melihat riwayat rilis, penambahan fitur, perbaikan bug, dan optimasi alur kerja ERP di rute `/system/changelog` (dan alias rute `/changelog`).
  - Menyediakan dua mode tampilan fleksibel: **Tampilan Kartu Interaktif** (timeline rilis, badge kategori semantik, rincian butir perubahan, daftar file terdampak) dan **Format Teks Markdown Asli** lengkap dengan tombol 1-klik untuk menyalin dokumentasi ke clipboard.
  - Dilengkapi panel filter kategori (Semua, Alur Kerja & SOP, Fitur Baru, Perbaikan Bug, Keamanan, Desain UI) dan pencarian instan berbasis kata kunci modul maupun rincian perubahan.
  - Integrasi navigasi menyeluruh: dapat diakses langsung dari menu navigasi utama 'Sistem' di Sidebar, tautan indikator versi di footer Sidebar (`v2.1.0`), serta menu profil pengguna di Topbar.
- **Kewajiban Referensi Pengadaan pada Pembuatan Purchase Order (`PurchaseView.tsx`, `api.ts`)**:
  - **Penegakan Aturan SOP (Wajib Referensi)**:
    - Pembuatan dokumen Purchase Order (PO) kini secara ketat mewajibkan adanya dokumen referensi yang sah, yaitu memilih salah satu dari **Penawaran Pemasok (RFQ)** atau **Pesanan Penjualan (Sales Order)**. Pembuatan PO bebas tanpa asal-usul dokumen ditiadakan demi menjaga tata kelola dan ketertelusuran pengadaan logistik.
  - **Alur Kerja Pemilihan Referensi**:
    - **Referensi RFQ**: Memilih dokumen RFQ (berstatus 'Diterima') akan otomatis mengunci Vendor Supplier dari pemenang penawaran harga dan memuat seluruh item pengadaan beserta kuantitas dan harga satuan penawaran vendor ke dalam tabel barang.
    - **Referensi Sales Order**: Memilih dokumen Sales Order (Back-to-Back) akan otomatis memuat rincian barang dari pesanan penjualan pelanggan yang membutuhkan pemenuhan stok vendor, dan pengguna dapat menentukan supplier vendor yang dituju.
    - Dilengkapi pemilih tipe referensi interaktif (*segmented control*) yang otomatis mereset rincian data ketika beralih opsi agar data item tidak tercampur.
  - **Validasi Antarmuka & API**:
    - Jika referensi belum dipilih, form menampilkan panduan kosong yang jelas, menonaktifkan tombol penambahan baris item bebas, dan menonaktifkan tombol submit 'Rilis Surat PO'.
    - Validasi submit (`handleSubmit`) memblokir proses penyimpanan jika referensi belum dipilih dan memunculkan notifikasi peringatan.
    - Lapisan API `purchasingApi.createPurchaseOrder` dilengkapi validasi wajib referensi (`rfq_id` atau `sales_order_id`) sebelum mengirimkan muatan data ke server.
- **Perbaikan Bug Nama Item & Standardisasi Desain Purchase Order dan Retur (`PurchaseView.tsx`, `ReturnsView.tsx`)**:
  - **Investigasi & Akar Masalah**:
    - Pada form Purchase Order (`PurchaseView.tsx`), state `formItems` sebelumnya tidak menyimpan `productName`. Ketika pengguna menambahkan item dari RFQ atau Sales Order (Back-to-Back), atau memilih langsung lewat `ProductPicker`, nama produk tidak disimpan di state baris form sehingga input picker kehilangan konteks nama saat re-render. Selain itu, payload submit `purchasingApi.createPurchaseOrder` tidak mengirimkan `description: it.productName`, dan daftar item pada tabel riwayat PO kehilangan fallback pencarian nama produk jika relasi produk backend belum ter-eager load.
    - Pada form Retur Penjualan & Pembelian (`ReturnsView.tsx`), pemilihan item sebelumnya menggunakan `<select>` HTML biasa yang terbatas. Ketika referensi Sales Order atau Purchase Order dipilih, nama item hilang dan kembali ke `-- Pilih Produk --` jika terjadi perbedaan format ID atau produk belum selesai dimuat. Tampilan rincian item retur pada modal verifikasi QC juga kehilangan fallback nama dari master produk.
  - **Solusi & Perbaikan**:
    - Pada `PurchaseView.tsx`: Menambahkan interface `PoFormItem` yang menyimpan `productName` dan `unit` secara persisten. Menghubungkan `ProductPicker` dengan properti `selectedProductName={item.productName}`. Menyimpan nama produk secara otomatis ketika import item dari RFQ maupun Sales Order. Mengirimkan `description: it.productName` saat membuat PO ke API. Menyediakan fallback nama bertingkat pada tabel rincian dan template cetak dokumen PO.
    - Pada `ReturnsView.tsx`: Menambahkan interface `ReturnFormItem` yang membawa `productName`. Mengganti elemen dropdown `<select>` biasa dengan komponen `ProductPicker` interaktif dengan fitur pencarian cepat dan retensi `selectedProductName={item.productName}`. Memetakan nama produk saat referensi SO/PO dipilih, serta menambahkan fallback display nama produk pada rincian modal verifikasi QC.
  - **Standardisasi Desain UI Sesuai Panduan `AGENTS.md`**:
    - Mengadopsi palet warna tunggal Soft Sky Blue (`sky-600`, `sky-50`, `border-slate-200`) dan netral slate pada halaman Purchase Order dan Retur.
    - Menstandarisasi tombol menggunakan `btn btn-primary btn-md` (gradien soft sky `from-sky-600 to-sky-700` dengan `rounded-xl`), `btn btn-secondary`, `btn btn-success` (emerald untuk approval/konfirmasi), dan `btn btn-danger` (rose untuk tolak/batal).
    - Menghilangkan elemen dekoratif dan micro-details yang tidak perlu. Menata ulang header banner, filter tabs, modal dialog (Rilis PO, Tambah Supplier Cepat, Formulir Retur Baru, Verifikasi QC Retur, dan Konfirmasi Refund) agar selaras, konsisten, dan rapi.
- **Perbaikan Bug Nama Item & Standardisasi Desain PR dan RFQ (`PurchaseRequestView.tsx`, `RfqView.tsx`, `ProductPicker.tsx`, `PurchaseRequestPicker.tsx`, `mappers.ts`)**:
  - **Investigasi & Akar Masalah Nama Item Kosong**:
    - Pada form PR dan RFQ, state form sebelumnya hanya menyimpan `productId` tanpa menyimpan nama produk (`productName`), sehingga ketika picker di-re-render atau item ditambahkan ke baris berikutnya, trigger tombol picker kehilangan konteks nama produk dan hanya menampilkan placeholder default.
    - Pada RFQ saat pengguna memilih Referensi PR, pemetaan item PR ke form RFQ hanya mengambil `productId` dan mengabaikan `productName`, sementara `ProductPicker` menyaring produk dengan `procurementTypeFilter="purchase"`. Jika produk bertipe non-purchase atau terjadi perbedaan casing UUID, item tersebut tereliminasi dari daftar sehingga nama produk tampil kosong/blank.
    - Saat submit PR dan RFQ, payload item tidak menyertakan kolom `description: item.productName`, sehingga backend menyimpan `description` bernilai `null` dan fallback pembacaan item di tabel menjadi kosong jika relasi produk backend belum ter-eager load.
  - **Solusi & Perbaikan**:
    - Menambahkan `selectedProductName?: string` pada `ProductPickerProps` dan mencocokkan ID produk secara case-insensitive (`p.id.toLowerCase() === value.toLowerCase()`). Jika produk belum selesai dimuat atau berada di luar filter sementara, nama produk yang dipilih tetap langsung muncul dengan andal.
    - Memperbarui state item form di `PurchaseRequestView` dan `RfqView` agar menyimpan `productName` dan `unit` secara persisten.
    - Menambahkan pengiriman `description: item.productName` pada saat pembuatan PR dan RFQ ke backend (`apiClient.post`), serta memperbarui domain types (`PurchaseRequestItem`, `RfqItem`) dan mappers (`mapPurchaseRequestItemFromDto`, `mapRfqItemFromDto`) dengan fallback bertingkat (nama produk -> description -> pencocokan master produk lokal).
    - Memastikan saat referensi PR dipilih di RFQ, seluruh nama item produk langsung terisi ke dalam tabel form RFQ.
  - **Standardisasi Desain UI Sesuai Panduan `AGENTS.md`**:
    - **Palet Warna Tunggal (Soft Sky Blue & Slate)**: Menghilangkan seluruh warna dekoratif yang tidak baku (`cyan-*`, `indigo-*`, `purple-*`) dan menggantinya dengan tema utama `sky-600`, `sky-50`, `border-sky-100`, dan netral `slate-50` s.d. `slate-800`.
    - **Standardisasi Tombol**: Menggunakan varian baku `btn btn-primary btn-md` (gradien soft sky `from-sky-600 to-sky-700` dengan `rounded-xl`), `btn btn-secondary`, `btn btn-success` (emerald untuk approval/terima), dan `btn btn-danger` (rose untuk tolak/batal).
    - **Header & Modal Bersih**: Menata ulang header banner, kartu filter pencarian, dialog modal multi-item, dan kartu rincian dokumen dengan border halus (`border-slate-200/80`), `rounded-2xl`, serta efek interaksi responsif (`active:scale-[0.98]`).
- **Bypass OTP Super Admin untuk Lingkungan Localhost & Development (`LoginView.tsx`, `AuthController.php`)**:
  - Pada tahap pengembangan (localhost / 127.0.0.1 / APP_ENV=local / APP_DEBUG=true), masuk sebagai Super Admin dapat dilakukan cukup dengan memasukkan angka `111111` (angka 1 sebanyak 6 kali) pada kolom OTP Super Admin tanpa memerlukan aplikasi Google Authenticator fisik.
  - Mendukung bypass otomatis ketika memasukkan password `111111` pada akun Super Admin di form login standar lingkungan lokal untuk mempercepat proses testing dan pengembangan.
- **Persetujuan Langsung & Perbaikan Otorisasi Stock Opname (`StockOpnameView.tsx`)**:
  - **Identifikasi Kendala 403 (Forbidden)**: Pengajuan tiket approval (`/api/inventory/approval-requests`) sebelumnya ditolak oleh middleware backend karena dipetakan ke modul `approvals` (di bawah Master & Sistem), sehingga pengguna yang hanya mengaktifkan otorisasi pada modul `stock_opname` (di bawah Persediaan) mendapatkan pesan 'Akses ditolak untuk role akun ini'.
  - **Aksi Persetujuan Langsung (Direct Approval)**: Menghadirkan tombol 'Setujui Langsung' (per-item maupun massal) khusus untuk pengguna berwenang (`canApprove()`) yang langsung mengeksekusi `/inventory/stock-opname-items/{id}/approve` dengan opsi `auto_adjust: true`.
  - **Efisiensi Alur Kerja 1-Klik**: Menghilangkan keharusan membuat tiket pengajuan approval berulang kali bagi akun yang sudah memiliki otorisasi penuh; saldo stok fisik langsung diselaraskan secara instan.
  - **Status Visual Jelas**: Mengubah label status dari 'Butuh Pengajuan' menjadi badge 'Siap Disetujui' bagi akun approver, serta menambahkan pesan error deskriptif jika staf operasional non-approver belum memiliki izin modul 'approvals'.
- **Halaman Khusus Riwayat Transaksi Kasir POS (`PosHistoryView.tsx`, `AppRouter.tsx`, `routes.ts`, `navigation.tsx`)**:
  - Mengubah fitur riwayat transaksi kasir yang sebelumnya berupa modal pop-up menjadi halaman terdedikasi di rute `/sales/pos/history`.
  - Dilengkapi banner ringkasan metrik penjualan POS (total transaksi, total omset halaman, dan status pemenuhan barang).
  - Menyediakan filter komprehensif: pencarian nomor nota/pelanggan/kasir, rentang tanggal (mulai & akhir), serta filter status operasional (Selesai, Diantar/Pending, Dibatalkan).
  - Tabel transaksi rapi dengan aksi cetak struk thermal 80mm langsung, unduh PDF 80mm, cetak Bluetooth ESC/POS, dan navigasi langsung ke detail Sales Order.
  - Pagination penuh dengan pilihan jumlah baris per halaman (10, 15, 25, 50).
  - Tombol navigasi balik yang mulus antara layar Kasir POS (`/sales/pos`) dan Riwayat Transaksi POS (`/sales/pos/history`).
