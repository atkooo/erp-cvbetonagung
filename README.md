# Frontend ERP CV. Beton Agung

Frontend untuk sistem ERP CV. Beton Agung. Aplikasi ini dibangun dengan Vite, React 19, TypeScript, Tailwind CSS, dan terhubung ke Laravel API backend melalui Bearer token.

## Fitur Utama

- Dashboard ringkasan operasional.
- Master data customer, supplier, produk, kategori, satuan, gudang, dan lokasi stok.
- Inventory, stock in/out, stock opname, multi warehouse, dan approval.
- Sales: quotation, sales order, delivery order, invoice, payment, dan return.
- Purchasing: purchase request, RFQ, purchase order, receiving, payable, dan return.
- Finance, project, production, HRD, payroll, audit log, reminder, dan export dokumen.
- Login berbasis backend API dengan token yang disimpan di localStorage.

## Prasyarat

- Node.js 20 atau lebih baru.
- npm.
- Backend Laravel berjalan di `http://localhost:8000/api`.

Backend project berada di folder sibling `../backend`.

## Setup Lokal

1. Install dependency:

   ```bash
   npm install
   ```

2. Buat file environment lokal:

   ```bash
   copy .env.example .env.local
   ```

3. Sesuaikan nilai berikut di `.env.local`:

   ```env
   VITE_API_BASE_URL="http://localhost:8000/api"
   ```

4. Jalankan frontend:

   ```bash
   npm run dev
   ```

5. Buka aplikasi:

   ```text
   http://localhost:3000
   ```

## Environment

| Nama | Keterangan | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL Laravel API. Semua request frontend dikirim ke URL ini. | `http://localhost:8000/api` |
| `VITE_APP_NAME` | Nama aplikasi yang tampil di UI. | `CV. Beton Agung` |
| `GEMINI_API_KEY` | Variabel bawaan template AI Studio. Tidak dipakai untuk integrasi ERP utama. | - |
| `APP_URL` | Variabel bawaan template AI Studio. Tidak dipakai untuk run lokal Vite. | - |

## Script

| Command | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan Vite dev server di port `3000` dan host `0.0.0.0`. |
| `npm run build` | Build production ke folder `dist`. |
| `npm run preview` | Preview hasil build production. |
| `npm run lint` | Menjalankan TypeScript check tanpa emit. |
| `npm run clean` | Menghapus output `dist` dan `server.js`. |

## Integrasi Backend

- API client utama ada di `src/services/api.ts`.
- Default API base URL adalah `http://localhost:8000/api`.
- Auth endpoint yang dipakai:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- Token disimpan dengan key `cvba_api_token`.
- Data user disimpan dengan key `cvba_api_user`.
- Jika API mengembalikan `401`, sesi lokal dihapus dan aplikasi memicu event `auth:unauthorized`.

Pastikan backend mengizinkan origin frontend melalui `ALLOWED_ORIGINS`, misalnya:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173
```

## Struktur Penting

```text
src/
  components/          Komponen dan view utama aplikasi
  features/            Modul API, mapper, dan type per domain
  pages/               Entry page per menu/domain
  services/api.ts      HTTP client, auth API, dan session storage
  services/resources.ts Helper resource CRUD generik
  config/navigation.tsx Konfigurasi menu/sidebar
```

## Alur Development

1. Jalankan backend Laravel terlebih dahulu dari `../backend`.
2. Pastikan `GET http://localhost:8000/api/health` mengembalikan `status: ok`.
3. Jalankan frontend dengan `npm run dev`.
4. Login memakai akun yang disediakan seeder backend.
5. Untuk perubahan API, tambahkan DTO dan mapper di `src/features/<module>/`.

Dokumen integrasi lebih detail tersedia di `docs/frontend-backend-integration-plan.md`.

## Troubleshooting

- `Failed to fetch` biasanya berarti backend belum berjalan, URL `VITE_API_BASE_URL` salah, atau CORS backend belum mengizinkan origin frontend.
- `401` berarti token tidak valid atau sesi backend sudah habis. Logout lalu login ulang.
- `403` berarti role user tidak punya permission untuk endpoint tersebut.
- Jika perubahan `.env.local` belum terbaca, restart `npm run dev`.
