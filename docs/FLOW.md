# FLOW.md - Data Flow (Frontend <-> Backend)

> Version: 3.1 (2026-04-08)
> Aligned with latest backend flow: 6 roles, 3 financial flows, wallet-first model

## 1. System Overview

```
Browser (Next.js)
  -> /api/v1/* (proxy in next.config.ts)
  -> Spring Boot Backend
  -> PostgreSQL + Redis + MQ/WebSocket
```

## 2. Auth Flow

1. User login: `POST /api/v1/auth/login`
2. If `requiresSetup = true`:
   - Frontend stores `setupToken` in sessionStorage
   - Redirect to `/change-password`
   - Submit one-step setup: `POST /api/v1/auth/first-login/complete`
3. If `requiresSetup = false`:
   - Save access/refresh token
   - Redirect `/dashboard`
4. On 401:
   - `POST /api/v1/auth/refresh-token`
   - Retry original request

Note: no separate first-login `/create-pin` step in current flow.

## 3. Roles and Fund Tiers

Roles:
- EMPLOYEE
- TEAM_LEADER
- MANAGER
- ACCOUNTANT
- CFO
- ADMIN

Fund tiers:
1. COMPANY_FUND (top)
2. DEPARTMENT
3. PROJECT
4. PERSONAL WALLET

## 4. Flow 1 - Personal Spending

Type: `ADVANCE | EXPENSE | REIMBURSE`

1. Employee creates request -> `PENDING`
2. Team Leader approves -> `APPROVED_BY_TEAM_LEADER`
3. Request waits accountant execution -> `PENDING_ACCOUNTANT_EXECUTION`
4. Accountant disburses (PIN) -> `PAID`
5. Money movement: `PROJECT -> USER`

## 5. Flow 2 - Project Topup

Type: `PROJECT_TOPUP`

1. Team Leader creates request -> `PENDING`
2. Manager approves -> `APPROVED_BY_MANAGER`
3. System auto settles -> `PAID`
4. Money movement: `DEPARTMENT -> PROJECT`

## 6. Flow 3 - Department Topup

Type: `DEPARTMENT_TOPUP`

1. Manager creates request -> `PENDING`
2. CFO approves -> `APPROVED_BY_CFO`
3. System auto settles -> `PAID`
4. Money movement: `COMPANY_FUND -> DEPARTMENT`

## 7. Request Status Set

- `PENDING`
- `APPROVED_BY_TEAM_LEADER`
- `PENDING_ACCOUNTANT_EXECUTION`
- `APPROVED_BY_MANAGER`
- `APPROVED_BY_CFO`
- `PAID`
- `REJECTED`
- `CANCELLED`

## 8. Frontend Data Path

```
UI event
  -> api-client.ts
  -> /api/v1/*
  -> Backend controller/service
  -> ApiResponse<T>
  -> Frontend state/context update
```

## 9. Real-time Channels

- `/user/queue/wallet`
- `/user/queue/requests`
- `/user/queue/notifications`