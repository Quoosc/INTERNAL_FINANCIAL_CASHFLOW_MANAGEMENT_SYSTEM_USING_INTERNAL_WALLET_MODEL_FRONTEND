# API_CONTRACT.md - Frontend/Backend Contract

> Version: 3.2 (2026-04-09)
> Source priority: backend runtime source code > backend docs > frontend docs
> Roles: EMPLOYEE, TEAM_LEADER, MANAGER, ACCOUNTANT, CFO, ADMIN

## Base URL

- Backend: `http://localhost:8080/api/v1`
- Frontend call: `/api/v1/...` via Next.js proxy

## Response Wrapper

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "timestamp": "2026-04-08T10:30:00"
}
```

TypeScript: `ApiResponse<T>`

## Pagination

Hầu hết endpoints mới dùng `PageResponse<T>`:
```json
{ "items": [], "total": 0, "page": 0, "size": 20, "totalPages": 0 }
```
Một số endpoint cũ hơn dùng `page`/`limit` (1-indexed). Xem từng endpoint cụ thể.

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|:---:|
| POST | `/auth/login` | `LoginRequest` | `LoginResponse` | No |
| POST | `/auth/logout` | - | `{ message }` | Yes |
| POST | `/auth/refresh-token` | `RefreshTokenRequest` | `LoginResponse` | Yes |
| POST | `/auth/first-login/complete` | `FirstLoginSetupRequest` | `LoginResponse` | No |
| POST | `/auth/change-password` | `ChangePasswordRequest` | `{ message }` | Yes |
| POST | `/auth/forgot-password` | `ForgotPasswordRequest` | `{ message }` | No |
| POST | `/auth/verify-password-reset` | `VerifyOtpPasswordResetRequest` | `{ message }` | No |
| GET | `/auth/me` | - | `AuthUser` | Yes |

Notes:
- `LoginResponse` gồm `{ accessToken, refreshToken, requiresSetup, setupToken, user: AuthUser }`
- First-login: `requiresSetup = true` → `setupToken` cấp, không có `accessToken/refreshToken`
- `POST /auth/reset-password` không có trong `AuthController` runtime hiện tại

---

## 2. Profile and Security (`/users/me`, `/banks`)

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/users/me/profile` | - | `UserProfileResponse` |
| PUT | `/users/me/profile` | `UpdateProfileRequest` | `UserProfileResponse` |
| PUT | `/users/me/avatar` | `UpdateAvatarRequest` | `{ avatar: string }` |
| PUT | `/users/me/bank-info` | `UpdateBankInfoRequest` | `BankInfo` |
| PUT | `/users/me/pin` | `UpdatePinRequest` | `{ message }` |
| POST | `/users/me/pin/verify` | `VerifyPinRequest` | `{ valid: boolean }` |
| GET | `/banks` | - | `BankOption[]` |

Notes:
- Avatar là Signed URL Cloudinary (hết hạn 15 phút)
- PIN: 5 chữ số. Nhập sai > 5 lần → khoá 30 phút (`423 Locked`)
- `PUT /users/me/pin` body: `{ currentPin, newPin }` — đổi PIN khi đã có PIN

---

## 3. File Storage (`/uploads`)

| Method | Endpoint | Response |
|---|---|---|
| GET | `/uploads/signature?folder=AVATAR\|REQUEST` | `{ signature, timestamp, cloudName, apiKey, folder }` |

Client-direct upload flow:
1. Lấy signature từ backend
2. Upload file trực tiếp lên Cloudinary với signature
3. Gửi metadata (`fileName`, `cloudinaryPublicId`, `url`, `fileType`, `size`) đến API nghiệp vụ

---

## 4. Wallet, Transactions, Deposit, Withdraw

### Wallet (`/wallet`)

| Method | Endpoint | Params | Response |
|---|---|---|---|
| GET | `/wallet` | - | `WalletResponse` |
| GET | `/wallet/transactions` | `?from=&to=&page=0&size=20` | `PageResponse<LedgerEntryResponse>` |
| GET | `/wallet/transactions/{transactionId}` | - | `TransactionResponse` |
| POST | `/wallet/deposit` | - | `PaymentResponse` |

**WalletResponse:**
```json
{
  "id": 1,
  "ownerType": "USER",
  "ownerId": 1,
  "balance": 10250000,
  "lockedBalance": 2000000,
  "availableBalance": 8250000
}
```
> `availableBalance = balance - lockedBalance` (computed field)

**LedgerEntryResponse** (trong danh sách giao dịch):
```json
{
  "id": 101,
  "transactionCode": "TXN-8829145A",
  "direction": "CREDIT",
  "amount": 15000000,
  "balanceAfter": 15250000,
  "createdAt": "2026-02-10T09:00:00Z"
}
```
> `direction`: `DEBIT | CREDIT` — CREDIT là tiền vào, DEBIT là tiền ra

**TransactionResponse** (chi tiết 1 giao dịch):
```json
{
  "id": 102,
  "transactionCode": "TXN-9A33BC21",
  "amount": 2000000,
  "type": "WITHDRAW",
  "status": "SUCCESS",
  "referenceType": "WITHDRAWAL",
  "referenceId": 12,
  "description": "Rut tien - VCB20260405103000000001",
  "createdAt": "2026-02-22T10:05:00"
}
```

**POST `/wallet/deposit` body:**
```json
{ "amount": 500000, "description": "string (optional)" }
```

**PaymentResponse** (deposit):
```json
{
  "gateway": "VNPAY",
  "depositCode": "DEP-2026-000001",
  "transactionRef": "DEP-2026-000001",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "qrCode": null,
  "status": "PENDING",
  "message": "Payment URL generated",
  "expiredAt": "2026-02-22T11:30:00"
}
```
> FE redirect user đến `paymentUrl` để thanh toán qua VNPay

---

### Withdraw (`/wallet/withdraw`) — User endpoints

⚠️ Endpoint prefix thay đổi từ `/withdrawals` → `/wallet/withdraw`

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/wallet/withdraw` | `{ amount, userNote, pin }` | `WithdrawRequestResponse` |
| DELETE | `/wallet/withdraw/{id}` | - | `WithdrawRequestResponse` |
| GET | `/wallet/withdraw/my?page=0&size=10` | - | `PageResponse<WithdrawRequestResponse>` |

**WithdrawRequestResponse:**
```json
{
  "id": 102,
  "withdrawCode": "WD-2026-000012",
  "userId": 1,
  "amount": 2000000,
  "userNote": "Rut tien thang 04",
  "status": "PENDING",
  "accountantNote": null,
  "failureReason": null,
  "createdAt": "2026-02-22T10:05:00",
  "updatedAt": "2026-02-22T10:05:00"
}
```
> `status`: `WithdrawStatus` = `PENDING | COMPLETED | FAILED | REJECTED | CANCELLED`
> DELETE chỉ được phép khi `status = PENDING`

---

## 5. Company Fund (`/company-fund`)

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/company-fund` | - | `CompanyFundResponse` |
| POST | `/company-fund/topup` | `SystemTopupRequest` | `TransactionResponse` |
| PUT | `/company-fund/bank-statement` | `UpdateBankStatementRequest` | `CompanyFundResponse` |
| GET | `/company-fund/reconciliation` | - | `ReconciliationReportResponse` |

Notes:
- `CompanyFund` entity chỉ lưu metadata (bank info, external balance)
- Balance thực tế lưu trong `Wallet(COMPANY_FUND, ownerId=1)`
- `reconciliation` kiểm tra invariant: `FLOAT_MAIN.balance = SUM(all other wallets)`

---

## 6. System Config (`/system-configs`)

| Method | Endpoint |
|---|---|
| GET | `/system-configs` |
| GET | `/system-configs/:key` |
| PUT | `/system-configs/:key` |
| POST | `/system-configs/:key` |
| DELETE | `/system-configs/:key/cache` |
| DELETE | `/system-configs/cache` |

---

## 7. Notifications (`/notifications`)

| Method | Endpoint | Params |
|---|---|---|
| GET | `/notifications` | `?unreadOnly=false&page=0&size=20` |
| GET | `/notifications/unread-count` | - |
| PATCH | `/notifications/{id}/read` | - |
| PATCH | `/notifications/read-all` | - |

**NotificationType enum** (Java source):
```
REQUEST_SUBMITTED         — Member tạo request → notify TL
REQUEST_APPROVED_BY_TL    — TL duyệt → notify Accountant
REQUEST_REJECTED          — Bị từ chối → notify requester
REQUEST_PAID              — Accountant giải ngân → notify requester
PROJECT_TOPUP_APPROVED    — Manager duyệt + auto-pay → notify TL
PROJECT_TOPUP_REJECTED    — Manager từ chối → notify TL
DEPT_TOPUP_APPROVED       — CFO duyệt + auto-pay → notify Manager
DEPT_TOPUP_REJECTED       — CFO từ chối → notify Manager
SALARY_PAID               — Lương đã chuyển → notify employee
SYSTEM                    — Thông báo hệ thống chung
SECURITY_ALERT            — Cảnh báo bảo mật (PIN bị khoá, v.v.)
```

---

## 8. Common: Projects & Payslips

### Projects (dùng để populate dropdown khi tạo request)

| Method | Endpoint | Params | Response |
|---|---|---|---|
| GET | `/projects` | `?status=PLANNING\|ACTIVE\|PAUSED\|CLOSED` | `{ items: [{id, projectCode, name}] }` |
| GET | `/projects/:id/phases` | `?status=ACTIVE\|CLOSED` | `{ projectId, projectName, phases: [] }` |
| GET | `/projects/{phaseId}` (categories) | - | `{ items: [{id, name}] }` |

### Payslips (Employee xem phiếu lương của mình)

| Method | Endpoint | Params | Response |
|---|---|---|---|
| GET | `/payslips` | `?year=&status=DRAFT\|PAID&page=1&limit=12` | `{ items, total, page, limit, totalPages }` |
| GET | `/payslips/:id` | - | `PayslipDetailResponse` |

---

## 9. Employee Requests (`/requests`)

| Method | Endpoint | Params/Body | Response |
|---|---|---|---|
| GET | `/requests` | `?type=&status=&search=&page=1&limit=20` | `PageResponse<RequestListItem>` |
| GET | `/requests/summary` | - | `RequestSummaryResponse` |
| GET | `/requests/:id` | - | `RequestDetailResponse` |
| POST | `/requests` | `CreateRequestBody` | `RequestDetailResponse` |
| PUT | `/requests/:id` | `UpdateRequestBody` | `RequestDetailResponse` |
| DELETE | `/requests/:id` | - | `{ message }` |

**Enums:**
```
RequestType:   ADVANCE | EXPENSE | REIMBURSE | PROJECT_TOPUP | DEPARTMENT_TOPUP

RequestStatus: PENDING | APPROVED_BY_TEAM_LEADER | PENDING_ACCOUNTANT_EXECUTION |
               APPROVED_BY_MANAGER | APPROVED_BY_CFO | PAID | REJECTED | CANCELLED
               ⚠ Mỗi status là flow-specific — xem financial-architecture.md

RequestAction: APPROVE | REJECT | PAYOUT | CANCEL
```

**RequestSummaryResponse:**
```json
{
  "totalPendingApproval": 2,
  "totalPendingAccountant": 1,
  "totalApproved": 12,
  "totalRejected": 2,
  "totalPaid": 8,
  "totalCancelled": 1
}
```

**CreateRequestBody notes:**
- Flow 1 (`ADVANCE/EXPENSE/REIMBURSE`): cần `projectId`, `phaseId`, `categoryId`
- `REIMBURSE` cần thêm `advanceBalanceId`
- `EXPENSE`/`REIMBURSE`: bắt buộc có `attachments[]`
- Flow 2 (`PROJECT_TOPUP`): cần `projectId`; `phaseId`/`categoryId` = null
- Flow 3 (`DEPARTMENT_TOPUP`): `projectId`/`phaseId`/`categoryId` = null

**PUT `/requests/:id`:** Chỉ được phép khi `status = PENDING`. `attachments` ghi đè toàn bộ.

**DELETE `/requests/:id`:** Chỉ được phép khi `status = PENDING`. Chuyển sang `CANCELLED`.

---

## 10. Team Leader (`/team-leader`)

### Projects

| Method | Endpoint |
|---|---|
| GET | `/team-leader/projects?status=&search=&page=1&limit=20` |
| GET | `/team-leader/projects/:id` |
| POST | `/team-leader/projects/:id/members` — body: `{ userId, position }` |
| PUT | `/team-leader/projects/:id/members/:userId` — body: `{ position }` |
| DELETE | `/team-leader/projects/:id/members/:userId` |
| GET | `/team-leader/projects/:id/available-members?search=` |
| POST | `/team-leader/projects/:id/phases` — body: `{ name, budgetLimit, startDate, endDate }` |
| PUT | `/team-leader/projects/:id/phases/:phaseId` — body: `{ name?, budgetLimit?, endDate?, status? }` |
| GET | `/team-leader/projects/:id/categories?phaseId=` |
| PUT | `/team-leader/projects/:id/categories` — body: `{ phaseId, categories: [{categoryId, budgetLimit}] }` |
| GET | `/team-leader/expense-categories` |

### Team Members

| Method | Endpoint |
|---|---|
| GET | `/team-leader/team-members?projectId=&search=&page=1&limit=20` |
| GET | `/team-leader/team-members/:userId` |

### Approvals (Flow 1: ADVANCE/EXPENSE/REIMBURSE)

| Method | Endpoint |
|---|---|
| GET | `/team-leader/approvals?type=&projectId=&search=&page=0&size=20` |
| GET | `/team-leader/approvals/:id` |
| POST | `/team-leader/approvals/:id/approve` — body: `{ comment?, approvedAmount }` |
| POST | `/team-leader/approvals/:id/reject` — body: `{ reason }` |

Notes:
- TL chỉ thấy requests trong projects mình là LEADER
- Sau approve: `PENDING → APPROVED_BY_TEAM_LEADER → PENDING_ACCOUNTANT_EXECUTION`
- TL chỉ **decision** (approve/reject), không execute payout (SoD)

---

## 11. Manager (`/manager`)

### Approvals (Flow 2: PROJECT_TOPUP)

| Method | Endpoint |
|---|---|
| GET | `/manager/approvals?search=&page=1&limit=20` |
| GET | `/manager/approvals/:id` |
| POST | `/manager/approvals/:id/approve` — body: `{ comment?, approvedAmount }` |
| POST | `/manager/approvals/:id/reject` — body: `{ reason }` |

Notes:
- Manager chỉ duyệt `PROJECT_TOPUP` thuộc department của mình
- Sau approve: auto-transition `APPROVED_BY_MANAGER → PAID` (scheduler 1 phút)
- Không có `MANAGER_LIMIT` — chỉ bị chặn bởi `Department Fund balance`

### Projects

| Method | Endpoint |
|---|---|
| GET | `/manager/projects?status=&search=&page=1&limit=20` |
| GET | `/manager/projects/:id` |
| POST | `/manager/projects` — body: `{ name, description?, totalBudget, teamLeaderId }` |
| PUT | `/manager/projects/:id` — body: `{ name?, description?, totalBudget?, status?, teamLeaderId? }` |
| GET | `/manager/department/team-leaders` |

### Department Members

| Method | Endpoint |
|---|---|
| GET | `/manager/department/members?search=&page=1&limit=20` |
| GET | `/manager/department/members/:id` |

---

## 12. Accountant (`/accountant`)

### Disbursements (Flow 1 execution)

| Method | Endpoint |
|---|---|
| GET | `/accountant/disbursements?type=&search=&page=0&size=20` |
| GET | `/accountant/disbursements/:id` |
| POST | `/accountant/disbursements/:id/disburse` — body: `{ pin, note? }` |
| POST | `/accountant/disbursements/:id/reject` — body: `{ reason }` |

Notes:
- Chỉ thấy requests ở trạng thái `PENDING_ACCOUNTANT_EXECUTION`
- `disburse` yêu cầu PIN 5 số của Accountant
- Sau disburse: `PAID` + tạo Transaction `REQUEST_PAYMENT` (PROJECT → USER wallet)
- Accountant **có thể reject** ngay cả sau khi TL đã approve (checkpoint chứng từ)

### Payroll

| Method | Endpoint |
|---|---|
| GET | `/accountant/payroll?year=&status=&page=1&limit=12` |
| GET | `/accountant/payroll/:periodId` |
| POST | `/accountant/payroll` — body: `{ name, month, year, startDate, endDate }` |
| GET | `/accountant/payroll/template` — tải file Excel mẫu |
| POST | `/accountant/payroll/:periodId/import` — `multipart/form-data`, field `file` |
| POST | `/accountant/payroll/:periodId/confirm-overwrite` — xác nhận ghi đè |
| POST | `/accountant/payroll/:periodId/auto-netting` — tính `advanceDeduct` tự động |
| POST | `/accountant/payroll/:periodId/run` — chạy tính lương chính thức |
| PUT | `/accountant/payroll/:periodId/entries/:payslipId` — sửa 1 payslip |

Notes:
- Thứ tự bắt buộc: `import` → `auto-netting` → `run`
- `auto-netting`: tính khấu trừ tạm ứng, đảm bảo nhân viên nhận ≥ 50% lương
- Nguồn chi trả: `Wallet(COMPANY_FUND)` — không dùng `system_funds`

### Ledger (Sổ cái)

| Method | Endpoint |
|---|---|
| GET | `/accountant/ledger?type=&status=&referenceType=&from=&to=&page=1&limit=20` |
| GET | `/accountant/ledger/summary?from=&to=` |
| GET | `/accountant/ledger/:transactionId` |
| GET | `/accountant/payslips/:payslipId` |

**LedgerSummaryResponse:**
```json
{
  "currentBalance": 1250000000,
  "totalInflow": 3500000000,
  "totalOutflow": 2250000000,
  "transactionCount": 156
}
```

---

## 13. CFO (`/cfo`)

| Method | Endpoint |
|---|---|
| GET | `/cfo/approvals?search=&page=0&size=20` |
| GET | `/cfo/approvals/:id` |
| POST | `/cfo/approvals/:id/approve` — body: `{ comment?, approvedAmount }` |
| POST | `/cfo/approvals/:id/reject` — body: `{ reason }` |

Notes:
- CFO chỉ duyệt `DEPARTMENT_TOPUP`
- Sau approve: status = `APPROVED_BY_CFO` → scheduler auto-pay → `PAID` (COMPANY_FUND → DEPARTMENT)
- Detail response bao gồm `department.totalAvailableBalance` và `companyFund.balance`

---

## 14. Admin (`/admin`)

### Users

| Method | Endpoint |
|---|---|
| GET | `/admin/users?role=&departmentId=&status=&search=&page=1&limit=20` |
| GET | `/admin/users/:id` |
| POST | `/admin/users` — body: `{ fullName, email, roleId, departmentId? }` |
| PUT | `/admin/users/:id` — body: `{ fullName?, roleId?, departmentId? }` |
| POST | `/admin/users/:id/lock` |
| POST | `/admin/users/:id/unlock` |
| POST | `/admin/users/:id/reset-password` |

Notes:
- Tạo user → backend tự generate mật khẩu tạm, gửi email ONBOARD
- `reset-password` → set `is_first_login = true`, gửi mật khẩu tạm qua email
- Admin user detail kèm `wallet`, `securitySettings`

### Departments

| Method | Endpoint |
|---|---|
| GET | `/admin/departments?search=&page=1&limit=20` |
| GET | `/admin/departments/:id` |
| POST | `/admin/departments` — body: `{ name, code?, managerId?, totalProjectQuota? }` |
| PUT | `/admin/departments/:id` — body: `{ name?, managerId?, totalProjectQuota? }` |

### Audit

| Method | Endpoint |
|---|---|
| GET | `/admin/audit?actorId=&action=&entityName=&from=&to=&page=1&limit=50` |

**AuditAction values:**
```
USER_CREATED | USER_UPDATED | USER_LOCKED | USER_UNLOCKED | BANK_INFO_UPDATED |
ROLE_ASSIGNED | ROLE_REVOKED | PERMISSION_GRANTED | PERMISSION_REVOKED |
DEPARTMENT_CREATED | DEPARTMENT_UPDATED | DEPARTMENT_DELETED |
QUOTA_TOPUP | QUOTA_ADJUSTED | CONFIG_UPDATED | SYSTEM_FUND_ADJUSTED |
PROJECT_TOPUP | CATEGORY_BUDGET_UPDATED | PIN_RESET | PIN_LOCKED |
USER_LOGIN_SUCCESS | USER_LOGIN_FAILED | DATA_EXPORTED | MANUAL_ADJUSTMENT
```

### Settings

| Method | Endpoint |
|---|---|
| GET | `/admin/settings` | — trả `{ items: [{key, value, description}] }` |
| PUT | `/admin/settings` | — body: `{ configs: [{key, value}] }` |

Known system config keys: `WITHDRAWAL_LIMIT`, `MINIMUM_WITHDRAWAL`, `MAX_FILE_SIZE_MB`,
`MAX_FILES_PER_REQUEST`, `MINIMUM_REQUEST_AMOUNT`, `PIN_MAX_RETRY`,
`PIN_LOCK_DURATION_MINUTES`, `REQUIRE_PIN_FOR_WITHDRAWAL`

⚠️ `MANAGER_APPROVAL_LIMIT` **không còn** — hệ thống dùng Balance Limit (số dư quỹ) làm chốt chặn duy nhất

---

## 15. WebSocket

| Channel | Payload Type | Trigger |
|---|---|---|
| `/user/queue/wallet` | `WalletUpdateMessage` | Disbursement, Payroll run, Withdraw confirm, Deposit confirm |
| `/user/queue/requests` | `RequestStatusUpdateMessage` | Approve/Reject/Payout trên request của user |
| `/user/queue/notifications` | `NotificationMessage` | Mọi notification mới tạo cho user |

**WalletUpdateMessage payload:**
```json
{
  "type": "WALLET_UPDATED",
  "data": {
    "walletId": 1,
    "balance": 20000000,
    "pendingBalance": 0,
    "debtBalance": 0,
    "version": 12,
    "transaction": {
      "id": 501,
      "transactionCode": "TXN-8829145A",
      "type": "PAYSLIP_PAYMENT",
      "status": "SUCCESS",
      "amount": 15000000,
      "balanceAfter": 20000000,
      "referenceType": "PAYSLIP",
      "referenceId": 42,
      "description": "Lương T02/2026",
      "createdAt": "2026-02-25T10:00:00"
    }
  },
  "timestamp": "2026-02-25T10:00:00"
}
```
> `WalletContext.updateFromWS(data)` áp dụng nếu `data.version > current.version`

**RequestStatusUpdateMessage payload:**
```json
{
  "type": "REQUEST_STATUS_CHANGED",
  "data": {
    "id": 101,
    "requestCode": "REQ-IT-2602-001",
    "previousStatus": "PENDING",
    "newStatus": "PENDING_ACCOUNTANT_EXECUTION",
    "approvedAmount": 8500000,
    "rejectReason": null,
    "actor": { "id": 8, "fullName": "Le Van Minh", "role": "TEAM_LEADER" },
    "comment": "Approved — looks good.",
    "updatedAt": "2026-02-25T10:30:00"
  },
  "timestamp": "2026-02-25T10:30:00"
}
```

**NotificationMessage payload:**
```json
{
  "type": "NEW_NOTIFICATION",
  "data": {
    "id": 55,
    "type": "REQUEST_APPROVED_BY_TL",
    "title": "Request Approved",
    "message": "Your request REQ-IT-2602-001 has been approved",
    "isRead": false,
    "refId": 101,
    "refType": "REQUEST",
    "createdAt": "2026-02-25T10:30:00"
  },
  "timestamp": "2026-02-25T10:30:00"
}
```

**WebSocket config:**
- Endpoint: `/ws` (SockJS fallback)
- Auth: gửi `Authorization: Bearer <token>` trong STOMP CONNECT header
- Reconnect: exponential backoff (1s → 2s → 4s → 8s → max 30s)
- Khi reconnect → gọi `GET /wallet` + `GET /notifications` để sync lại state
