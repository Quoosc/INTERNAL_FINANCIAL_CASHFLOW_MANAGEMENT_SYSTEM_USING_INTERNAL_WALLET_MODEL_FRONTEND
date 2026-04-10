# TODO — Cải tiến khi bắt đầu code UI

> Danh sách các cải tiến cần triển khai khi bắt đầu phát triển giao diện thật.
> Đánh dấu `[x]` khi hoàn thành.

---

## 1. Service Layer (`lib/api/`)

- [ ] `requestService.ts` — CRUD requests, approve, reject, payout, cancel (endpoints: `/requests`, `/requests/:id`)
- [ ] `projectService.ts` — CRUD projects, phases, members, category budgets (endpoints: `/team-leader/projects`, `/manager/projects`)
- [ ] `walletService.ts` — getWallet, getTransactions, deposit (VNPay URL), withdraw (endpoints: `/wallet`, `/wallet/transactions`, `/wallet/deposit`, `/wallet/withdraw`)
- [ ] `userService.ts` — CRUD users, lock/unlock, resetPassword (endpoints: `/admin/users`)
- [ ] `payrollService.ts` — CRUD payroll periods, import Excel, auto-netting, run (endpoints: `/accountant/payroll`)
- [ ] `departmentService.ts` — CRUD departments (endpoints: `/admin/departments`)
- [ ] `auditService.ts` — getLogs, filter (endpoints: `/admin/audit`)
- [ ] `notificationService.ts` — getNotifications, markRead, markAllRead (endpoints: `/notifications`)
- [ ] `systemConfigService.ts` — getConfigs, updateConfigs (endpoints: `/admin/settings`)
- [ ] `systemFundService.ts` — getCompanyFund, topup, reconciliation (endpoints: `/company-fund`)
- [ ] `disbursementService.ts` — getDisbursements, disburse (PIN), reject (endpoints: `/accountant/disbursements`)
- [ ] `cfoService.ts` — getApprovals, approve, reject DEPARTMENT_TOPUP (endpoints: `/cfo/approvals`)

## 2. Reusable UI Components (`components/ui/`)

- [ ] `Button.tsx` — variants (primary, danger, outline, ghost, loading)
- [ ] `Modal.tsx` — confirm dialog, form modal
- [ ] `Table.tsx` — sortable, pagination, responsive
- [ ] `Form/Input.tsx` — label, error, validation
- [ ] `Badge.tsx` — hiển thị status (PENDING, APPROVED_BY_TEAM_LEADER, REJECTED...)
- [ ] `Card.tsx` — stat cards cho Dashboard
- [ ] `FileUpload.tsx` — upload chứng từ, Excel
- [ ] `PinInput.tsx` — nhập PIN 5 số cho giải ngân/rút tiền

## 3. Custom Hooks (`hooks/`)

- [ ] `useRequests(filters)` — fetch + filter + pagination
- [ ] `useProjects(filters)` — fetch + filter + pagination
- [ ] `useUsers(filters)` — fetch + filter + pagination
- [ ] `usePayroll()` — fetch payroll periods
- [ ] `useNotifications()` — fetch + badge count unread

## 4. Utilities (`utils/`)

- [ ] `formatCurrency(amount)` — "1.500.000 ₫"
- [ ] `formatDate(iso)` — "24/03/2026 14:30"
- [ ] `formatStatus(status)` — label + color theo RequestStatus
- [ ] `formatRequestType(type)` — "Tạm ứng", "Cấp vốn DA"...
- [ ] `getStatusColor(status)` — green/yellow/red cho Badge

## 5. Constants (`constants/`)

- [ ] `routes.ts` — all route paths
- [ ] `sidebarMenu.ts` — menu items per role/permission
- [ ] `statusConfig.ts` — status → label + color mapping

## 6. API Client Enhancement

- [ ] `api-client.ts` — thêm `uploadFile()` method cho FormData (bỏ Content-Type header, để browser tự set `multipart/form-data`) — dùng cho Excel import payroll

---

## 🗺️ KẾ HOẠCH CODE GIAO DIỆN THEO ROLE

> **Chiến lược**: Mock data khi API chưa sẵn sàng. API call thật được comment lại.
> Khi backend hoàn thành → xóa mock, bỏ comment → chạy ngay, không cần refactor lớn.
>
> **Thứ tự**: Ít chức năng → Nhiều chức năng (giảm rủi ro dependency)

---

### 🥇 Tier 1 — EMPLOYEE _(Sprint hiện tại)_

> **Lý do đầu tiên**: Tất cả role đều share các trang này. Base layer cho mọi role.

| Trang | API endpoint | Sprint | Trạng thái |
|---|---|---|---|
| Dashboard (`/dashboard`) | `GET /dashboard/employee` | 9 | [ ] Chờ code |
| Ví của tôi (`/wallet`) | `GET /wallet` | 3 | [ ] Chờ code |
| Nạp tiền (`/wallet/deposit`) | `POST /wallet/deposit` → VNPay URL | 3 | [ ] Chờ code |
| Rút tiền (`/wallet/withdraw`) | `POST /wallet/withdraw` | 3 | [ ] Chờ code |
| Lịch sử GD (`/wallet/transactions`) | `GET /wallet/transactions` | 3 | [ ] Chờ code |
| Danh sách YC (`/requests`) | `GET /requests` | 5 | [ ] Chờ code |
| Tạo YC mới (`/requests/new`) | `POST /requests` | 5 | [ ] Chờ code |
| Chi tiết YC (`/requests/[id]`) | `GET /requests/:id` | 5 | [ ] Chờ code |
| Bảng lương (`/payroll`) | `GET /payslips` | 7 | [ ] Chờ code |
| Chi tiết payslip (`/payroll/[id]`) | `GET /payslips/:id` | 7 | [ ] Chờ code |
| Thông báo (`/notifications`) | `GET /notifications` | 8 | [ ] Chờ code |

---

### 🥈 Tier 2 — TEAM_LEADER _(sau khi Employee xong)_

> **Role bổ sung**: Approvals (Flow 1), quản lý Project phases/categories, Team overview.

| Trang | API endpoint | Sprint | Trạng thái |
|---|---|---|---|
| Duyệt yêu cầu (`/team-leader/approvals`) | `GET /team-leader/approvals` | 4-5 | [ ] Chờ code |
| Chi tiết duyệt (`/team-leader/approvals/[id]`) | `GET /team-leader/approvals/:id` | 4-5 | [ ] Chờ code |
| Dự án của TL (`/team-leader/projects`) | `GET /team-leader/projects` | 4 | [ ] Chờ code |
| Chi tiết DA (`/team-leader/projects/[id]`) | `GET /team-leader/projects/:id` | 4 | [ ] Chờ code |
| Thành viên nhóm (`/team-leader/team`) | `GET /team-leader/team-members` | 5 | [ ] Chờ code |

---

### 🥉 Tier 3 — MANAGER _(sau khi Team Leader xong)_

> **Role bổ sung**: Duyệt PROJECT_TOPUP (Flow 2), tạo/sửa dự án, quản lý phòng ban.

| Trang | API endpoint | Sprint | Trạng thái |
|---|---|---|---|
| Duyệt YC phòng ban (`/manager/approvals`) | `GET /manager/approvals` | 4-5 | [ ] Chờ code |
| Quản lý dự án (`/manager/projects`) | `GET /manager/projects` | 4 | [ ] Chờ code |
| Tạo/Sửa dự án | `POST/PUT /manager/projects` | 4 | [ ] Chờ code |
| Thành viên phòng ban (`/manager/department`) | `GET /manager/department/members` | 5 | [ ] Chờ code |

---

### 🏅 Tier 4A — CFO _(sau khi Manager xong)_

> **Role bổ sung**: CFO duyệt DEPARTMENT_TOPUP (Flow 3), quản lý quỹ hệ thống.
> ⚠ Route riêng tại `/cfo/*` — KHÔNG dùng chung `/admin/*`.

| Trang | API endpoint | Sprint | Trạng thái |
|---|---|---|---|
| Duyệt YC cấp quota (`/cfo/approvals`) | `GET /cfo/approvals` | 6 | [ ] Chờ code |
| Chi tiết duyệt (`/cfo/approvals/[id]`) | `GET /cfo/approvals/:id` | 6 | [ ] Chờ code |
| Quỹ hệ thống (`/cfo/system-fund`) | `GET /company-fund` | 6 | [ ] Chờ code |

### 🏅 Tier 4B — ADMIN _(song song hoặc sau CFO)_

> **Role bổ sung**: ADMIN quản trị IAM/system — KHÔNG tham gia duyệt tài chính.

| Trang | API endpoint | Sprint | Trạng thái |
|---|---|---|---|
| Quản lý nhân sự (`/admin/users`) | `GET /admin/users` | 2 | [ ] Chờ code |
| Tạo/Sửa user | `POST/PUT /admin/users` | 2 | [ ] Chờ code |
| Quản lý phòng ban (`/admin/departments`) | `GET /admin/departments` | 2 | [ ] Chờ code |
| Nhật ký hệ thống (`/admin/audit-logs`) | `GET /admin/audit` | 6 | [ ] Chờ code |
| Cấu hình hệ thống (`/admin/settings`) | `GET/PUT /admin/settings` | 6 | [ ] Chờ code |

---

### 🏆 Tier 5 — ACCOUNTANT _(nhiều nhất — cuối cùng)_

> **Role phức tạp nhất**: Giải ngân PIN, Payroll Excel import, Ledger double-entry, System Fund.

| Trang | API endpoint | Sprint | Trạng thái |
|---|---|---|---|
| Giải ngân (`/accountant/disbursements`) | `GET /accountant/disbursements` | 6 | [ ] Chờ code |
| Xử lý giải ngân (nhập PIN) | `POST /accountant/disbursements/:id/disburse` | 6 | [ ] Chờ code |
| Quản lý lương (`/accountant/payroll`) | `GET /accountant/payroll` | 7 | [ ] Chờ code |
| Import Excel lương | `POST /accountant/payroll/:id/import` | 7 | [ ] Chờ code |
| Auto-netting & Run payroll | `POST /accountant/payroll/:id/auto-netting` + `/run` | 7 | [ ] Chờ code |
| Sổ cái (`/accountant/ledger`) | `GET /accountant/ledger` | 7 | [ ] Chờ code |
| Chi tiết giao dịch sổ cái | `GET /accountant/ledger/:transactionId` | 7 | [ ] Chờ code |
| Quỹ hệ thống — Accountant view (`/admin/system-fund`) | `GET /company-fund` + reconciliation | 7 | [ ] Chờ code |

---

## ⚙️ Shared Pages (tất cả role)

| Trang | Ghi chú |
|---|---|
| Change Password (`/change-password`) | First login flow (1 bước: đổi MK + PIN) |
| Create PIN (`/create-pin`) | Orphaned (flow cũ — không sử dụng) |
| Profile / Settings | Chưa có route riêng |

---

## 📝 Quy ước Mock Data

```typescript
// ─── MOCK DATA (xóa khi backend sẵn sàng) ───────────────────
const MOCK_DATA: SomeResponseType = { ... };
// ─────────────────────────────────────────────────────────────

// ─── API CALL THẬT (bỏ comment khi backend sẵn sàng) ────────
// const res = await api.get<SomeResponseType>('/api/v1/some/endpoint');
// const data = res.data;
// ─────────────────────────────────────────────────────────────
```

---

## ⚠️ Các thay đổi quan trọng so với v3.1 (cần biết khi code)

1. **Withdraw endpoint prefix**: `/withdrawals` → `/wallet/withdraw`
   - Old: `POST /withdrawals`, `DELETE /withdrawals/:id`, `GET /withdrawals/my`
   - New: `POST /wallet/withdraw`, `DELETE /wallet/withdraw/{id}`, `GET /wallet/withdraw/my`

2. **Deposit flow thay đổi**: Không còn QR code — trả về VNPay payment URL
   - `POST /wallet/deposit` → `PaymentResponse.paymentUrl` → FE redirect user

3. **Transaction list response**: Giờ là `LedgerEntryResponse` với `direction: DEBIT|CREDIT`
   - Thêm endpoint chi tiết: `GET /wallet/transactions/{transactionId}`

4. **WalletResponse** có thêm `availableBalance` = `balance - lockedBalance`

5. **RequestAction enum**: thêm `PAYOUT` và `CANCEL` (không chỉ APPROVE/REJECT)

6. **Admin settings**: `GET /admin/settings` trả `{ items: [] }`, `PUT /admin/settings` nhận `{ configs: [] }`

7. **Không còn `MANAGER_APPROVAL_LIMIT`** — chỉ bị giới hạn bởi số dư quỹ phòng ban
