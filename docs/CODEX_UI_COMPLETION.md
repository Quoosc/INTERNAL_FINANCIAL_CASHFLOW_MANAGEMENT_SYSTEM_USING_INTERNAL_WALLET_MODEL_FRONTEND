# CODEX — UI Completion Plan (All Roles)

> **Ngày tạo:** 2026-04-13  | **Cập nhật lần cuối:** 2026-04-30
> **Mục tiêu:** Hoàn thiện 100% UI + API wiring cho toàn bộ 6 roles.

---

## Bước 0 — Đọc tài liệu bắt buộc

```
docs/API_CONTRACT.md        → endpoint chính xác, request/response shape
docs/FLOW.md                → business flow, role matrix
docs/PROJECT_STRUCTURE.md   → cây thư mục
CLAUDE.md                   → conventions: types, api-client, Tailwind v4, language
```

**Conventions cứng:**
- Types: chỉ import từ `@/types` barrel
- API: chỉ dùng `api` từ `@/lib/api-client`
- Mock pattern (giữ cho đến khi backend sẵn sàng):
  ```ts
  // ─── MOCK (xóa khi backend sẵn sàng) ──────────────────────
  const MOCK_X: SomeType[] = [...];
  // TODO: Replace when backend ready
  // ──────────────────────────────────────────────────────────
  ```
- UI text: **tiếng Việt có dấu** | Code: **English**
- Tailwind v4 — không `@apply`, không Shadcn, icon dùng inline SVG
- `use(params)` cho dynamic route params (Next.js 16)

---

## Trạng thái tổng quan (cập nhật 2026-04-30)

| Nhóm | Tổng | ✅ Done | ⚠️ Mock/Partial | ❌ Còn lại |
|------|------|---------|-----------------|-----------|
| A — Backend ready → integrate | 7 | **7** | 0 | 0 |
| B — Mock chờ backend | 21 | **17** | 4 | 0 |
| C — Skeleton | 1 | **1** | 0 | 0 |
| Auth pages | 3 | **3** | 0 | 0 |

> **Nhóm A + C hoàn thành 100%.** Nhóm B: 17/21 wired.
> Nhóm B còn mock: accountant/payroll (x2), accountant/ledger (x2) — blocked by backend.
> Auth pages: login, change-password, forgot-password đều LIVE.

---

## NHÓM A — ✅ Đã hoàn thành (Backend ready → Real API)

> Tất cả 7 tasks đã xong. Mock đã xóa, API thật đang được gọi, lint sạch.

| # | File | API endpoint | Trạng thái |
|---|------|-------------|------------|
| A1 | `payroll/page.tsx` | `GET /api/v1/payslips` | ✅ Done |
| A2 | `payroll/[id]/page.tsx` | `GET /api/v1/payslips/{id}` | ✅ Done |
| A3 | `projects/page.tsx` | `GET /api/v1/projects` | ✅ Done |
| A4 | `projects/[id]/page.tsx` | `GET /api/v1/projects/{id}/phases` | ✅ Done |
| A5 | `wallet/deposit/page.tsx` | `POST /api/v1/payments` (VNPay via PaymentController) | ✅ Done |
| A6 | `wallet/page.tsx` | `WalletContext` + `GET /api/v1/wallet/transactions?size=5` | ✅ Done |
| A7 | `wallet/transactions/page.tsx` | `GET /api/v1/wallet/transactions` | ✅ Done |

---

## NHÓM B — Trạng thái UI + API

---

### ✅ B-DONE — Đã hoàn chỉnh UI + API thật (2026-04-30)

| File | Endpoint | Ghi chú |
|------|----------|---------|
| `requests/page.tsx` | `GET /api/v1/requests` + `/requests/summary` | Filter, pagination, summary cards |
| `requests/new/page.tsx` | `POST /api/v1/requests` | Cascading project/phase/category, attachment |
| `requests/[id]/page.tsx` | `GET/PUT/DELETE /api/v1/requests/{id}` | Timeline, cancel, edit PENDING |
| `team-leader/approvals/page.tsx` | `GET /api/v1/team-leader/approvals` | Filter type, pagination |
| `team-leader/approvals/[id]/page.tsx` | `GET/POST approve/reject` | PIN-less flow, reason modal |
| `team-leader/projects/page.tsx` | `GET /api/v1/team-leader/projects` | Filter status, search |
| `team-leader/projects/[id]/page.tsx` | CRUD phases, members, category budgets | Tab: Phases / Ngân sách / Thành viên |
| `team-leader/team/page.tsx` | `GET /api/v1/team-leader/team-members` | Sprint 6 — page 1-indexed + limit |
| `manager/approvals/page.tsx` | `GET /api/v1/manager/approvals` | PROJECT_TOPUP queue |
| `manager/approvals/[id]/page.tsx` | `GET/POST approve/reject` | BudgetHealthCard, confirm modal |
| `manager/projects/page.tsx` | `GET/POST /api/v1/manager/projects` | Sprint 6 — tạo dự án, dropdown TL |
| `manager/projects/[id]/page.tsx` | `GET/PUT /api/v1/manager/projects/{id}` | Sprint 6 — sửa tên/budget/status/TL |
| `manager/department/page.tsx` | `GET /api/v1/manager/department/members` | Sprint 6 — list + detail panel |
| `accountant/disbursements/page.tsx` | `GET /api/v1/accountant/disbursements` | Status filter APPROVED_BY_TEAM_LEADER |
| `accountant/disbursements/[id]/page.tsx` | `POST disburse` (PIN) + `POST reject` | PIN modal, 423 Locked handling |
| `accountant/withdrawals/page.tsx` | `GET/PUT /api/v1/wallet/withdraw` | Quản lý rút tiền user — có trong sidebar |
| `admin/users/page.tsx` | `GET/POST /api/v1/admin/users` | lock/unlock/reset-password wired |
| `admin/users/[id]/page.tsx` | `GET/PUT /api/v1/admin/users/{id}` | Role + dept edit |
| `admin/departments/page.tsx` | `GET/POST /api/v1/admin/departments` | CRUD |
| `admin/departments/[id]/page.tsx` | `GET/PUT/DELETE /api/v1/admin/departments/{id}` | — |
| `admin/audit-logs/page.tsx` | `GET /api/v1/admin/audit` | Filter, pagination, detail modal |
| `notifications/page.tsx` | `GET /api/v1/notifications` + mark-read | SSE prepend listener |
| `cfo/approvals/page.tsx` | `GET /api/v1/cfo/approvals` | DEPARTMENT_TOPUP queue |
| `cfo/approvals/[id]/page.tsx` | `GET/POST approve/reject` | — |
| `cfo/system-fund/page.tsx` | `GET /api/v1/company-fund` + topup + reconciliation | — |
| `admin/system-fund/page.tsx` | `GET /api/v1/company-fund` | Re-use CompanyFundController |
| `admin/settings/page.tsx` | `GET/PUT /api/v1/system-configs/*` | evict cache |
| `cfo/settings/page.tsx` | Re-export từ admin/settings | — |
| `cfo/audit-logs/page.tsx` | Re-export từ admin/audit-logs | — |

---

### ⚠️ B-BLOCKED — MOCK, chờ backend endpoint

> **KHÔNG** xóa mock. Endpoint chưa có phía backend. Giữ block comment `ENDPOINT_BLOCKED = true`.

#### B14. `accountant/payroll/page.tsx` — Quản lý bảng lương (ACCOUNTANT)

```
Endpoint cần:   GET  /api/v1/accountant/payroll?year=&status=&page=1&limit=10
                POST /api/v1/accountant/payroll  body: CreatePayrollPeriodBody
Types:          PayrollPeriodListItem, PayrollStatus, CreatePayrollPeriodBody
Block reason:   Backend chưa có AccountantPayrollController
```

Checklist UI (hoàn chỉnh khi backend ready):
- [ ] Bảng kỳ lương: `period` (Tháng X/YYYY), `status` badge, `totalAmount`, `employeeCount`
- [ ] Status badge: DRAFT=xám / PROCESSING=vàng / COMPLETED=xanh
- [ ] Nút **"Tạo kỳ lương mới"** → modal: chọn tháng, năm
- [ ] Click → `/accountant/payroll/[id]`
- [ ] Pagination theo năm

---

#### B15. `accountant/payroll/[id]/page.tsx` — Chi tiết kỳ lương (ACCOUNTANT)

```
Endpoint cần:   GET  /api/v1/accountant/payroll/{id}
                POST /api/v1/accountant/payroll/{id}/import         multipart Excel
                POST /api/v1/accountant/payroll/{id}/auto-netting
                POST /api/v1/accountant/payroll/{id}/run
                PUT  /api/v1/accountant/payroll/{id}/entries/{userId}
Types:          PayrollDetailResponse, PayrollEntry, PayrollImportResponse, PayrollRunResponse
Block reason:   Backend chưa có endpoint
```

Checklist UI (hoàn chỉnh khi backend ready):
- [ ] Bảng entries: `employee.fullName`, `baseSalary`, `bonuses`, `deductions`, `advanceBalance`, `netSalary`
- [ ] Nút **"Import Excel"** → `<input type="file" accept=".xlsx,.xls">` → POST multipart
  - Preview: `PayrollImportResponse` với `entries[]` và `errors[]`
- [ ] Nút **"Auto Netting"** → confirm modal → trừ `advanceBalance` vào `netSalary`
- [ ] Nút **"Chạy bảng lương"** (chỉ khi status=DRAFT) → confirm modal
- [ ] Edit inline từng entry: click cell `baseSalary`/`bonuses`/`deductions`

---

#### B16. `accountant/ledger/page.tsx` — Sổ cái (ACCOUNTANT)

```
Endpoint cần:   GET /api/v1/accountant/ledger?from=&to=&type=&page=0&size=20
Types:          LedgerSummaryResponse
Block reason:   Backend chưa có AccountantLedgerController
```

Checklist UI (hoàn chỉnh khi backend ready):
- [ ] Summary cards: Tổng phát sinh Nợ, Tổng phát sinh Có, Số dư
- [ ] Bảng double-entry: `date`, `description`, `debitAccount`, `creditAccount`, `amount`, `runningBalance`
- [ ] Filter by date range (from/to)
- [ ] Filter by transaction type dropdown
- [ ] Click row → `/accountant/ledger/[id]`
- [ ] Pagination

---

#### B17. `accountant/ledger/[id]/page.tsx` — Chi tiết bút toán (ACCOUNTANT)

```
Endpoint cần:   GET /api/v1/accountant/ledger/{id}
Types:          TransactionResponse
Block reason:   Backend chưa có endpoint
```

Checklist UI (hoàn chỉnh khi backend ready):
- [ ] Journal entry: debit account, credit account, amount, description, reference code
- [ ] Link tới nguồn gốc: request hoặc payslip (clickable nếu có `referenceId`)
- [ ] Timestamp, created by

---

## NHÓM C — ✅ Đã hoàn thành (Skeleton → Full UI)

| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `admin/roles/page.tsx` | ✅ Done | Static UI: 6 roles, permission matrix, ROLE_PERMISSION_SET mapping |

---

## Còn lại — Chờ backend (2026-04-30)

| # | Task | Endpoint cần | Priority |
|---|------|-------------|----------|
| 1 | **B14-B15** Accountant Payroll | `/accountant/payroll/*` | 🔴 Blocked by backend |
| 2 | **B16-B17** Accountant Ledger | `/accountant/ledger/*` | 🔴 Blocked by backend |
| 3 | Dashboard live stats | `/api/v1/dashboard/*` | 🟡 Nice-to-have |

> UI scaffolding cho tất cả items đã hoàn chỉnh. Chỉ cần xóa `ENDPOINT_BLOCKED = true`
> và replace mock data bằng API thật khi backend implement xong.

---

## Sau mỗi task

```bash
npm run lint    # Fix ALL errors — quality gate duy nhất
```
