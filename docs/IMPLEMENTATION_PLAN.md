# Implementation Plan: Next.js Frontend Architecture for Internal Financial Cashflow Management System

> [!WARNING]
> Tài liệu này mang tính lịch sử (giai đoạn khởi tạo). Nguồn chuẩn hiện tại là `docs/API_CONTRACT.md`, `docs/FLOW.md`, và `CLAUDE.md`.

## Overview

Thiết kế và xây dựng kiến trúc Frontend Next.js (App Router, TypeScript) kết nối với Backend Java Spring Boot. Backend hiện đã có nhiều controller/module được triển khai theo từng sprint; nội dung chi tiết cần đối chiếu từ `docs/API_CONTRACT.md` thay vì giả định trạng thái ban đầu.

> [!IMPORTANT]
> Giả định "chỉ có AuthController" đã lỗi thời. Khi triển khai, luôn kiểm tra contract backend mới nhất trước khi code.

---

## Proposed Changes

### Component 1: Next.js Configuration (Proxy / Rewrites)

Cấu hình `next.config.ts` để proxy tất cả `/api/**` requests sang Spring Boot backend (port 8080), giúp tránh CORS khi develop. Dù Backend đã config CORS cho `*`, việc dùng proxy vẫn là best practice cho production.

#### [MODIFY] [next.config.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/next.config.ts)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
```

---

### Component 2: TypeScript Types / Interfaces (khớp 100% với Java)

Tạo thư mục `types/` tại root project, với các file tổ chức theo module, khớp chính xác với Java Entity/DTO.

#### [NEW] [api.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/types/api.ts)

- Generic `ApiResponse<T>` matching Java `ApiResponse<T>` (success, message, data, timestamp)
- Base types (`BaseEntity` fields: createdAt, updatedAt, createdBy, updatedBy)

#### [NEW] [auth.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/types/auth.ts)

- `LoginRequest` (email, password)
- `RegisterRequest` (firstName, lastName, email, password)
- `RefreshTokenRequest` (refreshToken)
- `LogoutRequest` (refreshToken)
- `AuthenticationResponse` (access_token, refresh_token, token_type, expires_in, user)
- `UserInfoResponse` (id, email, full_name, role, permissions)

#### [NEW] [user.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/types/user.ts)

- `UserStatus` enum (ACTIVE, LOCKED, PENDING)
- `Permission` enum (40+ values matching Java)
- `User`, `Role`, `UserProfile`, `UserSecuritySettings`

#### [NEW] [wallet.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/types/wallet.ts)

- `PaymentProvider` enum
- `TransactionType`, `TransactionStatus` enums
- `ReferenceType` enum
- `Wallet` interface (id, userId, balance, pendingBalance, debtBalance, version)
- `Transaction` interface (full fields matching Java)

#### [NEW] [request.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/types/request.ts)

- `RequestType` enum (ADVANCE, EXPENSE, REIMBURSE, **PROJECT_TOPUP**, DEPARTMENT_TOPUP)
- `RequestStatus` enum (**PENDING**, **PENDING_ACCOUNTANT_EXECUTION**, APPROVED, PAID, REJECTED, CANCELLED) — Absolute Delegation, không Escalation
- `RequestAction` enum (APPROVE, REJECT — **không còn ESCALATE**)
- `RequestHistoryStatus` enum
- `Request`, `RequestHistory`, `RequestAttachment` interfaces

#### [NEW] [project.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/types/project.ts)

- `ProjectStatus`, `PhaseStatus` enums
- `Project`, `ProjectPhase`, `ProjectMember` interfaces

#### [NEW] [accounting.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/types/accounting.ts)

- `PayrollStatus`, `PayslipStatus` enums
- `PayrollPeriod`, `Payslip`, `SystemFund` interfaces

#### [NEW] [organization.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/types/organization.ts)

- `Department` interface

#### [NEW] [notification.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/types/notification.ts)

- `NotificationType` enum
- `Notification` interface

#### [NEW] [audit.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/types/audit.ts)

- `AuditAction` enum
- `AuditLog` interface

#### [NEW] [index.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/types/index.ts)

- Re-export tất cả types từ các file above

---

### Component 3: API Client & Token Management

#### [NEW] [api-client.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/lib/api-client.ts)

- Centralized fetch wrapper với:
  - Auto-attach `Authorization: Bearer <token>` header
  - Auto refresh token khi nhận 401
  - Parse `ApiResponse<T>` wrapper
  - Error handling

#### [NEW] [auth.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/lib/auth.ts)

- Token storage/retrieval (localStorage hoặc cookie)
- Login, logout, refresh token helper functions
- `getAuthHeaders()` utility

#### [NEW] [middleware.ts](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/middleware.ts)

- Next.js Middleware để kiểm tra JWT token
- Redirect `/login` nếu chưa authenticated
- Bảo vệ các route `/dashboard/**`, `/wallet/**`, `/requests/**`, etc.
- Public routes: `/login`, `/register`

---

### Component 4: App Router Directory Structure

Thiết kế directory structure dựa trên Backend modules và RBAC permissions:

```
app/
├── (auth)/                          # Auth Layout Group (no sidebar)
│   ├── login/page.tsx               # Client Component - Login form
│   └── register/page.tsx            # Client Component - Register form
├── (dashboard)/                     # Dashboard Layout Group (with sidebar)
│   ├── layout.tsx                   # Server Component - Sidebar + Header
│   ├── dashboard/page.tsx           # Server Component - Overview dashboard
│   ├── wallet/
│   │   ├── page.tsx                 # Server Component - Wallet overview
│   │   ├── deposit/page.tsx         # Client Component - Deposit form
│   │   ├── withdraw/page.tsx        # Client Component - Withdraw form
│   │   └── transactions/page.tsx    # Server Component - Transaction history
│   ├── requests/
│   │   ├── page.tsx                 # Server Component - List requests
│   │   ├── new/page.tsx             # Client Component - Create request form
│   │   └── [id]/page.tsx            # Server Component - Request detail
│   ├── projects/
│   │   ├── page.tsx                 # Server Component - List projects
│   │   └── [id]/page.tsx            # Server Component - Project detail
│   ├── payroll/
│   │   ├── page.tsx                 # Server Component - Payroll periods
│   │   └── [id]/page.tsx            # Server Component - Payslip detail
│   ├── admin/
│   │   ├── users/page.tsx           # Server Component - User management
│   │   ├── roles/page.tsx           # Server Component - Role/Permission management
│   │   ├── departments/page.tsx     # Server Component - Department management
│   │   ├── system-fund/page.tsx     # Server Component - System fund overview
│   │   ├── settings/page.tsx        # Client Component - System config
│   │   └── audit-logs/page.tsx      # Server Component - Audit logs
│   └── notifications/page.tsx       # Server Component - Notifications
```

#### Tạo file cụ thể:

##### Auth Pages

- [NEW] `app/(auth)/layout.tsx` - Auth-only layout (centered, no sidebar)
- [NEW] `app/(auth)/login/page.tsx` - Login form (Client Component)
- [NEW] `app/(auth)/register/page.tsx` - Register form (Client Component)

##### Dashboard Layout & Main Pages

- [NEW] `app/(dashboard)/layout.tsx` - Dashboard layout with sidebar + header (Server Component)
- [NEW] `app/(dashboard)/dashboard/page.tsx` - Main dashboard overview

##### Wallet Module

- [NEW] `app/(dashboard)/wallet/page.tsx` - Wallet overview (balance, pending, debt)
- [NEW] `app/(dashboard)/wallet/deposit/page.tsx` - Deposit form
- [NEW] `app/(dashboard)/wallet/withdraw/page.tsx` - Withdraw form
- [NEW] `app/(dashboard)/wallet/transactions/page.tsx` - Transaction history

##### Requests Module

- [NEW] `app/(dashboard)/requests/page.tsx` - Request list
- [NEW] `app/(dashboard)/requests/new/page.tsx` - Create new request
- [NEW] `app/(dashboard)/requests/[id]/page.tsx` - Request detail + approval flow

##### Projects Module

- [NEW] `app/(dashboard)/projects/page.tsx` - Project list
- [NEW] `app/(dashboard)/projects/[id]/page.tsx` - Project detail with phases

##### Payroll Module

- [NEW] `app/(dashboard)/payroll/page.tsx` - Payroll periods list
- [NEW] `app/(dashboard)/payroll/[id]/page.tsx` - Payslip detail

##### Admin Module

- [NEW] `app/(dashboard)/admin/users/page.tsx` - User management
- [NEW] `app/(dashboard)/admin/roles/page.tsx` - Role & permission management
- [NEW] `app/(dashboard)/admin/departments/page.tsx` - Department management
- [NEW] `app/(dashboard)/admin/system-fund/page.tsx` - System fund management
- [NEW] `app/(dashboard)/admin/settings/page.tsx` - System config
- [NEW] `app/(dashboard)/admin/audit-logs/page.tsx` - Audit log viewer

##### Notifications

- [NEW] `app/(dashboard)/notifications/page.tsx` - Notification list

> [!NOTE]
> **Server vs Client Component Strategy:**
>
> - **Server Components** (default): Dùng cho các trang HIỂN THỊ dữ liệu (list, detail, dashboard) - fetch data trên server, bảo mật token
> - **Client Components** (`"use client"`): Dùng cho các trang CẦN TƯƠNG TÁC (login form, deposit/withdraw form, create request form) - cần `useState`, `useEffect`, event handlers

---

### Component 5: Auth Context & Wallet State Management

#### [NEW] [auth-context.tsx](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/contexts/auth-context.tsx)

- React Context cho auth state (user info, permissions, token)
- `useAuth()` hook
- Permission checking utility: `hasPermission(permission: Permission)`

#### [NEW] [wallet-context.tsx](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/contexts/wallet-context.tsx)

- React Context cho wallet balance state (real-time cập nhật)
- `useWallet()` hook
- Auto-refresh balance sau mỗi giao dịch
- Optimistic update pattern cho UX mượt

---

### Component 6: Documentation Files

#### [NEW] [PROJECT_STRUCTURE.md](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/PROJECT_STRUCTURE.md)

- Giải thích ý nghĩa TỪNG thư mục/file quan trọng
- Sơ đồ cây thư mục
- Quy ước đặt tên và tổ chức code

#### [NEW] [FLOW.md](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/FLOW.md)

- Luồng dữ liệu (Data Flow): User → UI → Next.js → Spring Boot → Response
- Mermaid diagrams cho auth flow, request flow, wallet flow
- Server Component vs Client Component data fetching patterns

#### [NEW] [API_CONTRACT.md](file:///d:/HK6%20UIT/DA1/financial-wallet-frontend/API_CONTRACT.md)

- Danh sách ALL API endpoints (existing + planned)
- Request/Response types cho mỗi endpoint
- Authentication requirements
- Error response format

---

## Verification Plan

### Automated Tests

1. **TypeScript Compilation Check:**

   ```
   cd "d:\HK6 UIT\DA1\financial-wallet-frontend"
   npx tsc --noEmit
   ```

   Verify tất cả type files compile thành công, không có type errors.

2. **Next.js Build Check:**
   ```
   cd "d:\HK6 UIT\DA1\financial-wallet-frontend"
   npm run build
   ```
   Verify project builds thành công, tất cả pages render được.

### Manual Verification

> Sau khi implement xong, bạn hãy kiểm tra:
>
> 1. **Start cả 2 servers** (Spring Boot port 8080 + Next.js dev server port 3000)
> 2. **Truy cập** `http://localhost:3000/login` → Phải redirect đúng layout auth (không sidebar)
> 3. **Truy cập** `http://localhost:3000/dashboard` → Nếu chưa login phải redirect về `/login`
> 4. **Login** với valid credentials → Phải redirect về `/dashboard` với sidebar
> 5. **Kiểm tra proxy** bằng cách mở DevTools Network tab, gọi API login → URL phải là `/api/v1/auth/login` (không phải `localhost:8080`)
