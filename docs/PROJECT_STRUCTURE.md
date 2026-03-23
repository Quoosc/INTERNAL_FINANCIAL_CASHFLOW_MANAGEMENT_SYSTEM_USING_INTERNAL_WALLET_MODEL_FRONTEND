# PROJECT_STRUCTURE.md — Cấu trúc dự án Frontend

## Tổng quan

Dự án sử dụng **Next.js 16** (App Router, TypeScript) kết nối với Backend **Java Spring Boot** (port 8080).

```
financial-wallet-frontend/
├── app/                        # ← App Router (File-based Routing)
│   ├── (auth)/                 # Route Group: Trang không cần sidebar
│   │   ├── layout.tsx          # Layout centered (không sidebar)
│   │   ├── login/page.tsx      # [Client] Form đăng nhập
│   │   └── register/page.tsx   # [Client] Form đăng ký
│   ├── (dashboard)/            # Route Group: Trang yêu cầu đăng nhập
│   │   ├── layout.tsx          # [Client] Layout với Sidebar + Header + Providers
│   │   ├── dashboard/page.tsx  # [Client] Tổng quan (Wallet cards + Quick actions)
│   │   ├── wallet/
│   │   │   ├── page.tsx        # [Client] Số dư ví
│   │   │   ├── deposit/page.tsx    # [Client] Form nạp tiền
│   │   │   ├── withdraw/page.tsx   # [Client] Form rút tiền
│   │   │   └── transactions/page.tsx # [Server] Lịch sử giao dịch
│   │   ├── requests/
│   │   │   ├── page.tsx        # [Server] Danh sách yêu cầu
│   │   │   ├── new/page.tsx    # [Client] Tạo yêu cầu mới
│   │   │   └── [id]/page.tsx   # [Server] Chi tiết yêu cầu
│   │   ├── projects/
│   │   │   ├── page.tsx        # [Server] Danh sách dự án
│   │   │   └── [id]/page.tsx   # [Server] Chi tiết dự án
│   │   ├── payroll/
│   │   │   ├── page.tsx        # [Server] Danh sách kỳ lương
│   │   │   └── [id]/page.tsx   # [Server] Chi tiết phiếu lương
│   │   ├── admin/
│   │   │   ├── users/page.tsx       # [Server] Quản lý nhân sự
│   │   │   ├── roles/page.tsx       # [Server] Vai trò & Quyền hạn
│   │   │   ├── departments/page.tsx # [Server] Phòng ban
│   │   │   ├── system-fund/page.tsx # [Server] Quỹ hệ thống
│   │   │   ├── settings/page.tsx    # [Client] Cấu hình
│   │   │   └── audit-logs/page.tsx  # [Server] Nhật ký
│   │   └── notifications/page.tsx   # [Server] Thông báo
│   ├── layout.tsx              # Root Layout (font, metadata)
│   ├── page.tsx                # Redirect → /dashboard
│   └── globals.css             # TailwindCSS global styles
│
├── types/                      # ← TypeScript Interfaces (khớp Java Entities)
│   ├── api.ts                  # ApiResponse<T>, BaseEntity, PageResponse
│   ├── auth.ts                 # LoginRequest, AuthenticationResponse...
│   ├── user.ts                 # User, Role, Permission (40+ enum values)
│   ├── wallet.ts               # Wallet, Transaction, enums
│   ├── request.ts              # Request, RequestType, RequestStatus...
│   ├── project.ts              # Project, ProjectPhase, ProjectMember
│   ├── accounting.ts           # PayrollPeriod, Payslip, SystemFund
│   ├── organization.ts         # Department
│   ├── notification.ts         # Notification, NotificationType
│   ├── audit.ts                # AuditLog, AuditAction
│   └── index.ts                # Barrel export
│
├── lib/                        # ← Utilities & API Client
│   ├── api-client.ts           # Fetch wrapper (JWT auto-refresh, error handling)
│   └── auth.ts                 # Login/Register/Logout service functions
│
├── contexts/                   # ← React Context Providers
│   ├── auth-context.tsx        # Auth state, useAuth(), hasPermission()
│   └── wallet-context.tsx      # Wallet balance, useWallet(), optimistic update
│
├── middleware.ts               # ← Next.js Middleware (JWT route protection)
├── next.config.ts              # Proxy rewrites → Spring Boot :8080
├── tsconfig.json               # TypeScript config (path alias @/*)
└── package.json
```

## Quy ước quan trọng

| Concept | Quy tắc |
|---------|---------|
| **Server Component** | Mặc định. Dùng cho pages HIỂN THỊ dữ liệu (list, detail) |
| **Client Component** | Thêm `"use client"` ở dòng đầu. Dùng cho pages CẦN TƯƠNG TÁC (form, chart) |
| **Route Group** | `(auth)` và `(dashboard)` không ảnh hưởng URL, chỉ chia layout |
| **Types** | Đặt trong `types/`, import qua `@/types` |
| **API calls** | Dùng `api.get/post/put/delete` từ `@/lib/api-client` |
| **Permission check** | Dùng `useAuth().hasPermission(Permission.XXX)` |

## Mapping Backend ↔ Frontend

| Backend Module | Frontend Route | Mô tả |
|---------------|---------------|-------|
| `auth` | `/login`, `/register` | Đăng nhập, đăng ký |
| `wallet` | `/wallet/*` | Ví, nạp/rút tiền, lịch sử GD |
| `request` | `/requests/*` | Tạm ứng, thanh toán, hoàn ứng |
| `project` | `/projects/*` | Dự án, phase, thành viên |
| `accounting` | `/payroll/*` | Kỳ lương, phiếu lương |
| `user` | `/admin/users` | Quản lý nhân sự |
| `user.Role` | `/admin/roles` | Vai trò & quyền hạn (RBAC) |
| `organization` | `/admin/departments` | Phòng ban, ngân sách |
| `accounting.SystemFund` | `/admin/system-fund` | Quỹ hệ thống |
| `config` | `/admin/settings` | Cấu hình tham số |
| `audit` | `/admin/audit-logs` | Nhật ký hệ thống |
| `notification` | `/notifications` | Thông báo |
