# Frontend Backend Integration Plan

Target: integrate this Vite React frontend with the Laravel ERP backend API in `../backend`, replacing prototype-only `dummyData` gradually while keeping the UI usable at every phase.

## Current State

- Framework: React 19, Vite 6, TypeScript, Tailwind CSS 4, lucide-react.
- Frontend runs on port `3000` through `npm run dev`.
- Backend API base URL is configured through `VITE_API_BASE_URL`, defaulting to `http://localhost:8000/api`.
- Auth integration has started:
  - `src/services/api.ts` has `apiClient`, `authApi`, and localStorage-backed session storage.
  - login uses `POST /api/auth/login`.
  - session restore uses `GET /api/auth/me`.
  - logout uses `POST /api/auth/logout`.
  - Bearer token is attached automatically to API requests.
  - `401` clears local session and `403` returns a role/access error.
- ERP module data is still mostly local prototype state:
  - `src/dummyData.ts` is the current data source for dashboard, master data, inventory, sales, finance, purchasing, projects, QR, and reports.
  - `src/App.tsx` owns global mock state and simulated CRUD/workflow handlers.
  - several views under `src/features/prototypes/` are placeholder/prototype screens.
- Existing frontend type contracts use display-oriented Indonesian labels and camelCase fields.
- Backend API resources use module prefixes and Laravel-style JSON envelopes.

## Integration Direction

The frontend should become an API client for the Laravel backend, not a second business-rule engine.

Recommended direction:

- Keep:
  - React route/view structure in `App.tsx`.
  - shared shell components: `Sidebar`, `Topbar`, login/session flow.
  - current page components as the first UI surface.
  - `VITE_API_BASE_URL` as the only API base URL configuration.
- Add:
  - feature API modules under `src/services/` or `src/features/<module>/api.ts`.
  - request/response DTO types that match backend payloads.
  - mapper functions from backend DTOs to current UI view models.
  - loading, empty, error, pagination, search, and submit states per integrated page.
  - a small shared resource client for CRUD endpoints.
- Deprioritize/remove later:
  - global ERP mock state from `App.tsx`.
  - simulated CRUD/workflow handlers once matching backend endpoints are connected.
  - `dummyData.ts` for production paths. It can remain only for demo/dev fallback if explicitly marked.
- Business workflows should call backend workflow endpoints directly. The frontend should only update UI state from backend responses or refetch affected resources.

## Backend API Surface

Base URL:

```text
{VITE_API_BASE_URL}
```

Public endpoints:

- `GET /health`
- `POST /auth/login`

Authenticated endpoints:

- `GET /auth/me`
- `POST /auth/logout`

CRUD endpoint pattern:

```text
GET    /{module}/{resource}
POST   /{module}/{resource}
GET    /{module}/{resource}/{id}
PUT    /{module}/{resource}/{id}
PATCH  /{module}/{resource}/{id}
DELETE /{module}/{resource}/{id}
```

Module prefixes and resources:

- `identity`
  - `roles`
  - `users`
  - `employees`
  - `permissions`
  - `role-permissions`
- `master-data`
  - `customers`
  - `suppliers`
  - `product-categories`
  - `units`
  - `warehouses`
  - `storage-locations`
  - `products`
  - `company-settings`
- `inventory`
  - `product-stocks`
  - `stock-movements`
  - `stock-opname-sessions`
  - `stock-opname-items`
  - `approval-requests`
- `sales`
  - `quotations`
  - `quotation-items`
  - `sales-orders`
  - `sales-order-items`
  - `delivery-orders`
  - `delivery-order-items`
- `purchasing`
  - `purchase-orders`
  - `purchase-order-items`
  - `supplier-payables`
  - `returns`
  - `return-items`
- `projects`
  - `projects`
  - `project-timelines`
  - `project-documents`
  - `project-budget-items`
- `finance`
  - `invoices`
  - `invoice-items`
  - `payments`
  - `project-termins`
- `production`
  - `work-orders`
  - `work-order-items`
  - `work-logs`
  - `boms`
  - `bom-items`
- `support`
  - `audit-logs`
  - `reminders`
  - `document-exports`

Workflow endpoints:

- `POST /sales/quotations/{id}/approve`
- `POST /sales/sales-orders/{id}/deliver`
- `POST /sales/delivery-orders/{id}/ship`
- `POST /purchasing/purchase-orders/{id}/receive`
- `POST /finance/payments/{id}/verify`
- `POST /inventory/stock-opname-items/{id}/adjust`

## API Contract Decisions

- Authentication:
  - store only the backend Bearer token and current user in localStorage.
  - clear token on `401`.
  - show a permission-specific message on `403`.
  - keep demo login only as a deliberate development mode, not the default production path.
- Response envelope:
  - use a shared `ApiEnvelope<T>` contract for `{ data: T }`.
  - support paginated list metadata once backend list endpoints expose it consistently.
- Field names:
  - backend DTOs should keep backend/API field names.
  - UI view models can keep display-friendly camelCase names.
  - mapper functions should be explicit and tested for high-risk modules.
- Status values:
  - backend status values are the source of truth.
  - map backend machine statuses to Indonesian UI labels in one place per module.
  - do not send translated labels back to the backend.
- Money and quantity:
  - treat backend decimals as string or number deliberately per endpoint.
  - format currency only at render time.
  - avoid doing stock, invoice, payment, or project status calculations in the UI after workflow endpoints are integrated.
- Errors:
  - read backend `message` for user-facing errors.
  - add validation error handling for `422` before form-heavy modules are integrated.

## Recommended Frontend Structure

Add a thin API layer first, then migrate screens module by module.

```text
src/services/
  api.ts
  resources.ts

src/features/
  customers/
    api.ts
    mappers.ts
    types.ts
  products/
    api.ts
    mappers.ts
    types.ts
```

Suggested shared resource client:

- `listResource<T>(module, resource, params)`
- `getResource<T>(module, resource, id)`
- `createResource<T, P>(module, resource, payload)`
- `updateResource<T, P>(module, resource, id, payload)`
- `deleteResource(module, resource, id)`

Each integrated page should own:

- list query state: loading, error, search/filter/sort/page.
- form submit state.
- optimistic UI only when rollback behavior is clear.
- refetch after create/update/delete/workflow success.

## Module Dependency Order

Follow backend readiness and UI dependency order.

1. Auth and session
   - login
   - restore session
   - logout
   - current user and role display

2. Identity and access
   - employees
   - roles
   - permissions
   - role permissions

3. Master data
   - customers
   - suppliers
   - product categories
   - units
   - warehouses
   - storage locations
   - products
   - company settings

4. Inventory
   - product stocks
   - stock movements
   - stock opname sessions
   - stock opname items
   - approval requests

5. Sales
   - quotations
   - quotation items
   - quotation approval
   - sales orders
   - sales order items
   - delivery orders
   - delivery shipment

6. Purchasing and returns
   - purchase orders
   - purchase order items
   - purchase receiving
   - supplier payables
   - returns
   - return items

7. Projects
   - projects
   - project timelines
   - project documents
   - project budget items

8. Finance
   - invoices
   - invoice items
   - payments
   - payment verification
   - project termins

9. Production
   - work orders
   - work order items
   - work logs
   - BOMs
   - BOM items

10. Support and reporting
   - reminders
   - audit logs
   - document exports
   - reports/dashboard aggregations

## Implementation Phases

### Phase 0 - Integration Foundation

Goal: make the frontend consistently API-ready without changing every screen at once.

Tasks:

- Confirm backend runs locally at `http://localhost:8000/api`.
- Keep `VITE_API_BASE_URL` in `.env.example`.
- Add shared CRUD resource client.
- Add typed query parameter helper for pagination, search, sort, and filters.
- Add validation error handling for `422`.
- Add a single convention for loading, empty, and error states.
- Document demo login behavior and production login behavior.

Verification:

- `npm run lint`
- `npm run build`
- login, refresh session, and logout still work.
- `GET /api/health` works from browser/dev tools.

### Phase 1 - Auth and Shell Integration

Goal: make the app shell depend on backend identity.

Tasks:

- Use backend user and role as the source for `Topbar` and `Sidebar`.
- Hide or disable role switching in production mode.
- Add permission-aware navigation if backend role permissions are available in `/auth/me`.
- Replace hard-coded "Super Admin" defaults after session restore.
- Add expired-session UX that returns to login.

Verification:

- login with seeded backend admin user.
- refresh browser and stay logged in.
- logout invalidates the token locally and on backend.
- unauthorized and forbidden responses show clear messages.

### Phase 2 - Master Data Integration

Goal: replace local master data state with backend CRUD.

Tasks:

- Integrate customers list/create/update/delete.
- Integrate suppliers list/create/update/delete.
- Integrate product categories and units before products.
- Integrate warehouses and storage locations before inventory.
- Integrate products with category/unit relationships.
- Add mapper functions for current UI cards/tables.

Verification:

- created records persist after browser refresh.
- validation errors appear near forms.
- delete conflicts from backend are shown instead of silently removing rows.
- dashboard counts can read from integrated lists or summary endpoints.

### Phase 3 - Inventory Integration

Goal: make stock screens reflect backend stock records and movements.

Tasks:

- Replace product stock cards with `inventory/product-stocks`.
- Replace movement history with `inventory/stock-movements`.
- Connect stock opname session and item screens.
- Connect stock opname adjustment workflow.
- Remove frontend-only stock recalculation for integrated paths.
- Keep QR product views read-only until product and stock APIs are stable.

Verification:

- stock movement creation persists and appears in history.
- stock opname adjustment calls backend workflow endpoint.
- stock values after refresh match backend data.

### Phase 4 - Sales and Delivery Integration

Goal: use backend workflows for quotation to delivery.

Tasks:

- Integrate quotations and quotation items.
- Integrate quotation approval through `POST /sales/quotations/{id}/approve`.
- Integrate sales orders and sales order items.
- Integrate delivery order creation through `POST /sales/sales-orders/{id}/deliver`.
- Integrate delivery shipment through `POST /sales/delivery-orders/{id}/ship`.
- Refetch related quotations, sales orders, delivery orders, product stocks, and movements after workflows.

Verification:

- approving a quotation creates a sales order in the UI after refetch.
- creating a delivery order persists after refresh.
- shipping a delivery order deducts stock through backend workflow.
- backend validation errors for insufficient stock are shown.

### Phase 5 - Purchasing, Projects, and Finance Integration

Goal: connect the cross-module business flows.

Tasks:

- Integrate purchase orders and purchase order items.
- Integrate purchase receiving through `POST /purchasing/purchase-orders/{id}/receive`.
- Integrate supplier payables and returns.
- Integrate projects, timelines, documents, and budget items.
- Integrate invoices and invoice items.
- Integrate payments and payment verification through `POST /finance/payments/{id}/verify`.
- Refetch affected stocks, payables, invoices, and payments after workflows.

Verification:

- receiving a purchase order increases stock through backend workflow.
- payment verification updates invoice paid amount and status.
- project timeline entries persist after refresh.
- related financial views agree with backend values.

### Phase 6 - Production, Reporting, and Operations

Goal: finish the remaining ERP modules and harden API UX.

Tasks:

- Integrate production work orders, work items, logs, BOMs, and BOM items.
- Integrate reminders, audit logs, and document exports.
- Replace dashboard mock summaries with backend data or resource-derived summaries.
- Add reusable filters for date range, status, customer, supplier, warehouse, and project.
- Add print/export trigger behavior once backend export jobs are ready.
- Add E2E smoke tests for critical flows.

Verification:

- production records persist and relate to products/BOMs.
- audit log pages are read-only unless backend allows mutation.
- dashboard numbers match backend source data.
- `npm run lint` and `npm run build` pass.

## Recommended First Implementation Batch

Start with a small batch that proves the API pattern without rewiring every screen.

Batch 1:

- Keep existing auth API integration and harden error handling.
- Add shared CRUD resource client.
- Integrate customers:
  - list from `GET /master-data/customers`.
  - create through `POST /master-data/customers`.
  - update/delete if the current UI supports it.
- Add a customer mapper:
  - backend fields to current `Customer` UI type.
  - current form payload to backend payload.
- Add loading, empty, error, and submit states to `CustomersView`.

Why this first:

- customers are simple master data with low workflow risk.
- dashboard and sales depend on customer data later.
- it validates auth, CRUD, envelope parsing, mapping, and persistence in one small surface.

## Screen Migration Checklist

Use this checklist for every screen moved from dummy data to backend API.

- Endpoint exists in backend route list.
- Backend seed/demo data exists if the screen needs initial records.
- TypeScript DTO type exists.
- UI view model type exists or current type is confirmed reusable.
- Mapper exists for API response to UI view model.
- Mapper exists for form payload to API payload.
- Loading state exists.
- Empty state exists.
- Error state exists.
- Submit state prevents duplicate submission.
- `401`, `403`, and `422` behavior is handled.
- Create/update/delete refetches or reconciles the list.
- Workflow actions call backend workflow endpoints.
- Frontend does not duplicate backend business calculations.
- Browser refresh keeps data consistent.
- `npm run lint` passes.
- `npm run build` passes.

## Risks and Open Decisions

- API response shape:
  - current auth integration expects `{ data: ... }`.
  - confirm list pagination metadata before building shared table pagination.
- Naming mismatch:
  - frontend uses camelCase and Indonesian display labels.
  - backend likely uses database/API field names and machine statuses.
  - explicit mappers are safer than changing every UI type at once.
- Role permissions:
  - current UI still has role switching and prototype-only access behavior.
  - decide whether `/auth/me` should include permissions or whether the frontend should fetch them separately.
- Demo mode:
  - demo login is useful during UI work but must not mask backend integration failures.
  - decide whether demo mode is controlled by an environment variable.
- Cross-module refresh:
  - workflows can change several resources at once, especially stock and finance.
  - frontend should refetch affected resources after workflow success until a cache/query library is introduced.
- Query/cache library:
  - current app can integrate manually first.
  - if repeated fetching grows, introduce TanStack Query or an equivalent library in a dedicated phase.
- Validation UX:
  - backend `422` field errors need a standard shape before form-level error rendering is consistent.

## Definition of Done

Frontend-backend integration is done when:

- all production ERP screens read from backend API instead of `dummyData`.
- all create/update/delete actions persist through backend endpoints.
- all business workflows call backend workflow endpoints.
- auth, session restore, logout, unauthorized, and forbidden flows work.
- translated UI labels are mapped from backend source-of-truth statuses.
- money, quantity, stock, invoice, payment, and project status calculations come from backend responses.
- browser refresh does not lose ERP data.
- demo/mock data is removed from production paths or explicitly gated for development.
- `npm run lint` passes.
- `npm run build` passes.
- critical flows have at least smoke coverage or a documented manual verification script.
