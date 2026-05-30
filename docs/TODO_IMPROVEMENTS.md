# TODO_IMPROVEMENTS.md — Backend-dependent Features

> Những cải tiến này **không thể implement phía frontend** cho đến khi backend cung cấp API tương ứng.
> Cập nhật lần cuối: 2026-05-11

---

## 1. Analytics Charts — Dashboard Manager / Admin / CFO

**Vấn đề:** Các biểu đồ trong dashboard Manager, Admin, CFO đang dùng hardcoded mock data:
- `MOCK_MONTHLY` (doanh thu/chi phí theo tháng)
- `CASHFLOW` (dòng tiền inflow/outflow — Admin)
- `DEPT_SPENDING` (chi tiêu theo phòng ban — Admin PieChart)
- `TOP_DEBTORS` (top người tạm ứng chưa quyết toán — Admin)

**API backend cần implement:**

| Endpoint | Params | Response |
|---|---|---|
| `GET /api/v1/dashboard/manager/monthly` | `?year=2026` | `{ month, approved, rejected }[]` |
| `GET /api/v1/admin/dashboard/cashflow` | `?period=ytd\|last6m\|fy2025` | `{ date, inflow, outflow }[]` |
| `GET /api/v1/admin/dashboard/dept-spending` | `?period=...` | `{ dept, spent }[]` |
| `GET /api/v1/admin/dashboard/top-debtors` | `?limit=5` | `{ userId, name, dept, amount, days }[]` |
| `GET /api/v1/dashboard/accountant/monthly` | `?year=2026` | `{ month, disbursed, payroll }[]` |

**File cần update khi có API:**
- `components/dashboard/manager-dashboard.tsx` — `MOCK_MONTHLY` constant
- `components/dashboard/admin-dashboard.tsx` — `CASHFLOW`, `DEPT_SPENDING`, `TOP_DEBTORS` constants
- `components/dashboard/accountant-dashboard.tsx` — `MOCK_MONTHLY` constant

---

## 2. Export CSV / PDF

**Vấn đề:** Các trang list (transaction history, deposit history, payroll, ledger) không có tính năng export. CFO và Accountant thường cần export cho báo cáo tài chính.

**API backend cần implement:**

| Endpoint | Mô tả |
|---|---|
| `GET /api/v1/wallet/transactions/export?format=csv&from=...&to=...` | Export lịch sử giao dịch ví |
| `GET /api/v1/wallet/deposit/export?format=csv` | Export lịch sử nạp tiền |
| `GET /api/v1/accountant/ledger/export?format=csv` | Export sổ cái |
| `GET /api/v1/accountant/payroll/{id}/export?format=pdf` | Export bảng lương kỳ X |

**FE pattern đề xuất:** Backend trả `Content-Disposition: attachment; filename=...` → FE dùng `<a href="..." download>` hoặc `window.open()`.

---

## 3. Filter theo ngày cho Deposit History

**Vấn đề:** `GET /api/v1/wallet/deposit/my` hiện tại chỉ nhận `page`/`size`. Nếu user có nhiều lịch sử nạp tiền, không thể lọc theo khoảng thời gian.

**API backend cần thêm params:**
```
GET /api/v1/wallet/deposit/my?page=0&size=10&from=2026-01-01&to=2026-05-31&status=COMPLETED
```

**File cần update khi có API:**
- `lib/api/payment.ts` — `getMyDeposits()`: thêm params `from`, `to`, `status`
- `app/(dashboard)/wallet/deposit/my/page.tsx` — thêm filter UI (date range + status dropdown)

---

## 4. PIN Attempt Count khi nhập sai

**Vấn đề:** Khi Accountant nhập sai PIN khi giải ngân, backend trả lỗi nhưng không cho biết còn bao nhiêu lần trước khi bị khóa 30 phút. User không biết mình đang ở lần thứ mấy.

**API backend cần thêm:**
Trả về attempt count trong error response khi PIN sai:
```json
{
  "success": false,
  "message": "Mã PIN không đúng. Còn 3 lần thử.",
  "data": { "attemptsRemaining": 3, "lockoutMinutes": null }
}
```
Hoặc thêm header `X-Pin-Attempts-Remaining: 3`.

**File cần update khi có API:**
- `app/(dashboard)/accountant/disbursements/[id]/page.tsx` — hiển thị badge "Còn N lần" dưới ô nhập PIN

---

---

## 5. Missing Frontend Integrations — Backend API Exists, FE Chưa Gọi

> Cập nhật ngày 2026-05-30: **Tất cả 5 item đã được implement.**

### ✅ 5.1 `GET /api/v1/admin/settings` và `PUT /api/v1/admin/settings`

**Đã implement:** `app/(dashboard)/admin/settings/page.tsx` đã dùng `getAdminSettings()` / `updateAdminSettings()` từ `lib/api/system-config.ts`.
`UpdateSettingsBody.configs` đã được fix (trước đó dùng `items`, nay đúng với backend `configs`).

---

### ✅ 5.2 `GET /api/v1/accountant/payslips/{payslipId}`

**Đã implement:**
- Tạo `app/(dashboard)/accountant/payslips/[id]/page.tsx` — trang chi tiết phiếu lương kế toán
- `app/(dashboard)/accountant/payroll/[id]/page.tsx` Step 2 — thêm nút "Chi tiết" link đến `/accountant/payslips/{id}`

---

### ✅ 5.3 `POST /api/v1/users/me/pin/verify`

**Đã implement:** `app/(dashboard)/accountant/disbursements/[id]/page.tsx` — gọi pre-verify PIN trước `disburse`:
1. `POST /users/me/pin/verify { pin }` → nếu `valid = false` hiện lỗi ngay
2. Nếu valid → tiếp tục gọi `POST /accountant/disbursements/{id}/disburse`

---

### ✅ 5.4 `DELETE /api/v1/team-leader/projects/{id}/categories`

**Đã implement:** `app/(dashboard)/team-leader/projects/[id]/page.tsx` — budget tab:
- Thêm cột "Xóa" trong bảng categories
- Nút xóa disabled khi `currentSpent > 0` (backend cũng enforce)
- Confirm modal trước khi xóa
- Thêm type `RemoveCategoryBody` vào `types/project.ts`

---

### ✅ 5.5 `POST /api/v1/team-leader/projects/{id}/expense-categories`

**Đã implement:** `app/(dashboard)/team-leader/projects/[id]/page.tsx` — budget tab:
- Thêm nút "+ Thêm danh mục"
- Modal tạo custom expense category (name, description, budgetLimit)
- Tự động refresh category list sau khi tạo
- Thêm type `CreateExpenseCategoryBody` vào `types/project.ts`

---

## Ghi chú

- Các item 5.1–5.5 **đã hoàn thiện** (2026-05-30).
- Chart mock data (items 1–4 bên trên) **vẫn cần backend implement các analytics endpoint mới**. Xem §1–§4 bên trên.
- Chart mock data hiện tại là intentional fallback — không gây lỗi runtime, chỉ hiển thị dữ liệu tĩnh.
