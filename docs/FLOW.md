# FLOW.md - Data Flow (Frontend <-> Backend)

> Version: 3.3 (2026-04-25)
> Aligned with backend source: 6 roles, 4 financial flows, wallet-first model, SoD
>
> **Thay đổi so với 3.2:** Realtime transport STOMP/WebSocket → SSE (xem §11).

## 1. System Overview

```
Browser (Next.js)
  -> /api/v1/* (proxy in next.config.ts)
  -> Spring Boot Backend (port 8080)
  -> PostgreSQL + Redis + RabbitMQ + SSE (Server-Sent Events)
```

## 2. Auth Flow

1. User login: `POST /api/v1/auth/login`
2. If `requiresSetup = true` (first login):
   - Backend cấp `setupToken` (15 phút, one-time), KHÔNG có access/refresh token
   - Frontend lưu `setupToken` vào sessionStorage
   - Redirect `/change-password`
   - Submit one-step setup: `POST /api/v1/auth/first-login/complete` `{ setupToken, newPassword, confirmPassword, pin }`
   - Success → nhận `accessToken/refreshToken` → redirect `/dashboard`
3. If `requiresSetup = false` (normal login):
   - Lưu `accessToken/refreshToken` + set cookie `access_token`
   - `localStorage["user_info"] = JSON.stringify(user)`
   - Redirect `/dashboard`
4. On 401:
   - `POST /api/v1/auth/refresh-token { refreshToken }`
   - Success → retry request gốc
   - Fail → clearTokens() + redirect `/login`

Note: `/create-pin` và `/register` là orphaned pages — không có endpoint backend.

## 3. Roles và Fund Tiers

**6 Roles:**
- `EMPLOYEE` — tạo requests chi tiêu
- `TEAM_LEADER` — duyệt Flow 1, quản lý project/phase/budget
- `MANAGER` — duyệt Flow 2, tạo/quản lý projects
- `ACCOUNTANT` — execute giải ngân Flow 1, quản lý payroll, sổ cái
- `CFO` — duyệt Flow 3, nạp quỹ hệ thống
- `ADMIN` — quản trị IAM/system, không tham gia duyệt tài chính

**4-Tier Fund Structure (WalletOwnerType):**

```
External Bank
    ↓ SYSTEM_TOPUP (boundary — FLOAT_MAIN +amount)
Tier 1: Wallet(COMPANY_FUND, ownerId=1) — Quỹ công ty
    ↓ DEPT_QUOTA_ALLOCATION (Flow 3)
Tier 2: Wallet(DEPARTMENT, ownerId=departmentId) — Quỹ phòng ban
    ↓ PROJECT_QUOTA_ALLOCATION (Flow 2)
Tier 3: Wallet(PROJECT, ownerId=projectId) — Quỹ dự án
    ↓ REQUEST_PAYMENT (Flow 1)
Tier 4: Wallet(USER, ownerId=userId) — Ví cá nhân nhân viên
    ↓ ADVANCE_RETURN (hoàn trả tạm ứng dư)
Tier 3: Project Wallet
```

**FLOAT_MAIN** (`Wallet(FLOAT_MAIN, ownerId=0)`):
- Control wallet — invariant checker, không có owner thực
- Invariant: `FLOAT_MAIN.balance = SUM(balance của tất cả wallet trừ FLOAT_MAIN)`
- Chỉ thay đổi khi có boundary transaction (SYSTEM_TOPUP, DEPOSIT, WITHDRAW)
- Discrepancy ≠ 0 → có lỗi mutation ngoài WalletService

## 4. Flow 1 - Personal Spending (High Risk)

Type: `ADVANCE | EXPENSE | REIMBURSE`

```
EMPLOYEE tạo request (PENDING)
    ↓
TEAM_LEADER duyệt (APPROVED_BY_TEAM_LEADER)
    ↓ [tự động]
PENDING_ACCOUNTANT_EXECUTION
    ↓
ACCOUNTANT kiểm tra chứng từ + nhập PIN + disburse
    ↓
PAID
```

Money movement: `Project Wallet → User Wallet` (transaction type: `REQUEST_PAYMENT`)

Segregation of Duties:
- TEAM_LEADER: **Decision** — approve/reject
- ACCOUNTANT: **Execution** — review chứng từ, kiểm tra số dư, giải ngân

Reject points: TL có thể reject (REJECTED), Accountant cũng có thể reject sau khi TL đã approve (phát hiện sai sót chứng từ cuối cùng).

## 5. Flow 2 - Project Fund Top-up (Medium Risk)

Type: `PROJECT_TOPUP`

```
TEAM_LEADER tạo request (PENDING)
    ↓
MANAGER duyệt (APPROVED_BY_MANAGER)
    ↓ [Scheduler auto-pay ~1 phút]
PAID
```

Money movement: `Department Wallet → Project Wallet` (transaction type: `PROJECT_QUOTA_ALLOCATION`)

Note: Không cần Accountant. Manager quyết định, scheduler tự động thực thi.

## 6. Flow 3 - Department Quota Top-up (Low Risk)

Type: `DEPARTMENT_TOPUP`

```
MANAGER tạo request (PENDING)
    ↓
CFO duyệt (APPROVED_BY_CFO)
    ↓ [Scheduler auto-pay ~1 phút]
PAID
```

Money movement: `Company Fund Wallet → Department Wallet` (transaction type: `DEPT_QUOTA_ALLOCATION`)

## 7. Flow 4 - System Fund Top-up

Nạp tiền từ ngân hàng thực tế vào quỹ công ty (không phải request — là action trực tiếp):

```
CFO/Accountant xác nhận tiền đã về từ ngân hàng
    ↓
POST /api/v1/company-fund/topup { amount, paymentRef, description }
    ↓ [Ngay lập tức]
Company Fund Wallet +amount + FLOAT_MAIN +amount
```

Money movement: `External Bank → Company Fund Wallet` (transaction type: `SYSTEM_TOPUP`, 1 LedgerEntry, không có source wallet trong IFMS)

## 8. AdvanceBalance Lifecycle (cho ADVANCE request)

```
Flow 1 ADVANCE payout
    ↓ PAID
AdvanceBalance tạo (debt_balance += amount)
    ↓
User wallet có debt_balance

Settlement (2 cách):
  Option A: REIMBURSE request
    - Employee nộp hóa đơn → TL approve → Accountant approve
    - Chỉ cập nhật AdvanceBalance (accounting only, không movement wallet)
    - debt_balance -= settled amount

  Option B: ADVANCE_RETURN (cash return)
    - User chuyển tiền thừa về
    - Transaction ADVANCE_RETURN: User Wallet → Project Wallet
    - debt_balance -= returned amount
```

Khi run payroll: `auto-netting` tính `advanceDeduct = min(debtBalance, 50% * netSalary)` → khấu trừ vào lương.

## 9. Request Status Set

```
PENDING                      — Mọi flow khi mới tạo
APPROVED_BY_TEAM_LEADER      — Flow 1: TL duyệt (trước Accountant execution)
PENDING_ACCOUNTANT_EXECUTION — Flow 1: chờ Accountant giải ngân
APPROVED_BY_MANAGER          — Flow 2: Manager duyệt (chờ auto-pay)
APPROVED_BY_CFO              — Flow 3: CFO duyệt (chờ auto-pay)
PAID                         — Terminal: đã giải ngân (mọi flow)
REJECTED                     — Terminal: bị từ chối
CANCELLED                    — Terminal: người tạo tự hủy (chỉ khi PENDING)
```

## 10. Frontend Data Path

```
UI event
  -> api-client.ts (tự attach Bearer token, xử lý 401/refresh, unwrap ApiResponse<T>)
  -> /api/v1/* (Next.js proxy → localhost:8080)
  -> Backend controller/service
  -> ApiResponse<T> { success, message, data, timestamp }
  -> Frontend state/context update
```

Error handling:
```ts
import { ApiError } from "@/lib/api-client";
try {
  const res = await api.post<T>("/api/v1/...", body);
  // res.data là payload
} catch (err) {
  if (err instanceof ApiError) {
    // err.status (HTTP code) + err.apiMessage (backend message)
  }
}
```

## 11. Real-time — Server-Sent Events (SSE)

Từ v3.3, backend chuyển từ STOMP/WebSocket sang **SSE** với **1 endpoint duy nhất**:

- Endpoint: `GET /api/v1/users/stream` (`text/event-stream`)
- Auth: `Authorization: Bearer <accessToken>` header
- FE lib: `@microsoft/fetch-event-source` (native `EventSource` không hỗ trợ custom header)

### 4 event backend đẩy về

| Event name | Payload (raw, không wrap) | FE Handler |
|---|---|---|
| `connected` | `"SSE connected"` | No-op / log debug |
| `wallet.updated` | `WalletResponse` | `WalletContext.updateFromSse(wallet)` — replace state |
| `transaction.created` | `LedgerEntryResponse` | Prepend row vào `wallet/transactions` list |
| `notification` | `NotificationResponse` | Prepend vào notification list + tăng unread badge |

> Không còn `REQUEST_STATUS_CHANGED` — sau action approve/reject/disburse, UI gọi caller tự `refetch` list/detail. Gate lại bằng wallet + notification nếu cần.

**Reconnect**: `fetchEventSource` tự reconnect. Khi reconnect thành công → gọi lại `GET /wallet` + `GET /notifications` (1 lần) để sync lại state.

Chi tiết payload + ví dụ đầy đủ: xem [API_CONTRACT §15](./API_CONTRACT.md#15-realtime--server-sent-events-sse).

## 12. Server vs Client Component

| Component type | Khi nào dùng |
|---|---|
| **Server Component** (default) | Render props/static data, không cần hook/interactivity |
| **Client Component** (`"use client"`) | Cần `useState`, `useEffect`, `useContext`, `useRouter`, `usePathname`, form handlers |

Rule: Default là Server Component. Chỉ thêm `"use client"` khi thực sự cần.

AuthContext và WalletContext **chỉ khả dụng trong `(dashboard)/`** — auth pages không được gọi `useAuth`/`useWallet`.
