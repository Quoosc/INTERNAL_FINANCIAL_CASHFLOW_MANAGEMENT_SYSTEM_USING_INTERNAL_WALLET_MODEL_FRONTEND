# PROJECT_STRUCTURE.md — Cấu trúc dự án Frontend

> **Cập nhật v3.5 (2026-05-31):** Thêm `app/maintenance/page.tsx` (public 503 page). Thêm `lib/api/analytics.ts`. Cập nhật `types/dashboard.ts` với analytics types. Đánh dấu accountant/payroll + ledger là LIVE.

## Tổng quan

Dự án sử dụng **Next.js 16.1.6** (App Router, TypeScript 5) kết nối với Backend **Java Spring Boot** (port 8080).
Tailwind CSS v4 — cấu hình qua `@tailwindcss/postcss` trong `postcss.config.mjs` (không có `tailwind.config.js`).

---

## Cây thư mục

```
financial-wallet-frontend/
│
├── app/                             # App Router (file-based routing)
│   ├── (auth)/                      # Route Group: public, no sidebar, no providers
│   │   ├── layout.tsx               # [Server] Centered layout
│   │   ├── login/page.tsx           # [Client] Form đăng nhập — handle ?reset=success banner
│   │   ├── change-password/page.tsx # [Client] First-login setup (1 bước: mật khẩu + PIN)
│   │   └── forgot-password/page.tsx # [Client] 2-step: email+MK mới → OTP → redirect /login
│   │
│   ├── (dashboard)/                 # Route Group: protected, AuthProvider + WalletProvider
│   │   ├── layout.tsx               # [Client] Sidebar role-aware + Providers wrapper
│   │   ├── dashboard/page.tsx       # [Client] Dispatcher theo role → component riêng
│   │   │
│   │   ├── wallet/                  # ALL ROLES
│   │   │   ├── page.tsx             # [Client] Số dư ví (dùng useWallet)
│   │   │   ├── deposit/page.tsx     # [Client] Form nạp tiền (VNPay URL)
│   │   │   ├── withdraw/page.tsx    # [Client] Form rút tiền (PIN)
│   │   │   └── transactions/page.tsx # [Client] Lịch sử giao dịch (list)
│   │   │
│   │   ├── requests/                # EMPLOYEE only — "YC của tôi"
│   │   │   ├── page.tsx             # [Client] Danh sách yêu cầu đã tạo
│   │   │   ├── new/page.tsx         # [Client] Tạo yêu cầu mới (ADVANCE/EXPENSE/REIMBURSE)
│   │   │   └── [id]/page.tsx        # [Client] Chi tiết + timeline
│   │   │
│   │   ├── projects/                # ALL ROLES — read-only view
│   │   │   ├── page.tsx             # [Client] Danh sách dự án
│   │   │   └── [id]/page.tsx        # [Client] Chi tiết dự án + phases
│   │   │
│   │   ├── payroll/                 # EMPLOYEE only — "Phiếu lương của tôi"
│   │   │   ├── page.tsx             # [Client] Danh sách payslips
│   │   │   └── [id]/page.tsx        # [Client] Chi tiết phiếu lương
│   │   │
│   │   ├── notifications/page.tsx   # ALL ROLES — [Client] Danh sách thông báo
│   │   │
│   │   ├── team-leader/             # TEAM_LEADER only
│   │   │   ├── approvals/           # Flow 1: duyệt ADVANCE/EXPENSE/REIMBURSE
│   │   │   │   ├── page.tsx         # [Client] Danh sách chờ duyệt
│   │   │   │   └── [id]/page.tsx    # [Client] Chi tiết + approve/reject
│   │   │   ├── projects/            # Quản lý phases, categories, members
│   │   │   │   ├── page.tsx         # [Client]
│   │   │   │   └── [id]/page.tsx    # [Client]
│   │   │   └── team/page.tsx        # [Client] Team members overview
│   │   │
│   │   ├── manager/                 # MANAGER only
│   │   │   ├── approvals/           # Flow 2: duyệt PROJECT_TOPUP
│   │   │   │   ├── page.tsx         # [Client]
│   │   │   │   └── [id]/page.tsx    # [Client]
│   │   │   ├── projects/            # Tạo/sửa dự án phòng ban
│   │   │   │   ├── page.tsx         # [Client]
│   │   │   │   └── [id]/page.tsx    # [Client]
│   │   │   └── department/page.tsx  # [Client] Thành viên phòng ban
│   │   │
│   │   ├── accountant/              # ACCOUNTANT only
│   │   │   ├── disbursements/       # Giải ngân Flow 1 (nhập PIN)
│   │   │   │   ├── page.tsx         # [Client] ✅ LIVE
│   │   │   │   └── [id]/page.tsx    # [Client] ✅ LIVE
│   │   │   ├── withdrawals/page.tsx # [Client] ✅ LIVE — quản lý rút tiền user (execute/reject)
│   │   │   ├── payroll/             # Quản lý bảng lương (import Excel, run)
│   │   │   │   ├── page.tsx         # [Client] ✅ LIVE (Sprint 10)
│   │   │   │   └── [id]/page.tsx    # [Client] ✅ LIVE (Sprint 10)
│   │   │   └── ledger/              # Sổ cái double-entry
│   │   │       ├── page.tsx         # [Client] ✅ LIVE (Sprint 10)
│   │   │       └── [id]/page.tsx    # [Client] ✅ LIVE (Sprint 10)
│   │   │
│   │   ├── cfo/                     # CFO only — quản trị tài chính
│   │   │   ├── approvals/           # Flow 3: duyệt DEPARTMENT_TOPUP
│   │   │   │   ├── page.tsx         # [Client] Danh sách chờ duyệt
│   │   │   │   └── [id]/page.tsx    # [Client] Chi tiết + approve/reject
│   │   │   ├── system-fund/page.tsx # [Client] Quỹ hệ thống (COMPANY_FUND)
│   │   │   ├── settings/page.tsx    # re-export admin/settings (same UI)
│   │   │   └── audit-logs/page.tsx  # re-export admin/audit-logs (same UI)
│   │   │
│   │   └── admin/                   # ADMIN only — IAM & system config
│   │       ├── approvals/           # ⚠ redirect → /dashboard (ADMIN không duyệt tài chính)
│   │       │   ├── page.tsx         # redirect /dashboard
│   │       │   └── [id]/page.tsx    # redirect /dashboard
│   │       ├── users/               # CRUD users
│   │       │   ├── page.tsx         # [Client]
│   │       │   └── [id]/page.tsx    # [Client]
│   │       ├── departments/         # CRUD departments
│   │       │   ├── page.tsx         # [Client]
│   │       │   └── [id]/page.tsx    # [Client]
│   │       ├── roles/page.tsx       # [Client] Vai trò & quyền hạn
│   │       ├── system-fund/page.tsx # [Client] Quỹ hệ thống (view-only cho Admin)
│   │       ├── settings/page.tsx    # [Client] Cấu hình hệ thống
│   │       └── audit-logs/page.tsx  # [Client] Nhật ký kiểm toán
│   │
│   ├── maintenance/
│   │   └── page.tsx                 # [Client] Trang bảo trì — public, hiện khi BE trả 503
│   ├── layout.tsx                   # Root layout (html, body, font, globals.css)
│   ├── page.tsx                     # Redirect → /dashboard
│   ├── globals.css                  # Tailwind global styles
│   └── favicon.ico
│
│   Auth flows:
│      login → change-password (first-login, requiresSetup=true)
│      login → forgot-password (2-step OTP) → login?reset=success
│
├── types/                           # TypeScript DTOs — khớp backend contract v3.1
│   ├── api.ts                       # ApiResponse<T>, PaginatedResponse<T>
│   ├── auth.ts                      # AuthUser, LoginRequest, LoginResponse, RefreshTokenRequest, ...
│   ├── user.ts                      # UserStatus, RoleName, Permission (40+), UserProfileResponse, BankInfo, ...
│   ├── wallet.ts                    # WalletResponse, TransactionResponse, LedgerEntryResponse, TransactionType, WalletUpdatedEvent (SSE), ...
│   ├── request.ts                   # RequestType, RequestStatus, RequestAction, RequestListItem, ...
│   ├── project.ts                   # ProjectStatus, ProjectDetailResponse, ProjectPhaseResponse, CreatePhaseBody, ...
│   ├── accounting.ts                # PayrollStatus, PayslipListItem, PayrollDetailResponse, CompanyFundResponse, LedgerSummaryResponse, ...
│   ├── organization.ts              # DepartmentListItem, DepartmentDetailResponse, CreateDepartmentBody, ...
│   ├── notification.ts              # NotificationType, NotificationResponse, NotificationListResponse, ...
│   ├── audit.ts                     # AuditAction, AuditLogResponse, AuditLogFilterParams
│   ├── team-leader.ts               # TLProjectListItem, TLApprovalListItem, ApprovalRequester, TLTeamMemberListItem, ...
│   ├── manager.ts                   # ManagerApprovalListItem, ManagerProjectListItem, ManagerDeptMemberListItem, ...
│   ├── accountant.ts                # DisbursementListItem, DisburseBody, AccountantRequestDetailResponse, ...
│   ├── admin.ts                     # AdminUserListItem, AdminApprovalListItem, SystemSettingsResponse, ...
│   ├── dashboard.ts                 # EmployeeDashboardResponse, ManagerDashboardResponse, AccountantDashboardResponse, CfoDashboardResponse, AdminDashboardResponse, CashFlowPoint, CashFlowAnalyticsResponse, AdminAnalyticsResponse, SpendingPoint, EmployeeSpendingAnalyticsResponse
│   └── index.ts                     # Barrel export — LUÔN import từ đây: import { ... } from "@/types"
│
├── lib/                             # Utilities & API client
│   ├── api-client.ts                # Fetch wrapper: JWT auto-attach, 401 auto-refresh, ApiResponse unwrap, ApiError
│   ├── auth.ts                      # login(), firstLoginSetup(), logout(), forgotPassword(), verifyPasswordReset(), getMe()
│   ├── api/                         # Named API modules (re-exported via api/index.ts)
│   │   ├── index.ts                 # Barrel: export * from "./withdrawal", "./company-fund", etc.
│   │   ├── withdrawal.ts            # createWithdrawRequest(), getMyWithdrawRequests(), getAllWithdrawRequests(), executeWithdraw(), rejectWithdraw()
│   │   ├── company-fund.ts          # getCompanyFund(), topupCompanyFund(), updateBankStatement(), getReconciliationReport()
│   │   ├── system-config.ts         # getSystemConfigs(), updateSystemConfig(), evictConfigCache()
│   │   ├── notification.ts          # getNotifications(), getUnreadCount(), markRead(), markAllRead()
│   │   ├── payment.ts               # createPayment(), getPaymentStatus(), getMyDeposits()
│   │   └── analytics.ts             # getCashFlowAnalytics(), getAdminAnalytics(), getEmployeeSpendingAnalytics()
│   ├── hooks/
│   │   └── use-user-stream.ts       # SSE hook — 1 connection/session, auto-reconnect
│   ├── adapters/
│   │   ├── pagination.ts            # Helpers chuyển đổi UI page ↔ API page
│   │   ├── request-status.ts        # Map backend RequestStatus → display label/color
│   │   └── team-leader.ts           # Normalize TL approval/project responses
│   ├── mocks/                       # Mock data cho BLOCKED endpoints
│   │   ├── system.ts
│   │   ├── projects.ts
│   │   └── departments.ts
│   ├── format.ts                    # formatCurrency(), formatDateTime(), formatDate()
│   └── schemas.ts                   # Zod schemas (nếu dùng)
│
├── contexts/                        # React Context providers
│   ├── auth-context.tsx             # useAuth() → { user, hasRole(), hasAnyRole(), isFirstLogin, logout }
│   └── wallet-context.tsx           # useWallet() → { wallet, fetchWallet(), refreshBalance(), optimisticUpdate(), updateFromSse() }
│
├── docs/                            # Tài liệu kỹ thuật — source of truth cho specs
│   ├── API_CONTRACT.md              # Tất cả endpoints, request/response types, Sprint status
│   ├── FLOW.md                      # Auth flow, 3 business flows, Server vs Client guide
│   ├── PROJECT_STRUCTURE.md         # File này
│   ├── IMPLEMENTATION_PLAN.md       # Sprint-by-sprint feature plan
│   ├── TODO_IMPROVEMENTS.md         # Known issues và pending improvements
│   ├── USE_CASE_DIAGRAMS.md         # Use case overview
│   └── diagrams/                    # PlantUML source files
│       ├── activity/                # UC-*.puml (activity diagrams)
│       └── sequence/                # UC-*.puml (sequence diagrams)
│
├── public/                          # Static assets (served at /)
│   └── *.svg                        # Default Next.js SVGs (placeholder — chưa có assets thực)
│
├── middleware.ts                    # JWT route guard — kiểm tra cookie "access_token"
├── next.config.ts                   # Proxy rewrites: /api/:path* → localhost:8080/api/:path*
├── postcss.config.mjs               # Tailwind v4 PostCSS config
├── eslint.config.mjs                # ESLint flat config (eslint-config-next)
├── tsconfig.json                    # TypeScript — path alias @/ → repo root
├── next-env.d.ts                    # Next.js type declarations (auto-generated, đừng sửa)
├── .env.local                       # Local env vars (không commit)
├── CLAUDE.md                        # AI coding assistant SOP
├── package.json
└── package-lock.json
```

---

## Quy ước quan trọng

| Concept              | Quy tắc                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Server Component** | Mặc định — không có directive. Dùng cho pages hiển thị dữ liệu (list, detail).                                       |
| **Client Component** | Thêm `"use client"` dòng đầu. Dùng khi cần hook, form, browser event, context.                                       |
| **Route Group**      | `(auth)` và `(dashboard)` không ảnh hưởng URL — chỉ chia layout và providers.                                        |
| **Types**            | Đặt trong `types/`, luôn import qua `@/types` (barrel). Không import từ file con.                                    |
| **API calls**        | Chỉ dùng `api.get/post/put/patch/delete` từ `@/lib/api-client`. Không dùng raw fetch/axios.                          |
| **Role check**       | `useAuth().hasRole(RoleName.ADMIN)` hoặc `useAuth().hasAnyRole([RoleName.CFO, RoleName.ADMIN, RoleName.ACCOUNTANT])` |
| **Styling**          | Tailwind CSS v4 only. Không inline `style={{}}` trừ dynamic values. Không Shadcn (chưa cài).                         |
| **Icons**            | Inline SVG. Nếu cần library: cài `lucide-react`, import riêng lẻ.                                                    |

---

## Mapping Backend ↔ Frontend

| Backend Module | Frontend Route | API prefix | Ghi chú |
|---|---|---|---|
| `auth` | `/login`, `/change-password`, `/forgot-password` | `/auth` | 2-step OTP flow cho forgot-password |
| `wallet` | `/wallet/*` | `/wallet` | Ví, nạp tiền (VNPay), rút tiền, lịch sử GD |
| `request` | `/requests/*` | `/requests` | Employee: tạo/xem YC cá nhân (3 flows) |
| `team-leader` | `/team-leader/*` | `/team-leader` | Approvals Flow 1, quản lý project/team |
| `manager` | `/manager/*` | `/manager` | Approvals Flow 2, tạo/quản lý projects |
| `accountant` | `/accountant/*` | `/accountant` | Giải ngân, payroll, sổ cái |
| `cfo` | `/cfo/*` | `/cfo` | Flow 3 approvals, quỹ hệ thống — KHÔNG dùng `/admin/*` |
| `project` | `/projects/*` | `/projects` | Read-only view dự án cho mọi role |
| `payslip` | `/payroll/*` | `/payslips` | Employee xem phiếu lương của mình |
| `user` | `/admin/users` | `/admin/users` | Quản lý nhân sự (ADMIN only) |
| `organization` | `/admin/departments` | `/admin/departments` | Phòng ban (ADMIN only) |
| `company-fund` | `/cfo/system-fund` (CFO) · `/admin/system-fund` (Admin view) | `/company-fund` | CFO quản lý + nạp quỹ; Admin chỉ xem |
| `config` | `/admin/settings` · `/cfo/settings` (re-export) | `/admin/settings` | Cấu hình hệ thống |
| `audit` | `/admin/audit-logs` · `/cfo/audit-logs` (re-export) | `/admin/audit` | Nhật ký kiểm toán |
| `notification` | `/notifications` | `/notifications` | Thông báo real-time qua SSE — xem §15 API_CONTRACT |
| `user` (SSE) | — (sidebar global) | `/users/stream` | 1 kênh SSE duy nhất cho `wallet.updated` · `transaction.created` · `notification` |

---

## Pages còn BLOCKED (backend chưa implement)

> **Cập nhật 2026-06-01:** Tất cả pages đã được implement. Không còn trang BLOCKED.

| Route | Trạng thái | Ghi chú |
|---|---|---|
| `app/(dashboard)/accountant/payroll/*` | ✅ LIVE | `AccountantPayrollController` — Sprint 10 |
| `app/(dashboard)/accountant/ledger/*` | ✅ LIVE | `AccountantLedgerController` (trong wallet module) — Sprint 10 |
| `app/(dashboard)/dashboard/page.tsx` | ✅ LIVE | `/api/v1/dashboard/*` — Sprint 16 |

> Tất cả orphaned pages (`register`, `create-pin`) đã bị xóa khỏi codebase (2026-04-30).
