# Frontend Agent Rules (React / TypeScript)

Panduan berikut WAJIB diikuti dalam setiap pengembangan atau modifikasi fitur frontend.

---

## 1. UI Cleanliness & Naming Rules (Mandatory)
- **Dilarang Menambahkan Teks Fluff / Gimmick di UI Header/Title:** Dilarang keras menambahkan frasa gimmick seperti `— Enterprise Edition`, `Pro Version`, `V2`, `Ultimate`, atau gimmick sejenis pada judul header, modal, card, atau label UI.
- Gunakan nama yang bersih, baku, profesional, dan langsung pada fungsinya (contoh: `Berita Acara Gudang (BAG)`).
- Jaga kebersihan antarmuka dari teks tambahan yang tidak diminta oleh USER.

---

## 2. Design System & Unified Color Palette Rules (Mandatory)
Setiap fitur baru, komponen baru, refactoring, atau modifikasi antarmuka WAJIB mematuhi sistem warna tunggal (Single Unified Color Palette) berikut:

### 2.1 Tema Warna Utama (Soft Sky Blue & Slate)
- **Primary Color:** Soft Sky / Royal Blue (`sky-600` `#0284c7`, hover `sky-700` `#0369a1`, active `sky-800`).
- **Tints & Glassmorphism:** `sky-50` (`#f0f9ff`), `sky-100` (`#e0f2fe`), `sky-200` (`#bae6fd`), overlay `sky-500/10` s.d. `sky-500/20` dengan `backdrop-blur-md`.
- **Canvas / Background:** Gradien lembut (`bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20`).
- **Borders & Dividers:** `border-sky-100` atau `border-slate-200`.
- **Neutrals (Slate):** `slate-50` hingga `slate-900` untuk teks, label mono, dan struktur netral.

### 2.2 Larangan Keras Warna-Warni (No Rainbow / Arbitrary Colors)
- **Dilarang keras memakai warna sembarang / campur aduk:** Jangan menggunakan warna dekoratif seperti `indigo`, `purple`, `violet`, `cyan`, `teal`, `fuchsia`, `pink`, atau `orange` pada tombol, sidebar, header, kartu, atau tab navigasi.
- **Tombol Utama (Primary Action):** WAJIB memakai `bg-sky-600 hover:bg-sky-700` atau gradien soft sky `bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-sky-500/20`.
- **Tombol Sekunder / Netral:** `bg-white border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700`.

### 2.3 Semantic Status Colors (Hanya Untuk Status Data/Dokumen)
Warna selain `sky` dan `slate` HANYA diizinkan secara ketat untuk status data:
- **Success / Disetujui / Selesai:** `emerald` (`bg-emerald-50 text-emerald-700 border-emerald-200`).
- **Warning / Menunggu Approval:** `amber` (`bg-amber-50 text-amber-700 border-amber-200`).
- **Danger / Ditolak / Dibatalkan:** `rose` (`bg-rose-50 text-rose-700 border-rose-200`).
- **Netral / Draft:** `slate` (`bg-slate-50 text-slate-700 border-slate-200`).
Dilarang menggunakan warna-warna status ini sebagai warna tema umum, latar belakang kartu biasa, atau tombol non-destruktif.

---

## 3. Button Standardization & Styling Rules (Mandatory)
Setiap tombol di antarmuka WAJIB terstandarisasi baik warna, bentuk (border-radius), ukuran (padding/font), maupun efek transisi/interaksi.

### 3.1 Komponen & Kelas Baku
Gunakan salah satu dari dua pendekatan standar berikut pada fitur/komponen baru:
1. **Komponen Standar React (`<Button>`):**
   ```tsx
   import { Button } from '@/src/components/ui/Button';
   <Button variant="primary" size="md" icon={<Plus size={14} />}>Tambah Data</Button>
   ```
2. **Kelas Utilitas Baku CSS (`btn`):**
   ```html
   <button className="btn btn-primary btn-md">Simpan</button>
   <button className="btn btn-secondary btn-md">Batal</button>
   ```

### 3.2 Hierarki & Varian Tombol (Strict Variants)
- **Primary Action (Aksi Utama):**
  - Varian: `variant="primary"` atau class `btn btn-primary`
  - Style: Gradien soft sky `from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600`, text-white, border `sky-600`, shadow halus `shadow-xs shadow-sky-500/20`.
  - Digunakan untuk: Simpan, Buat Dokumen, Tambah Data, Submit Form, Konfirmasi Utama.
- **Secondary / Neutral Action (Aksi Sekunder / Netral):**
  - Varian: `variant="secondary"` atau class `btn btn-secondary`
  - Style: `bg-white hover:bg-sky-50/70 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-200 shadow-2xs`.
  - Digunakan untuk: Batal, Tutup, Kembali, Filter, Refresh, Download / Ekspor, Cetak.
- **Danger / Destructive Action (Aksi Destruktif / Hapus):**
  - Varian: `variant="danger"` (`bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200`) atau `variant="danger-solid"` (`bg-gradient-to-r from-rose-600 to-rose-700 text-white`).
  - Digunakan HANYA untuk: Hapus Data permanen, Tolak Pengajuan, Batalkan Transaksi.
- **Success Action (Aksi Persetujuan):**
  - Varian: `variant="success"` (`bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-600 shadow-xs`).
  - Digunakan HANYA untuk: Setujui (Approve), Validasi Akhir.
- **Ghost Action (Aksi Ikon / Minimalis):**
  - Varian: `variant="ghost"` atau class `btn btn-ghost`
  - Style: `bg-transparent hover:bg-sky-50/70 text-slate-600 hover:text-sky-700 border-transparent`.
  - Digunakan untuk: Aksi baris tabel (lihat detail), tombol close (X), toggle view.

### 3.3 Ukuran Standar (Strict Sizes)
- **Small (`size="sm"` / `btn-sm`):** `px-2.5 py-1.5 text-xs rounded-lg gap-1.5 font-medium` (untuk baris tabel sempit, filter badge).
- **Medium (`size="md"` / `btn-md` - DEFAULT):** `px-3.5 py-2 text-xs rounded-xl gap-2 font-semibold` (standar untuk form, modal, drawer, toolbar header).
- **Large (`size="lg"` / `btn-lg`):** `px-5 py-2.5 text-sm rounded-xl gap-2.5 font-semibold` (hanya untuk aksi utama checkout POS / submit order besar).

### 3.4 Bentuk, Efek, & Interaksi (Mandatory Effects)
- **Border Radius:** WAJIB `rounded-xl` (12px) untuk ukuran md/lg, dan `rounded-lg` (8px) untuk ukuran sm/xs. Dilarang keras memakai `rounded` (4px kotak sempit) atau bentuk kapsul tanpa alasan.
- **Efek Tekan (Active State):** WAJIB ada `active:scale-[0.98]` dan `transition-all duration-150` agar tombol responsif.
- **Cursor & Disabled State:** WAJIB menyertakan `cursor-pointer`, dan saat disabled: `disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none`.
- **Dilarang Keras:** Meracik style ad-hoc seperti `bg-slate-900`, `bg-indigo-600`, `bg-blue-600`, atau `bg-slate-800` pada tombol di fitur manapun.


