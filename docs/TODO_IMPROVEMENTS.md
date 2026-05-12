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

> Các endpoint backend đã có nhưng frontend chưa tích hợp. Không phải lỗi — chỉ là tính năng chưa implement.
> Phát hiện qua audit ngày 2026-05-12.

### 5.1 `GET /api/v1/admin/settings` và `PUT /api/v1/admin/settings`

**Controller:** `AdminSettingsController` (`/admin/settings`)

**Vấn đề:** Frontend hoàn toàn bỏ qua `AdminSettingsController`. Trang `/admin/settings` và `/cfo/settings` đang dùng trực tiếp `SystemConfigController` (`/system-configs`). Hai endpoint này là một lớp abstraction phía admin (nhóm key theo category, thêm RBAC riêng).

**File cần tích hợp khi cần:**
- `app/(dashboard)/admin/settings/page.tsx` — thay `getAllConfigs()` / `updateConfig()` bằng `GET/PUT /admin/settings`
- `lib/api/system-config.ts` — thêm `getAdminSettings()` và `updateAdminSettings()`

---

### 5.2 `GET /api/v1/accountant/payslips/{payslipId}`

**Controller:** `AccountantPayslipController` (`/accountant/payslips/{payslipId}`)

**Vấn đề:** Không có trang chi tiết phiếu lương dành cho kế toán. Hiện tại trang `/accountant/payroll/{id}` liệt kê các payslip entry nhưng không drill-down vào từng payslip.

**File cần tạo khi implement:**
- `app/(dashboard)/accountant/payroll/[id]/page.tsx` — thêm link click từng entry → gọi `GET /accountant/payslips/{payslipId}`
- Hoặc tạo `app/(dashboard)/accountant/payslips/[id]/page.tsx` riêng

---

### 5.3 `POST /api/v1/users/me/pin/verify`

**Controller:** `ProfileController` (`/users/me/pin/verify`)

**Vấn đề:** Endpoint xác thực PIN (`{ pin } → { valid: boolean }`) chưa được gọi từ UI. Hiện tại Accountant nhập PIN thẳng vào form giải ngân (PIN được validate ở backend khi disburse). Endpoint này hữu ích cho luồng xác nhận trước khi thực hiện thao tác nhạy cảm (pre-check PIN trước khi submit).

**File cần update khi implement:**
- `app/(dashboard)/accountant/disbursements/[id]/page.tsx` — thêm bước pre-verify PIN trước khi gọi `/disburse`
- `lib/api/` — thêm `verifyPin(pin: string): Promise<{ valid: boolean }>`

---

### 5.4 `DELETE /api/v1/team-leader/projects/{id}/categories`

**Controller:** `TeamLeaderCategoryController` (`/team-leader/projects/{id}/categories` DELETE)

**Vấn đề:** Frontend chỉ gọi `GET` (lấy danh sách) và `PUT` (cập nhật budget) trên categories. Không có nút xóa danh mục trong trang `/team-leader/projects/{id}`.

**File cần update khi implement:**
- `app/(dashboard)/team-leader/projects/[id]/page.tsx` — thêm nút xóa danh mục trong phần category management

---

### 5.5 `POST /api/v1/team-leader/projects/{id}/expense-categories`

**Controller:** `TeamLeaderCategoryController` (`/team-leader/projects/{id}/expense-categories` POST)

**Vấn đề:** Frontend chỉ `GET /team-leader/expense-categories?projectId=...` để lấy danh sách template categories. Không có UI để Team Leader tạo expense category tùy chỉnh cho một project cụ thể.

**File cần update khi implement:**
- `app/(dashboard)/team-leader/projects/[id]/page.tsx` — thêm form tạo custom expense category

---

## Ghi chú

- Các item trên **không ảnh hưởng đến luồng nghiệp vụ** (3 flows đều hoạt động đầy đủ).
- Đây là cải tiến UX/reporting — ưu tiên sau khi các luồng core ổn định.
- Chart mock data hiện tại là intentional fallback — không gây lỗi runtime, chỉ hiển thị dữ liệu tĩnh.
