# CODEX Prompts — Tier 4B: ADMIN

> **Sprint**: 2, 6, 7
> **Role**: `ADMIN`
> **Business**: Quan tri IAM/system: users, departments, settings, audit logs, system dashboard.
>
> Luu y: Flow 3 approvals thuoc CFO, khong nam trong file nay.

---

## Quy uoc bat buoc (giong Tier 2, 3)

- Types: `@/types` barrel only | API: `api` tu `@/lib/api-client`
- `"use client"` o dau file | Tailwind v4 | inline SVG | UI text tieng Viet
- Mock-first voi comment API that + `// TODO: Replace when Sprint N is complete`
- `use(params)` cho dynamic routes | URL search params cho filter
- `npm run lint` — 0 errors

---

## Prompt 0 — Admin Dashboard

### Muc tieu
Replace stub `components/dashboard/admin-dashboard.tsx` voi dashboard tong quan he thong: KPI cards (users/depts/system fund), recent audit events.

### Target file
`components/dashboard/admin-dashboard.tsx`

### Design reference
`d:\src\components\pages\admin-dashboard-page.tsx` — system overview layout, fund health card, user stats

### Types
```typescript
import {
  AdminDashboardResponse, AdminApprovalListItem, RequestType, RequestStatus,
} from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
```

### API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/dashboard` (neu co) | Sprint 6 |
| Fallback | compose tu `/api/v1/admin/users`, `/api/v1/admin/departments`, `/api/v1/admin/audit` | Sprint 2,6 |

### UI layout
1. Header: "Quan tri he thong" + role badge "Admin"
2. Stat row: tong users, tong departments, tong so du vi, recent activity
3. 2-col layout: left metrics + right recent audits
4. Quick links: Nhan su | Phong ban | Nhat ky | Cau hinh

---

## Prompt 1 — Admin Users List + Create User

### Muc tieu
Page `/admin/users`: CRUD users. Danh sach voi filter (role/status/search). Tao user moi (gui email onboarding), lock/unlock.

### Target file
`app/(dashboard)/admin/users/page.tsx`

### Design reference
`d:\src\components\pages\admin-users-page.tsx`

### Business rules
- `POST /admin/users` -> backend tu tao password tam + `isFirstLogin=true` + gui email onboarding
- Khong co delete user -> chi lock/unlock
- `UserStatus`: ACTIVE | LOCKED | PENDING

### Types
```typescript
import {
  AdminUserListItem, AdminUserFilterParams, CreateUserBody,
  LockUserResponse, UnlockUserResponse,
  PaginatedResponse, RoleName, UserStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/users` | Sprint 2 |
| POST | `/api/v1/admin/users` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/lock` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/unlock` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/reset-password` | Sprint 2 |
| GET | `/api/v1/admin/departments` | Sprint 2 |

### UI layout
1. Header + button "Tao nguoi dung"
2. Filter bar role/status/search
3. Data table theo cot
4. Create modal
5. Lock/Unlock/Reset confirm
6. Pagination

---

## Prompt 2 — Admin User Detail + Edit

### Muc tieu
Page `/admin/users/[id]`: xem chi tiet user, wallet info, cap nhat thong tin co ban + role/dept.

### Target file
`app/(dashboard)/admin/users/[id]/page.tsx`

### Types
```typescript
import {
  AdminUserDetailResponse, UpdateUserBody, RoleName,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
import { use } from "react";
```

### API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/users/:id` | Sprint 2 |
| PUT | `/api/v1/admin/users/:id` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/lock` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/unlock` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/reset-password` | Sprint 2 |

### UI layout
1. Profile header + role/status badges
2. Info grid 2-col
3. Wallet info card
4. Action buttons
5. Edit modal

---

## Prompt 3 — Admin Departments (List + CRUD)

### Muc tieu
Page `/admin/departments`: CRUD phong ban. Danh sach + tao moi + sua. Click row -> `/admin/departments/[id]`.

### Target file
`app/(dashboard)/admin/departments/page.tsx` va `app/(dashboard)/admin/departments/[id]/page.tsx`

### Types
```typescript
import {
  DepartmentListItem, DepartmentDetailResponse, DepartmentMemberItem,
  CreateDepartmentBody, UpdateDepartmentBody, PaginatedResponse,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/departments` | Sprint 2 |
| POST | `/api/v1/admin/departments` | Sprint 2 |
| GET | `/api/v1/admin/departments/:id` | Sprint 2 |
| PUT | `/api/v1/admin/departments/:id` | Sprint 2 |

### UI layout
1. Header + tao phong ban
2. Cards/list departments
3. Create/Edit modal
4. Detail page voi member list

---

## Prompt 4 — Admin System Fund

### Muc tieu
Page `/admin/system-fund`: tong quan System Fund (Tier 1): balance, inflow/outflow, fund health.

### Target file
`app/(dashboard)/admin/system-fund/page.tsx`

### Business rules
- System Fund la Tier 1 trong 4-tier fund structure
- Admin chi xem, khong thuc hien disbursement
- Co the dung data tu ledger summary neu backend expose chung

### Types
```typescript
import { SystemFund, LedgerSummaryResponse } from "@/types";
import { api } from "@/lib/api-client";
```

### API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/accountant/ledger/summary` | Sprint 7 |

### UI layout
1. Header + subtitle Tier 1
2. Fund health card
3. Stats row inflow/outflow/net
4. Department budget table

---

## Prompt 5 — Admin System Settings

### Muc tieu
Page `/admin/settings`: xem va cap nhat cau hinh he thong (PIN length, retry, OTP TTL, ...).

### Target file
`app/(dashboard)/admin/settings/page.tsx`

### Types
```typescript
import {
  SystemConfigItem, SystemSettingsResponse, UpdateSettingsBody,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/settings` | Sprint 6 |
| PUT | `/api/v1/admin/settings` | Sprint 6 |

### UI layout
1. Group theo category SECURITY | MAIL | SYSTEM
2. Inline edit value
3. Save + warning thay doi co hieu luc ngay

---

## Prompt 6 — Admin Audit Logs

### Muc tieu
Page `/admin/audit-logs`: immutable audit trail, filter theo actor/action/date, xem chi tiet entry.

### Target file
`app/(dashboard)/admin/audit-logs/page.tsx`

### Types
```typescript
import {
  AuditLogResponse, AuditLogFilterParams, AuditAction, PaginatedResponse,
} from "@/types";
import { api } from "@/lib/api-client";
```

### API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/audit` | Sprint 6 |
| Query params | `actor`, `action`, `startDate`, `endDate`, `page`, `limit=20` | |

### UI layout
1. Header + read-only badge
2. Filter bar
3. Table logs
4. Row detail modal
5. Pagination + export CSV placeholder

---

*End of Tier 4B prompts*