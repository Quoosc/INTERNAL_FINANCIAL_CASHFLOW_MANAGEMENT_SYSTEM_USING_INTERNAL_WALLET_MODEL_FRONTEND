# API_CONTRACT.md - Frontend/Backend Contract

> Version: 3.1 (2026-04-08)
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

Backend currently has mixed conventions by module:
- Spring pageable: `page` (0-index), `size`
- Legacy style: `page` (often 1-index), `limit`

Do not assume one global pagination format.

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|:---:|
| POST | `/auth/login` | `LoginRequest` | `LoginResponse` (`requiresSetup`, `setupToken`) | No |
| POST | `/auth/logout` | - | `{ message }` | Yes |
| POST | `/auth/refresh-token` | `RefreshTokenRequest` | `RefreshTokenResponse` | Yes |
| POST | `/auth/first-login/complete` | `FirstLoginSetupRequest` | `LoginResponse` | No |
| POST | `/auth/change-password` | `ChangePasswordRequest` | `{ message }` | Yes |
| POST | `/auth/forgot-password` | `ForgotPasswordRequest` | `{ message }` | No |
| POST | `/auth/verify-password-reset` | `VerifyOtpPasswordResetRequest` | `{ message }` | No |
| GET | `/auth/me` | - | `AuthUser` | Yes |

Notes:
- First login flow is one-step via `POST /auth/first-login/complete`.
- `POST /auth/reset-password` is not mapped in current `AuthController` runtime.

---

## 2. Profile and Security (`/users/me`, `/banks`)

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/users/me/profile` | - | `UserProfileResponse` |
| PUT | `/users/me/profile` | `UpdateProfileRequest` | `UserProfileResponse` |
| PUT | `/users/me/avatar` | `UpdateAvatarRequest` | `{ avatar }` |
| PUT | `/users/me/bank-info` | `UpdateBankInfoRequest` | `BankInfo` |
| PUT | `/users/me/pin` | `UpdatePinRequest` | `{ message }` |
| POST | `/users/me/pin/verify` | `VerifyPinRequest` | `{ valid }` |
| GET | `/banks` | - | `BankOption[]` |

Password change while logged in uses `POST /auth/change-password`.

---

## 3. File Storage (`/uploads`)

| Method | Endpoint | Response |
|---|---|---|
| GET | `/uploads/signature?folder=AVATAR|REQUEST` | `{ signature, timestamp, cloudName, apiKey, folder }` |

---

## 4. Wallet and Withdraw

| Method | Endpoint | Response | Status |
|---|---|---|---|
| GET | `/wallet` | `WalletResponse` | Planned/Rollout |
| GET | `/wallet/transactions` | `PaginatedResponse<TransactionResponse>` | Planned/Rollout |
| POST | `/wallet/deposit` | `DepositResponse` | Planned/Rollout |

### Withdraw (`/withdrawals`) - implemented in backend runtime

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/withdrawals` | `CreateWithdrawRequest` | `WithdrawRequestResponse` |
| DELETE | `/withdrawals/:id` | - | `WithdrawRequestResponse` |
| GET | `/withdrawals/my?page=&size=` | - | `SpringPage<WithdrawRequestResponse>` |
| GET | `/withdrawals?status=&page=&size=` | - | `SpringPage<WithdrawRequestResponse>` |
| PUT | `/withdrawals/:id/execute` | `ProcessWithdrawRequest?` | `WithdrawRequestResponse` |
| PUT | `/withdrawals/:id/reject` | `ProcessWithdrawRequest` | `WithdrawRequestResponse` |

---

## 5. Company Fund (`/company-fund`)

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/company-fund` | - | `CompanyFundResponse` |
| POST | `/company-fund/topup` | `SystemTopupRequest` | `TransactionResponse` |
| PUT | `/company-fund/bank-statement` | `UpdateBankStatementRequest` | `CompanyFundResponse` |
| GET | `/company-fund/reconciliation` | - | `ReconciliationReportResponse` |

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

| Method | Endpoint |
|---|---|
| GET | `/notifications` |
| GET | `/notifications/unread-count` |
| PATCH | `/notifications/:id/read` |
| PATCH | `/notifications/read-all` |

---

## 8. Employee Requests (`/requests`)

| Method | Endpoint |
|---|---|
| GET | `/requests` |
| GET | `/requests/summary` |
| GET | `/requests/:id` |
| POST | `/requests` |
| PUT | `/requests/:id` |
| DELETE | `/requests/:id` |

Enums:
- `RequestType`: `ADVANCE | EXPENSE | REIMBURSE | PROJECT_TOPUP | DEPARTMENT_TOPUP`
- `RequestStatus`: `PENDING | APPROVED_BY_TEAM_LEADER | PENDING_ACCOUNTANT_EXECUTION | APPROVED_BY_MANAGER | APPROVED_BY_CFO | PAID | REJECTED | CANCELLED`

---

## 9. Team Leader (`/team-leader`)

`/projects`, `/approvals`, `/team-members`, `/expense-categories` families are used per current backend spec.

## 10. Manager (`/manager`)

`/approvals`, `/projects`, `/department/members`, `/department/team-leaders` families are used per current backend spec.

## 11. Accountant (`/accountant`)

`/disbursements`, `/payroll`, `/ledger` families are used per current backend spec.

## 12. CFO (`/cfo`)

| Method | Endpoint |
|---|---|
| GET | `/cfo/approvals` |
| GET | `/cfo/approvals/:id` |
| POST | `/cfo/approvals/:id/approve` |
| POST | `/cfo/approvals/:id/reject` |

## 13. Admin (`/admin`)

IAM/system endpoints only:
- `/admin/users/*`
- `/admin/departments/*`
- `/admin/audit`
- `/admin/settings`

---

## 14. WebSocket

| Channel | Payload |
|---|---|
| `/user/queue/wallet` | `WalletUpdateMessage` |
| `/user/queue/requests` | `RequestStatusUpdateMessage` |
| `/user/queue/notifications` | `NotificationMessage` |