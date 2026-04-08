# CODEX Prompts — Tier 4: ADMIN

> **Sprint**: 2, 6 (User/Dept APIs Sprint 2 — có thể ready; Approvals/Settings/Audit Sprint 6 — chưa ready)
> **Role**: `ADMIN`
> **Business**: Duyệt Flow 3 (QUOTA_TOPUP từ Manager), CRUD users, CRUD departments, xem system fund, cấu hình hệ thống, audit logs
>
> ⚠️ Design ref `d:\src` Admin page duyệt Flow 2 (sai). Thực tế Admin chỉ duyệt **QUOTA_TOPUP** (Flow 3).

---

## Quy ước bắt buộc (giống Tier 2, 3)

- Types: `@/types` barrel only | API: `api` từ `@/lib/api-client`
- `"use client"` ở đầu file | Tailwind v4 | inline SVG | UI text tiếng Việt
- Mock-first với comment API thật + `// TODO: Replace when Sprint N is complete`
- `use(params)` cho dynamic routes | URL search params cho filter
- `npm run lint` — 0 errors

---

## Prompt 0 — Admin Dashboard

### 🎯 Mục tiêu
Replace stub `components/dashboard/admin-dashboard.tsx` với dashboard tổng quan hệ thống: KPI cards (users/depts/system fund/pending approvals), recent audit events, system fund health.

### 📁 Target file
`components/dashboard/admin-dashboard.tsx`

### 🎨 Design reference
`d:\src\components\pages\admin-dashboard-page.tsx` — system overview layout, fund health card, user stats

### 📦 Types
```typescript
import {
  AdminDashboardResponse, AdminApprovalListItem, RequestType, RequestStatus,
} from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/approvals?limit=3` | Sprint 6 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 6 is complete
const MOCK_DASHBOARD: AdminDashboardResponse = {
  totalUsers: 24,
  totalDepartments: 4,
  totalWalletBalance: 1_248_500_000,
  recentAuditEvents: [
    { id: 1, actorName: "Lê Văn Cường", action: "DISBURSEMENT_PAID", entityName: "REQ-2026-0041", createdAt: "2026-04-03T11:00:00" },
    { id: 2, actorName: "Trần Thị Bích", action: "PROJECT_APPROVED", entityName: "PRJ-IT-001", createdAt: "2026-04-03T10:30:00" },
    { id: 3, actorName: "Phạm Thị Thanh Hà", action: "USER_CREATED", entityName: "EMP006", createdAt: "2026-04-03T09:00:00" },
    { id: 4, actorName: "Lê Văn Cường", action: "PAYROLL_RUN", entityName: "PR-2026-03", createdAt: "2026-04-02T17:00:00" },
  ],
};

const MOCK_PENDING: AdminApprovalListItem[] = [
  {
    id: 20, requestCode: "REQ-2026-0060", type: RequestType.QUOTA_TOPUP,
    status: RequestStatus.PENDING_APPROVAL, amount: 200_000_000,
    description: "Xin cấp thêm quota ngân sách cho phòng IT Q2/2026",
    requester: { id: 5, fullName: "Trần Thị Bích", avatar: null, employeeCode: "MGR001", jobTitle: "Manager IT", email: "manager.it@ifms.vn" },
    department: { id: 1, name: "Phòng Công nghệ thông tin" },
    currentDeptBudget: 800_000_000, availableDeptBudget: 80_000_000,
    createdAt: "2026-04-02T09:00:00",
  },
];
```

### 🖥️ UI layout
1. **Header**: "Quản trị hệ thống" + role badge "Admin"
2. **Stat row (4 cards)**:
   - Tổng người dùng: `totalUsers` — link `/admin/users`
   - Phòng ban: `totalDepartments` — link `/admin/departments`
   - Tổng số dư ví: `totalWalletBalance` VND — màu blue — link `/admin/system-fund`
   - Chờ duyệt: pending count — màu amber — link `/admin/approvals`
3. **2-col layout**:
   - Left: "Yêu cầu QUOTA_TOPUP chờ duyệt" — list pending approvals
   - Right: "Nhật ký hoạt động gần đây" — `recentAuditEvents` list (action + actorName + entityName + time-ago)
4. **Quick links**: Quản lý nhân sự | Phòng ban | Nhật ký | Cấu hình hệ thống

---

## Prompt 1 — Admin Approvals List (Flow 3 — QUOTA_TOPUP)

### 🎯 Mục tiêu
Page `/admin/approvals`: danh sách **QUOTA_TOPUP** từ Managers chờ Admin duyệt (Flow 3). Approve → system fund → dept fund (auto PAID). Từ chối → rejected.

### 📁 Target file
`app/(dashboard)/admin/approvals/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\admin-approvals-page.tsx` — list layout, bulk selection (TÙY CHỌN), badges

### ⚠️ Business rules
- Chỉ `type = QUOTA_TOPUP` + `status = PENDING_APPROVAL`
- Sau approve: System Fund → Dept Fund (auto, không qua Accountant)
- Hiện tại System Fund balance để Admin cân nhắc khi duyệt

### 📦 Types
```typescript
import {
  AdminApprovalListItem, AdminApprovalFilterParams,
  PaginatedResponse, RequestType, RequestStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/approvals` | Sprint 6 |
| Query params | `search`, `page`, `limit=10` | |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 6 is complete
const MOCK_APPROVALS: AdminApprovalListItem[] = [
  {
    id: 20, requestCode: "REQ-2026-0060", type: RequestType.QUOTA_TOPUP,
    status: RequestStatus.PENDING_APPROVAL, amount: 200_000_000,
    description: "Xin cấp thêm quota ngân sách cho phòng IT Q2/2026 — mở rộng headcount + infrastructure",
    requester: { id: 5, fullName: "Trần Thị Bích", avatar: null, employeeCode: "MGR001", jobTitle: "Manager IT", email: "manager.it@ifms.vn" },
    department: { id: 1, name: "Phòng Công nghệ thông tin" },
    currentDeptBudget: 800_000_000, availableDeptBudget: 80_000_000,
    createdAt: "2026-04-02T09:00:00",
  },
  {
    id: 21, requestCode: "REQ-2026-0055", type: RequestType.QUOTA_TOPUP,
    status: RequestStatus.PENDING_APPROVAL, amount: 100_000_000,
    description: "Bổ sung ngân sách phòng Sales cho chiến dịch Q2",
    requester: { id: 6, fullName: "Nguyễn Văn Tùng", avatar: null, employeeCode: "MGR002", jobTitle: "Manager Sales", email: "manager.sales@ifms.vn" },
    department: { id: 2, name: "Phòng Kinh doanh" },
    currentDeptBudget: 400_000_000, availableDeptBudget: 35_000_000,
    createdAt: "2026-04-01T11:00:00",
  },
];
```

### 🖥️ UI layout
1. **Header**: "Duyệt cấp quota ngân sách" + badge số lượng
2. **Info banner** (blue): "Phê duyệt → Tự động chuyển từ Quỹ hệ thống → Quỹ phòng ban. Kiểm tra System Fund trước khi duyệt."
3. **System fund quick info**: "Quỹ hệ thống khả dụng: X VND" (nhỏ, ở banner)
4. **Search** + card list:
   - requestCode + badge "Cấp quota" + department.name
   - requester.fullName + jobTitle
   - currentDeptBudget (hiện tại) + amount (xin thêm) + sau khi duyệt (availableDeptBudget + amount)
   - description + createdAt
   - Nút "Xem chi tiết →"
5. **Empty state** + pagination

---

## Prompt 2 — Admin Approval Detail + Duyệt/Từ chối (Flow 3)

### 🎯 Mục tiêu
Page `/admin/approvals/[id]`: chi tiết QUOTA_TOPUP — thông tin phòng ban, system fund impact, approve/reject với confirmation. Redirect sau action.

### 📁 Target file
`app/(dashboard)/admin/approvals/[id]/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\admin-approvals-page.tsx` — ReviewSheet detail, ApprovalTimeline (simplified — Flow 3 chỉ có 2 steps: Manager submit → Admin approve)

### 📦 Types
```typescript
import {
  AdminApprovalDetailResponse, AdminApproveBody, AdminRejectBody,
  AdminApproveResponse, AdminRejectResponse, RequestStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
import { use } from "react";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/approvals/:id` | Sprint 6 |
| POST | `/api/v1/admin/approvals/:id/approve` | Sprint 6 |
| POST | `/api/v1/admin/approvals/:id/reject` | Sprint 6 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 6 is complete
const MOCK_DETAIL: AdminApprovalDetailResponse = {
  id: 20, requestCode: "REQ-2026-0060", type: RequestType.QUOTA_TOPUP,
  status: RequestStatus.PENDING_APPROVAL, amount: 200_000_000,
  approvedAmount: null, rejectReason: null,
  description: "Xin cấp thêm quota ngân sách cho phòng IT Q2/2026. Lý do: mở rộng team thêm 3 headcount + nâng cấp infrastructure cloud.",
  requester: { id: 5, fullName: "Trần Thị Bích", avatar: null, employeeCode: "MGR001", jobTitle: "Manager IT", email: "manager.it@ifms.vn" },
  department: { id: 1, name: "Phòng Công nghệ thông tin", currentQuota: 800_000_000, availableBudget: 80_000_000 },
  systemFundBalance: 1_248_500_000,
  createdAt: "2026-04-02T09:00:00", timeline: [],
};
```

### 🖥️ UI layout
1. **Breadcrumb** + header (requestCode, badge "Cấp quota", amount, status)
2. **Flow 3 impact card** (blue):
   - Quỹ hệ thống hiện tại: `systemFundBalance` VND
   - Sau phê duyệt: `systemFundBalance - amount` VND
   - Quỹ phòng ban `department.name` sau phê duyệt: `availableBudget + amount` VND
   - Cảnh báo đỏ nếu amount > systemFundBalance
3. **Requester + department info**
4. **Description + timeline** (simplified: Submitted by Manager → Pending Admin)
5. **Action bar** (chỉ khi PENDING_APPROVAL): Duyệt + Từ chối
6. **Approve modal**: confirm approvedAmount (default = amount) + comment
7. **Reject modal**: required reason + suggestion chips

---

## Prompt 3 — Admin Users List + Create User

### 🎯 Mục tiêu
Page `/admin/users`: CRUD users. Danh sách với filter (role/status/search). Tạo user mới (gửi email onboarding tự động). Lock/unlock user.

### 📁 Target file
`app/(dashboard)/admin/users/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\admin-users-page.tsx` — data table, create modal, lock/unlock actions

### ⚠️ Business rules
- `POST /admin/users` → backend tự tạo password tạm + `isFirstLogin=true` + gửi email onboarding
- Không có "delete user" — chỉ lock/unlock
- `UserStatus`: ACTIVE | LOCKED | PENDING (chưa đổi pass lần đầu)

### 📦 Types
```typescript
import {
  AdminUserListItem, AdminUserFilterParams, CreateUserBody,
  LockUserResponse, UnlockUserResponse,
  PaginatedResponse, RoleName, UserStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/users` | Sprint 2 |
| POST | `/api/v1/admin/users` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/lock` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/unlock` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/reset-password` | Sprint 2 |
| GET | `/api/v1/admin/departments` (dropdown) | Sprint 2 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 2 is complete
const MOCK_USERS: AdminUserListItem[] = [
  { id: 4, fullName: "Hoàng Minh Tuấn", email: "tl.it@ifms.vn", employeeCode: "TL001", avatar: null, role: RoleName.TEAM_LEADER, status: "ACTIVE", departmentName: "Phòng IT", createdAt: "2026-01-05T08:00:00" },
  { id: 5, fullName: "Trần Thị Bích", email: "manager.it@ifms.vn", employeeCode: "MGR001", avatar: null, role: RoleName.MANAGER, status: "ACTIVE", departmentName: "Phòng IT", createdAt: "2026-01-04T08:00:00" },
  { id: 7, fullName: "Lê Văn Cường", email: "accountant@ifms.vn", employeeCode: "ACC001", avatar: null, role: RoleName.ACCOUNTANT, status: "ACTIVE", departmentName: "Phòng Tài chính", createdAt: "2026-01-03T08:00:00" },
  { id: 11, fullName: "Đỗ Quốc Bảo", email: "emp.it1@ifms.vn", employeeCode: "EMP001", avatar: null, role: RoleName.EMPLOYEE, status: "ACTIVE", departmentName: "Phòng IT", createdAt: "2026-01-10T08:00:00" },
  { id: 12, fullName: "Vũ Thị Lan", email: "emp.it2@ifms.vn", employeeCode: "EMP002", avatar: null, role: RoleName.EMPLOYEE, status: "ACTIVE", departmentName: "Phòng IT", createdAt: "2026-01-10T08:00:00" },
  { id: 13, fullName: "Phạm Văn Đức", email: "emp.sales1@ifms.vn", employeeCode: "EMP003", avatar: null, role: RoleName.EMPLOYEE, status: "LOCKED", departmentName: "Phòng Kinh doanh", createdAt: "2026-01-15T08:00:00" },
];
```

### 🖥️ UI layout
1. **Header**: "Quản lý nhân sự" + badge tổng + nút "Tạo người dùng" (primary)
2. **Filter bar**: Role select (Tất cả / EMPLOYEE / TEAM_LEADER / MANAGER / ACCOUNTANT / ADMIN) + Status select (Tất cả / ACTIVE / LOCKED / PENDING) + search input
3. **Table** (thay vì grid — dữ liệu dạng bảng tốt hơn):
   - Cột: Avatar+Name | employeeCode | Email | Vai trò | Phòng ban | Trạng thái | Ngày tạo | Hành động
   - Status badge: ACTIVE=emerald, LOCKED=rose, PENDING=amber
   - Role badge: màu theo từng role
   - Hành động: "Chi tiết" | (nếu ACTIVE → "Khóa") | (nếu LOCKED → "Mở khóa") | "Reset pass"
4. **Create User Modal**:
   - Input: Họ và tên (required)
   - Input: Email (required, unique)
   - Input: Mã nhân viên (required, unique)
   - Select: Vai trò (required) — options: EMPLOYEE | TEAM_LEADER | MANAGER | ACCOUNTANT
   - Select: Phòng ban (required) — load `GET /admin/departments`
   - Info banner: "Hệ thống sẽ tự tạo mật khẩu tạm và gửi email onboarding"
5. **Lock/Unlock/Reset**: confirm dialog trước khi thực hiện
6. **Pagination**

---

## Prompt 4 — Admin User Detail + Edit

### 🎯 Mục tiêu
Page `/admin/users/[id]`: xem đầy đủ thông tin user, ví, lịch sử. Có thể sửa thông tin cơ bản và đổi role/dept.

### 📁 Target file
`app/(dashboard)/admin/users/[id]/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\admin-users-page.tsx` — user detail panel/sheet section

### 📦 Types
```typescript
import {
  AdminUserDetailResponse, UpdateUserBody, RoleName,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
import { use } from "react";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/users/:id` | Sprint 2 |
| PUT | `/api/v1/admin/users/:id` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/lock` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/unlock` | Sprint 2 |
| POST | `/api/v1/admin/users/:id/reset-password` | Sprint 2 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 2 is complete
const MOCK_USER: AdminUserDetailResponse = {
  id: 11, fullName: "Đỗ Quốc Bảo", email: "emp.it1@ifms.vn",
  employeeCode: "EMP001", avatar: null, jobTitle: "Frontend Developer",
  phoneNumber: "0901234567", role: RoleName.EMPLOYEE, status: "ACTIVE",
  departmentId: 1, departmentName: "Phòng Công nghệ thông tin",
  isFirstLogin: false, createdAt: "2026-01-10T08:00:00",
  walletBalance: 15_500_000, debtBalance: 2_500_000,
};
```

### 🖥️ UI layout
1. **Breadcrumb**: "Nhân sự" → `/admin/users` / `{fullName}`
2. **Profile header**: avatar placeholder (lớn, initials) + fullName + role badge + status badge
3. **Info grid 2-col**: employeeCode | email | jobTitle | phone | department | createdAt | isFirstLogin
4. **Wallet info card**: balance VND + debtBalance VND
5. **Action buttons**: Sửa thông tin | Lock/Unlock | Reset mật khẩu (với confirm dialogs)
6. **Edit Modal**: sửa fullName, jobTitle, phoneNumber, role, departmentId

---

## Prompt 5 — Admin Departments (List + CRUD)

### 🎯 Mục tiêu
Page `/admin/departments`: CRUD phòng ban. Danh sách + tạo mới + sửa. Click row → `/admin/departments/[id]` xem chi tiết thành viên.

### 📁 Target file
`app/(dashboard)/admin/departments/page.tsx` (và `[id]/page.tsx`)

### 🎨 Design reference
`d:\src\components\pages\department-page.tsx` — department overview card

### 📦 Types
```typescript
import {
  DepartmentListItem, DepartmentDetailResponse, DepartmentMemberItem,
  CreateDepartmentBody, UpdateDepartmentBody, PaginatedResponse,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/departments` | Sprint 2 |
| POST | `/api/v1/admin/departments` | Sprint 2 |
| GET | `/api/v1/admin/departments/:id` | Sprint 2 |
| PUT | `/api/v1/admin/departments/:id` | Sprint 2 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 2 is complete
const MOCK_DEPARTMENTS: DepartmentListItem[] = [
  { id: 1, name: "Phòng Công nghệ thông tin", code: "IT", memberCount: 8, managerId: 5, managerName: "Trần Thị Bích", createdAt: "2026-01-01T08:00:00" },
  { id: 2, name: "Phòng Kinh doanh", code: "SALES", memberCount: 6, managerId: 6, managerName: "Nguyễn Văn Tùng", createdAt: "2026-01-01T08:00:00" },
  { id: 3, name: "Phòng Tài chính", code: "FIN", memberCount: 4, managerId: null, managerName: null, createdAt: "2026-01-01T08:00:00" },
  { id: 4, name: "Ban Giám đốc", code: "BGD", memberCount: 2, managerId: null, managerName: null, createdAt: "2026-01-01T08:00:00" },
];
```

### 🖥️ UI layout (List page)
1. **Header**: "Phòng ban" + badge + nút "Tạo phòng ban"
2. **Cards grid (2-3 col)**: name + code + memberCount + managerName + nút Sửa + click → detail
3. **Create Modal**: name (required) + code (required, unique uppercase) + description (optional)
4. **Edit Modal**: sửa name + description

### 🖥️ UI layout ([id] detail page)
1. Dept name + code + managerName
2. Member list: avatar + fullName + role + status
3. Back button

---

## Prompt 6 — Admin System Fund

### 🎯 Mục tiêu
Page `/admin/system-fund`: xem tổng quan System Fund (Tier 1) — balance tổng, inflow/outflow, lịch sử nạp tiền, quỹ từng phòng ban.

### 📁 Target file
`app/(dashboard)/admin/system-fund/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\accountant-finance-dashboard-page.tsx` — SystemFundWidget, fund health bar

### ⚠️ Business rules
- System Fund là Tier 1 trong 4-tier fund structure
- Chỉ xem — Accountant mới nạp tiền vào System Fund
- Lấy data từ `/accountant/ledger/summary` (Accountant cũng có access route này)

### 📦 Types
```typescript
import { SystemFund, LedgerSummaryResponse } from "@/types";
import { api } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/accountant/ledger/summary` | Sprint 7 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 7 is complete
const MOCK_FUND: SystemFund = {
  id: 1, totalBalance: 1_248_500_000, reservedBalance: 0, availableBalance: 1_248_500_000,
};
const MOCK_SUMMARY: LedgerSummaryResponse = {
  totalInflow: 2_500_000_000, totalOutflow: 1_251_500_000,
  netFlow: 1_248_500_000, periodLabel: "Tất cả thời gian",
};
```

### 🖥️ UI layout
1. **Header**: "Quỹ hệ thống" + subtitle "Tier 1 — nguồn gốc toàn bộ dòng tiền"
2. **Fund health card** (lớn): totalBalance VND + health badge (HEALTHY nếu > 500M, LOW nếu 100-500M, CRITICAL nếu < 100M)
3. **Stats row**: Tổng nạp vào (inflow) | Tổng chi ra (outflow) | Số dư ròng
4. **Info**: "Để nạp tiền vào Quỹ hệ thống: liên hệ Kế toán tại /accountant/disbursements"
5. **Dept budgets table**: tên phòng ban | quota được cấp | đã dùng | còn lại | burn %

---

## Prompt 7 — Admin System Settings

### 🎯 Mục tiêu
Page `/admin/settings`: xem và cập nhật cấu hình hệ thống (PIN length, max retry, OTP TTL, mail settings...).

### 📁 Target file
`app/(dashboard)/admin/settings/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\admin-settings-page.tsx` — settings sections, inline edit

### 📦 Types
```typescript
import {
  SystemConfigItem, SystemSettingsResponse, UpdateSettingsBody,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/settings` | Sprint 6 |
| PUT | `/api/v1/admin/settings` | Sprint 6 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 6 is complete
const MOCK_SETTINGS: SystemSettingsResponse = {
  configs: [
    { key: "PIN_LENGTH", value: "5", description: "Độ dài mã PIN", category: "SECURITY" },
    { key: "PIN_MAX_RETRY", value: "5", description: "Số lần nhập PIN sai tối đa", category: "SECURITY" },
    { key: "PIN_LOCK_MINUTES", value: "30", description: "Thời gian khóa sau khi nhập sai (phút)", category: "SECURITY" },
    { key: "OTP_TTL_MS", value: "300000", description: "Thời hạn OTP (ms)", category: "MAIL" },
    { key: "JWT_EXPIRATION", value: "1800000", description: "Thời hạn Access Token (ms)", category: "SECURITY" },
    { key: "CACHE_TTL_MS", value: "3600000", description: "TTL cache Redis (ms)", category: "SYSTEM" },
    { key: "MAX_FILE_SIZE_MB", value: "10", description: "Kích thước file upload tối đa (MB)", category: "SYSTEM" },
  ],
};
```

### 🖥️ UI layout
1. **Header**: "Cấu hình hệ thống" + badge "Chỉ Admin"
2. **Settings grouped by category** (SECURITY | MAIL | SYSTEM):
   - Mỗi nhóm: heading + list items
   - Mỗi item: key (mono, slate) | description | value (có thể edit inline)
   - Edit mode: click "Sửa" → input field → Lưu | Hủy
3. **Save button** (toàn bộ hoặc per-item): PUT với `UpdateSettingsBody`
4. **Warning**: "Thay đổi cấu hình có hiệu lực ngay lập tức. Hãy thận trọng."

---

## Prompt 8 — Admin Audit Logs

### 🎯 Mục tiêu
Page `/admin/audit-logs`: immutable audit trail — filter theo actor/action/date. Xem chi tiết log entry.

### 📁 Target file
`app/(dashboard)/admin/audit-logs/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\admin-audit-page.tsx` — filter bar, table, detail inspector

### 📦 Types
```typescript
import {
  AuditLogResponse, AuditLogFilterParams, AuditAction, PaginatedResponse,
} from "@/types";
import { api } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/admin/audit` | Sprint 6 |
| Query params | `actor`, `action`, `startDate`, `endDate`, `page`, `limit=20` | |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 6 is complete
const MOCK_LOGS: AuditLogResponse[] = [
  { id: 1, actorId: 7, actorName: "Lê Văn Cường", action: "DISBURSEMENT_PAID", entityType: "REQUEST", entityId: "1", entityName: "REQ-2026-0041", details: "Giải ngân 3,500,000 ₫ cho Đỗ Quốc Bảo", ipAddress: "192.168.1.10", createdAt: "2026-04-03T11:00:00" },
  { id: 2, actorId: 5, actorName: "Trần Thị Bích", action: "PROJECT_TOPUP_APPROVED", entityType: "REQUEST", entityId: "10", entityName: "REQ-2026-0050", details: "Duyệt cấp vốn 50,000,000 ₫ cho PRJ-IT-001", ipAddress: "192.168.1.5", createdAt: "2026-04-03T10:30:00" },
  { id: 3, actorId: 9, actorName: "Phạm Thị Thanh Hà", action: "USER_CREATED", entityType: "USER", entityId: "20", entityName: "emp.new@ifms.vn", details: "Tạo user mới role EMPLOYEE phòng IT", ipAddress: "192.168.1.20", createdAt: "2026-04-03T09:00:00" },
  { id: 4, actorId: 7, actorName: "Lê Văn Cường", action: "PAYROLL_RUN", entityType: "PAYROLL", entityId: "5", entityName: "PR-2026-03", details: "Chạy lương tháng 03/2026 — 12 nhân viên", ipAddress: "192.168.1.10", createdAt: "2026-04-02T17:00:00" },
  { id: 5, actorId: 11, actorName: "Đỗ Quốc Bảo", action: "REQUEST_CREATED", entityType: "REQUEST", entityId: "1", entityName: "REQ-2026-0041", details: "Tạo yêu cầu ADVANCE 3,500,000 ₫", ipAddress: "192.168.1.11", createdAt: "2026-04-03T09:15:00" },
];
```

### 🖥️ UI layout
1. **Header**: "Nhật ký hệ thống" + badge "Chỉ đọc — Immutable"
2. **Filter bar**:
   - Search input: tìm theo actorName / entityName
   - Action select: dropdown các AuditAction values
   - Date range: từ ngày → đến ngày (input type=date)
3. **Table**: actorName | action (badge theo loại) | entityType+entityName | details (truncate) | ipAddress | createdAt
4. **Row click → Detail modal**:
   - Full info: actorName + actorId | action | entity | details (full) | ipAddress | timestamp
5. **Pagination**
6. **Export CSV button** (mock: `console.log("export CSV")`, real: download từ API sau)

### ⚙️ Action badge colors
- `*_CREATED` → blue
- `*_APPROVED` / `*_PAID` → emerald
- `*_REJECTED` / `*_LOCKED` → rose
- `*_UPDATED` → amber
- `LOGIN*` → slate

---

*End of Tier 4 prompts*
