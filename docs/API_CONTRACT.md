# API_CONTRACT.md — Đồng bộ API giữa Frontend & Backend

> **Version:** 2.0 — Aligned với Backend `API_Spec.md` (09/03/2026)
> **Kiến trúc:** 5 Roles, 3 Flows, 4-tầng Quỹ, NO Escalation

## Base URL & Proxy

- **Backend:** `http://localhost:8080/api/v1`
- **Frontend gọi:** `/api/v1/...` (proxy qua `next.config.ts` rewrites)

## Response Format

```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-03-07T15:00:00"
}
```

TypeScript: `ApiResponse<T>` — xem `types/api.ts`

## Pagination Format

```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

TypeScript: `PaginatedResponse<T>` — page **1-indexed**

---

## 1. Authentication (`/auth`) ✅ READY

| Method | Endpoint | Body | Response | Auth |
|--------|----------|------|----------|:----:|
| POST | `/auth/login` | `LoginRequest` | `LoginResponse` | ❌ |
| POST | `/auth/logout` | — | `{ message }` | ✅ |
| POST | `/auth/refresh-token` | `RefreshTokenRequest` | `RefreshTokenResponse` | ❌ |
| POST | `/auth/change-password` | `ChangePasswordRequest` | `{ message }` | ✅ |
| POST | `/auth/forgot-password` | `ForgotPasswordRequest` | `{ message }` | ❌ |
| POST | `/auth/reset-password` | `ResetPasswordRequest` | `{ message }` | ❌ |
| GET | `/auth/me` | — | `AuthUser` | ✅ |

---

## 2. User Profile (`/users/me`) 🔮 Sprint 1

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/users/me/profile` | — | `UserProfileResponse` |
| PUT | `/users/me/profile` | `UpdateProfileRequest` | `UserProfileResponse` |
| PUT | `/users/me/avatar` | `UpdateAvatarRequest` | `{ avatar }` |
| PUT | `/users/me/bank-info` | `UpdateBankInfoRequest` | `BankInfo` |
| PUT | `/users/me/password` | `ChangePasswordRequest` | `{ message }` |
| POST | `/users/me/pin` | `CreatePinRequest` | `{ message }` |
| PUT | `/users/me/pin` | `UpdatePinRequest` | `{ message }` |
| POST | `/users/me/pin/verify` | `VerifyPinRequest` | `{ valid }` |

---

## 3. File Storage (`/files`) ✅ READY

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/files/signature?folder=` | `{ signature, timestamp, cloudName, apiKey, folder, publicId }` |
| DELETE | `/files/:publicId` | `{ message }` |

---

## 4. Common Data

| Method | Endpoint | Response | Sprint |
|--------|----------|----------|:------:|
| GET | `/banks` | `BankOption[]` | 1 |
| GET | `/wallet` | `WalletResponse` | 3 |
| GET | `/wallet/transactions` | `PaginatedResponse<TransactionResponse>` | 3 |
| POST | `/wallet/withdraw` | `WithdrawResponse` | 3 |
| POST | `/wallet/deposit/generate-qr` | `DepositQRResponse` | 3 |
| GET | `/projects` | `PaginatedResponse<ProjectListItem>` | 4 |
| GET | `/projects/:id/phases` | `ProjectPhasesResponse` | 4 |
| GET | `/payslips` | `PaginatedResponse<PayslipListItem>` | 7 |
| GET | `/payslips/:id` | `PayslipDetailResponse` | 7 |
| GET | `/notifications` | `NotificationListResponse` | 8 |
| PUT | `/notifications/:id/read` | `MarkReadResponse` | 8 |
| PUT | `/notifications/read-all` | `MarkAllReadResponse` | 8 |

---

## 5. Employee Requests (`/requests`) 🔮 Sprint 5

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/requests` | Query params | `PaginatedResponse<RequestListItem>` |
| GET | `/requests/summary` | — | `RequestSummaryResponse` |
| GET | `/requests/:id` | — | `RequestDetailResponse` |
| POST | `/requests` | `CreateRequestBody` | `RequestDetailResponse` |
| PUT | `/requests/:id` | `UpdateRequestBody` | `RequestDetailResponse` |
| DELETE | `/requests/:id` | — | `{ message }` |

---

## 6. Team Leader (`/team-leader`) 🔮 Sprint 4-5

### Project Management

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/team-leader/projects` | Query | `PaginatedResponse<TLProjectListItem>` |
| GET | `/team-leader/projects/:id` | — | `TLProjectDetailResponse` |
| POST | `/team-leader/projects/:id/phases` | `CreatePhaseBody` | `ProjectPhaseResponse` |
| PUT | `/team-leader/projects/:id/phases/:phaseId` | `UpdatePhaseBody` | `ProjectPhaseResponse` |
| POST | `/team-leader/projects/:id/members` | `AddMemberBody` | `ProjectMemberResponse` |
| PUT | `/team-leader/projects/:id/members/:userId` | `UpdateMemberBody` | `ProjectMemberResponse` |
| DELETE | `/team-leader/projects/:id/members/:userId` | — | `{ message }` |
| GET | `/team-leader/projects/:id/available-members` | `?search=` | `AvailableMemberResponse[]` |
| GET | `/team-leader/projects/:id/categories` | `?phaseId=` | `PhaseCategoriesResponse` |
| PUT | `/team-leader/projects/:id/categories` | `UpdateCategoryBudgetBody` | `PhaseCategoriesResponse` |
| GET | `/team-leader/expense-categories` | — | `ExpenseCategoryResponse[]` |

### Approvals (Flow 1)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/team-leader/approvals` | Query | `PaginatedResponse<TLApprovalListItem>` |
| GET | `/team-leader/approvals/:id` | — | `RequestDetailResponse` |
| POST | `/team-leader/approvals/:id/approve` | `TLApproveBody` | `TLApproveResponse` |
| POST | `/team-leader/approvals/:id/reject` | `TLRejectBody` | `TLRejectResponse` |

### Team Overview

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/team-leader/team-members` | `PaginatedResponse<TLTeamMemberListItem>` |
| GET | `/team-leader/team-members/:userId` | `TLTeamMemberDetailResponse` |

---

## 7. Manager (`/manager`) 🔮 Sprint 4-5

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/manager/approvals` | Query | `PaginatedResponse<ManagerApprovalListItem>` |
| GET | `/manager/approvals/:id` | — | `ManagerApprovalDetailResponse` |
| POST | `/manager/approvals/:id/approve` | `ManagerApproveBody` | `ManagerApproveResponse` |
| POST | `/manager/approvals/:id/reject` | `ManagerRejectBody` | `ManagerRejectResponse` |
| GET | `/manager/projects` | Query | `PaginatedResponse<ManagerProjectListItem>` |
| GET | `/manager/projects/:id` | — | `ProjectDetailResponse` |
| POST | `/manager/projects` | `CreateProjectBody` | `ProjectDetailResponse` |
| PUT | `/manager/projects/:id` | `UpdateProjectBody` | `ProjectDetailResponse` |
| GET | `/manager/department/members` | Query | `PaginatedResponse<ManagerDeptMemberListItem>` |
| GET | `/manager/department/members/:id` | — | `ManagerDeptMemberDetailResponse` |
| GET | `/manager/department/team-leaders` | — | `TeamLeaderOptionResponse[]` |

---

## 8. Accountant (`/accountant`) 🔮 Sprint 6-7

### Disbursements

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/accountant/disbursements` | Query | `PaginatedResponse<DisbursementListItem>` |
| GET | `/accountant/disbursements/:id` | — | `DisbursementDetailResponse` |
| POST | `/accountant/disbursements/:id/disburse` | `DisburseBody` | `DisburseResponse` |
| POST | `/accountant/disbursements/:id/reject` | `DisbursementRejectBody` | `DisbursementRejectResponse` |
| GET | `/accountant/requests/:requestId` | — | `AccountantRequestDetailResponse` |

### Payroll

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/accountant/payroll` | Query | `PaginatedResponse<PayrollPeriodListItem>` |
| GET | `/accountant/payroll/:periodId` | — | `PayrollDetailResponse` |
| POST | `/accountant/payroll` | `CreatePayrollPeriodBody` | `PayrollDetailResponse` |
| GET | `/accountant/payroll/template` | — | *File download (.xlsx)* |
| POST | `/accountant/payroll/:periodId/import` | `FormData (file)` | `PayrollImportResponse` |
| POST | `/accountant/payroll/:periodId/confirm-overwrite` | — | `{ message }` |
| POST | `/accountant/payroll/:periodId/auto-netting` | — | `AutoNettingResponse` |
| POST | `/accountant/payroll/:periodId/run` | — | `PayrollRunResponse` |
| PUT | `/accountant/payroll/:periodId/entries/:payslipId` | `UpdatePayslipEntryBody` | `PayrollEntry` |

### Ledger

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/accountant/ledger` | `PaginatedResponse<TransactionResponse>` |
| GET | `/accountant/ledger/summary` | `LedgerSummaryResponse` |
| GET | `/accountant/ledger/:transactionId` | `TransactionDetailResponse` |

---

## 9. Admin (`/admin`) 🔮 Sprint 2, 6

### Approvals (Flow 3)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/admin/approvals` | Query | `PaginatedResponse<AdminApprovalListItem>` |
| GET | `/admin/approvals/:id` | — | `AdminApprovalDetailResponse` |
| POST | `/admin/approvals/:id/approve` | `AdminApproveBody` | `AdminApproveResponse` |
| POST | `/admin/approvals/:id/reject` | `AdminRejectBody` | `AdminRejectResponse` |

### User Management

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/admin/users` | Query | `PaginatedResponse<AdminUserListItem>` |
| GET | `/admin/users/:id` | — | `AdminUserDetailResponse` |
| POST | `/admin/users` | `CreateUserBody` | `CreateUserResponse` |
| PUT | `/admin/users/:id` | `UpdateUserBody` | `AdminUserDetailResponse` |
| POST | `/admin/users/:id/lock` | — | `LockUserResponse` |
| POST | `/admin/users/:id/unlock` | — | `UnlockUserResponse` |
| POST | `/admin/users/:id/reset-password` | — | `{ message }` |

### Departments

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/admin/departments` | Query | `PaginatedResponse<DepartmentListItem>` |
| GET | `/admin/departments/:id` | — | `DepartmentDetailResponse` |
| POST | `/admin/departments` | `CreateDepartmentBody` | `DepartmentDetailResponse` |
| PUT | `/admin/departments/:id` | `UpdateDepartmentBody` | `DepartmentDetailResponse` |

### Audit & Settings

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/admin/audit` | Query | `PaginatedResponse<AuditLogResponse>` |
| GET | `/admin/settings` | — | `SystemSettingsResponse` |
| PUT | `/admin/settings` | `UpdateSettingsBody` | `SystemSettingsResponse` |

---

## 10. WebSocket Channels 🔮 Sprint 8

| Channel | Payload Type | Trigger |
|---------|-------------|---------|
| `/user/queue/wallet` | `WalletUpdateMessage` | Disbursement, Payroll, Withdraw, Deposit |
| `/user/queue/requests` | `RequestStatusUpdateMessage` | Approve/Reject/Payout |
| `/user/queue/notifications` | `NotificationMessage` | Any notification created |

---

## 11. Dashboard APIs 🔮 Sprint 9

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/dashboard/employee` | `EmployeeDashboardResponse` |
| GET | `/dashboard/manager` | `ManagerDashboardResponse` |
| GET | `/dashboard/accountant` | `AccountantDashboardResponse` |
| GET | `/dashboard/admin` | `AdminDashboardResponse` |

---

## Legend

| Icon | Nghĩa |
|------|-------|
| ✅ READY | Backend Controller đã implement |
| 🔮 Sprint N | Dự kiến implement ở Sprint N |
