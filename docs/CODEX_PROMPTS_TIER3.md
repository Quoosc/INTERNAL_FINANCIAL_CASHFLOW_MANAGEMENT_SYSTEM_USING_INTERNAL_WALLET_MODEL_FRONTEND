# CODEX Prompts — Tier 3: MANAGER

> **Sprint**: 4-5 (APIs chưa sẵn sàng → dùng mock-first pattern)
> **Role**: `MANAGER`
> **Business**: Duyệt Flow 2 (PROJECT_TOPUP từ Team Leader), tạo/sửa dự án trong phòng ban, xem thành viên phòng ban, tạo Flow 3 (QUOTA_TOPUP → Admin duyệt)
>
> ⚠️ Design ref `d:\src` dùng flow cũ — Manager trong `d:\src` duyệt Flow 1 (chi tiêu cá nhân), KHÔNG copy.
> Thực tế: Manager chỉ duyệt **PROJECT_TOPUP** (Flow 2).

---

## Quy ước bắt buộc (giống Tier 2)

- Types: `@/types` barrel only | API: `api` từ `@/lib/api-client`
- `"use client"` ở đầu file | Tailwind v4 | inline SVG icons | UI text tiếng Việt
- Mock-first: comment real API, dùng mock, ghi `// TODO: Replace when Sprint 4-5 is complete`
- `use(params)` cho dynamic routes | URL search params cho filter/pagination
- Chạy `npm run lint` — 0 errors

---

## Prompt 0 — Manager Dashboard

### 🎯 Mục tiêu
Replace stub `components/dashboard/manager-dashboard.tsx` với full dashboard: KPI cards (dept budget/pending approvals/projects/team debt), pending PROJECT_TOPUP list, projects overview.

### 📁 Target file
`components/dashboard/manager-dashboard.tsx`

### 🎨 Design reference
`d:\src\components\pages\manager-dashboard-page.tsx` — stat cards, pending list, budget chart (dùng layout, KHÔNG copy role logic)

### ⚠️ Business rules
- Manager duyệt PROJECT_TOPUP (Flow 2), KHÔNG duyệt ADVANCE/EXPENSE/REIMBURSE
- Manager tạo QUOTA_TOPUP để xin cấp vốn phòng ban từ Admin (Flow 3)
- Dept budget từ `ManagerDashboardResponse.departmentBudget`

### 📦 Types
```typescript
import {
  ManagerDashboardResponse, ManagerApprovalListItem,
  ManagerProjectListItem, RequestType, RequestStatus,
} from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useWallet } from "@/contexts/wallet-context";
import { api } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/manager/approvals?limit=3` | Sprint 4-5 |
| GET | `/api/v1/manager/projects?limit=4` | Sprint 4 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 4-5 is complete
const MOCK_DASHBOARD: ManagerDashboardResponse = {
  departmentBudget: {
    totalProjectQuota: 800_000_000,
    totalAvailableBalance: 524_500_000,
    totalSpent: 275_500_000,
  },
  projectStatusSummary: { active: 3, planning: 2, paused: 1, closed: 0 },
  pendingApprovalsCount: 2,
  teamDebtSummary: { totalDebt: 5_200_000, employeesWithDebt: 3 },
};

const MOCK_PENDING_APPROVALS: ManagerApprovalListItem[] = [
  {
    id: 10, requestCode: "REQ-2026-0050", type: RequestType.PROJECT_TOPUP,
    status: RequestStatus.PENDING_APPROVAL, amount: 50_000_000,
    description: "Xin cấp vốn bổ sung Phase 2 dự án HTQL nội bộ",
    requester: { id: 4, fullName: "Hoàng Minh Tuấn", avatar: null, employeeCode: "TL001", jobTitle: "Team Leader", email: "tl.it@ifms.vn" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ", availableBudget: 12_000_000 },
    createdAt: "2026-04-03T10:00:00",
  },
  {
    id: 11, requestCode: "REQ-2026-0048", type: RequestType.PROJECT_TOPUP,
    status: RequestStatus.PENDING_APPROVAL, amount: 30_000_000,
    description: "Cấp vốn cho Phase triển khai dự án hạ tầng mạng",
    requester: { id: 4, fullName: "Hoàng Minh Tuấn", avatar: null, employeeCode: "TL001", jobTitle: "Team Leader", email: "tl.it@ifms.vn" },
    project: { id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng", availableBudget: 8_500_000 },
    createdAt: "2026-04-02T14:00:00",
  },
];

const MOCK_PROJECTS: ManagerProjectListItem[] = [
  { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ", status: "ACTIVE", totalBudget: 150_000_000, availableBudget: 12_000_000, totalSpent: 138_000_000, memberCount: 5 },
  { id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng", status: "ACTIVE", totalBudget: 80_000_000, availableBudget: 8_500_000, totalSpent: 71_500_000, memberCount: 3 },
  { id: 3, projectCode: "PRJ-IT-003", name: "Nghiên cứu AI integration", status: "PLANNING", totalBudget: 50_000_000, availableBudget: 50_000_000, totalSpent: 0, memberCount: 2 },
];
```

### 🖥️ UI layout
1. **Header**: "Xin chào, {user?.fullName}" + role badge "Quản lý" + ngày hôm nay
2. **Stat row (4 cards)**:
   - Quỹ phòng ban: `departmentBudget.totalAvailableBalance` VND — màu blue — link `/manager/department`
   - Chờ duyệt: `pendingApprovalsCount` — màu amber — link `/manager/approvals`
   - Dự án active: `projectStatusSummary.active` — màu emerald — link `/manager/projects`
   - Dư nợ nhóm: `teamDebtSummary.totalDebt` VND — màu rose (nếu > 0) hoặc slate — `{employeesWithDebt} nhân viên`
3. **2-col layout (lg:grid-cols-3)**:
   - Left (col-span-2): "PROJECT_TOPUP chờ duyệt" — list MOCK_PENDING_APPROVALS (max 3). Mỗi row: badge "Cấp vốn DA" + project.name + requester.fullName + amount. Link "Xem tất cả →"
   - Right (col-span-1): "Dự án phòng ban" — list projects với budget burn bar. Link "Xem tất cả →"
4. **Quick actions**: "Xin cấp vốn PB" (mở modal tạo QUOTA_TOPUP — amount input + description) | Ví cá nhân → `/wallet`

---

## Prompt 1 — Manager Approvals List (Flow 2)

### 🎯 Mục tiêu
Page `/manager/approvals`: danh sách **PROJECT_TOPUP** từ Team Leaders chờ Manager duyệt (Flow 2). Filter search + pagination. Click row → detail page.

### 📁 Target file
`app/(dashboard)/manager/approvals/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\approvals-page.tsx` — list/filter structure (NHƯNG chỉ type PROJECT_TOPUP, không có ADVANCE/EXPENSE/REIMBURSE)

### ⚠️ Business rules
- Chỉ hiển thị `type = PROJECT_TOPUP`, status `PENDING_APPROVAL`
- Dữ liệu: `ManagerApprovalListItem` — có `project.currentBudget` và `project.availableBudget`
- Sau approve: auto PAID (không qua Accountant)

### 📦 Types
```typescript
import {
  ManagerApprovalListItem, ManagerApprovalFilterParams,
  PaginatedResponse, RequestType, RequestStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/manager/approvals` | Sprint 4-5 |
| Query params | `search`, `page`, `limit=10` | |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 4-5 is complete
const MOCK_APPROVALS: ManagerApprovalListItem[] = [
  {
    id: 10, requestCode: "REQ-2026-0050", type: RequestType.PROJECT_TOPUP,
    status: RequestStatus.PENDING_APPROVAL, amount: 50_000_000,
    description: "Xin cấp vốn bổ sung Phase 2 — nhóm IT thiếu ngân sách phát triển module báo cáo",
    requester: { id: 4, fullName: "Hoàng Minh Tuấn", avatar: null, employeeCode: "TL001", jobTitle: "Team Leader IT", email: "tl.it@ifms.vn" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ", availableBudget: 12_000_000 },
    createdAt: "2026-04-03T10:00:00",
  },
  {
    id: 11, requestCode: "REQ-2026-0048", type: RequestType.PROJECT_TOPUP,
    status: RequestStatus.PENDING_APPROVAL, amount: 30_000_000,
    description: "Cấp vốn Phase triển khai — mua thêm server và license phần mềm",
    requester: { id: 4, fullName: "Hoàng Minh Tuấn", avatar: null, employeeCode: "TL001", jobTitle: "Team Leader IT", email: "tl.it@ifms.vn" },
    project: { id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng", availableBudget: 8_500_000 },
    createdAt: "2026-04-02T14:00:00",
  },
];
```

### 🖥️ UI layout
1. **Header**: "Duyệt cấp vốn dự án" + badge số lượng + label "Flow 2: PROJECT_TOPUP"
2. **Info banner**: "Phê duyệt sẽ tự động cấp vốn từ quỹ phòng ban → dự án (không cần Kế toán)"
3. **Search input** + list cards:
   - Mỗi card: requestCode (mono) + requester.fullName + project.name + projectCode
   - project.availableBudget hiện tại (label "Ngân sách DA hiện có: X VND")
   - amount request (lớn) — nếu amount > availableBudget → cảnh báo đỏ "Vượt ngân sách DA"
   - description + createdAt
   - Nút "Xem chi tiết →"
4. **Empty state** + pagination

---

## Prompt 2 — Manager Approval Detail + Duyệt/Từ chối (Flow 2)

### 🎯 Mục tiêu
Page `/manager/approvals/[id]`: chi tiết PROJECT_TOPUP request, thông tin dự án + ngân sách hiện tại. Nút "Duyệt" (auto PAID sau khi approve). Nút "Từ chối". Redirect về list sau action.

### 📁 Target file
`app/(dashboard)/manager/approvals/[id]/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\approvals-page.tsx` — RequestSheet detail section, RejectDialog

### ⚠️ Business rules
- Endpoint trả `ManagerApprovalDetailResponse` (khác Employee — có project budget info)
- Approve body: `ManagerApproveBody { comment?, approvedAmount? }`
- Reject body: `ManagerRejectBody { reason: string }`
- Sau approve → status `PAID` (tự động — dept fund → project fund)
- Banner thông tin: "Duyệt sẽ tự động trích {approvedAmount VND} từ Quỹ Phòng ban → Dự án"

### 📦 Types
```typescript
import {
  ManagerApprovalDetailResponse, ManagerApproveBody, ManagerRejectBody,
  ManagerApproveResponse, ManagerRejectResponse, RequestStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
import { use } from "react";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/manager/approvals/:id` | Sprint 4-5 |
| POST | `/api/v1/manager/approvals/:id/approve` | Sprint 4-5 |
| POST | `/api/v1/manager/approvals/:id/reject` | Sprint 4-5 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 4-5 is complete
const MOCK_DETAIL: ManagerApprovalDetailResponse = {
  id: 10, requestCode: "REQ-2026-0050", type: RequestType.PROJECT_TOPUP,
  status: RequestStatus.PENDING_APPROVAL, amount: 50_000_000,
  approvedAmount: null, description: "Xin cấp vốn bổ sung Phase 2 — nhóm IT thiếu ngân sách phát triển module báo cáo tài chính. Dự kiến dùng cho: nhân công outsource (30M) + infrastructure (20M).",
  rejectReason: null,
  requester: { id: 4, fullName: "Hoàng Minh Tuấn", avatar: null, employeeCode: "TL001", jobTitle: "Team Leader IT", email: "tl.it@ifms.vn", departmentName: "Phòng CNTT" },
  project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ", totalBudget: 150_000_000, availableBudget: 12_000_000 },
  department: { id: 1, name: "Phòng CNTT", totalAvailableBalance: 245_000_000 },
  createdAt: "2026-04-03T10:00:00",
  updatedAt: "2026-04-03T10:00:00",
  timeline: [],
};
```

### 🖥️ UI layout
1. **Breadcrumb** + header (requestCode, badge PROJECT_TOPUP, amount, status)
2. **Flow 2 info banner** (màu blue): "Phê duyệt → Tự động cấp vốn: Quỹ PB → Dự án. KHÔNG qua Kế toán."
3. **Requester block**: fullName, employeeCode, jobTitle
4. **Project budget card**: project.name | Ngân sách hiện tại: X VND | Quỹ khả dụng: Y VND | Yêu cầu thêm: Z VND | Sau phê duyệt: Y+Z VND
5. **Dept budget indicator**: `department.totalAvailableBalance` — "Quỹ phòng ban khả dụng: {VND}" — nếu amount > dept.totalAvailableBalance → cảnh báo đỏ
6. **Description** + createdAt
7. **Action bar** (chỉ khi PENDING_APPROVAL): "Duyệt" (green) + "Từ chối" (red)
8. **Approve modal**: confirm amount (default = request.amount, max = min(request.amount, dept.available)) + comment optional
9. **Reject modal**: required reason ≥10 chars + suggestion chips

---

## Prompt 3 — Manager Projects List + Create Project

### 🎯 Mục tiêu
Page `/manager/projects`: danh sách dự án phòng ban Manager quản lý. Manager CÓ THỂ tạo dự án mới (modal) và sửa dự án. Filter status + search.

### 📁 Target file
`app/(dashboard)/manager/projects/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\projects-list-page.tsx` — grid layout + create dialog

### ⚠️ Business rules
- Manager tạo dự án: `POST /manager/projects {name, description, totalBudget, teamLeaderId}`
- Manager phải chọn Team Leader từ dropdown: `GET /manager/department/team-leaders`
- `ManagerProjectListItem` có đầy đủ `totalBudget`, `availableBudget`, `totalSpent`, `currentPhaseId`, `currentPhaseName`, `createdAt`
- `teamLeaderName` không có trong type — dùng local extension: `type ManagerProjectViewItem = ManagerProjectListItem & { teamLeaderName?: string | null }`

### 📦 Types
```typescript
import {
  ManagerProjectListItem, ManagerProjectFilterParams,
  CreateProjectBody, TeamLeaderOptionResponse,
  PaginatedResponse, ProjectStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/manager/projects` | Sprint 4 |
| POST | `/api/v1/manager/projects` | Sprint 4 |
| GET | `/api/v1/manager/department/team-leaders` | Sprint 4 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 4 is complete
// teamLeaderName không có trong ManagerProjectListItem — dùng local extension type
type ManagerProjectViewItem = ManagerProjectListItem & { teamLeaderName?: string | null };

const MOCK_PROJECTS: ManagerProjectViewItem[] = [
  { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ", status: "ACTIVE", totalBudget: 150_000_000, availableBudget: 12_000_000, totalSpent: 138_000_000, memberCount: 5, currentPhaseId: 2, currentPhaseName: "Phase 2 - Triển khai", createdAt: "2026-01-10T08:00:00", teamLeaderName: "Hoàng Minh Tuấn" },
  { id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng", status: "ACTIVE", totalBudget: 80_000_000, availableBudget: 8_500_000, totalSpent: 71_500_000, memberCount: 3, currentPhaseId: 4, currentPhaseName: "Phase 1 - Triển khai", createdAt: "2026-02-15T08:00:00", teamLeaderName: "Hoàng Minh Tuấn" },
  { id: 3, projectCode: "PRJ-IT-003", name: "Nghiên cứu AI integration", status: "PLANNING", totalBudget: 50_000_000, availableBudget: 50_000_000, totalSpent: 0, memberCount: 2, currentPhaseId: null, currentPhaseName: null, createdAt: "2026-03-20T08:00:00", teamLeaderName: "Lê Thu Trang" },
  { id: 4, projectCode: "PRJ-IT-004", name: "Migration legacy system", status: "PAUSED", totalBudget: 120_000_000, availableBudget: 45_000_000, totalSpent: 75_000_000, memberCount: 4, currentPhaseId: 5, currentPhaseName: "Phase 2 - Migration", createdAt: "2025-11-01T08:00:00", teamLeaderName: "Lê Thu Trang" },
];

const MOCK_TL_OPTIONS: TeamLeaderOptionResponse[] = [
  { id: 4, fullName: "Hoàng Minh Tuấn", employeeCode: "TL001", avatar: null, email: "tl.it@ifms.vn", jobTitle: "Team Leader IT" },
];
```

### 🖥️ UI layout
1. **Header**: "Dự án phòng ban" + badge tổng + nút "Tạo dự án" (primary blue)
2. **Filter bar**: Status tabs + search
3. **Grid 3-col**: card mỗi dự án với burn bar + teamLeaderName + status badge + nút "Xem chi tiết"
4. **Create Project Modal**:
   - Input: Tên dự án (required)
   - Textarea: Mô tả (optional)
   - Input số: Tổng ngân sách (required, VND)
   - Select: Trưởng nhóm — load `MOCK_TL_OPTIONS` (sau khi API ready: `GET /manager/department/team-leaders`)
   - Buttons: Hủy | Tạo dự án

---

## Prompt 4 — Manager Project Detail (Read + Edit)

### 🎯 Mục tiêu
Page `/manager/projects/[id]`: xem chi tiết dự án, phases, members (read-only view với quyền sửa tên/description/budget/status/teamLeader). Manager không thể manage phases (đó là việc của TL).

### 📁 Target file
`app/(dashboard)/manager/projects/[id]/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\project-detail-page.tsx` — header info + budget summary + tabs (đơn giản hơn TL version)

### ⚠️ Business rules
- Manager chỉ sửa thông tin dự án tổng thể (`PUT /manager/projects/:id`), KHÔNG quản lý phases/categories
- Manager thấy phases và members (read-only) để có cái nhìn tổng thể
- Edit: `UpdateProjectBody { name?, description?, totalBudget?, status?, teamLeaderId? }`

### 📦 Types
```typescript
import {
  ProjectDetailResponse, UpdateProjectBody, TeamLeaderOptionResponse,
  ProjectStatus, ProjectRole,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
import { use } from "react";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/manager/projects/:id` | Sprint 4 |
| PUT | `/api/v1/manager/projects/:id` | Sprint 4 |
| GET | `/api/v1/manager/department/team-leaders` | Sprint 4 |

### 📊 Mock data
Dùng `MOCK_PROJECT` tương tự Tier 2 Prompt 4 nhưng managerId = currentUser.

### 🖥️ UI layout
1. **Header**: projectCode + name + status badge + nút "Sửa thông tin" → mở edit modal
2. **Budget summary**: totalBudget | totalSpent | availableBudget (burn bar)
3. **Info grid**: Trưởng nhóm | Phòng ban | Ngày tạo | Mô tả
4. **Phases list** (read-only): name + status + budget burn + date range
5. **Members list** (read-only): avatar + fullName + position + role badge
6. **Edit Modal**: sửa name, description, totalBudget, status (dropdown ProjectStatus), teamLeaderId (dropdown TL options)
7. **Back button**: "← Quay lại" → `/manager/projects`

---

## Prompt 5 — Manager Department Members

### 🎯 Mục tiêu
Page `/manager/department`: danh sách thành viên phòng ban Manager quản lý. Xem chi tiết member: projects, debtBalance, recent requests.

### 📁 Target file
`app/(dashboard)/manager/department/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\department-page.tsx` — member list, detail panel, budget quota section

### 📦 Types
```typescript
import {
  ManagerDeptMemberListItem, ManagerDeptMemberDetailResponse,
  ManagerDeptMemberFilterParams, PaginatedResponse,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/manager/department/members` | Sprint 4-5 |
| GET | `/api/v1/manager/department/members/:id` | Sprint 4-5 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 4-5 is complete
// role và projectsCount không có trong ManagerDeptMemberListItem — dùng local extension
// ManagerDeptMemberListItem có: id, fullName, email, employeeCode, avatar, jobTitle, status, pendingRequestsCount, debtBalance
type MemberRole = "TEAM_LEADER" | "EMPLOYEE";
type ManagerMemberView = ManagerDeptMemberListItem & { role: MemberRole; projectsCount: number };

const MOCK_MEMBERS: ManagerMemberView[] = [
  { id: 4, fullName: "Hoàng Minh Tuấn", email: "tl.it@ifms.vn", employeeCode: "TL001", avatar: null, jobTitle: "Team Leader IT", status: "ACTIVE", pendingRequestsCount: 1, debtBalance: 0, role: "TEAM_LEADER", projectsCount: 3 },
  { id: 11, fullName: "Đỗ Quốc Bảo", email: "emp.it1@ifms.vn", employeeCode: "EMP001", avatar: null, jobTitle: "Frontend Developer", status: "ACTIVE", pendingRequestsCount: 2, debtBalance: 2_500_000, role: "EMPLOYEE", projectsCount: 2 },
  { id: 12, fullName: "Vũ Thị Lan", email: "emp.it2@ifms.vn", employeeCode: "EMP002", avatar: null, jobTitle: "Backend Developer", status: "ACTIVE", pendingRequestsCount: 1, debtBalance: 0, role: "EMPLOYEE", projectsCount: 1 },
  { id: 13, fullName: "Phạm Văn Đức", email: "emp.sales1@ifms.vn", employeeCode: "EMP003", avatar: null, jobTitle: "QA Engineer", status: "ACTIVE", pendingRequestsCount: 0, debtBalance: 1_200_000, role: "EMPLOYEE", projectsCount: 1 },
];
```

### 🖥️ UI layout
1. **Header**: "Phòng ban của tôi" + tên phòng ban + tổng thành viên
2. **Dept budget summary bar**: quỹ phòng ban khả dụng / tổng quota (lấy từ dept budget trong dashboard response)
3. **Search input** + role filter (Tất cả / Team Leader / Nhân viên)
4. **Member cards grid (2-3 col)**:
   - Avatar initials + fullName + jobTitle + employeeCode
   - role badge: TEAM_LEADER=indigo, EMPLOYEE=slate
   - status badge + debtBalance (nếu >0 → red badge) + projectsCount
   - Click → load detail → slide-in panel (400px)
5. **Detail panel**:
   - Full info: fullName, email, jobTitle, role, status
   - debtBalance VND
   - Projects list: tên project + TL/member
   - Recent requests (nếu có)

---

*End of Tier 3 prompts*
