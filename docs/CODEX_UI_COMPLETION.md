# CODEX — UI Completion Plan (All Roles)

> **Ngày tạo:** 2026-04-13  | **Cập nhật lần cuối:** 2026-04-13
> **Mục tiêu:** Hoàn thiện 100% UI cho toàn bộ 6 roles theo đúng chức năng nghiệp vụ.

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

## Trạng thái tổng quan (cập nhật 2026-04-13)

| Nhóm | Tổng | ✅ Done | ⚠️ Mock/Partial | ❌ Còn lại |
|------|------|---------|-----------------|-----------|
| A — Backend ready → integrate | 7 | **7** | 0 | 0 |
| B — Mock chờ backend | 22 | **4** | 18 | 0 |
| C — Skeleton | 1 | **1** | 0 | 0 |

> **Nhóm A hoàn thành 100%.** Nhóm B intentionally mock — chờ backend sprint tiếp theo.
> Nhóm C (admin/roles) đã được xây static UI hoàn chỉnh.

---

## NHÓM A — ✅ Đã hoàn thành (Backend ready → Real API)

> Tất cả 7 tasks đã xong. Mock đã xóa, API thật đang được gọi, lint sạch.

| # | File | API endpoint | Trạng thái |
|---|------|-------------|------------|
| A1 | `payroll/page.tsx` | `GET /api/v1/payslips` | ✅ Done |
| A2 | `payroll/[id]/page.tsx` | `GET /api/v1/payslips/{id}` | ✅ Done |
| A3 | `projects/page.tsx` | `GET /api/v1/projects` | ✅ Done |
| A4 | `projects/[id]/page.tsx` | `GET /api/v1/projects/{id}/phases` | ✅ Done |
| A5 | `wallet/deposit/page.tsx` | `POST /api/v1/wallet/deposit` → VNPay redirect | ✅ Done |
| A6 | `wallet/page.tsx` | `WalletContext` + `GET /api/v1/wallet/transactions?size=5` | ✅ Done |
| A7 | `wallet/transactions/page.tsx` | `GET /api/v1/wallet/transactions` | ✅ Done |

---

## NHÓM B — Mock chờ backend: trạng thái UI

> ⚠️ KHÔNG xóa mock. Backend các sprint này chưa sẵn sàng.
> Mỗi item dưới đây: kiểm tra UI có đủ feature chưa — nếu thiếu thì build thêm.

### B-DONE — Đã hoàn chỉnh UI (mock data nhưng đủ feature)

| File | Ghi chú |
|------|---------|
| `accountant/disbursements/[id]/page.tsx` | ✅ `MOCK_DETAIL` đã xóa, chỉ còn TODO simulate Sprint 6; PIN flow, checklist, reject modal đầy đủ |
| `admin/users/page.tsx` | ✅ Gọi `POST /api/v1/admin/users` (real), lock/unlock/reset-password wired; filter + pagination có |
| `admin/users/[id]/page.tsx` | ✅ Profile view, role/dept edit, lock/unlock, reset-password |

---

### B1. `requests/page.tsx` — Yêu cầu của tôi (EMPLOYEE)

```
API (chờ backend):  GET /api/v1/requests?type=&status=&search=&page=1&limit=20
                    GET /api/v1/requests/summary
Types:              RequestListItem, RequestSummaryResponse, RequestFilterParams
Sprint chờ:         5
```

Checklist UI:
- [ ] Summary cards: tổng YC, đang chờ, đã duyệt, đã giải ngân
- [ ] Filter tab: ALL / PENDING / APPROVED_BY_TEAM_LEADER / PAID / REJECTED / CANCELLED
- [ ] Filter type: ADVANCE / EXPENSE / REIMBURSE
- [ ] Search input (lọc theo `requestCode`, `description`)
- [ ] Bảng: `requestCode`, `type` badge, `status` badge, `amount`, `createdAt`
- [ ] Nút **"Tạo yêu cầu mới"** → `/requests/new`
- [ ] Click row → `/requests/[id]`
- [ ] Pagination
- [ ] Mock data dùng đúng `RequestListItem` type (không tự định nghĩa field)

### B2. `requests/new/page.tsx` — Tạo yêu cầu (EMPLOYEE)

```
API (chờ backend):  POST /api/v1/requests  body: CreateRequestBody
API (có sẵn):       GET /api/v1/projects (real), GET /api/v1/projects/{id}/phases (real),
                    GET /api/v1/projects/{phaseId} categories (real)
                    GET /api/v1/uploads/signature?folder=REQUEST (real)
Types:              CreateRequestBody, RequestType, RequestDetailResponse
Sprint chờ:         5
```

Checklist UI:
- [ ] Dropdown loại YC: **chỉ** ADVANCE / EXPENSE / REIMBURSE (không có PROJECT_TOPUP — TL tạo riêng)
- [ ] `amount`, `description` (bắt buộc)
- [ ] Cascading: Project → Phase → Category (đã có API thật — gọi real endpoint)
- [ ] File attachment: dùng `GET /api/v1/uploads/signature?folder=REQUEST` → upload Cloudinary
- [ ] Validation trước submit: amount > 0, description không rỗng, phase/category nếu là EXPENSE
- [ ] Preview summary trước khi submit
- [ ] After submit: redirect → `/requests/[id]`

### B3. `requests/[id]/page.tsx` — Chi tiết yêu cầu (EMPLOYEE)

```
API (chờ backend):  GET /api/v1/requests/{id}   → RequestDetailResponse
                    DELETE /api/v1/requests/{id} (cancel)
Types:              RequestDetailResponse, RequestAction, RequestStatus
Sprint chờ:         5
```

Checklist UI:
- [ ] Header: `requestCode`, `type` badge, `status` badge, `amount`
- [ ] Timeline approval 4 bước: PENDING → APPROVED_BY_TEAM_LEADER → PENDING_ACCOUNTANT_EXECUTION → PAID
  - Mỗi bước: icon trạng thái, timestamp nếu có, tên người duyệt
- [ ] Thông tin yêu cầu: description, project/phase/category, file attachments
- [ ] Thông tin người tạo: avatar, name, department
- [ ] Nút **"Huỷ yêu cầu"** chỉ hiện khi `status === "PENDING"` → gọi DELETE (mock OK)
- [ ] Nút **"Chỉnh sửa"** chỉ hiện khi `status === "PENDING"` → edit inline hoặc redirect new form pre-filled
- [ ] File viewer cho attachments

### B4. `team-leader/approvals/page.tsx` — Duyệt YC Flow 1 (TEAM_LEADER)

```
API (chờ backend):  GET /api/v1/team-leader/approvals?type=&status=&page=1&limit=20
Types:              TLApprovalListItem, TLApprovalFilterParams
Sprint chờ:         4-5
```

Checklist UI:
- [ ] Bảng: `requestCode`, `requester.fullName`, `type` badge, `amount`, `status` badge, `createdAt`
- [ ] Filter status: PENDING / APPROVED_BY_TEAM_LEADER / REJECTED
- [ ] Filter type: ADVANCE / EXPENSE / REIMBURSE
- [ ] Badge PENDING nổi bật màu vàng
- [ ] Click row → `/team-leader/approvals/[id]`
- [ ] Pagination
- [ ] Mock data dùng đúng `TLApprovalListItem`

### B5. `team-leader/approvals/[id]/page.tsx` — Chi tiết duyệt (TEAM_LEADER)

```
API (chờ backend):
  GET  /api/v1/team-leader/approvals/{id}              → TLApprovalDetailResponse
  POST /api/v1/team-leader/approvals/{id}/approve      body: TLApproveBody
  POST /api/v1/team-leader/approvals/{id}/reject       body: TLRejectBody
Types:  TLApprovalDetailResponse, TLApproveBody, TLRejectBody
Sprint chờ:  4-5
```

Checklist UI:
- [ ] Header: requester info (avatar, name, dept, job title), amount, type, description
- [ ] Thông tin project/phase/category (cho ADVANCE/EXPENSE/REIMBURSE)
- [ ] File attachments viewer
- [ ] Nút **"Duyệt"** → modal: `approvedAmount` (default = amount), `comment?` → POST approve
- [ ] Nút **"Từ chối"** → modal: `reason` (bắt buộc) → POST reject
- [ ] Cả hai nút chỉ hiện khi `status === "PENDING"`
- [ ] Timeline trạng thái
- [ ] Mock data dùng đúng `TLApprovalDetailResponse` (field `approver`, `approvedAt`)

### B6. `team-leader/projects/page.tsx` — Dự án của TL (TEAM_LEADER)

```
API (chờ backend):  GET /api/v1/team-leader/projects?status=&search=&page=1&limit=20
Types:              TLProjectListItem, TLProjectFilterParams
Sprint chờ:         4
```

Checklist UI:
- [ ] Cards hoặc bảng: `projectCode`, `name`, `status` badge, `totalBudget`, `spentAmount`, progress bar
- [ ] Filter status: PLANNING / ACTIVE / PAUSED / CLOSED
- [ ] Search
- [ ] Nút **"Yêu cầu nạp quỹ"** (PROJECT_TOPUP) per project hoặc trên detail
- [ ] Click → `/team-leader/projects/[id]`

### B7. `team-leader/projects/[id]/page.tsx` — Quản lý project (TEAM_LEADER)

```
API (chờ backend):
  GET    /api/v1/team-leader/projects/{id}
  POST   /api/v1/team-leader/projects/{id}/phases              body: CreatePhaseBody
  PUT    /api/v1/team-leader/projects/{id}/phases/{phaseId}    body: UpdatePhaseBody
  GET    /api/v1/team-leader/projects/{id}/categories?phaseId=
  PUT    /api/v1/team-leader/projects/{id}/categories
  GET    /api/v1/team-leader/projects/{id}/available-members
  POST   /api/v1/team-leader/projects/{id}/members             body: AddMemberBody
  PUT    /api/v1/team-leader/projects/{id}/members/{userId}    body: UpdateMemberBody
  DELETE /api/v1/team-leader/projects/{id}/members/{userId}
Types:  TLProjectDetailResponse, CreatePhaseBody, UpdatePhaseBody, AddMemberBody, UpdateMemberBody
Sprint chờ:  4
```

Checklist UI (3 tabs):
- **Tab "Phases"**: danh sách phases (name, status, budgetLimit, startDate, endDate), nút tạo phase mới (modal form), edit phase inline
- **Tab "Ngân sách"**: bảng category budgets per phase, edit budget amount inline
- **Tab "Thành viên"**: danh sách members (avatar, name, role trong project), nút thêm/xóa member, đổi project role
- Nút **"Yêu cầu nạp quỹ dự án"** (PROJECT_TOPUP) → form modal với `projectId`, `amount`, `description`

### B8. `team-leader/team/page.tsx` — Thành viên nhóm (TEAM_LEADER)

```
API (chờ backend):  GET /api/v1/team-leader/team?search=&page=1&limit=20
Types:              TLTeamMemberListItem
Sprint chờ:         5
```

Checklist UI:
- [ ] Grid hoặc bảng: avatar, `fullName`, `jobTitle`, `email`, `status` badge
- [ ] Search input
- [ ] Click → side panel hoặc modal với `TLTeamMemberDetailResponse` (active projects, recent requests)

### B9. `manager/approvals/page.tsx` & `[id]/page.tsx` — Duyệt PROJECT_TOPUP (MANAGER)

```
API (chờ backend):
  GET  /api/v1/manager/approvals?status=&page=1&limit=20
  GET  /api/v1/manager/approvals/{id}
  POST /api/v1/manager/approvals/{id}/approve   body: ManagerApproveBody
  POST /api/v1/manager/approvals/{id}/reject    body: ManagerRejectBody
Types:  ManagerApprovalListItem, ManagerApprovalDetailResponse, ManagerApproveBody, ManagerRejectBody
Sprint chờ:  4-5
```

List checklist:
- [ ] Type cố định = PROJECT_TOPUP (không cần filter type)
- [ ] Bảng: `requestCode`, người tạo (TL), `projectName`, `amount`, `status`, `createdAt`
- [ ] Filter status: PENDING / APPROVED_BY_MANAGER / REJECTED

Detail checklist:
- [ ] Thông tin project, dept fund balance hiện tại, `amount`, lý do TL
- [ ] Nút Duyệt / Từ chối với confirm modal

### B10. `manager/projects/page.tsx` & `[id]/page.tsx` — Dự án phòng ban (MANAGER)

```
API (chờ backend):
  GET  /api/v1/manager/projects
  POST /api/v1/manager/projects        body: CreateProjectBody
  PUT  /api/v1/manager/projects/{id}   body: UpdateProjectBody
Types:  ManagerProjectListItem, CreateProjectBody, UpdateProjectBody, ProjectDetailResponse
Sprint chờ:  4
```

Checklist:
- [ ] List: nút **"Tạo dự án mới"** → modal form (name, description, departmentId, teamLeaderId)
- [ ] Detail: thông tin dự án, phases overview (read-only), members list
- [ ] Edit project (name, description, status)
- [ ] Nút **"Yêu cầu ngân sách phòng ban"** (DEPARTMENT_TOPUP) → form với `amount`, `description`

### B11. `manager/department/page.tsx` — Phòng ban (MANAGER)

```
API (chờ backend):  GET /api/v1/manager/department/members
Types:              ManagerDeptMemberListItem
Sprint chờ:         4-5
```

Checklist:
- [ ] Summary cards: tổng nhân viên, quỹ phòng ban (dept fund balance), số dự án active
- [ ] Danh sách thành viên với search
- [ ] Thông tin dept fund không phải hardcode — lấy từ mock `ManagerDeptMemberDetailResponse`

### B12. `accountant/disbursements/page.tsx` — Danh sách giải ngân (ACCOUNTANT)

```
API (chờ backend):  GET /api/v1/accountant/disbursements?status=&page=1&limit=20
Types:              DisbursementListItem, DisbursementFilterParams
Sprint chờ:         6
```

Checklist:
- [ ] Filter tab: PENDING_ACCOUNTANT_EXECUTION (nổi bật) / PAID / REJECTED
- [ ] Bảng: `requestCode`, `requester.fullName`, `type` badge, `amount`, `status` badge, `createdAt`
- [ ] Click → `/accountant/disbursements/[id]`
- [ ] Count badge trên tab PENDING_ACCOUNTANT_EXECUTION
- [ ] Mock data dùng đúng `DisbursementListItem`

### B13. `accountant/disbursements/[id]/page.tsx` — Giải ngân chi tiết (ACCOUNTANT)

> UI đã hoàn chỉnh. `MOCK_DETAIL` fallback đã xóa (chỉ còn simulate Sprint 6).
> Không cần làm thêm gì đến khi backend sprint 6 ready.

### B14. `accountant/payroll/page.tsx` — Quản lý bảng lương (ACCOUNTANT)

```
API (chờ backend):  GET /api/v1/accountant/payroll?year=&status=&page=1&limit=10
                    POST /api/v1/accountant/payroll  body: CreatePayrollPeriodBody
Types:              PayrollPeriodListItem, PayrollStatus, CreatePayrollPeriodBody
Sprint chờ:         7
```

Checklist:
- [ ] Bảng kỳ lương: `period` (Tháng X/YYYY), `status` badge, `totalAmount`, `employeeCount`
- [ ] Status badge: DRAFT=xám / PROCESSING=vàng / COMPLETED=xanh
- [ ] Nút **"Tạo kỳ lương mới"** → modal: chọn tháng, năm → mock POST
- [ ] Click → `/accountant/payroll/[id]`
- [ ] Pagination theo năm

### B15. `accountant/payroll/[id]/page.tsx` — Chi tiết kỳ lương (ACCOUNTANT)

```
API (chờ backend):
  GET  /api/v1/accountant/payroll/{id}
  POST /api/v1/accountant/payroll/{id}/import         multipart Excel
  POST /api/v1/accountant/payroll/{id}/auto-netting
  POST /api/v1/accountant/payroll/{id}/run
  PUT  /api/v1/accountant/payroll/{id}/entries/{userId}  body: UpdatePayslipEntryBody
Types:  PayrollDetailResponse, PayrollEntry, PayrollImportResponse, PayrollRunResponse
Sprint chờ:  7
```

Checklist:
- [ ] Bảng entries: `employee.fullName`, `baseSalary`, `bonuses`, `deductions`, `advanceBalance`, `netSalary`
- [ ] Nút **"Import Excel"** → `<input type="file" accept=".xlsx,.xls">` → mock POST multipart
  - Preview: `PayrollImportResponse` với `entries[]` (success) và `errors[]` (warning list)
- [ ] Nút **"Auto Netting"** → confirm modal → mock POST → trừ `advanceBalance` vào `netSalary`
- [ ] Nút **"Chạy bảng lương"** (chỉ khi status=DRAFT) → confirm modal → mock POST run
- [ ] Edit inline từng entry: click cell `baseSalary`/`bonuses`/`deductions` → input
- [ ] Status header badge + transition display

### B16. `accountant/ledger/page.tsx` — Sổ cái (ACCOUNTANT)

```
API (chờ backend):  GET /api/v1/accountant/ledger?from=&to=&type=&page=0&size=20
Types:              LedgerSummaryResponse
Sprint chờ:         7
```

Checklist:
- [ ] Summary cards: Tổng phát sinh Nợ, Tổng phát sinh Có, Số dư
- [ ] Bảng double-entry: `date`, `description`, `debitAccount`, `creditAccount`, `amount`, `runningBalance`
- [ ] Filter by date range (from/to)
- [ ] Filter by transaction type dropdown
- [ ] Click row → `/accountant/ledger/[id]`
- [ ] Pagination

### B17. `accountant/ledger/[id]/page.tsx` — Chi tiết bút toán (ACCOUNTANT)

```
API (chờ backend):  GET /api/v1/accountant/ledger/{id}
Types:              TransactionResponse
Sprint chờ:         7
```

Checklist:
- [ ] Journal entry: debit account, credit account, amount, description, reference code
- [ ] Link tới nguồn gốc: request hoặc payslip (clickable nếu có `referenceId`)
- [ ] Timestamp, created by

### B18. `cfo/approvals/page.tsx` & `[id]/page.tsx` — Duyệt DEPARTMENT_TOPUP (CFO)

```
API (chờ backend):
  GET  /api/v1/cfo/approvals?status=&page=1&limit=20
  GET  /api/v1/cfo/approvals/{id}
  POST /api/v1/cfo/approvals/{id}/approve   body: AdminApproveBody
  POST /api/v1/cfo/approvals/{id}/reject    body: AdminRejectBody
Types:  AdminApprovalListItem, AdminApprovalDetailResponse, AdminApproveBody, AdminRejectBody
Sprint chờ:  6
```

List checklist:
- [ ] Type cố định = DEPARTMENT_TOPUP
- [ ] Bảng: `requestCode`, người tạo (Manager), `departmentName`, `amount`, `status`

Detail checklist:
- [ ] Company fund balance hiện tại, dept fund hiện tại, số tiền yêu cầu
- [ ] Nút **"Duyệt"** → status = APPROVED_BY_CFO → auto-pay → company fund giảm / dept fund tăng
- [ ] Nút **"Từ chối"** → modal reason → status = REJECTED

### B19 (done). `admin/users/page.tsx` & `[id]/page.tsx` — Đã hoàn chỉnh

> ✅ `POST /api/v1/admin/users` wired thật, lock/unlock/reset-password có UI, filter + pagination OK.

### B20. `admin/departments/page.tsx` & `[id]/page.tsx` — Phòng ban (ADMIN)

```
API (chờ backend):
  GET    /api/v1/admin/departments
  POST   /api/v1/admin/departments       body: CreateDepartmentBody
  PUT    /api/v1/admin/departments/{id}  body: UpdateDepartmentBody
  DELETE /api/v1/admin/departments/{id}
Types:  DepartmentListItem, DepartmentDetailResponse, CreateDepartmentBody, UpdateDepartmentBody
Sprint chờ:  2
```

Checklist:
- [ ] List: `name`, `managerName`, `memberCount`, `deptFundBalance` (format tiền VND)
- [ ] Nút **"Tạo phòng ban"** → modal form (name, managerId)
- [ ] Nút edit / delete per row (delete: confirm modal)
- [ ] Detail: danh sách thành viên, fund balance, projects liên quan

### B21. `admin/audit-logs/page.tsx` — Nhật ký hệ thống (ADMIN)

```
API (chờ backend):  GET /api/v1/admin/audit-logs?userId=&action=&from=&to=&page=1&limit=20
Types:              AuditLogResponse, AuditLogFilterParams, AuditAction
Sprint chờ:         6
```

Checklist:
- [ ] Bảng: `timestamp`, `actor.fullName`, `action` badge, `targetType`, `targetId`, `ipAddress`
- [ ] Filter: date range (from/to), action type dropdown (dùng `AuditAction` enum), user search
- [ ] Pagination
- [ ] Mock data dùng đúng `AuditLogResponse` type (không tự định nghĩa)

---

## NHÓM C — ✅ Đã hoàn thành (Skeleton → Full UI)

| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `admin/roles/page.tsx` | ✅ Done | Static UI: 6 roles, permission matrix, ROLE_PERMISSION_SET mapping |

---

## Thứ tự ưu tiên (những gì còn lại)

| # | Task | Sprint chờ | Priority |
|---|------|-----------|----------|
| 1 | **B1-B3** Requests (Employee core flow) | 5 | 🔴 Cao |
| 2 | **B4-B5** TL Approvals | 4-5 | 🔴 Cao |
| 3 | **B6-B8** TL Projects + Team | 4 | 🔴 Cao |
| 4 | **B9-B11** Manager flows | 4-5 | 🔴 Cao |
| 5 | **B12** Accountant disbursements list | 6 | 🟡 Trung bình |
| 6 | **B14-B15** Accountant Payroll | 7 | 🟡 Trung bình |
| 7 | **B16-B17** Accountant Ledger | 7 | 🟡 Trung bình |
| 8 | **B18** CFO Approvals | 6 | 🟡 Trung bình |
| 9 | **B20** Admin Departments | 2 | 🟢 Thấp |
| 10 | **B21** Admin Audit Logs | 6 | 🟢 Thấp |

---

## Sau mỗi task

```bash
npm run lint    # Fix ALL errors — quality gate duy nhất
```
