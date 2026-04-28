# CODEX — UI Completion Plan (All Roles)

> **Ngày tạo:** 2026-04-13  | **Cập nhật lần cuối:** 2026-04-28
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

## Trạng thái tổng quan (cập nhật 2026-04-28)

| Nhóm | Tổng | ✅ Done | ⚠️ Mock/Partial | ❌ Còn lại |
|------|------|---------|-----------------|-----------|
| A — Backend ready → integrate | 7 | **7** | 0 | 0 |
| B — Mock chờ backend | 21 | **11** | 10 | 0 |
| C — Skeleton | 1 | **1** | 0 | 0 |

> **Nhóm A hoàn thành 100%.** Nhóm B: 11/21 đã wire API thật.
> Nhóm B còn lại intentionally mock — chờ backend sprint tiếp theo.

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

### ✅ B-DONE — Đã hoàn chỉnh UI + API thật (2026-04-28)

| File | Endpoint | Ghi chú |
|------|----------|---------|
| `requests/page.tsx` | `GET /api/v1/requests` + `/requests/summary` | Filter, pagination, summary cards |
| `requests/new/page.tsx` | `POST /api/v1/requests` | Cascading project/phase/category, attachment |
| `requests/[id]/page.tsx` | `GET/PUT/DELETE /api/v1/requests/{id}` | Timeline, cancel, edit PENDING |
| `team-leader/approvals/page.tsx` | `GET /api/v1/team-leader/approvals` | Filter type, pagination |
| `team-leader/approvals/[id]/page.tsx` | `GET/POST approve/reject` | PIN-less flow, reason modal |
| `team-leader/projects/page.tsx` | `GET /api/v1/team-leader/projects` | Filter status, search |
| `team-leader/projects/[id]/page.tsx` | CRUD phases, members, category budgets | Tab: Phases / Ngân sách / Thành viên |
| `manager/approvals/page.tsx` | `GET /api/v1/manager/approvals` | PROJECT_TOPUP queue |
| `manager/approvals/[id]/page.tsx` | `GET/POST approve/reject` | BudgetHealthCard, confirm modal |
| `accountant/disbursements/page.tsx` | `GET /api/v1/accountant/disbursements` | Status filter APPROVED_BY_TEAM_LEADER |
| `accountant/disbursements/[id]/page.tsx` | `POST disburse` (PIN) + `POST reject` | PIN modal, 423 Locked handling |
| `admin/users/page.tsx` | `POST /api/v1/admin/users` (real) | lock/unlock/reset-password wired |
| `admin/users/[id]/page.tsx` | Profile view, role/dept edit, lock/unlock | — |
| `notifications/page.tsx` | `GET /api/v1/notifications` + mark-read | SSE prepend listener |
| `cfo/system-fund/page.tsx` | `GET /api/v1/company-fund` + topup + reconciliation | — |
| `admin/system-fund/page.tsx` | `GET /api/v1/company-fund` | Re-use CompanyFundController |
| `admin/settings/page.tsx` | `GET/PUT /api/v1/system-configs/*` | evict cache |
| `cfo/settings/page.tsx` | Re-export từ admin/settings | — |

---

### ⚠️ B-BLOCKED — MOCK, chờ backend endpoint

> **KHÔNG** xóa mock. Endpoint chưa có phía backend. Giữ block comment rõ ràng.

#### B8. `team-leader/team/page.tsx` — Thành viên nhóm (TEAM_LEADER)

```
Endpoint cần:   GET /api/v1/team-leader/team-members
                GET /api/v1/team-leader/team-members/{userId}
Types:          TLTeamMemberListItem, TLTeamMemberDetailResponse
Block reason:   Backend chưa có TeamMemberController
```

Checklist UI (hoàn chỉnh khi backend ready):
- [ ] Grid hoặc bảng: avatar, `fullName`, `jobTitle`, `email`, `status` badge
- [ ] Search input
- [ ] Click → side panel hoặc modal với `TLTeamMemberDetailResponse` (active projects, recent requests)

---

#### B10. `manager/projects/page.tsx` & `[id]/page.tsx` — Dự án phòng ban (MANAGER)

```
Endpoint cần:   GET  /api/v1/manager/projects
                POST /api/v1/manager/projects        body: CreateProjectBody
                PUT  /api/v1/manager/projects/{id}   body: UpdateProjectBody
                GET  /api/v1/manager/department/team-leaders   (populate dropdown TL)
Types:          ManagerProjectListItem, CreateProjectBody, UpdateProjectBody
Block reason:   Backend chưa có ManagerProjectController
```

Checklist UI (hoàn chỉnh khi backend ready):
- [ ] List: nút **"Tạo dự án mới"** → modal form (name, description, departmentId, teamLeaderId)
- [ ] Detail: thông tin dự án, phases overview (read-only), members list
- [ ] Edit project (name, description, status)
- [ ] Nút **"Yêu cầu ngân sách phòng ban"** (DEPARTMENT_TOPUP) → form với `amount`, `description`

---

#### B11. `manager/department/page.tsx` — Phòng ban (MANAGER)

```
Endpoint cần:   GET /api/v1/manager/department/members
Types:          ManagerDeptMemberListItem
Block reason:   Backend chưa có endpoint
```

Checklist UI (hoàn chỉnh khi backend ready):
- [ ] Summary cards: tổng nhân viên, quỹ phòng ban (dept fund balance), số dự án active
- [ ] Danh sách thành viên với search
- [ ] Thông tin dept fund lấy từ API (không hardcode)

---

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

#### B18. `cfo/approvals/page.tsx` & `[id]/page.tsx` — Duyệt DEPARTMENT_TOPUP (CFO)

```
Endpoint cần:   GET  /api/v1/cfo/approvals?status=&page=1&limit=20
                GET  /api/v1/cfo/approvals/{id}
                POST /api/v1/cfo/approvals/{id}/approve   body: AdminApproveBody
                POST /api/v1/cfo/approvals/{id}/reject    body: AdminRejectBody
Types:          AdminApprovalListItem, AdminApprovalDetailResponse, AdminApproveBody, AdminRejectBody
Block reason:   Backend chưa có CfoApprovalController
```

List checklist:
- [ ] Type cố định = DEPARTMENT_TOPUP
- [ ] Bảng: `requestCode`, người tạo (Manager), `departmentName`, `amount`, `status`

Detail checklist:
- [ ] Company fund balance hiện tại, dept fund hiện tại, số tiền yêu cầu
- [ ] Nút **"Duyệt"** → status = APPROVED_BY_CFO → auto-pay
- [ ] Nút **"Từ chối"** → modal reason → status = REJECTED

---

#### B20. `admin/departments/page.tsx` & `[id]/page.tsx` — Phòng ban (ADMIN)

```
Endpoint cần:   GET    /api/v1/admin/departments
                POST   /api/v1/admin/departments       body: CreateDepartmentBody
                PUT    /api/v1/admin/departments/{id}  body: UpdateDepartmentBody
                DELETE /api/v1/admin/departments/{id}
Types:          DepartmentListItem, DepartmentDetailResponse, CreateDepartmentBody, UpdateDepartmentBody
Block reason:   Backend chưa có AdminDepartmentController
```

Checklist:
- [ ] List: `name`, `managerName`, `memberCount`, `deptFundBalance`
- [ ] Nút **"Tạo phòng ban"** → modal form (name, managerId)
- [ ] Nút edit / delete per row (delete: confirm modal)
- [ ] Detail: danh sách thành viên, fund balance, projects liên quan

---

#### B21. `admin/audit-logs/page.tsx` — Nhật ký hệ thống (ADMIN)

```
Endpoint cần:   GET /api/v1/admin/audit-logs?userId=&action=&from=&to=&page=1&limit=20
Types:          AuditLogResponse, AuditLogFilterParams, AuditAction
Block reason:   Backend chưa có AdminAuditController
```

Checklist:
- [ ] Bảng: `timestamp`, `actor.fullName`, `action` badge, `targetType`, `targetId`, `ipAddress`
- [ ] Filter: date range, action type dropdown (`AuditAction` enum), user search
- [ ] Pagination

---

## NHÓM C — ✅ Đã hoàn thành (Skeleton → Full UI)

| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `admin/roles/page.tsx` | ✅ Done | Static UI: 6 roles, permission matrix, ROLE_PERMISSION_SET mapping |

---

## Thứ tự ưu tiên — Còn lại (chờ backend)

| # | Task | Endpoint cần | Priority |
|---|------|-------------|----------|
| 1 | **B8** TL Team members | `/team-leader/team-members*` | 🟡 Trung bình |
| 2 | **B10** Manager Projects | `/manager/projects*` | 🟡 Trung bình |
| 3 | **B11** Manager Department | `/manager/department/members*` | 🟡 Trung bình |
| 4 | **B18** CFO Approvals | `/cfo/approvals*` | 🟡 Trung bình |
| 5 | **B14-B15** Accountant Payroll | `/accountant/payroll/*` | 🟢 Thấp |
| 6 | **B16-B17** Accountant Ledger | `/accountant/ledger/*` | 🟢 Thấp |
| 7 | **B20** Admin Departments | `/admin/departments*` | 🟢 Thấp |
| 8 | **B21** Admin Audit Logs | `/admin/audit*` | 🟢 Thấp |

> Tất cả items trên đều bị block bởi backend chưa implement. Khi backend sẵn sàng,
> xem endpoint chi tiết ở `docs/CODEX_INTEGRATION_PLAN.md` §8 (BLOCKED Sprint).

---

## Sau mỗi task

```bash
npm run lint    # Fix ALL errors — quality gate duy nhất
```
