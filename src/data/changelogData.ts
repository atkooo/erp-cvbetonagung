/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ChangelogCategory = 'fitur-baru' | 'perbaikan' | 'alur-kerja' | 'keamanan' | 'desain-ui';

export interface ChangelogItem {
  id: string;
  title: string;
  category: ChangelogCategory;
  categoryLabel: string;
  module: string;
  summary: string;
  details: string[];
  affectedFiles?: string[];
}

export interface ChangelogRelease {
  version: string;
  releaseDate: string;
  isLatest?: boolean;
  statusLabel?: string;
  summary: string;
  items: ChangelogItem[];
}

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: "v2.1.0 (Terkini)",
    releaseDate: "November 2026",
    isLatest: true,
    statusLabel: "Rilis Terbaru",
    summary: "Penegakan alur kerja pengadaan PO berbasis referensi sah, standardisasi tampilan PR/RFQ/PO/Retur sesuai desain Soft Sky Blue, perbaikan retensi nama item produk, bypass OTP dev, otorisasi langsung stock opname, dan halaman khusus riwayat kasir POS.",
    items: [
      {
        id: "po-mandatory-reference",
        title: "Kewajiban Referensi Pengadaan pada Pembuatan Purchase Order",
        category: "alur-kerja",
        categoryLabel: "Alur Kerja & SOP",
        module: "Pembelian (PO & RFQ)",
        summary: "Pembuatan PO secara ketat mewajibkan adanya referensi sah dari RFQ atau Sales Order demi menjaga tata kelola dan ketertelusuran dokumen logistik.",
        details: [
          "Pembuatan PO manual mandiri tanpa asal-usul dokumen kini ditiadakan untuk menjaga ketertelusuran SOP.",
          "Menghadirkan pemilih tipe referensi terintegrasi (Penawaran Pemasok / RFQ vs Pesanan Penjualan / Sales Order).",
          "Memilih referensi RFQ otomatis mengunci Vendor Supplier pemenang penawaran dan memuat item barang beserta harga satuan kuotasi.",
          "Memilih referensi Sales Order (Back-to-Back) otomatis memuat rincian barang dari pesanan penjualan pelanggan yang memerlukan restok supplier.",
          "Validasi formulir dan lapisan API purchasingApi.createPurchaseOrder yang memblokir pembuatan PO tanpa referensi."
        ],
        affectedFiles: ["PurchaseView.tsx", "api.ts"]
      },
      {
        id: "po-return-item-bugfix-ui",
        title: "Perbaikan Bug Nama Item & Standardisasi Desain PO dan Retur",
        category: "perbaikan",
        categoryLabel: "Perbaikan Bug & UI",
        module: "Pembelian (PO) & Retur",
        summary: "Memperbaiki kendala hilangnya nama item saat penambahan baris atau re-render form, serta standardisasi visual halaman PO dan Retur.",
        details: [
          "State baris form PO (PoFormItem) dan Retur (ReturnFormItem) kini menyimpan nama produk secara persisten.",
          "Mengganti elemen select HTML statis pada formulir Retur dengan komponen interaktif ProductPicker.",
          "Penyediaan fallback nama produk bertingkat pada tabel rincian transaksi dan template cetak dokumen.",
          "Penerapan palet Soft Sky Blue dan standardisasi tombol sesuai panduan AGENTS.md."
        ],
        affectedFiles: ["PurchaseView.tsx", "ReturnsView.tsx"]
      },
      {
        id: "pr-rfq-item-bugfix-ui",
        title: "Perbaikan Bug Nama Item & Standardisasi Desain PR dan RFQ",
        category: "perbaikan",
        categoryLabel: "Perbaikan Bug & UI",
        module: "Permintaan Pembelian (PR) & RFQ",
        summary: "Memastikan nama item produk langsung terisi dan tetap muncul saat dipilih pada formulir PR dan penawaran RFQ.",
        details: [
          "Komponen ProductPicker kini mendukung retensi selectedProductName untuk mencegah teks kosong saat re-render.",
          "Pencocokan ID produk dibuat fleksibel dan case-insensitive.",
          "Pemetaan item otomatis saat referensi PR dipilih di RFQ beserta pengiriman deskripsi barang ke API.",
          "Restrukturisasi antarmuka formulir, dialog modal, dan kartu rincian dokumen dengan tema Soft Sky Blue."
        ],
        affectedFiles: ["PurchaseRequestView.tsx", "RfqView.tsx", "ProductPicker.tsx", "mappers.ts"]
      },
      {
        id: "otp-bypass-dev",
        title: "Bypass OTP Super Admin untuk Lingkungan Development",
        category: "keamanan",
        categoryLabel: "Keamanan & Dev",
        module: "Autentikasi & Login",
        summary: "Mempermudah akses pengujian lokal tanpa memerlukan sinkronisasi aplikasi Google Authenticator fisik.",
        details: [
          "Pada lingkungan localhost / development, login Super Admin dapat menggunakan angka 111111 (1 sebanyak 6 kali).",
          "Mendukung bypass otomatis form login untuk percepatan iterasi pengujian sistem lokal."
        ],
        affectedFiles: ["LoginView.tsx", "AuthController.php"]
      },
      {
        id: "stock-opname-direct-approval",
        title: "Persetujuan Langsung & Perbaikan Otorisasi Stock Opname",
        category: "alur-kerja",
        categoryLabel: "Otorisasi & Alur Kerja",
        module: "Persediaan (Stock Opname)",
        summary: "Menyediakan aksi persetujuan langsung 1-klik bagi akun approver serta mengatasi kendala 403 Forbidden tiket approval.",
        details: [
          "Approver berwenang dapat langsung menyetujui hasil opname fisik barang tanpa melalui siklus tiket berulang.",
          "Penyesuaian stok fisik otomatis (auto_adjust: true) langsung disinkronkan ke saldo inventaris sistem.",
          "Penyelarasan hak akses modul antara stock_opname dan approvals sistem."
        ],
        affectedFiles: ["StockOpnameView.tsx"]
      },
      {
        id: "pos-history-page",
        title: "Halaman Khusus Riwayat Transaksi Kasir POS",
        category: "fitur-baru",
        categoryLabel: "Fitur Baru",
        module: "Penjualan (Kasir POS)",
        summary: "Mentransformasikan riwayat transaksi kasir dari modal pop-up menjadi halaman tersendiri di /sales/pos/history.",
        details: [
          "Tampilan banner ringkasan metrik penjualan POS (total transaksi, omset, status barang).",
          "Filter pencarian lengkap berdasarkan nota, pelanggan, kasir, dan rentang tanggal.",
          "Aksi cetak struk thermal 80mm langsung, cetak Bluetooth ESC/POS, dan unduh PDF dokumen.",
          "Navigasi breadcrumb yang mulus antara layar Kasir dan Riwayat Transaksi POS."
        ],
        affectedFiles: ["PosHistoryView.tsx", "AppRouter.tsx", "routes.ts", "navigation.tsx"]
      }
    ]
  },
  {
    version: "v2.0.0",
    releaseDate: "Oktober 2026",
    summary: "Fondasi Sistem Desain Terpadu (Soft Sky Blue & Slate), Berita Acara Gudang (BAG), Lokasi Multi-Gudang, dan Terminal Presensi Karyawan.",
    items: [
      {
        id: "unified-design-system",
        title: "Penerapan Single Unified Color Palette (Soft Sky Blue & Slate)",
        category: "desain-ui",
        categoryLabel: "Desain UI",
        module: "Seluruh Modul ERP",
        summary: "Penyeragaman seluruh antarmuka aplikasi menggunakan Soft Sky Blue (#0284c7) dan netral Slate tanpa warna dekoratif acak.",
        details: [
          "Standarisasi tombol ke kelas baku btn btn-primary, btn btn-secondary, dsb dengan rounded-xl dan active scale.",
          "Pemberian status warna semantik ketat: Emerald (Disetujui), Amber (Menunggu), Rose (Ditolak), Slate (Draft).",
          "Pembersihan micro-label dan teks gimmick penjelas yang tidak diperlukan."
        ],
        affectedFiles: ["App.css", "Sidebar.tsx", "Topbar.tsx"]
      },
      {
        id: "berita-acara-gudang",
        title: "Modul Berita Acara Gudang (BAG)",
        category: "fitur-baru",
        categoryLabel: "Fitur Baru",
        module: "Persediaan (Gudang)",
        summary: "Pencatatan resmi dokumen Berita Acara untuk selisih, kerusakan, dan penyesuaian barang di gudang.",
        details: [
          "Pencatatan formal alasan ketidaksesuaian barang saat penerimaan maupun inspeksi.",
          "Dukungan cetak dokumen Berita Acara legal dan penyesuaian stok otomatis."
        ],
        affectedFiles: ["BagView.tsx", "navigation.tsx"]
      },
      {
        id: "multi-warehouse-qr",
        title: "Lokasi Multi-Gudang & Pemindai Barcode QR",
        category: "fitur-baru",
        categoryLabel: "Fitur Baru",
        module: "Persediaan & Master Data",
        summary: "Manajemen lokasi penyimpanan rak/bin multi-gudang serta integrasi pemindai kamera barcode/QR produk.",
        details: [
          "Struktur lokasi gudang hierarkis per gudang dan zona penyimpanan.",
          "Pemindaian cepat QR code menggunakan kamera perangkat untuk inspeksi instan."
        ],
        affectedFiles: ["MultiWarehouseView.tsx", "QrView.tsx"]
      }
    ]
  }
];

export const CHANGELOG_CATEGORIES: { id: ChangelogCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Semua Pembaruan' },
  { id: 'alur-kerja', label: 'Alur Kerja & SOP' },
  { id: 'fitur-baru', label: 'Fitur Baru' },
  { id: 'perbaikan', label: 'Perbaikan Bug' },
  { id: 'keamanan', label: 'Keamanan' },
  { id: 'desain-ui', label: 'Desain UI' },
];

