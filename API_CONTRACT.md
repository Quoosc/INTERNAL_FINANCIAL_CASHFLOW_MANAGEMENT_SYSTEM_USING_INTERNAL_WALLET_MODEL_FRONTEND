# API_CONTRACT.md — Đồng bộ API giữa Frontend & Backend

## Base URL

- **Development**: `http://localhost:8080` (proxy qua Next.js rewrites)
- **Frontend gọi**: `/api/v1/...` (tự proxy sang backend)

## Response Format (chung)

```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-03-07T15:00:00"
}
```

TypeScript: `ApiResponse<T>` — xem `types/api.ts`

---

## 1. Authentication (`/api/v1/auth`) ✅ READY

| Method | Endpoint | Request Body | Response Data | Auth |
|--------|----------|-------------|---------------|------|
| POST | `/api/v1/auth/register` | `RegisterRequest` | `AuthenticationResponse` | ❌ |
| POST | `/api/v1/auth/login` | `LoginRequest` | `AuthenticationResponse` | ❌ |
| POST | `/api/v1/auth/refresh-token` | `RefreshTokenRequest` | `AuthenticationResponse` | ❌ |
| POST | `/api/v1/auth/logout` | `LogoutRequest` | `string` | ❌ |

### Request/Response DTOs

```typescript
// LoginRequest
{ email: string; password: string }

// RegisterRequest
{ firstName: string; lastName: string; email: string; password: string }

// AuthenticationResponse
{
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
    permissions: string[];
  }
}
```

---

## 2. Wallet (`/api/v1/wallet`) 🔮 PLANNED

| Method | Endpoint | Request Body | Response Data | Auth | Permission |
|--------|----------|-------------|---------------|------|------------|
| GET | `/api/v1/wallet/me` | — | `Wallet` | ✅ | `WALLET_VIEW_SELF` |
| POST | `/api/v1/wallet/deposit` | `{amount, pin}` | `Transaction` | ✅ | `WALLET_DEPOSIT` |
| POST | `/api/v1/wallet/withdraw` | `{amount, bankAccount, pin}` | `Transaction` | ✅ | `WALLET_WITHDRAW` |
| GET | `/api/v1/wallet/transactions` | Query params | `Page<Transaction>` | ✅ | `WALLET_TRANSACTION_VIEW` |

---

## 3. Requests (`/api/v1/requests`) 🔮 PLANNED

| Method | Endpoint | Body | Response | Auth | Permission |
|--------|----------|------|----------|------|------------|
| GET | `/api/v1/requests` | Query params | `Page<Request>` | ✅ | `REQUEST_VIEW_SELF/DEPT/ALL` |
| POST | `/api/v1/requests` | `CreateRequestDTO` | `Request` | ✅ | `REQUEST_CREATE` |
| GET | `/api/v1/requests/{id}` | — | `Request` | ✅ | Varies |
| POST | `/api/v1/requests/{id}/approve` | `{comment}` | `Request` | ✅ | `REQUEST_APPROVE_TIER1/2` |
| POST | `/api/v1/requests/{id}/reject` | `{reason}` | `Request` | ✅ | `REQUEST_REJECT` |
| POST | `/api/v1/requests/{id}/payout` | — | `Request` | ✅ | `REQUEST_PAYOUT` |
| POST | `/api/v1/requests/{id}/cancel` | — | `Request` | ✅ | Owner only |

---

## 4. Projects (`/api/v1/projects`) 🔮 PLANNED

| Method | Endpoint | Body | Response | Permission |
|--------|----------|------|----------|------------|
| GET | `/api/v1/projects` | Query | `Page<Project>` | `PROJECT_VIEW_ACTIVE/ALL` |
| POST | `/api/v1/projects` | `CreateProjectDTO` | `Project` | `PROJECT_CREATE` |
| GET | `/api/v1/projects/{id}` | — | `Project` | Varies |
| PUT | `/api/v1/projects/{id}` | `UpdateProjectDTO` | `Project` | `PROJECT_UPDATE` |
| POST | `/api/v1/projects/{id}/phases` | `CreatePhaseDTO` | `ProjectPhase` | `PROJECT_PHASE_MANAGE` |
| POST | `/api/v1/projects/{id}/members` | `{userId}` | `ProjectMember` | `PROJECT_MEMBER_MANAGE` |

---

## 5. Payroll (`/api/v1/payroll`) 🔮 PLANNED

| Method | Endpoint | Body | Response | Permission |
|--------|----------|------|----------|------------|
| GET | `/api/v1/payroll` | Query | `Page<PayrollPeriod>` | `PAYROLL_VIEW_SELF/MANAGE` |
| POST | `/api/v1/payroll` | `CreatePayrollDTO` | `PayrollPeriod` | `PAYROLL_MANAGE` |
| POST | `/api/v1/payroll/{id}/upload` | FormData (Excel) | `PayrollPeriod` | `PAYROLL_MANAGE` |
| POST | `/api/v1/payroll/{id}/execute` | — | `PayrollPeriod` | `PAYROLL_EXECUTE` |
| GET | `/api/v1/payroll/my-payslips` | — | `Payslip[]` | `PAYROLL_VIEW_SELF` |

---

## 6. Users (`/api/v1/users`) 🔮 PLANNED

| Method | Endpoint | Body | Response | Permission |
|--------|----------|------|----------|------------|
| GET | `/api/v1/users` | Query | `Page<User>` | `USER_VIEW_LIST` |
| POST | `/api/v1/users` | `CreateUserDTO` | `User` | `USER_CREATE` |
| PUT | `/api/v1/users/{id}` | `UpdateUserDTO` | `User` | `USER_UPDATE` |
| PATCH | `/api/v1/users/{id}/lock` | — | `User` | `USER_LOCK` |
| GET | `/api/v1/users/me/profile` | — | `UserProfile` | `USER_PROFILE_VIEW` |
| PUT | `/api/v1/users/me/profile` | `UpdateProfileDTO` | `UserProfile` | `USER_PROFILE_UPDATE` |
| PUT | `/api/v1/users/me/pin` | `{oldPin, newPin}` | — | `USER_PIN_UPDATE` |

---

## 7. Roles (`/api/v1/roles`) 🔮 PLANNED

| Method | Endpoint | Body | Response | Permission |
|--------|----------|------|----------|------------|
| GET | `/api/v1/roles` | — | `Role[]` | `ROLE_MANAGE` |
| POST | `/api/v1/roles` | `{name, description, permissions}` | `Role` | `ROLE_MANAGE` |
| PUT | `/api/v1/roles/{id}` | `{name, permissions}` | `Role` | `ROLE_MANAGE` |

---

## 8. Departments (`/api/v1/departments`) 🔮 PLANNED

| Method | Endpoint | Body | Response | Permission |
|--------|----------|------|----------|------------|
| GET | `/api/v1/departments` | — | `Department[]` | `DEPT_MANAGE` |
| POST | `/api/v1/departments` | `{name, code, managerId}` | `Department` | `DEPT_MANAGE` |
| POST | `/api/v1/departments/{id}/topup` | `{amount}` | `Department` | `DEPT_BUDGET_ALLOCATE` |

---

## 9. System Fund (`/api/v1/system-fund`) 🔮 PLANNED

| Method | Endpoint | Body | Response | Permission |
|--------|----------|------|----------|------------|
| GET | `/api/v1/system-fund` | — | `SystemFund` | `SYSTEM_FUND_VIEW` |
| POST | `/api/v1/system-fund/topup` | `{amount}` | `SystemFund` | `SYSTEM_FUND_TOPUP` |

---

## 10. Notifications (`/api/v1/notifications`) 🔮 PLANNED

| Method | Endpoint | Body | Response | Permission |
|--------|----------|------|----------|------------|
| GET | `/api/v1/notifications` | Query | `Page<Notification>` | `NOTIFICATION_VIEW` |
| PATCH | `/api/v1/notifications/{id}/read` | — | — | Owner only |
| PATCH | `/api/v1/notifications/read-all` | — | — | Owner only |

---

## 11. Audit Logs (`/api/v1/audit-logs`) 🔮 PLANNED

| Method | Endpoint | Body | Response | Permission |
|--------|----------|------|----------|------------|
| GET | `/api/v1/audit-logs` | Query (action, date) | `Page<AuditLog>` | `AUDIT_LOG_VIEW` |

---

## Legend

| Icon | Nghĩa |
|------|-------|
| ✅ READY | Backend Controller đã implement |
| 🔮 PLANNED | Chỉ có Entity, cần dev thêm Controller |
| ✅ Auth | Yêu cầu `Authorization: Bearer <token>` |
| ❌ Auth | Public endpoint |
