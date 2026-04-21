# Frontend Improvement Tracker

> Consolidated từ: session review (8.5/10) + comprehensive audit (7.8/10)
> Bắt đầu: 2026-04-22 | Mục tiêu: 9+ / 10

---

## Progress

| # | ID | Hạng mục | Trạng thái | Ghi chú |
|---|-----|----------|-----------|---------|
| 1 | B1 | Tạo `middleware.ts` — JWT cookie guard | ✅ Done | `middleware.ts` root |
| 2 | B2 | Sửa raw `fetch()` profile avatar upload | ✅ Done | `profile/page.tsx:265` |
| 3 | H1 | Migrate `@/lib/format` → payroll/, accountant/, admin/, team-leader/ | ✅ Done | 30 files migrated |
| 4 | H2 | Thêm `ErrorBoundary` vào dashboard layout | ✅ Done | `components/ui/error-boundary.tsx` |
| 5 | M1 | Thay `window.confirm()` → custom modal | ✅ Done | 5 files, `components/ui/confirm-modal.tsx` |
| 6 | M3 | Fix Vietnamese diacritics `create-pin/page.tsx` | ✅ Done | Lines 10, 12, 18 |
| 7 | H3 | Tách mock data → `lib/mocks/` | ✅ Done | 3 shared mock files, 8 files updated |
| 8 | H4 | Bổ sung CFO role vào `CLAUDE.md` | ✅ Done | Route tree + sidebar spec |
| 9 | M2 | Toast slide-in animation | ✅ Done | `toast-slide-in` keyframe + arbitrary class |
| 10 | M4 | Chuẩn hóa skeleton loading nhất quán | ✅ Done | `components/ui/skeleton.tsx` — TableRowSkeleton + CardListSkeleton |

---

## Chi tiết từng mục

### 🔴 BLOCKING

#### B1 — middleware.ts
- **Vấn đề**: File `middleware.ts` bị thiếu trong source. CLAUDE.md yêu cầu JWT cookie guard cho mọi protected route. Chỉ có trong `.next/` build output → production không protect route.
- **Fix**: Tạo `/middleware.ts` — check cookie `access_token`, redirect `/login` nếu thiếu, redirect `/dashboard` nếu đã có token mà vào public route.
- **Status**: ✅ Done — `middleware.ts` tạo tại root. Check cookie `access_token`, redirect `/login?callbackUrl=<path>` nếu thiếu, redirect `/dashboard` nếu đã có token mà vào public route. Matcher loại trừ static assets.

#### B2 — Raw fetch() profile avatar
- **Vấn đề**: `profile/page.tsx:265` dùng `fetch()` trực tiếp gọi Cloudinary — bypass hoàn toàn `api-client.ts`, không có auto-refresh token, không có `ApiError`.
- **Fix**: Wrap error handling theo chuẩn `api-client`, hoặc proxy qua backend.
- **Status**: ✅ Done — Giữ nguyên `fetch()` trực tiếp tới Cloudinary (đúng vì external API không cần JWT). Fix: (1) parse Cloudinary error body lấy message chi tiết, (2) bọc `.json()` trong try/catch, (3) throw `Error` với message tiếng Việt + HTTP status, (4) catch block phân biệt `ApiError` / `Error` / unknown.

---

### 🟡 HIGH PRIORITY

#### H1 — Migrate @/lib/format
- **Status**: ✅ Done — 30 files migrated. 1 intentional local remain: `accountant/ledger/[id]` (needs second-precision). `formatVnd` renamed to `formatCurrency` in 3 files.

#### H2 — ErrorBoundary
- **Status**: ✅ Done — `components/ui/error-boundary.tsx` (React class component). Wrapped `<React.Suspense>` in `(dashboard)/layout.tsx`.

#### H3 — Tách mock data → lib/mocks/
- **Status**: ✅ Done — Created `lib/mocks/departments.ts` (MOCK_DEPARTMENTS + MOCK_MANAGERS), `lib/mocks/projects.ts` (MOCK_TL_OPTIONS), `lib/mocks/system.ts` (MOCK_SYSTEM_FUND_BALANCE). Updated 8 page files to import from shared mocks. Page-specific mocks remain inline (no deduplication value).

#### H4 — CFO role trong CLAUDE.md
- **Status**: ✅ Done — Added `/cfo/*` route tree entry (approvals, system-fund, settings, audit-logs) + CFO sidebar spec row to `CLAUDE.md`.

---

### 🟠 MEDIUM

#### M1 — window.confirm() → custom modal
- **Status**: ✅ Done — Created `components/ui/confirm-modal.tsx`. Replaced in 5 files: `requests/[id]`, `admin/users/[id]`, `admin/users`, `team-leader/projects/[id]`, `accountant/payroll/[id]`.

#### M2 — Toast slide-in animation
- **Status**: ✅ Done — Added `@keyframes toast-slide-in` to `globals.css`. Applied via `[animation:toast-slide-in_0.25s_ease-out]` on each toast div.

#### M3 — Vietnamese diacritics create-pin
- **Status**: ✅ Done — Fixed `create-pin/page.tsx` lines 10, 12, 18: proper diacritics on h1, p, and Link text.

#### M4 — Skeleton loading nhất quán
- **Status**: ✅ Done — Created `components/ui/skeleton.tsx` with `TableRowSkeleton` (colSpan + rows props) and `CardListSkeleton` (rows + height props). Replaced in: `admin/users` (TableRow), `admin/audit-logs` (TableRow), `accountant/disbursements` (CardList h-48), `cfo/approvals` (CardList h-44), `manager/approvals` (CardList h-44), `team-leader/approvals` (CardList h-36), `accountant/payroll` (CardList h-40).

---

## Changelog

| Ngày | ID | Thay đổi |
|------|----|---------|
| 2026-04-22 | — | Khởi tạo file tracking |
| 2026-04-22 | B1 | Tạo `middleware.ts` — JWT guard, PUBLIC_ROUTES, cookie check, matcher |
| 2026-04-22 | B2 | Fix Cloudinary error handling — Vietnamese message, HTTP status, safe json parse |
| 2026-04-22 | H1 | Migrate 30 files → `@/lib/format`; 1 intentional local remain (ledger/[id] needs seconds) |
| 2026-04-22 | H2 | Tạo `ErrorBoundary` class component, wrap dashboard layout |
| 2026-04-22 | M1 | Tạo `ConfirmModal`, thay `window.confirm()` trong 5 files |
| 2026-04-22 | M3 | Fix Vietnamese diacritics `create-pin/page.tsx` |
| 2026-04-22 | H3 | Tạo `lib/mocks/` (3 shared files), cập nhật 8 page imports |
| 2026-04-22 | H4 | Bổ sung CFO route tree + sidebar vào `CLAUDE.md` |
| 2026-04-22 | M2 | `toast-slide-in` keyframe + `[animation:...]` class trên toast items |
| 2026-04-22 | M4 | Tạo `skeleton.tsx` (TableRowSkeleton + CardListSkeleton), thay trong 7 files |
