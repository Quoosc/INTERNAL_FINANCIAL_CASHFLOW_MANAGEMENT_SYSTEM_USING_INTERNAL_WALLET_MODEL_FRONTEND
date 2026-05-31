# TODO_IMPROVEMENTS.md — Backend-dependent Features

> Những cải tiến cần backend API tương ứng.
> Cập nhật lần cuối: **2026-05-31** (Sprint 16)

---

## ✅ 1. Analytics Charts — Admin / Accountant Dashboard

> **Đã implement hoàn chỉnh — Sprint 16.**

**Backend đã thêm:**

| Endpoint | Params | Auth |
|---|---|---|
| `GET /api/v1/dashboard/analytics/cashflow` | `period=ytd\|last6m\|fy{year}`, `unit=raw\|million` | `PAYROLL_MANAGE` hoặc `USER_VIEW_LIST` |
| `GET /api/v1/dashboard/admin/analytics` | — | `USER_VIEW_LIST` |

**Response `cashflow`:**
```json
{
  "period": "last6m",
  "points": [{ "label": "T11/25", "inflow": 240000000, "outflow": 130000000 }],
  "totalInflow": 840000000,
  "totalOutflow": 450000000
}
```

**Response `admin/analytics`:**
```json
{
  "deptSpending": [{ "deptId": 1, "deptName": "Engineering", "spent": 60200000 }],
  "topDebtors": [{ "userId": 5, "fullName": "Nguyễn Văn A", "deptName": "IT", "outstandingAmount": 12750000, "daysSinceDisbursement": 45 }]
}
```

**Frontend đã cập nhật:**
- `components/dashboard/accountant-dashboard.tsx` — xóa mock `CASHFLOW`, gọi `getCashFlowAnalytics(period, "million")`
- `components/dashboard/admin-dashboard.tsx` — xóa mock `CASHFLOW`, `DEPT_SPENDING`, `TOP_DEBTORS`, gọi `Promise.all([...cashflow, getAdminAnalytics()])`
- `lib/api/analytics.ts` — file mới với `getCashFlowAnalytics()` và `getAdminAnalytics()`
- `types/dashboard.ts` — thêm `CashFlowPoint`, `CashFlowAnalyticsResponse`, `AdminAnalyticsResponse`

**Còn lại chưa có API:** `MOCK_MONTHLY` trong `employee-dashboard.tsx` (chart chi tiêu theo tháng của employee) — backend chưa có endpoint tương ứng.

---

## 2. Export CSV / PDF

> **Chưa implement — backend chưa cung cấp endpoint.**

### 2.1 Danh sách endpoint backend cần thêm

| Endpoint | Format | Auth | Mô tả |
|---|---|---|---|
| `GET /api/v1/wallet/transactions/export` | CSV | WALLET_VIEW | Lịch sử giao dịch ví cá nhân |
| `GET /api/v1/wallet/deposit/my/export` | CSV | WALLET_DEPOSIT | Lịch sử nạp tiền VNPay |
| `GET /api/v1/accountant/ledger/export` | CSV | TRANSACTION_VIEW_ALL | Sổ cái toàn hệ thống |
| `GET /api/v1/accountant/payroll/{id}/export` | PDF | PAYROLL_MANAGE | Bảng lương 1 kỳ |
| `GET /api/v1/payslips/{id}/export` | PDF | WALLET_VIEW | Phiếu lương cá nhân |

**Query params chung:** `?from=YYYY-MM-DD&to=YYYY-MM-DD` (optional date range filter).
**Backend response:** `Content-Disposition: attachment; filename="export-xxx.csv"` — FE không cần parse, chỉ trigger download.

---

### 2.2 Nút export cần thêm vào từng page

| Page | File | Nút | Format |
|---|---|---|---|
| `wallet/transactions/page.tsx` | `app/(dashboard)/wallet/transactions/page.tsx` | "Xuất CSV" góc trên phải, kế filter | CSV |
| `wallet/deposit/my/page.tsx` | `app/(dashboard)/wallet/deposit/my/page.tsx` | "Xuất CSV" góc trên phải filter bar | CSV |
| `accountant/ledger/page.tsx` | `app/(dashboard)/accountant/ledger/page.tsx` | "Xuất CSV" cạnh nút "Tải lại" | CSV |
| `accountant/payroll/[id]/page.tsx` | Step 4 (Run) — sau khi status = COMPLETED | "Xuất PDF" | PDF |
| `payroll/[id]/page.tsx` | `app/(dashboard)/payroll/[id]/page.tsx` | "Tải phiếu lương" | PDF |

---

### 2.3 Frontend implementation pattern (khi backend sẵn sàng)

```typescript
// lib/api/export.ts — tạo file mới

/** Trigger file download từ Bearer-auth endpoint */
async function downloadFile(url: string, filename: string) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

export function exportTransactions(from?: string, to?: string) {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to)   q.set("to", to);
  return downloadFile(`/api/v1/wallet/transactions/export?${q}`, `transactions-${Date.now()}.csv`);
}

export function exportLedger(from?: string, to?: string) { ... }
export function exportPayroll(periodId: number)          { ... }
export function exportPayslip(payslipId: number)         { ... }
```

**Lưu ý quan trọng:** Không dùng `api.get()` từ `api-client.ts` vì nó unwrap JSON. Phải dùng `fetch()` thẳng để nhận `blob`.

---

### 2.4 UI/UX nút export

```tsx
<button
  type="button"
  onClick={() => void handleExport()}
  disabled={exporting}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 text-sm font-medium transition-colors"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
  {exporting ? "Đang xuất..." : "Xuất CSV"}
</button>
```

---

### 2.5 Columns CSV mỗi loại

**`wallet/transactions` export:**
`Mã GD, Loại, Số tiền, Hướng, Số dư sau, Trạng thái, Ngày tạo`

**`wallet/deposit/my` export:**
`Mã nạp tiền, Số tiền, Trạng thái, Mã GD VNPay, Thời gian thanh toán, Ngày tạo`

**`accountant/ledger` export:**
`Mã GD, Loại GD, Số tiền, Hướng, Loại sở hữu ví, Trạng thái, Tham chiếu, Ngày tạo`

**`accountant/payroll/{id}` export (PDF):** Toàn bộ bảng lương kỳ đó — tên nhân viên, lương cơ bản, thưởng, trừ, net.

---

## ✅ 3. Filter theo ngày và status cho Deposit History

> **Đã implement hoàn chỉnh — Sprint 16.**

**Backend đã thêm params:**
```
GET /api/v1/wallet/deposit/my?page=0&size=10&from=2026-01-01&to=2026-05-31&status=COMPLETED
```

**Frontend đã cập nhật:**
- `lib/api/payment.ts` — `getMyDeposits(page, size, { status?, from?, to? })`
- `app/(dashboard)/wallet/deposit/my/page.tsx` — thêm filter bar: dropdown status + 2 date input + nút "Lọc" / "Xóa lọc"

---

## ✅ 4. PIN Attempt Count khi nhập sai

> **Đã implement hoàn chỉnh — Sprint 16.**

**Thay đổi backend:**
- `PinVerifyResponse` thêm field `attemptsRemaining: Integer`
- Khi nhập sai PIN (chưa bị khóa): trả HTTP 200 `{ valid: false, attemptsRemaining: N }` thay vì throw HTTP 401
- Khi PIN bị khóa: vẫn throw `LockedException` (HTTP 423)
- Khi format PIN sai: vẫn throw `UnauthorizedException` (HTTP 401)

**Frontend đã cập nhật:**
- `types/user.ts` — `VerifyPinResponse` thêm `attemptsRemaining?: number`
- `app/(dashboard)/accountant/disbursements/[id]/page.tsx` — hiển thị "Mã PIN không đúng. Còn N lần thử."

---

## ✅ 5. Missing Frontend Integrations (Sprint 15 — 2026-05-30)

> **Tất cả 5 item đã implement.**

### ✅ 5.1 `GET /api/v1/admin/settings` và `PUT /api/v1/admin/settings`
`app/(dashboard)/admin/settings/page.tsx` dùng `getAdminSettings()` / `updateAdminSettings()`.

### ✅ 5.2 `GET /api/v1/accountant/payslips/{payslipId}`
Tạo `app/(dashboard)/accountant/payslips/[id]/page.tsx`; link từ payroll detail Step 2.

### ✅ 5.3 `POST /api/v1/users/me/pin/verify`
`handleDisburse()` gọi pre-verify PIN trước `POST /disbursements/{id}/disburse`.

### ✅ 5.4 `DELETE /api/v1/team-leader/projects/{id}/categories`
Budget tab: nút "Xóa" per category row, disabled khi `currentSpent > 0`.

### ✅ 5.5 `POST /api/v1/team-leader/projects/{id}/expense-categories`
Budget tab: nút "+ Thêm danh mục", modal tạo custom category.

---

## ✅ 6. Dashboard URL Fixes — CFO / Admin (Sprint 16)

> **Đã fix — Sprint 16.**

**Vấn đề:** Frontend gọi sai URL — backend `DashboardController` mount tại `/dashboard`, không phải `/cfo` hay `/admin`.

| Role | URL cũ (sai) | URL mới (đúng) |
|---|---|---|
| CFO | `GET /api/v1/cfo/dashboard` | `GET /api/v1/dashboard/cfo` |
| Admin | `GET /api/v1/admin/dashboard` | `GET /api/v1/dashboard/admin` |

Backend đã thêm 2 endpoint `@GetMapping("/cfo")` và `@GetMapping("/admin")` vào `DashboardController`.

---

## 7. Employee Dashboard — Chi tiêu cá nhân theo tháng

> **Chưa implement — backend chưa cung cấp endpoint.**

**Vấn đề:** `components/dashboard/employee-dashboard.tsx` đang dùng mock `MOCK_MONTHLY` cho biểu đồ chi tiêu cá nhân theo tháng.

```typescript
// Hiện tại — hardcode mock trong employee-dashboard.tsx
const MOCK_MONTHLY: { month: string; chiTieu: number; tamUng: number }[] = [
  { month: "T1", chiTieu: 2400000, tamUng: 1200000 },
  ...
]
```

### 7.1 Backend endpoint cần implement

```
GET /api/v1/dashboard/employee/monthly-spending?year=2026
```

**Auth:** `WALLET_VIEW` (mọi role đều có)

**Response:**
```json
{
  "year": 2026,
  "months": [
    {
      "month": 1,
      "label": "T1",
      "chiTieu": 2400000,
      "tamUng": 1200000
    }
  ]
}
```

> `chiTieu` = tổng DEBIT từ USER wallet trong tháng đó (REQUEST_PAYMENT + PAYSLIP netting).
> `tamUng` = tổng ADVANCE đã được giải ngân trong tháng (status = PAID, type = ADVANCE).

### 7.2 Frontend cần cập nhật

**File:** `components/dashboard/employee-dashboard.tsx`

- Xóa const `MOCK_MONTHLY`
- Thêm state `monthlyData` + `useEffect` gọi API
- Thêm API function `getEmployeeMonthlySpending(year)` vào `lib/api/analytics.ts`
- Thêm type `EmployeeMonthlySpendingResponse` vào `types/dashboard.ts`
- Chart hiện tại dùng `recharts BarChart` với `dataKey="chiTieu"` và `dataKey="tamUng"` — giữ nguyên structure, chỉ thay data source

---

## 8. Withdraw History — Filter nâng cao

> **Có thể implement FE-side, nhưng hiệu quả hơn nếu có backend filter.**

**Hiện tại:** `wallet/withdraw/page.tsx` load 10 yêu cầu gần nhất, không có filter.

**Đề xuất bổ sung:**
- Filter theo `status` (PENDING / COMPLETED / REJECTED / CANCELLED)
- Filter theo `from` / `to` date
- Tăng page size + pagination

**Backend cần thêm params vào** `GET /api/v1/wallet/withdraw/my?status=&from=&to=&page=&size=` (hiện chỉ có `page`/`size`).

**Frontend cần cập nhật:** `app/(dashboard)/wallet/withdraw/page.tsx` — thêm filter bar tương tự như deposit history.

---

## 9. Notification — Mark as read từng dòng trong dropdown

> **FE-only improvement — backend endpoint đã có.**

**Hiện tại:** Trang `notifications/page.tsx` đã có "Đánh dấu đã đọc" per-item. Nhưng dropdown thông báo trong header chỉ có "Đánh dấu tất cả" chứ không có per-item action.

**Cải tiến:** Khi click vào từng notification trong dropdown → gọi `PATCH /api/v1/notifications/{id}/read` → cập nhật badge count ngay lập tức.

**File cần cập nhật:** `app/(dashboard)/layout.tsx` — phần render notification dropdown items.

---

## Ghi chú

| Item | Trạng thái | Blocker |
|---|---|---|
| 1 — Analytics Admin/Accountant | ✅ Done Sprint 16 | — |
| 2 — Export CSV/PDF | ⏳ Pending | Backend chưa có endpoint |
| 3 — Deposit filter | ✅ Done Sprint 16 | — |
| 4 — PIN attempts | ✅ Done Sprint 16 | — |
| 5 — Missing integrations | ✅ Done Sprint 15 | — |
| 6 — Dashboard URL fix | ✅ Done Sprint 16 | — |
| 7 — Employee spending chart | ⏳ Pending | Backend chưa có endpoint |
| 8 — Withdraw filter | ⏳ Pending | Backend cần thêm params |
| 9 — Notification dropdown read | ⏳ Pending | FE-only, backend đã có |
