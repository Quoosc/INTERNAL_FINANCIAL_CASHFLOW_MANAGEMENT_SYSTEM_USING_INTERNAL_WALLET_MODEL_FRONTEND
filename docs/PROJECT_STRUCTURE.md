# PROJECT_STRUCTURE.md — Cấu trúc dự án Frontend

> **Cập nhật:** Aligned với filesystem thực tế (types v3.2 — 16 modules, 6 roles)

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
│   │   ├── login/page.tsx           # [Client] Form đăng nhập
│   │   ├── change-password/page.tsx # [Client] First-login setup (1 bước: mật khẩu + PIN)
│   │   └── register/page.tsx        # [Client] Form đăng ký ⚠ orphaned — no backend endpoint
│   │
│   ├── (dashboard)/                 # Route Group: protected, AuthProvider + WalletProvider
│   │   ├── layout.tsx               # [Client] Sidebar + Header + Providers wrapper
│   │   ├── dashboard/page.tsx       # [Client] Tổng quan (wallet cards, quick actions)
│   │   │
│   │   ├── wallet/
│   │   │   ├── page.tsx             # [Client] Số dư ví (dùng useWallet)
│   │   │   ├── deposit/page.tsx     # [Client] Form nạp tiền (QR)
│   │   │   ├── withdraw/page.tsx    # [Client] Form rút tiền (PIN)
│   │   │   └── transactions/page.tsx # [Server] Lịch sử giao dịch (list)
│   │   │
│   │   ├── requests/
│   │   │   ├── page.tsx             # [Server] Danh sách yêu cầu quỹ
│   │   │   ├── new/page.tsx         # [Client] Tạo yêu cầu mới (form)
│   │   │   └── [id]/page.tsx        # [Server] Chi tiết yêu cầu
│   │   │
│   │   ├── projects/
│   │   │   ├── page.tsx             # [Server] Danh sách dự án
│   │   │   └── [id]/page.tsx        # [Server] Chi tiết dự án + phases
│   │   │
│   │   ├── payroll/
│   │   │   ├── page.tsx             # [Server] Danh sách kỳ lương / phiếu lương
│   │   │   └── [id]/page.tsx        # [Server] Chi tiết phiếu lương
│   │   │
│   │   ├── notifications/page.tsx   # [Server] Danh sách thông báo
│   │   │
│   │   └── admin/                   # Chỉ ADMIN và ACCOUNTANT (gated via hasAnyRole)
│   │       ├── users/page.tsx       # [Server] Quản lý nhân sự
│   │       ├── roles/page.tsx       # [Server] Vai trò & quyền hạn
│   │       ├── departments/page.tsx # [Server] Phòng ban & ngân sách
│   │       ├── system-fund/page.tsx # [Server] Quỹ hệ thống
│   │       ├── settings/page.tsx    # [Client] Cấu hình hệ thống
│   │       └── audit-logs/page.tsx  # [Server] Nhật ký kiểm toán
│   │
│   ├── layout.tsx                   # Root layout (html, body, font, globals.css)
│   ├── page.tsx                     # Redirect → /dashboard
│   ├── globals.css                  # Tailwind global styles
│   └── favicon.ico
│
│   ⚠ Flow first-login hiện tại:
│      app/(auth)/change-password/page.tsx   → POST /api/v1/auth/first-login/complete
│      app/(auth)/create-pin/page.tsx        → orphaned (flow đã gộp)
│
├── types/                           # TypeScript DTOs — khớp backend contract v3.1
│   ├── api.ts                       # ApiResponse<T>, PaginatedResponse<T>
│   ├── auth.ts                      # AuthUser, LoginRequest, LoginResponse, RefreshTokenRequest, ...
│   ├── user.ts                      # UserStatus, RoleName, Permission (40+), UserProfileResponse, BankInfo, ...
│   ├── wallet.ts                    # WalletResponse, TransactionResponse, TransactionType, WalletUpdateMessage, ...
│   ├── request.ts                   # RequestType, RequestStatus, RequestAction, RequestListItem, ...
│   ├── project.ts                   # ProjectStatus, ProjectDetailResponse, ProjectPhaseResponse, CreatePhaseBody, ...
│   ├── accounting.ts                # PayrollStatus, PayslipListItem, PayrollDetailResponse, SystemFund, ...
│   ├── organization.ts              # DepartmentListItem, DepartmentDetailResponse, CreateDepartmentBody, ...
│   ├── notification.ts              # NotificationType, NotificationResponse, NotificationListResponse, ...
│   ├── audit.ts                     # AuditAction, AuditLogResponse, AuditLogFilterParams
│   ├── team-leader.ts               # TLProjectListItem, TLApprovalListItem, ApprovalRequester, TLTeamMemberListItem, ...
│   ├── manager.ts                   # ManagerApprovalListItem, ManagerProjectListItem, ManagerDeptMemberListItem, ...
│   ├── accountant.ts                # DisbursementListItem, DisburseBody, AccountantRequestDetailResponse, ...
│   ├── admin.ts                     # AdminUserListItem, AdminApprovalListItem, SystemSettingsResponse, ...
│   ├── dashboard.ts                 # EmployeeDashboardResponse, ManagerDashboardResponse, ...
│   └── index.ts                     # Barrel export — LUÔN import từ đây: import { ... } from "@/types"
│
├── lib/                             # Utilities & API client
│   ├── api-client.ts                # Fetch wrapper: JWT auto-attach, 401 auto-refresh, ApiResponse unwrap, ApiError
│   └── auth.ts                      # login(), logout(), changePasswordFirstLogin(), forgotPassword(), getMe() (+ legacy helpers)
│
├── contexts/                        # React Context providers
│   ├── auth-context.tsx             # useAuth() → { user, hasRole(), hasAnyRole(), isFirstLogin, logout }
│   └── wallet-context.tsx           # useWallet() → { wallet, fetchWallet(), refreshBalance(), optimisticUpdate(), updateFromWS() }
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
| `auth` | `/login`, `/change-password` | `/auth` | `/register` orphaned — no backend endpoint |
| `wallet` | `/wallet/*` | `/wallet` | Ví, nạp tiền (VNPay), rút tiền, lịch sử GD |
| `request` | `/requests/*` | `/requests` | Employee: tạo/xem YC cá nhân (3 flows) |
| `team-leader` | `/team-leader/*` | `/team-leader` | Approvals Flow 1, quản lý project/team |
| `manager` | `/manager/*` | `/manager` | Approvals Flow 2, tạo/quản lý projects |
| `accountant` | `/accountant/*` | `/accountant` | Giải ngân, payroll, sổ cái |
| `cfo` | `/admin/approvals/*` | `/cfo` | Approvals Flow 3 (DEPARTMENT_TOPUP) |
| `project` | `/projects/*` | `/projects` | Read-only view dự án cho mọi role |
| `payslip` | `/payroll/*` | `/payslips` | Employee xem phiếu lương của mình |
| `user` | `/admin/users` | `/admin/users` | Quản lý nhân sự (ADMIN only) |
| `organization` | `/admin/departments` | `/admin/departments` | Phòng ban (ADMIN only) |
| `company-fund` | `/admin/system-fund` | `/company-fund` | Quỹ hệ thống (ACCOUNTANT + CFO) |
| `config` | `/admin/settings` | `/admin/settings` | Cấu hình hệ thống (ADMIN only) |
| `audit` | `/admin/audit-logs` | `/admin/audit` | Nhật ký kiểm toán (ADMIN only) |
| `notification` | `/notifications` | `/notifications` | Thông báo real-time (mọi role) |

---

## Pages chưa implement

| Route | Cần cho | API endpoint |
|---|---|---|
| `app/(auth)/change-password/` | `isFirstLogin = true` flow | `POST /api/v1/auth/first-login/complete` |
| `app/(auth)/create-pin/` | Legacy flow cũ | Orphaned — không dùng trong contract mới |
| `app/(auth)/register/` | Đăng ký mới | Orphaned — không có backend `/auth/register` |
