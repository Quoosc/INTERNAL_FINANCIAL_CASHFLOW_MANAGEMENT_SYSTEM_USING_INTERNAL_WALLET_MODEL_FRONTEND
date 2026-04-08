# CODEX Prompts — Tier 2: TEAM LEADER

> **Sprint**: 4-5 (APIs chưa sẵn sàng → dùng mock-first pattern)
> **Role**: `TEAM_LEADER`
> **Business**: Duyệt Flow 1 (ADVANCE/EXPENSE/REIMBURSE), tạo Flow 2 (PROJECT_TOPUP → Manager duyệt), quản lý Project phases/categories/members, xem thành viên nhóm
>
> ⚠️ Design ref `d:\src` dùng flow 4-role cũ (không có TEAM_LEADER) — chỉ tham khảo UI/UX layout, KHÔNG copy logic/types/flow.

---

## Quy ước bắt buộc (áp dụng cho MỌI prompt trong file này)

```typescript
// ─── MOCK DATA (xóa khi backend sẵn sàng) ───────────────────────────────
const MOCK_X: SomeType = { ... };
// TODO: Replace when Sprint 4-5 is complete
// ────────────────────────────────────────────────────────────────────────

// ─── API CALL THẬT (bỏ comment khi backend sẵn sàng) ────────────────────
// const res = await api.get<PaginatedResponse<SomeType>>("/api/v1/...");
// ────────────────────────────────────────────────────────────────────────
```

- Types: chỉ import từ `@/types` barrel
- API: chỉ dùng `api` từ `@/lib/api-client`
- `"use client"` ở đầu file (tất cả pages TL đều cần hooks)
- UI text: tiếng Việt | Code: tiếng Anh
- Tailwind v4 — không `@apply`, không `style={{}}` (trừ dynamic value)
- Icon: inline SVG only (không lucide-react)
- `use(params)` cho dynamic route params (Next.js 16)
- URL search params cho mọi filter/pagination (bookmarkable)
- Chạy `npm run lint` — 0 errors bắt buộc

---

## Prompt 0 — Team Leader Dashboard

### 🎯 Mục tiêu
Replace stub `components/dashboard/team-leader-dashboard.tsx` với full dashboard: stat cards (wallet/pending approvals/projects/team size), recent approval requests list (max 3), project budget overview list (max 3).

### 📁 Target file
`components/dashboard/team-leader-dashboard.tsx`

### 🎨 Design reference
- Layout tổng thể: `d:\src\components\pages\manager-dashboard-page.tsx` (stat cards row + 2-col layout)
- Activity list pattern: `d:\src\components\dashboard\activity-feed.tsx`
- Stat card pattern: `d:\src\components\dashboard\stats-card.tsx`

### ⚠️ Business rules
- TL không có số liệu phòng ban — chỉ có số liệu nhóm + dự án mình phụ trách
- Wallet balance lấy từ `useWallet()` (WalletContext), KHÔNG gọi API riêng
- Không có Dashboard API riêng cho TL → compose từ approvals + projects endpoints

### 📦 Types
```typescript
import {
  TLApprovalListItem,
  TLProjectListItem,
  RequestType,
  RequestStatus,
} from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useWallet } from "@/contexts/wallet-context";
import { api } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/team-leader/approvals?limit=3&status=PENDING` | Sprint 4-5 |
| GET | `/api/v1/team-leader/projects?limit=3` | Sprint 4 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 4-5 is complete
const MOCK_PENDING: TLApprovalListItem[] = [
  {
    id: 1, requestCode: "REQ-2026-0041", type: RequestType.ADVANCE,
    status: RequestStatus.PENDING, amount: 3_500_000,
    description: "Mua vật tư thiết bị thí nghiệm",
    requester: { id: 11, fullName: "Đỗ Quốc Bảo", avatar: null, employeeCode: "EMP001", jobTitle: "Frontend Developer", email: "emp.it1@ifms.vn" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: { id: 1, phaseCode: "PH-001", name: "Phase 1 - Phân tích", budgetLimit: 50_000_000, currentSpent: 12_000_000 },
    category: { id: 1, name: "Thiết bị & Phần cứng" }, attachments: [], createdAt: "2026-04-03T09:15:00",
  },
  {
    id: 2, requestCode: "REQ-2026-0042", type: RequestType.EXPENSE,
    status: RequestStatus.PENDING, amount: 850_000,
    description: "Chi phí di chuyển gặp khách hàng",
    requester: { id: 12, fullName: "Vũ Thị Lan", avatar: null, employeeCode: "EMP002", jobTitle: "Backend Developer", email: "emp.it2@ifms.vn" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: { id: 2, phaseCode: "PH-002", name: "Phase 2 - Phát triển", budgetLimit: 80_000_000, currentSpent: 31_000_000 },
    category: { id: 2, name: "Di chuyển & Công tác" }, attachments: [], createdAt: "2026-04-02T14:30:00",
  },
  {
    id: 3, requestCode: "REQ-2026-0043", type: RequestType.REIMBURSE,
    status: RequestStatus.PENDING, amount: 1_200_000,
    description: "Hoàn ứng chi phí ăn uống team",
    requester: { id: 11, fullName: "Đỗ Quốc Bảo", avatar: null, employeeCode: "EMP001", jobTitle: "Frontend Developer", email: "emp.it1@ifms.vn" },
    project: { id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng" },
    phase: { id: 3, phaseCode: "PH-001", name: "Phase 1 - Triển khai", budgetLimit: 30_000_000, currentSpent: 8_500_000 },
    category: { id: 3, name: "Ăn uống & Tiếp khách" }, attachments: [], createdAt: "2026-04-01T10:00:00",
  },
];

const MOCK_PROJECTS: TLProjectListItem[] = [
  {
    id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ",
    status: "ACTIVE", totalBudget: 150_000_000, availableBudget: 88_500_000,
    totalSpent: 61_500_000, memberCount: 5, currentPhaseId: 1,
    currentPhaseName: "Phase 1 - Phân tích", createdAt: "2026-01-10T08:00:00",
  },
  {
    id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng",
    status: "ACTIVE", totalBudget: 80_000_000, availableBudget: 62_500_000,
    totalSpent: 17_500_000, memberCount: 3, currentPhaseId: 3,
    currentPhaseName: "Phase 1 - Triển khai", createdAt: "2026-02-15T08:00:00",
  },
  {
    id: 3, projectCode: "PRJ-IT-003", name: "Nghiên cứu AI integration",
    status: "PLANNING", totalBudget: 50_000_000, availableBudget: 50_000_000,
    totalSpent: 0, memberCount: 2, currentPhaseId: null,
    currentPhaseName: null, createdAt: "2026-03-20T08:00:00",
  },
];
```

### 🧩 State shape
```typescript
const { user } = useAuth();
const { wallet } = useWallet();
const [approvals, setApprovals] = useState<TLApprovalListItem[]>([]);
const [projects, setProjects] = useState<TLProjectListItem[]>([]);
const [loading, setLoading] = useState(true);
```

### 🖥️ UI layout
1. **Header**: "Xin chào, {user?.fullName}" + subtitle ngày hôm nay + badge "Trưởng nhóm" (indigo)
2. **Stat row (4 cards)**:
   - Số dư ví: `wallet?.balance` VND — link `/wallet`
   - Chờ duyệt: `approvals.length` — màu amber, icon inbox — link `/team-leader/approvals`
   - Dự án: `projects.length` — màu blue, icon briefcase — link `/team-leader/projects`
   - Thành viên: tổng `projects.reduce((s,p)=>s+p.memberCount,0)` — màu indigo, icon users — link `/team-leader/team`
3. **2-col layout (lg:grid-cols-3)**:
   - Left (col-span-2): "Yêu cầu đang chờ duyệt" — list `approvals` (max 3): type badge + requester name + project name + amount + link chi tiết. Footer: "Xem tất cả →"
   - Right (col-span-1): "Dự án của tôi" — list `projects` (max 3): project name + status badge + budget burn progress bar. Footer: "Xem tất cả →"
4. **Quick actions**: 2 buttons — "Nạp tiền" → `/wallet/deposit`, "Rút tiền" → `/wallet/withdraw`

### ⚙️ Key behaviors
- Type badge colors: ADVANCE=violet, EXPENSE=sky, REIMBURSE=amber
- Status badge: ACTIVE=emerald, PLANNING=sky, PAUSED=amber, CLOSED=slate
- Budget burn = `totalSpent/totalBudget*100`% → bar color: <65% emerald, 65-84% amber, ≥85% rose
- Format currency: `new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(n)`
- Loading: skeleton placeholders animate-pulse
- Load data in single `useEffect` với `Promise.all`

---

## Prompt 1 — Team Leader Approvals List

### 🎯 Mục tiêu
Page `/team-leader/approvals`: danh sách ADVANCE/EXPENSE/REIMBURSE của employees chờ TL duyệt (Flow 1 step 2). Filter theo type + search. Click row → detail page.

### 📁 Target file
`app/(dashboard)/team-leader/approvals/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\approvals-page.tsx` — phần list/filter/table (BỎ RequestSheet vì dùng separate page thay vì slide-in panel)

### ⚠️ Business rules
- Chỉ hiển thị status `PENDING` (TL chưa duyệt)
- Chỉ Flow 1: ADVANCE, EXPENSE, REIMBURSE — KHÔNG có PROJECT_TOPUP ở đây
- Phase budget health: cảnh báo nếu `(phase.currentSpent + request.amount) > phase.budgetLimit`

### 📦 Types
```typescript
import {
  TLApprovalListItem, TLApprovalFilterParams,
  PaginatedResponse, RequestType, RequestStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/team-leader/approvals` | Sprint 4-5 |
| Query params | `type`, `search`, `page`, `limit=10` | |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 4-5 is complete
const MOCK_APPROVALS: TLApprovalListItem[] = [
  {
    id: 1, requestCode: "REQ-2026-0041", type: RequestType.ADVANCE,
    status: RequestStatus.PENDING, amount: 3_500_000,
    description: "Mua vật tư thiết bị thí nghiệm",
    requester: { id: 11, fullName: "Đỗ Quốc Bảo", avatar: null, employeeCode: "EMP001", jobTitle: "Frontend Developer", email: "emp.it1@ifms.vn" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: { id: 1, phaseCode: "PH-001", name: "Phase 1 - Phân tích", budgetLimit: 50_000_000, currentSpent: 47_000_000 },
    category: { id: 1, name: "Thiết bị & Phần cứng" }, attachments: [], createdAt: "2026-04-03T09:15:00",
  },
  {
    id: 2, requestCode: "REQ-2026-0042", type: RequestType.EXPENSE,
    status: RequestStatus.PENDING, amount: 850_000,
    description: "Chi phí di chuyển gặp khách hàng",
    requester: { id: 12, fullName: "Vũ Thị Lan", avatar: null, employeeCode: "EMP002", jobTitle: "Backend Developer", email: "emp.it2@ifms.vn" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: { id: 2, phaseCode: "PH-002", name: "Phase 2 - Phát triển", budgetLimit: 80_000_000, currentSpent: 31_000_000 },
    category: { id: 2, name: "Di chuyển & Công tác" }, attachments: [], createdAt: "2026-04-02T14:30:00",
  },
  {
    id: 3, requestCode: "REQ-2026-0043", type: RequestType.REIMBURSE,
    status: RequestStatus.PENDING, amount: 1_200_000,
    description: "Hoàn ứng chi phí ăn uống team",
    requester: { id: 11, fullName: "Đỗ Quốc Bảo", avatar: null, employeeCode: "EMP001", jobTitle: "Frontend Developer", email: "emp.it1@ifms.vn" },
    project: { id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng" },
    phase: { id: 3, phaseCode: "PH-001", name: "Phase 1 - Triển khai", budgetLimit: 30_000_000, currentSpent: 8_500_000 },
    category: { id: 3, name: "Ăn uống & Tiếp khách" }, attachments: [], createdAt: "2026-04-01T10:00:00",
  },
  {
    id: 4, requestCode: "REQ-2026-0038", type: RequestType.ADVANCE,
    status: RequestStatus.PENDING, amount: 5_000_000,
    description: "Ứng trước chi phí đào tạo nội bộ",
    requester: { id: 13, fullName: "Phạm Văn Đức", avatar: null, employeeCode: "EMP003", jobTitle: "QA Engineer", email: "emp.sales1@ifms.vn" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: { id: 2, phaseCode: "PH-002", name: "Phase 2 - Phát triển", budgetLimit: 80_000_000, currentSpent: 31_000_000 },
    category: { id: 4, name: "Đào tạo & Phát triển" }, attachments: [], createdAt: "2026-03-31T11:00:00",
  },
  {
    id: 5, requestCode: "REQ-2026-0035", type: RequestType.EXPENSE,
    status: RequestStatus.PENDING, amount: 2_300_000,
    description: "Mua sách tham khảo kỹ thuật",
    requester: { id: 12, fullName: "Vũ Thị Lan", avatar: null, employeeCode: "EMP002", jobTitle: "Backend Developer", email: "emp.it2@ifms.vn" },
    project: { id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng" },
    phase: { id: 3, phaseCode: "PH-001", name: "Phase 1 - Triển khai", budgetLimit: 30_000_000, currentSpent: 8_500_000 },
    category: { id: 5, name: "Tài liệu & In ấn" }, attachments: [], createdAt: "2026-03-29T16:45:00",
  },
];
```

### 🧩 State shape
```typescript
const searchParams = useSearchParams();
const router = useRouter();
const pathname = usePathname();
const [items, setItems] = useState<TLApprovalListItem[]>([]);
const [total, setTotal] = useState(0);
const [totalPages, setTotalPages] = useState(1);
const [loading, setLoading] = useState(true);

// Đọc từ URL params
const typeFilter = (searchParams.get("type") as RequestType) || undefined;
const search = searchParams.get("search") || "";
const page = Number(searchParams.get("page") || 1);
```

### 🖥️ UI layout
1. **Header**: "Duyệt yêu cầu" + badge `{total} chờ duyệt` màu amber
2. **Filter bar**:
   - Type tabs: Tất cả | Tạm ứng (ADVANCE) | Chi phí (EXPENSE) | Hoàn ứng (REIMBURSE)
   - Search input: debounce 300ms, placeholder "Tìm mã YC, tên nhân viên..."
3. **Card list** (mỗi card 1 request):
   - Row 1: type badge + requestCode (font-mono) + thời gian tạo (time-ago)
   - Row 2: avatar placeholder (initials 2 chữ) + requester.fullName + employeeCode
   - Row 3: project.name / phase.name / category.name
   - Row 4: budget health indicator + amount VND (lớn, bên phải) + nút "Chi tiết →"
   - Budget health: nếu `phase.currentSpent + amount > phase.budgetLimit` → cảnh báo đỏ "⚠ Vượt ngân sách phase"
4. **Empty state**: icon inbox + "Không có yêu cầu nào đang chờ duyệt"
5. **Loading**: 5 skeleton cards animate-pulse
6. **Pagination**: prev/next + số trang (ghi/đọc `?page=`)

### ⚙️ Key behaviors
- Mock filter client-side: filter by type + search (requestCode + requester.fullName)
- URL param helper: `updateParam(key, value)` → `router.push(pathname + "?" + params)`
- Click card → `router.push(\`/team-leader/approvals/${item.id}\`)`

---

## Prompt 2 — Team Leader Approval Detail + Duyệt/Từ chối

### 🎯 Mục tiêu
Page `/team-leader/approvals/[id]`: hiển thị full chi tiết request, budget health bar, attachments, timeline lịch sử. Nút "Duyệt" → confirm modal (optional approvedAmount + comment). Nút "Từ chối" → reject modal (required reason ≥10 chars). Sau action redirect về list.

### 📁 Target file
`app/(dashboard)/team-leader/approvals/[id]/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\approvals-page.tsx` — BudgetHealthCard, RejectDialog, RequestSheet details section

### ⚠️ Business rules
- Endpoint: `GET /team-leader/approvals/:id` trả `RequestDetailResponse` (không phải TLApprovalListItem)
- Sau approve: status → `PENDING_ACCOUNTANT_EXECUTION` (chờ Accountant giải ngân)
- Sau reject: status → `REJECTED`
- TL CÓ THỂ điều chỉnh `approvedAmount` ≤ `request.amount` khi duyệt
- Nếu request không phải `PENDING` → hiển thị read-only, ẩn action buttons

### 📦 Types
```typescript
import {
  RequestDetailResponse, RequestType, RequestStatus, RequestAction,
  TLApproveBody, TLRejectBody, TLApproveResponse, TLRejectResponse,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
import { use } from "react";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/team-leader/approvals/:id` | Sprint 4-5 |
| POST | `/api/v1/team-leader/approvals/:id/approve` | Sprint 4-5 |
| POST | `/api/v1/team-leader/approvals/:id/reject` | Sprint 4-5 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 4-5 is complete
const MOCK_DETAIL: RequestDetailResponse = {
  id: 1, requestCode: "REQ-2026-0041",
  type: RequestType.ADVANCE, status: RequestStatus.PENDING,
  amount: 3_500_000, approvedAmount: null,
  description: "Mua vật tư thiết bị thí nghiệm phục vụ dự án. Bao gồm màn hình đo kiểm, cáp kết nối chuyên dụng và bộ nguồn dự phòng UPS.",
  rejectReason: null,
  projectId: 1, projectName: "Hệ thống quản lý nội bộ", projectCode: "PRJ-IT-001",
  phaseId: 1, phaseName: "Phase 1 - Phân tích", phaseCode: "PH-001",
  categoryId: 1, categoryName: "Thiết bị & Phần cứng",
  requesterId: 11, requesterName: "Đỗ Quốc Bảo",
  createdAt: "2026-04-03T09:15:00", updatedAt: "2026-04-03T09:15:00",
  attachments: [
    { fileId: 1, fileName: "hoa_don_thiet_bi.pdf", url: "#", fileType: "application/pdf", size: 245_000 },
    { fileId: 2, fileName: "bao_gia_supplier.jpg", url: "#", fileType: "image/jpeg", size: 1_200_000 },
  ],
  timeline: [
    { id: 1, action: RequestAction.APPROVE, statusAfterAction: RequestStatus.PENDING, actorId: 11, actorName: "Đỗ Quốc Bảo", comment: null, createdAt: "2026-04-03T09:15:00" },
  ],
};

// Phase budget mock (dùng để tính health bar)
const MOCK_PHASE = { budgetLimit: 50_000_000, currentSpent: 47_000_000 };
```

### 🧩 State shape
```typescript
const { id } = use(params);  // Next.js 16 async params
const router = useRouter();
const [request, setRequest] = useState<RequestDetailResponse | null>(null);
const [loading, setLoading] = useState(true);
const [showApproveModal, setShowApproveModal] = useState(false);
const [showRejectModal, setShowRejectModal] = useState(false);
const [approveComment, setApproveComment] = useState("");
const [approvedAmount, setApprovedAmount] = useState("");
const [rejectReason, setRejectReason] = useState("");
const [submitting, setSubmitting] = useState(false);
const [actionError, setActionError] = useState<string | null>(null);
```

### 🖥️ UI layout
1. **Breadcrumb**: "Duyệt yêu cầu" → `/team-leader/approvals` / `{requestCode}`
2. **Header card**: requestCode (lớn, mono), type badge, status badge, amount (lớn VND), createdAt
3. **Requester block**: avatar placeholder (initials), requesterName, requesterId/email
4. **Details grid 2-col**: Mô tả | Dự án | Phase | Danh mục
5. **Budget health bar** (quan trọng):
   - Title: "Sức khỏe ngân sách Phase: {phaseName}"
   - Bar: phần `currentSpent` (xanh/vàng/đỏ) + phần `request.amount` (màu nhạt hơn — pending)
   - Label: "{currentSpent VND} đã dùng + {amount VND} yêu cầu = {total VND} / {budgetLimit VND}"
   - Nếu vượt budget: banner cảnh báo đỏ "⚠ Yêu cầu này vượt ngân sách phase — xem xét kỹ trước khi duyệt"
6. **Attachments**: grid 2 cols — file card với icon theo type (PDF/image/excel/doc), fileName, fileSize, link download
7. **Timeline**: vertical timeline `request.timeline[]` — icon action + actorName + comment + date
8. **Action bar** (chỉ khi `status === PENDING`):
   - Button "Duyệt" (green) → open Approve modal
   - Button "Từ chối" (red) → open Reject modal

### ⚙️ Approve modal
```
Title: "Xác nhận duyệt yêu cầu"
- Info: {requestCode} — {requesterName}
- Input số tiền duyệt (optional, default = request.amount, type=number, min=1, max=request.amount)
- Textarea ghi chú (optional, placeholder "Nhận xét của bạn...")
- Error message nếu actionError
- Buttons: "Hủy" | "Xác nhận duyệt" (green, disabled khi submitting)
```

### ⚙️ Reject modal
```
Title: "Từ chối yêu cầu — {requestCode}"
- Textarea lý do (required, min 10 chars)
- Chips gợi ý lý do: "Thiếu chứng từ" | "Số tiền không hợp lý" | "Không đúng danh mục" | "Vượt ngân sách"
  → click chip → append vào textarea
- Error message nếu actionError
- Buttons: "Hủy" | "Xác nhận từ chối" (red, disabled nếu reason.trim().length < 10 || submitting)
```

### ⚙️ Approve/Reject handlers
```typescript
// Approve:
// const body: TLApproveBody = {
//   comment: approveComment.trim() || undefined,
//   approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
// };
// await api.post<TLApproveResponse>(`/api/v1/team-leader/approvals/${id}/approve`, body);
// TODO mock: console.log("MOCK approve", body); → redirect

// Reject:
// const body: TLRejectBody = { reason: rejectReason.trim() };
// await api.post<TLRejectResponse>(`/api/v1/team-leader/approvals/${id}/reject`, body);
// TODO mock: console.log("MOCK reject", body); → redirect

// Sau cả 2: router.push("/team-leader/approvals")
```

---

## Prompt 3 — Team Leader Projects List

### 🎯 Mục tiêu
Page `/team-leader/projects`: danh sách dự án TL phụ trách. Filter theo status + search. Card hiển thị budget burn rate, phase hiện tại, số thành viên. Click → detail page.

### 📁 Target file
`app/(dashboard)/team-leader/projects/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\projects-list-page.tsx` — grid layout, MetricCard, budget burn bar, status badge

### ⚠️ Business rules
- TL KHÔNG tạo project (Manager tạo, TL được assign)
- TL CÓ THỂ: tạo/sửa phase, cập nhật category budget, thêm/xóa members
- Endpoint TL khác Employee: `GET /team-leader/projects` trả `TLProjectListItem` (có `availableBudget`)

### 📦 Types
```typescript
import {
  TLProjectListItem, TLProjectFilterParams,
  PaginatedResponse, ProjectStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/team-leader/projects` | Sprint 4 |
| Query params | `status`, `search`, `page`, `limit=12` | |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 4 is complete
const MOCK_PROJECTS: TLProjectListItem[] = [
  {
    id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ",
    status: "ACTIVE", totalBudget: 150_000_000, availableBudget: 88_500_000,
    totalSpent: 61_500_000, memberCount: 5, currentPhaseId: 1,
    currentPhaseName: "Phase 1 - Phân tích", createdAt: "2026-01-10T08:00:00",
  },
  {
    id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng",
    status: "ACTIVE", totalBudget: 80_000_000, availableBudget: 62_500_000,
    totalSpent: 17_500_000, memberCount: 3, currentPhaseId: 3,
    currentPhaseName: "Phase 1 - Triển khai", createdAt: "2026-02-15T08:00:00",
  },
  {
    id: 3, projectCode: "PRJ-IT-003", name: "Nghiên cứu AI integration",
    status: "PLANNING", totalBudget: 50_000_000, availableBudget: 50_000_000,
    totalSpent: 0, memberCount: 2, currentPhaseId: null,
    currentPhaseName: null, createdAt: "2026-03-20T08:00:00",
  },
  {
    id: 4, projectCode: "PRJ-IT-004", name: "Migration legacy system",
    status: "PAUSED", totalBudget: 120_000_000, availableBudget: 45_000_000,
    totalSpent: 75_000_000, memberCount: 4, currentPhaseId: 5,
    currentPhaseName: "Phase 2 - Migration", createdAt: "2025-11-01T08:00:00",
  },
];
```

### 🖥️ UI layout
1. **Header**: "Dự án của tôi" + badge `{total} dự án`
2. **Filter bar**: Status tabs (Tất cả | Đang hoạt động | Lập kế hoạch | Tạm dừng | Đã đóng) + search input
3. **Grid 3-col (lg)**: mỗi card hiển thị:
   - projectCode (mono) + status badge (ACTIVE=emerald, PLANNING=sky, PAUSED=amber, CLOSED=slate)
   - project name (lớn)
   - currentPhaseName (nếu có) hoặc "Chưa có phase"
   - Budget burn bar: `totalSpent/totalBudget*100`% — <65% emerald, 65-84% amber, ≥85% rose
   - Labels: "{totalSpent VND} / {totalBudget VND}" + "{burn}%"
   - availableBudget VND (màu xanh)
   - memberCount icon users
   - Click card → `/team-leader/projects/${id}`
4. **Empty state**: icon folder + "Bạn chưa được phân công dự án nào"
5. **Loading**: skeleton grid

---

## Prompt 4 — Team Leader Project Detail (Phases / Categories / Members)

### 🎯 Mục tiêu
Page `/team-leader/projects/[id]`: full project management. 3 tabs: **Phases** (tạo/sửa phase, set status), **Ngân sách** (category budget allocation per phase), **Thành viên** (add/remove/update position). Thêm nút "Xin cấp vốn" → tạo PROJECT_TOPUP request (Flow 2).

### 📁 Target file
`app/(dashboard)/team-leader/projects/[id]/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\project-detail-page.tsx` — tabs layout, phase cards, member list, add member dialog

### ⚠️ Business rules
- Tab Phases: TL có thể POST phase mới, PUT (đổi tên/budget/endDate/status)
- Tab Ngân sách: TL phân bổ category budget cho từng phase — `PUT /team-leader/projects/:id/categories`
- Tab Thành viên: TL add member (từ available-members), set position, remove member
- "Xin cấp vốn" → `POST /requests {type: PROJECT_TOPUP, projectId: id, amount}`
- `TLProjectDetailResponse = ProjectDetailResponse` (alias, cùng shape)

### 📦 Types
```typescript
import {
  TLProjectDetailResponse, ProjectPhaseResponse, ProjectMemberResponse,
  PhaseCategoriesResponse, CategoryBudgetResponse, ExpenseCategoryResponse,
  AvailableMemberResponse,
  CreatePhaseBody, UpdatePhaseBody,
  AddMemberBody, UpdateMemberBody, UpdateCategoryBudgetBody,
  PhaseStatus, ProjectRole, ProjectStatus,
  RequestType,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
import { use } from "react";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/team-leader/projects/:id` | Sprint 4 |
| POST | `/api/v1/team-leader/projects/:id/phases` | Sprint 4 |
| PUT | `/api/v1/team-leader/projects/:id/phases/:phaseId` | Sprint 4 |
| GET | `/api/v1/team-leader/projects/:id/categories?phaseId=` | Sprint 4 |
| PUT | `/api/v1/team-leader/projects/:id/categories` | Sprint 4 |
| GET | `/api/v1/team-leader/projects/:id/available-members` | Sprint 4 |
| POST | `/api/v1/team-leader/projects/:id/members` | Sprint 4 |
| PUT | `/api/v1/team-leader/projects/:id/members/:userId` | Sprint 4 |
| DELETE | `/api/v1/team-leader/projects/:id/members/:userId` | Sprint 4 |
| GET | `/api/v1/team-leader/expense-categories` | Sprint 4 |
| POST | `/api/v1/requests` body={type:PROJECT_TOPUP, projectId, amount} | Sprint 5 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 4 is complete
const MOCK_PROJECT: TLProjectDetailResponse = {
  id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ",
  description: "Xây dựng hệ thống quản lý tài chính nội bộ cho toàn công ty, tích hợp ví điện tử và workflow phê duyệt.",
  status: ProjectStatus.ACTIVE, totalBudget: 150_000_000, availableBudget: 88_500_000,
  totalSpent: 61_500_000, departmentId: 1, managerId: 5, currentPhaseId: 1,
  phases: [
    { id: 1, phaseCode: "PH-001", name: "Phase 1 - Phân tích", budgetLimit: 50_000_000, currentSpent: 47_000_000, status: PhaseStatus.ACTIVE, startDate: "2026-01-10", endDate: "2026-03-31" },
    { id: 2, phaseCode: "PH-002", name: "Phase 2 - Phát triển", budgetLimit: 80_000_000, currentSpent: 14_500_000, status: PhaseStatus.ACTIVE, startDate: "2026-04-01", endDate: "2026-07-31" },
    { id: 3, phaseCode: "PH-003", name: "Phase 3 - Triển khai", budgetLimit: 20_000_000, currentSpent: 0, status: PhaseStatus.ACTIVE, startDate: "2026-08-01", endDate: "2026-09-30" },
  ],
  members: [
    { userId: 11, fullName: "Đỗ Quốc Bảo", avatar: null, employeeCode: "EMP001", projectRole: ProjectRole.LEADER, position: "Tech Lead", joinedAt: "2026-01-10T08:00:00" },
    { userId: 12, fullName: "Vũ Thị Lan", avatar: null, employeeCode: "EMP002", projectRole: ProjectRole.MEMBER, position: "Backend Developer", joinedAt: "2026-01-15T08:00:00" },
    { userId: 13, fullName: "Phạm Văn Đức", avatar: null, employeeCode: "EMP003", projectRole: ProjectRole.MEMBER, position: "QA Engineer", joinedAt: "2026-01-20T08:00:00" },
  ],
  createdAt: "2026-01-10T08:00:00", updatedAt: "2026-04-01T08:00:00",
};

const MOCK_CATEGORIES: PhaseCategoriesResponse = {
  projectId: 1, phaseId: 1, phaseName: "Phase 1 - Phân tích",
  categories: [
    { categoryId: 1, categoryName: "Thiết bị & Phần cứng", budgetLimit: 20_000_000, currentSpent: 18_500_000, remaining: 1_500_000 },
    { categoryId: 2, categoryName: "Di chuyển & Công tác", budgetLimit: 10_000_000, currentSpent: 8_200_000, remaining: 1_800_000 },
    { categoryId: 3, categoryName: "Đào tạo & Phát triển", budgetLimit: 15_000_000, currentSpent: 14_300_000, remaining: 700_000 },
    { categoryId: 4, categoryName: "Ăn uống & Tiếp khách", budgetLimit: 5_000_000, currentSpent: 6_000_000, remaining: -1_000_000 },
  ],
};

const MOCK_AVAILABLE_MEMBERS: AvailableMemberResponse[] = [
  { id: 14, fullName: "Nguyễn Thị Minh", employeeCode: "EMP004", avatar: null, email: "emp.fin1@ifms.vn", jobTitle: "Business Analyst" },
  { id: 15, fullName: "Trần Văn Nam", employeeCode: "EMP005", avatar: null, email: "emp.it5@ifms.vn", jobTitle: "DevOps Engineer" },
];
```

### 🖥️ UI layout
1. **Header**: projectCode + project name + status badge + description
2. **Summary row**: totalBudget | totalSpent | availableBudget | phase hiện tại | số members
3. **Budget bar tổng** + nút "Xin cấp vốn" (outline button, mở input modal amount → POST PROJECT_TOPUP)
4. **Tabs** (3 tabs):
   - **Tab: Phases** — list phases dưới dạng cards:
     - phaseCode + phaseName + status badge (ACTIVE=emerald, CLOSED=slate)
     - Budget bar: `currentSpent/budgetLimit*100`%
     - startDate → endDate
     - Nút "Sửa" → mở edit phase modal (UpdatePhaseBody: name, budgetLimit, endDate, status)
     - Nút "+" ở header → mở create phase modal (CreatePhaseBody: name, budgetLimit, startDate, endDate)
   - **Tab: Ngân sách** — phase selector dropdown → hiển thị categories cho phase đó:
     - Table: Danh mục | Ngân sách | Đã dùng | Còn lại | Burn %
     - Remaining âm → text-rose-600 bold
     - Nút "Cập nhật ngân sách" → edit mode: inline input budgetLimit cho từng category → POST save
   - **Tab: Thành viên** — list members:
     - Avatar placeholder (initials) + fullName + employeeCode + position + projectRole badge (LEADER=gold, MEMBER=slate)
     - Nút "Sửa" → update position modal
     - Nút "Xóa" → confirm dialog → DELETE
     - Nút "Thêm thành viên" → search available-members (autocomplete) → chọn + nhập position → ADD
5. **Back button**: "← Quay lại" → `/team-leader/projects`

---

## Prompt 5 — Team Leader Team Overview

### 🎯 Mục tiêu
Page `/team-leader/team`: danh sách thành viên trong nhóm TL phụ trách. Filter theo project + search. Click member → slide-in panel hoặc detail modal: xem thông tin, debtBalance, pendingRequests, danh sách dự án của member.

### 📁 Target file
`app/(dashboard)/team-leader/team/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\department-page.tsx` — danh sách nhân viên với avatar, badge, detail slide-in (tham khảo layout, KHÔNG copy role logic)

### 📦 Types
```typescript
import {
  TLTeamMemberListItem, TLTeamMemberDetailResponse, TLTeamMemberFilterParams,
  PaginatedResponse, TeamMemberProject, TeamMemberRecentRequest,
  RequestType, RequestStatus,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/team-leader/team-members` | Sprint 5 |
| GET | `/api/v1/team-leader/team-members/:userId` | Sprint 5 |
| Query params | `projectId`, `search`, `page`, `limit=20` | |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 5 is complete
const MOCK_MEMBERS: TLTeamMemberListItem[] = [
  {
    id: 11, fullName: "Đỗ Quốc Bảo", email: "emp.it1@ifms.vn",
    employeeCode: "EMP001", avatar: null, jobTitle: "Frontend Developer",
    status: "ACTIVE", debtBalance: 2_500_000, pendingRequestsCount: 2,
    projects: [
      { projectId: 1, projectCode: "PRJ-IT-001", projectName: "Hệ thống quản lý nội bộ", position: "Tech Lead" },
      { projectId: 2, projectCode: "PRJ-IT-002", projectName: "Nâng cấp hạ tầng mạng", position: "Developer" },
    ],
  },
  {
    id: 12, fullName: "Vũ Thị Lan", email: "emp.it2@ifms.vn",
    employeeCode: "EMP002", avatar: null, jobTitle: "Backend Developer",
    status: "ACTIVE", debtBalance: 0, pendingRequestsCount: 1,
    projects: [
      { projectId: 1, projectCode: "PRJ-IT-001", projectName: "Hệ thống quản lý nội bộ", position: "Backend Developer" },
    ],
  },
  {
    id: 13, fullName: "Phạm Văn Đức", email: "emp.sales1@ifms.vn",
    employeeCode: "EMP003", avatar: null, jobTitle: "QA Engineer",
    status: "ACTIVE", debtBalance: 1_200_000, pendingRequestsCount: 0,
    projects: [
      { projectId: 1, projectCode: "PRJ-IT-001", projectName: "Hệ thống quản lý nội bộ", position: "QA" },
    ],
  },
];

const MOCK_MEMBER_DETAIL: TLTeamMemberDetailResponse = {
  id: 11, fullName: "Đỗ Quốc Bảo", email: "emp.it1@ifms.vn",
  employeeCode: "EMP001", avatar: null, jobTitle: "Frontend Developer",
  phoneNumber: "0901234567", status: "ACTIVE", debtBalance: 2_500_000,
  pendingRequestsCount: 2,
  projects: [
    { projectId: 1, projectCode: "PRJ-IT-001", projectName: "Hệ thống quản lý nội bộ", position: "Tech Lead", joinedAt: "2026-01-10T08:00:00" },
    { projectId: 2, projectCode: "PRJ-IT-002", projectName: "Nâng cấp hạ tầng mạng", position: "Developer", joinedAt: "2026-02-15T08:00:00" },
  ],
  recentRequests: [
    { id: 1, requestCode: "REQ-2026-0041", type: RequestType.ADVANCE, amount: 3_500_000, status: RequestStatus.PENDING, projectCode: "PRJ-IT-001", categoryName: "Thiết bị & Phần cứng", createdAt: "2026-04-03T09:15:00" },
    { id: 2, requestCode: "REQ-2026-0035", type: RequestType.EXPENSE, amount: 850_000, status: RequestStatus.PAID, projectCode: "PRJ-IT-001", categoryName: "Di chuyển & Công tác", createdAt: "2026-03-28T14:00:00" },
  ],
};
```

### 🧩 State shape
```typescript
const [members, setMembers] = useState<TLTeamMemberListItem[]>([]);
const [total, setTotal] = useState(0);
const [loading, setLoading] = useState(true);
const [selectedMember, setSelectedMember] = useState<TLTeamMemberDetailResponse | null>(null);
const [detailLoading, setDetailLoading] = useState(false);
const [showDetail, setShowDetail] = useState(false);
const search = searchParams.get("search") || "";
const projectFilter = searchParams.get("projectId") || "";
```

### 🖥️ UI layout
1. **Header**: "Thành viên nhóm" + badge `{total} thành viên`
2. **Filter bar**: search input + (optional) project filter dropdown
3. **Member grid (2-3 cols)**:
   - Avatar placeholder (initials 2 chữ, màu random theo ID)
   - fullName + jobTitle + employeeCode
   - Status badge (ACTIVE=emerald, LOCKED=rose)
   - debtBalance: nếu > 0 → badge đỏ "Dư nợ {VND}"
   - pendingRequestsCount: nếu > 0 → badge amber
   - Projects: pills tên project (max 2 + "... +N")
   - Click card → load member detail → mở slide-in panel (right side, 400px)
4. **Detail panel (slide-in)**:
   - Header: avatar + fullName + employeeCode + jobTitle + email + phone
   - debtBalance VND (nổi bật nếu > 0)
   - Section "Dự án tham gia": list project + position + joinedAt
   - Section "Yêu cầu gần đây": list 5 requests mới nhất với type badge + amount + status
5. **Loading**: skeleton grid

---

*End of Tier 2 prompts*
