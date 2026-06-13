# Engineering Documentation — Frontend
## Sistem ERP CV. Betonagung

> **Versi:** 1.0  
> **Tanggal:** Juni 2026  
> **Framework:** React 19 + Vite 6  
> **Bahasa:** TypeScript  
> **Styling:** TailwindCSS v4

---

## 1. Gambaran Umum

Frontend ERP CV. Betonagung adalah aplikasi Single Page Application (SPA) berbasis React yang berjalan sebagai klien dari REST API Laravel. Aplikasi ini dirancang sebagai **Single-File SPA** — semua view di-render secara kondisional berdasarkan `currentView` state.

### Modul Utama

| Modul | Halaman / View |
|---|---|
| **Dashboard** | `DashboardView`, `EmployeeDashboardView` |
| **Master Data** | `CustomersView`, `SuppliersView`, `ProductsView`, `CategoriesView`, `UnitsView`, `WarehouseMasterView` |
| **Penjualan** | `SalesView` (Quotation, SO, DO) |
| **Pembelian** | `PurchaseView`, `PurchaseRequestView`, `RfqView` |
| **Inventori** | `InventoryView`, `MultiWarehouseView`, `StockOpnameView`, `QrView` |
| **Keuangan** | `InvoicesView`, `PaymentsView`, `ReceivablesPayablesView`, `CashExpenseView` |
| **Produksi** | `ProductionWorkOrderView`, `BomCostingView` |
| **Proyek** | `ProjectsView`, `ProjectBudgetingView` |
| **HRD** | `EmployeeMasterView`, `AttendanceDashboardView`, `LeaveManagementView`, `PayrollManagementView`, `EmployeeLoanView` |
| **Support** | `AuditLogView`, `RemindersView`, `DocumentExportsView`, `ApprovalWorkflowView` |
| **Pengaturan** | `RolePermissionView`, `UsersView`, `SettingsView`, `ProfileView` |

---

## 2. Stack Teknologi

| Komponen | Teknologi | Versi |
|---|---|---|
| UI Framework | React | ^19.0.1 |
| Build Tool | Vite | ^6.2.3 |
| Bahasa | TypeScript | ~5.8.2 |
| Styling | TailwindCSS | ^4.1.14 |
| Icon | lucide-react | ^0.546.0 |
| Icon (tambahan) | react-icons | ^5.6.0 |
| Animasi | motion | ^12.23.24 |
| QR Code | qrcode.react | ^4.2.0 |
| QR Scanner | html5-qrcode | ^2.3.8 |
| Barcode | react-barcode | ^1.6.1 |
| Print | react-to-print | ^3.3.0 |
| Image Export | html-to-image, html2canvas | ^1.11.13 / ^1.4.1 |
| Alert Dialog | sweetalert2 | ^11.26.25 |
| AI (Gemini) | @google/genai | ^2.4.0 |

---

## 3. Struktur Direktori

```
frontend/
├── src/
│   ├── App.tsx                    # Root komponen utama, router & state global
│   ├── main.tsx                   # Entry point React DOM
│   ├── types.ts                   # TypeScript type definitions (semua interface)
│   ├── routes.ts                  # Peta path URL ↔ ViewType
│   ├── index.css                  # Global CSS entry
│   ├── components/
│   │   ├── Sidebar.tsx             # Navigasi sidebar
│   │   ├── Topbar.tsx              # Header bar atas
│   │   ├── icons.tsx               # Custom icon components
│   │   ├── Skeleton.tsx            # Loading skeleton
│   │   ├── SearchableSelect.tsx    # Dropdown searchable
│   │   ├── ProductPicker.tsx       # Picker produk
│   │   ├── PurchaseRequestPicker.tsx # Picker PR
│   │   ├── RfqPicker.tsx           # Picker RFQ
│   │   ├── ReferencePicker.tsx     # Picker referensi dokumen
│   │   │
│   │   ├── DashboardView.tsx       # Dashboard utama (admin)
│   │   ├── EmployeeDashboardView.tsx # Dashboard karyawan
│   │   ├── LoginView.tsx           # Halaman login
│   │   │
│   │   ├── CustomersView.tsx       # Master pelanggan
│   │   ├── SuppliersView.tsx       # Master pemasok
│   │   ├── ProductsView.tsx        # Master produk
│   │   ├── CategoriesView.tsx      # Kategori produk
│   │   ├── UnitsView.tsx           # Satuan
│   │   ├── WarehouseMasterView.tsx # Master gudang & lokasi
│   │   │
│   │   ├── SalesView.tsx           # Quotation, SO, DO (tabbed)
│   │   ├── DeliveryOrdersView.tsx  # Delivery order detail
│   │   ├── InvoicesView.tsx        # Invoice tagihan
│   │   ├── PaymentsView.tsx        # Pembayaran
│   │   ├── ReceivablesPayablesView.tsx # Piutang/hutang
│   │   ├── CashExpenseView.tsx     # Kas & pengeluaran
│   │   ├── FinanceReportView.tsx   # Laporan keuangan
│   │   │
│   │   ├── PurchaseView.tsx        # Purchase Order
│   │   ├── PurchaseRequestView.tsx # Purchase Request
│   │   ├── RfqView.tsx             # Request for Quotation
│   │   ├── ReturnsView.tsx         # Retur barang
│   │   │
│   │   ├── InventoryView.tsx       # Stok & mutasi barang
│   │   ├── MultiWarehouseView.tsx  # Multi-gudang
│   │   ├── StockOpnameView.tsx     # Stock opname
│   │   ├── InventoryReportView.tsx # Laporan inventori
│   │   ├── QrView.tsx              # QR product scanner
│   │   │
│   │   ├── ProductionWorkOrderView.tsx # Work order produksi
│   │   ├── BomCostingView.tsx      # Bill of Materials & costing
│   │   │
│   │   ├── ProjectsView.tsx        # Manajemen proyek
│   │   ├── ProjectBudgetingView.tsx # Anggaran proyek
│   │   │
│   │   ├── EmployeeMasterView.tsx  # Master karyawan
│   │   ├── AttendanceDashboardView.tsx # Dashboard absensi
│   │   ├── AttendanceScannerView.tsx   # Scanner QR absensi
│   │   ├── LeaveManagementView.tsx # Manajemen cuti
│   │   ├── PayrollManagementView.tsx   # Penggajian
│   │   ├── EmployeeLoanView.tsx    # Pinjaman karyawan
│   │   │
│   │   ├── ApprovalWorkflowView.tsx # Workflow persetujuan
│   │   ├── AuditLogView.tsx        # Log aktivitas sistem
│   │   ├── RemindersView.tsx       # Pengingat
│   │   ├── DocumentExportsView.tsx # Ekspor dokumen
│   │   │
│   │   ├── RolePermissionView.tsx  # Manajemen role & permission
│   │   ├── UsersView.tsx           # Manajemen user
│   │   ├── SettingsView.tsx        # Pengaturan sistem
│   │   └── ProfileView.tsx         # Profil user
│   │
│   ├── config/                     # Konfigurasi aplikasi
│   ├── features/                   # Feature-specific logic
│   ├── pages/                      # Halaman yang diorganisir per domain
│   │   ├── dashboard/
│   │   ├── finance/
│   │   ├── inventory/
│   │   ├── master/
│   │   ├── purchasing/
│   │   ├── reports/
│   │   └── sales/
│   ├── services/
│   │   ├── api.ts                  # API client (fetch wrapper)
│   │   └── resources.ts            # Resource endpoint helpers
│   ├── utils/                      # Utility functions
│   └── vite-env.d.ts
├── public/                         # Static assets
├── assets/                         # Aset lokal
├── docs/
│   └── engineering.md              # File ini
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Arsitektur Aplikasi

### 4.1 State Management (Tanpa Redux)

Seluruh state global dikelola di `App.tsx` menggunakan React hooks:

```typescript
// State navigasi
const [currentView, setCurrentView] = useState<ViewType>('login');

// State auth
const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
const [authToken, setAuthToken] = useState<string | null>(null);

// State data yang di-share antar view
const [selectedXxx, setSelectedXxx] = useState<T | null>(null);
```

Props drilling digunakan untuk meneruskan state ke child component.

### 4.2 Routing (Hash/History SPA)

Routing diimplementasikan secara manual melalui:
- `routes.ts` — peta `ViewType ↔ URL path`
- `PATH_TO_VIEW` — object lookup path ke view
- `VIEW_TO_PATH` — object lookup view ke path
- Event `popstate` untuk navigasi browser back/forward

```typescript
// Navigasi
const navigate = (view: ViewType) => {
  const path = pathForView(view);
  window.history.pushState({}, '', path);
  setCurrentView(view);
};

// Sinkronisasi URL
window.addEventListener('popstate', () => {
  const view = viewFromPath(window.location.pathname);
  if (view) setCurrentView(view);
});
```

### 4.3 API Client

Abstraksi fetch terstandar di `src/services/api.ts`:

```typescript
// GET
const result = await apiClient.get<ApiListEnvelope<Customer>>('/master-data/customers');

// POST
const created = await apiClient.post<ApiEnvelope<Customer>>('/master-data/customers', payload);

// PUT
await apiClient.put(`/master-data/customers/${id}`, payload);

// DELETE
await apiClient.delete(`/master-data/customers/${id}`);
```

**Penanganan error:**
- `401` → auto logout + redirect ke login
- `403` → tampilkan pesan "Akses ditolak"
- `4xx/5xx` → lempar `ApiRequestError` dengan pesan dari backend

### 4.4 Autentikasi Frontend

```typescript
// Simpan session
authStorage.setSession({ token, user });

// Cek token
const token = authStorage.getToken(); // dari localStorage

// Logout
authStorage.clear();
```

Token disimpan di `localStorage` dengan key `cvba_api_token`.

---

## 5. TypeScript Types

Semua interface berada di `src/types.ts`. Berikut entitas utama:

### Entitas Master
```typescript
interface Customer    // Pelanggan
interface Supplier    // Pemasok
interface Product     // Produk
interface Category    // Kategori produk
```

### Entitas Transaksi
```typescript
interface SalesOrder        // Sales Order
interface Quotation         // Penawaran harga
interface Invoice           // Tagihan
interface Payment           // Pembayaran
interface PurchaseOrder     // Purchase Order
interface PurchaseRequest   // Purchase Request
interface Rfq               // Request for Quotation
interface GoodsReceiptNote  // Penerimaan barang
interface DeliveryOrder     // Surat jalan
```

### Entitas Inventori
```typescript
interface StockMovement      // Mutasi stok
```

### Entitas Produksi
```typescript
interface ProductionWorkOrder   // Work order
interface ProductionWorkLog     // Log kerja
interface Bom                   // Bill of Materials
interface BomItem               // Item BOM
```

### Entitas HRD & Proyek
```typescript
interface Employee    // Karyawan
interface Project     // Proyek
```

### Entitas Auth
```typescript
interface AuthUser       // User yang login
interface AuthRole       // Role user
interface AuthPermission // Permission
interface AuthSession    // Token + user
```

### ViewType
```typescript
type ViewType = 'login' | 'dashboard' | 'customers' | 'sales-orders' | ...
// 42 view terdaftar
```

---

## 6. Environment & Konfigurasi

File `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

File `.env.example` sudah tersedia sebagai template.

---

## 7. Cara Menjalankan (Development)

```bash
# Install dependencies
npm install

# Jalankan dev server (port 3000)
npm run dev

# Build produksi
npm run build

# Preview build
npm run preview

# Type check
npm run lint
```

Server dev berjalan di: `http://localhost:3000`

---

## 8. Pola Komponen

### 8.1 View Component (Full Page)

Setiap view adalah komponen standalone yang menerima props dari `App.tsx`:

```typescript
interface XxxViewProps {
  currentUser: AuthUser;
  onNavigate: (view: ViewType) => void;
  // ... state spesifik
}

export default function XxxView({ currentUser, onNavigate }: XxxViewProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch data dari API
  }, []);

  return <div>...</div>;
}
```

### 8.2 Picker Component (Modal)

Komponen reusable untuk memilih entitas dari list:
- `ProductPicker` — pilih produk
- `PurchaseRequestPicker` — pilih PR
- `RfqPicker` — pilih RFQ
- `ReferencePicker` — pilih referensi dokumen

### 8.3 Shared UI Components
- `Skeleton` — loading placeholder
- `SearchableSelect` — dropdown dengan search
- `icons.tsx` — custom SVG icons

---

## 9. Fitur Khusus

### 9.1 QR Code & Barcode
- Generate QR: `qrcode.react`
- Scan QR: `html5-qrcode` (akses kamera)
- Barcode: `react-barcode`
- View: `QrView.tsx` (generate) dan `AttendanceScannerView.tsx` (scan absensi)

### 9.2 Print & Export
- Print halaman: `react-to-print`
- Capture screenshot: `html-to-image`, `html2canvas`
- Download file dari API: fetch blob → create object URL

### 9.3 AI Assistant (Gemini)
- Library: `@google/genai`
- Digunakan untuk fitur AI di dalam aplikasi

### 9.4 Animasi
- Library: `motion` (Framer Motion)
- Digunakan untuk transisi halaman dan micro-animation

---

## 10. Permission & Akses

Setiap komponen dapat mengecek permission user:

```typescript
const hasPermission = (user: AuthUser, module: string, action: string) => {
  return user.role?.permissions?.some(
    p => p.module === module && p.action === action
  ) ?? false;
};
```

Tampilan menu sidebar dan tombol aksi dikontrol berdasarkan `role` dan `permissions` yang dimiliki user.

---

## 11. Deployment (Vercel)

File `vercel.json` sudah dikonfigurasi untuk SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Semua path akan di-redirect ke `index.html` agar React Router bisa menangani routing.

---

## 12. Konvensi Kode

- Komponen: `PascalCase` (.tsx)
- Hooks & functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase` di `types.ts`
- File styles: Tailwind utility classes inline, custom di `index.css`
- Import: absolut dari `src/`, relatif untuk file berdekatan
