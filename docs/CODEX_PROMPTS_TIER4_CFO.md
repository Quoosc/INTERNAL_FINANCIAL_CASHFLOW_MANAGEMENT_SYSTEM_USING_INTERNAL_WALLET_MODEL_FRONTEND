# CODEX Prompts — Tier 4A: CFO

> **Sprint**: 6 (Approvals Flow 3)
> **Role**: `CFO`
> **Business**: Duyet Flow 3 (DEPARTMENT_TOPUP tu Manager) va quyet dinh cap ngan sach cap phong ban.
>
> ⚠️ CFO co route rieng tai `app/(dashboard)/cfo/` — KHONG code chung vao `/admin/`. ADMIN khong co approval flow.
> - Sidebar CFO dung: `/cfo/approvals`, `/cfo/system-fund`, `/cfo/settings`, `/cfo/audit-logs`
> - API backend prefix: `/cfo/*`
> - `app/(dashboard)/admin/approvals/` khong nen ton tai — neu dang co re-export thi doi code that sang `/cfo/`

---

## Quy uoc bat buoc (giong Tier 2, 3)

- Types: `@/types` barrel only | API: `api` tu `@/lib/api-client`
- `"use client"` o dau file | Tailwind v4 | inline SVG | UI text tieng Viet
- Mock-first voi comment API that + `// TODO: Replace when Sprint 6 is complete`
- `use(params)` cho dynamic routes | URL search params cho filter
- `npm run lint` — 0 errors

---

## Prompt 0 — CFO Approvals List (Flow 3 — DEPARTMENT_TOPUP)

### Muc tieu

Page approvals cho CFO: danh sach DEPARTMENT_TOPUP tu Managers cho duyet (Flow 3). Approve -> system fund -> dept fund (auto PAID). Reject -> REJECTED.

### Target file

`app/(dashboard)/cfo/approvals/page.tsx`

### Design reference

`d:\src\components\pages\admin-approvals-page.tsx` — list layout, card/table filter, badges

### Business rules

- Chi lay `type = DEPARTMENT_TOPUP` + `status = PENDING`
- Sau approve: System Fund -> Dept Fund (auto, khong qua Accountant)
- Hien tai System Fund balance de CFO can nhac khi duyet

### Types

```typescript
import {
  AdminApprovalListItem,
  AdminApprovalFilterParams,
  PaginatedResponse,
  RequestType,
  RequestStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### API endpoints

| Method       | Endpoint                     | Sprint   |
| ------------ | ---------------------------- | -------- |
| GET          | `/api/v1/cfo/approvals`      | Sprint 6 |
| Query params | `search`, `page`, `limit=10` |          |

### Mock data

```typescript
// TODO: Replace when Sprint 6 is complete
const MOCK_APPROVALS: AdminApprovalListItem[] = [
  {
    id: 20,
    requestCode: "REQ-2026-0060",
    type: RequestType.DEPARTMENT_TOPUP,
    status: RequestStatus.PENDING,
    amount: 200_000_000,
    description:
      "Xin cap them quota ngan sach cho phong IT Q2/2026 — mo rong headcount + infrastructure",
    requester: {
      id: 5,
      fullName: "Tran Thi Bich",
      avatar: null,
      employeeCode: "MGR001",
      jobTitle: "Manager IT",
      email: "manager.it@ifms.vn",
    },
    department: { id: 1, name: "Phong Cong nghe thong tin" },
    currentDeptBudget: 800_000_000,
    availableDeptBudget: 80_000_000,
    createdAt: "2026-04-02T09:00:00",
  },
  {
    id: 21,
    requestCode: "REQ-2026-0055",
    type: RequestType.DEPARTMENT_TOPUP,
    status: RequestStatus.PENDING,
    amount: 100_000_000,
    description: "Bo sung ngan sach phong Sales cho chien dich Q2",
    requester: {
      id: 6,
      fullName: "Nguyen Van Tung",
      avatar: null,
      employeeCode: "MGR002",
      jobTitle: "Manager Sales",
      email: "manager.sales@ifms.vn",
    },
    department: { id: 2, name: "Phong Kinh doanh" },
    currentDeptBudget: 400_000_000,
    availableDeptBudget: 35_000_000,
    createdAt: "2026-04-01T11:00:00",
  },
];
```

### UI layout

1. Header: "Duyet cap quota ngan sach" + badge so luong
2. Info banner (blue): "Phe duyet -> Tu dong chuyen tu Quy he thong -> Quy phong ban"
3. System fund quick info: "Quy he thong kha dung: X VND"
4. Search + list:
   - requestCode + badge "Cap quota" + department.name
   - requester.fullName + jobTitle
   - currentDeptBudget + amount + du kien sau duyet
   - description + createdAt
   - Nút "Xem chi tiet ->"
5. Empty state + pagination

---

## Prompt 1 — CFO Approval Detail + Duyet/Tu choi (Flow 3)

### Muc tieu

Page chi tiet DEPARTMENT_TOPUP: thong tin phong ban, system fund impact, approve/reject voi confirmation.

### Target file

`app/(dashboard)/cfo/approvals/[id]/page.tsx`

### Design reference

`d:\src\components\pages\admin-approvals-page.tsx` — ReviewSheet detail, ApprovalTimeline (Flow 3: Manager submit -> CFO approve)

### Types

```typescript
import {
  AdminApprovalDetailResponse,
  AdminApproveBody,
  AdminRejectBody,
  AdminApproveResponse,
  AdminRejectResponse,
  RequestStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
import { use } from "react";
```

### API endpoints

| Method | Endpoint                            | Sprint   |
| ------ | ----------------------------------- | -------- |
| GET    | `/api/v1/cfo/approvals/:id`         | Sprint 6 |
| POST   | `/api/v1/cfo/approvals/:id/approve` | Sprint 6 |
| POST   | `/api/v1/cfo/approvals/:id/reject`  | Sprint 6 |

### Mock data

```typescript
// TODO: Replace when Sprint 6 is complete
const MOCK_DETAIL: AdminApprovalDetailResponse = {
  id: 20,
  requestCode: "REQ-2026-0060",
  type: RequestType.DEPARTMENT_TOPUP,
  status: RequestStatus.PENDING,
  amount: 200_000_000,
  approvedAmount: null,
  rejectReason: null,
  description:
    "Xin cap them quota ngan sach cho phong IT Q2/2026. Ly do: mo rong team them 3 headcount + nang cap infrastructure cloud.",
  requester: {
    id: 5,
    fullName: "Tran Thi Bich",
    avatar: null,
    employeeCode: "MGR001",
    jobTitle: "Manager IT",
    email: "manager.it@ifms.vn",
  },
  department: {
    id: 1,
    name: "Phong Cong nghe thong tin",
    currentQuota: 800_000_000,
    availableBudget: 80_000_000,
  },
  systemFundBalance: 1_248_500_000,
  createdAt: "2026-04-02T09:00:00",
  timeline: [],
};
```

### UI layout

1. Breadcrumb + header (requestCode, badge "Cap quota", amount, status)
2. Flow 3 impact card:
   - Quy he thong hien tai: `systemFundBalance`
   - Sau phe duyet: `systemFundBalance - amount`
   - Quy phong ban sau phe duyet: `availableBudget + amount`
   - Canh bao do neu amount > systemFundBalance
3. Requester + department info
4. Description + timeline (Submitted by Manager -> Pending CFO)
5. Action bar (chi khi PENDING): Duyet + Tu choi
6. Approve modal: approvedAmount (default = amount) + comment
7. Reject modal: required reason + suggestion chips

---

_End of Tier 4A prompts_
