# CODEX Prompts — Tier 5: ACCOUNTANT

> **Sprint**: 6-7 (APIs chưa sẵn sàng → dùng mock-first pattern)
> **Role**: `ACCOUNTANT`
> **Business**: Giải ngân Flow 1 (nhập PIN), quản lý bảng lương (import Excel, auto-netting, run payroll), sổ cái double-entry, xem System Fund
>
> ⚠️ Accountant là role phức tạp nhất. Design ref `d:\src` rất chi tiết cho role này — tham khảo kỹ UI patterns (ComplianceChecklist, VerificationSheet, ReceiptViewer, TransactionInspectorSheet).

---

## Quy ước bắt buộc (giống Tier 2-4)

- Types: `@/types` barrel only | API: `api` từ `@/lib/api-client`
- `"use client"` ở đầu file | Tailwind v4 | inline SVG | UI text tiếng Việt
- Mock-first: comment real API, dùng mock, ghi `// TODO: Replace when Sprint 6-7 is complete`
- `use(params)` cho dynamic routes | URL search params cho filter/pagination
- `npm run lint` — 0 errors

---

## Prompt 0 — Accountant Dashboard

### 🎯 Mục tiêu
Replace stub `components/dashboard/accountant-dashboard.tsx` với dashboard tổng quan tài chính: System Fund health, pending disbursements count, monthly inflow/outflow, payroll status.

### 📁 Target file
`components/dashboard/accountant-dashboard.tsx`

### 🎨 Design reference
`d:\src\components\pages\accountant-finance-dashboard-page.tsx` — SystemFundWidget (fund balance + health), pending disbursements list, monthly chart, payroll status card

### ⚠️ Business rules
- Accountant giải ngân Flow 1 (PENDING_ACCOUNTANT_EXECUTION → PAID), không duyệt YC
- Accountant quản lý payroll và sổ cái
- Accountant và Admin đều có access `/admin/system-fund`

### 📦 Types
```typescript
import {
  AccountantDashboardResponse, DisbursementListItem,
  PayrollPeriodListItem, PayrollStatus,
} from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/accountant/disbursements?limit=3&status=PENDING_ACCOUNTANT_EXECUTION` | Sprint 6 |
| GET | `/api/v1/accountant/payroll?limit=1` | Sprint 7 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 6-7 is complete
const MOCK_DASHBOARD: AccountantDashboardResponse = {
  systemFundBalance: 1_248_500_000,
  pendingDisbursementsCount: 4,
  monthlyInflow: 320_000_000,
  monthlyOutflow: 187_500_000,
  payrollStatus: {
    latestPeriod: "Tháng 03/2026",
    status: "COMPLETED",
  },
};

// approver không có trong DisbursementListItem — dùng local extension
// DisbursementListItem.requester là DisbursementRequester (có bankName, bankAccountNum, bankAccountOwner, departmentName)
// DisbursementListItem.project = { id, projectCode, name }, .phase = ApprovalPhase
type DisbursementListViewItem = DisbursementListItem & {
  approver?: { fullName: string; approvedAt: string };
};

const MOCK_PENDING_DISBURSEMENTS: DisbursementListViewItem[] = [
  {
    id: 1, requestCode: "REQ-2026-0041", type: RequestType.ADVANCE,
    status: "PENDING_ACCOUNTANT_EXECUTION", amount: 3_500_000, approvedAmount: 3_500_000,
    description: "Mua vật tư thiết bị thí nghiệm cho phase 1.",
    requester: { id: 11, fullName: "Đỗ Quốc Bảo", avatar: null, employeeCode: "EMP001", jobTitle: "Frontend Developer", departmentName: "Phòng IT", bankName: "Vietcombank", bankAccountNum: "001100220011", bankAccountOwner: "DO QUOC BAO" },
    approver: { fullName: "Hoàng Minh Tuấn", approvedAt: "2026-04-03T10:00:00" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: { id: 1, phaseCode: "PH-001", name: "Phase 1 - Phân tích", budgetLimit: 50_000_000, currentSpent: 47_000_000 },
    attachments: [], createdAt: "2026-04-03T09:15:00",
  },
  {
    id: 2, requestCode: "REQ-2026-0042", type: RequestType.EXPENSE,
    status: "PENDING_ACCOUNTANT_EXECUTION", amount: 850_000, approvedAmount: 850_000,
    description: "Chi phí mua license công cụ.",
    requester: { id: 12, fullName: "Vũ Thị Lan", avatar: null, employeeCode: "EMP002", jobTitle: "Backend Developer", departmentName: "Phòng IT", bankName: "BIDV", bankAccountNum: "102030405060", bankAccountOwner: "VU THI LAN" },
    approver: { fullName: "Hoàng Minh Tuấn", approvedAt: "2026-04-03T09:30:00" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: { id: 1, phaseCode: "PH-001", name: "Phase 1 - Phân tích", budgetLimit: 50_000_000, currentSpent: 47_000_000 },
    attachments: [], createdAt: "2026-04-02T14:30:00",
  },
  {
    id: 3, requestCode: "REQ-2026-0038", type: RequestType.REIMBURSE,
    status: "PENDING_ACCOUNTANT_EXECUTION", amount: 1_200_000, approvedAmount: 1_200_000,
    description: "Hoàn ứng chi phí ăn uống team.",
    requester: { id: 13, fullName: "Phạm Văn Đức", avatar: null, employeeCode: "EMP003", jobTitle: "QA Engineer", departmentName: "Phòng IT", bankName: "Techcombank", bankAccountNum: "190001234567", bankAccountOwner: "PHAM VAN DUC" },
    approver: { fullName: "Hoàng Minh Tuấn", approvedAt: "2026-04-02T16:00:00" },
    project: { id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng" },
    phase: { id: 3, phaseCode: "PH-001", name: "Phase 1 - Triển khai", budgetLimit: 30_000_000, currentSpent: 8_500_000 },
    attachments: [], createdAt: "2026-04-01T10:00:00",
  },
];
```

### 🖥️ UI layout
1. **Header**: "Bảng điều khiển Kế toán" + role badge
2. **System Fund Widget** (nổi bật, chiếm 1 hàng hoặc col-span-2):
   - Balance lớn: `systemFundBalance` VND
   - Health badge: ≥500M = HEALTHY (emerald), 100-500M = LOW (amber), <100M = CRITICAL (rose)
   - Bar: visualize fund level
3. **Stat row (3 cards)**:
   - Chờ giải ngân: `pendingDisbursementsCount` — amber — link `/accountant/disbursements`
   - Dòng tiền vào tháng này: `monthlyInflow` VND — emerald
   - Dòng tiền ra tháng này: `monthlyOutflow` VND — rose
4. **2-col layout**:
   - Left: "Chờ giải ngân" — list 3 items: requester + type badge + approvedAmount + time-ago. Link "Xem tất cả →"
   - Right: "Kỳ lương gần nhất" — payrollStatus.latestPeriod + status badge (DRAFT=slate, PROCESSING=amber, COMPLETED=emerald). Link "Quản lý lương →"
5. **Quick links**: Sổ cái | Quỹ hệ thống

---

## Prompt 1 — Accountant Disbursements List

### 🎯 Mục tiêu
Page `/accountant/disbursements`: danh sách requests đã được TL duyệt, đang chờ Accountant giải ngân (`PENDING_ACCOUNTANT_EXECUTION`). Filter type + search. Click row → detail page (nhập PIN để giải ngân).

### 📁 Target file
`app/(dashboard)/accountant/disbursements/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\disbursements-page.tsx` — list với SystemFundWidget ở sidebar, filter, table rows với compliance indicator

### ⚠️ Business rules
- Chỉ hiển thị `status = PENDING_ACCOUNTANT_EXECUTION` (đã được TL approve, chờ Accountant)
- `approvedAmount` (do TL xác nhận) có thể ≠ `amount` gốc
- Accountant có thể từ chối giải ngân (reject) nếu chứng từ không hợp lệ

### 📦 Types
```typescript
import {
  DisbursementListItem, DisbursementFilterParams,
  PaginatedResponse, RequestType,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/accountant/disbursements` | Sprint 6 |
| Query params | `type`, `search`, `page`, `limit=10` | |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 6 is complete
// DisbursementListItem shape: requester = DisbursementRequester (có bankName, bankAccountNum, bankAccountOwner, departmentName — KHÔNG có email)
// project = { id, projectCode, name }, phase = { id, phaseCode, name }
// KHÔNG có approver field → dùng local extension nếu cần hiển thị "Đã duyệt bởi"
type DisbursementListViewItem = DisbursementListItem & {
  approver?: { fullName: string; approvedAt: string };
};

const MOCK_DISBURSEMENTS: DisbursementListViewItem[] = [
  {
    id: 1, requestCode: "REQ-2026-0041", type: RequestType.ADVANCE,
    status: "PENDING_ACCOUNTANT_EXECUTION", amount: 3_500_000, approvedAmount: 3_500_000,
    description: "Mua vật tư thiết bị thí nghiệm cho phase 1.",
    requester: { id: 11, fullName: "Đỗ Quốc Bảo", avatar: null, employeeCode: "EMP001", jobTitle: "Frontend Developer", departmentName: "Phòng IT", bankName: "Vietcombank", bankAccountNum: "001100220011", bankAccountOwner: "DO QUOC BAO" },
    approver: { fullName: "Hoàng Minh Tuấn", approvedAt: "2026-04-03T10:00:00" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: { id: 1, phaseCode: "PH-001", name: "Phase 1 - Phân tích" },
    attachments: [], createdAt: "2026-04-03T09:15:00",
  },
  {
    id: 2, requestCode: "REQ-2026-0042", type: RequestType.EXPENSE,
    status: "PENDING_ACCOUNTANT_EXECUTION", amount: 850_000, approvedAmount: 850_000,
    description: "Chi phí mua license công cụ.",
    requester: { id: 12, fullName: "Vũ Thị Lan", avatar: null, employeeCode: "EMP002", jobTitle: "Backend Developer", departmentName: "Phòng IT", bankName: "BIDV", bankAccountNum: "102030405060", bankAccountOwner: "VU THI LAN" },
    approver: { fullName: "Hoàng Minh Tuấn", approvedAt: "2026-04-03T09:30:00" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: { id: 1, phaseCode: "PH-001", name: "Phase 1 - Phân tích" },
    attachments: [], createdAt: "2026-04-02T14:30:00",
  },
  {
    id: 3, requestCode: "REQ-2026-0038", type: RequestType.REIMBURSE,
    status: "PENDING_ACCOUNTANT_EXECUTION", amount: 1_200_000, approvedAmount: 1_200_000,
    description: "Hoàn ứng chi phí ăn uống team.",
    requester: { id: 13, fullName: "Phạm Văn Đức", avatar: null, employeeCode: "EMP003", jobTitle: "QA Engineer", departmentName: "Phòng IT", bankName: "Techcombank", bankAccountNum: "190001234567", bankAccountOwner: "PHAM VAN DUC" },
    approver: { fullName: "Hoàng Minh Tuấn", approvedAt: "2026-04-02T16:00:00" },
    project: { id: 2, projectCode: "PRJ-IT-002", name: "Nâng cấp hạ tầng mạng" },
    phase: { id: 3, phaseCode: "PH-001", name: "Phase 1 - Triển khai" },
    attachments: [], createdAt: "2026-04-01T10:00:00",
  },
  {
    id: 4, requestCode: "REQ-2026-0035", type: RequestType.ADVANCE,
    status: "PENDING_ACCOUNTANT_EXECUTION", amount: 5_000_000, approvedAmount: 4_500_000,
    description: "Ứng trước chi phí đào tạo nội bộ.",
    requester: { id: 11, fullName: "Đỗ Quốc Bảo", avatar: null, employeeCode: "EMP001", jobTitle: "Frontend Developer", departmentName: "Phòng IT", bankName: "Vietcombank", bankAccountNum: "001100220011", bankAccountOwner: "DO QUOC BAO" },
    approver: { fullName: "Hoàng Minh Tuấn", approvedAt: "2026-04-01T14:00:00" },
    project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
    phase: { id: 2, phaseCode: "PH-002", name: "Phase 2 - Phát triển" },
    attachments: [], createdAt: "2026-03-31T11:00:00",
  },
];
```

### 🖥️ UI layout
1. **Header**: "Giải ngân" + badge `{total} chờ xử lý`
2. **System Fund quick bar** (nhỏ ở đầu trang): "Quỹ hệ thống: X VND" + health badge
3. **Filter bar**: Type tabs (Tất cả / Tạm ứng / Chi phí / Hoàn ứng) + search
4. **Card list** mỗi disbursement:
   - requestCode (mono) + type badge (ADVANCE=violet, EXPENSE=sky, REIMBURSE=amber)
   - requester.fullName + employeeCode + projectName
   - Duyệt bởi: approver.fullName + approvedAt
   - Amount (gốc) → Số tiền giải ngân: `approvedAmount` VND (highlight nếu khác amount)
   - Nút "Xử lý →"
5. **Empty state** + pagination

---

## Prompt 2 — Accountant Disbursement Detail + Giải ngân (PIN)

### 🎯 Mục tiêu
Page `/accountant/disbursements/[id]`: chi tiết disbursement với VerificationSheet layout (2 cột: thông tin request + receipt viewer). ComplianceChecklist (5 items phải check hết mới unlock nút giải ngân). Nhập PIN 5 số để xác nhận. Nút "Từ chối" nếu chứng từ không hợp lệ.

### 📁 Target file
`app/(dashboard)/accountant/disbursements/[id]/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\disbursements-page.tsx` — **VerificationSheet** (2-col: left=request details + approval chain, right=ReceiptViewer + checklist), **ComplianceChecklist**, **PIN input** 5 số (settings/pin-modal.tsx)

### ⚠️ Business rules
- Giải ngân body: `DisburseBody { pin: string }` — PIN 5 số của Accountant
- Sau giải ngân: Project Fund → Personal Wallet (Transaction `REQUEST_PAYMENT`)
- Backend trả `DisburseResponse { id, requestCode, status: "PAID", transactionCode, amount, disbursedAt }` — KHÔNG có `walletBalance`
- Nếu PIN sai → `ApiError` với message "Mã PIN không đúng"
- Reject body: `DisbursementRejectBody { reason: string }`

### 📦 Types
```typescript
import {
  DisbursementDetailResponse, DisburseBody, DisburseResponse,
  DisbursementRejectBody, DisbursementRejectResponse,
  RequestAction, RequestStatus, RequestType,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
import { use } from "react";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/accountant/disbursements/:id` | Sprint 6 |
| POST | `/api/v1/accountant/disbursements/:id/disburse` | Sprint 6 |
| POST | `/api/v1/accountant/disbursements/:id/reject` | Sprint 6 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 6 is complete
// DisbursementDetailResponse shape:
//   requester = DisbursementRequester (bankName, bankAccountNum, bankAccountOwner, departmentName — KHÔNG có email)
//   project = { id, projectCode, name }
//   phase = ApprovalPhase { id, phaseCode, name, budgetLimit, currentSpent }
//   KHÔNG có approver field — thông tin approver lấy từ timeline (action=APPROVE, actorName)
//   KHÔNG có flat projectCode/projectName/phaseCode/phaseName/categoryName
const MOCK_DETAIL: DisbursementDetailResponse = {
  id: 1, requestCode: "REQ-2026-0041", type: RequestType.ADVANCE,
  status: "PENDING_ACCOUNTANT_EXECUTION", amount: 3_500_000, approvedAmount: 3_500_000,
  description: "Mua vật tư thiết bị thí nghiệm phục vụ dự án. Bao gồm màn hình đo kiểm, cáp kết nối và bộ nguồn dự phòng UPS.",
  rejectReason: null,
  requester: { id: 11, fullName: "Đỗ Quốc Bảo", avatar: null, employeeCode: "EMP001", jobTitle: "Frontend Developer", departmentName: "Phòng IT", bankName: "Vietcombank", bankAccountNum: "001100220011", bankAccountOwner: "DO QUOC BAO" },
  project: { id: 1, projectCode: "PRJ-IT-001", name: "Hệ thống quản lý nội bộ" },
  phase: { id: 1, phaseCode: "PH-001", name: "Phase 1 - Phân tích", budgetLimit: 50_000_000, currentSpent: 47_000_000 },
  attachments: [
    { fileId: 1, fileName: "hoa_don_thiet_bi.pdf", url: "#", fileType: "application/pdf", size: 245_000 },
    { fileId: 2, fileName: "bao_gia_supplier.jpg", url: "#", fileType: "image/jpeg", size: 1_200_000 },
  ],
  timeline: [
    // timeline[0] = Employee tạo YC (action APPROVE = bước submit, statusAfterAction = PENDING)
    { id: 1, action: RequestAction.APPROVE, statusAfterAction: RequestStatus.PENDING, actorId: 11, actorName: "Đỗ Quốc Bảo", comment: null, createdAt: "2026-04-03T09:15:00" },
    // timeline[1] = TL duyệt → PENDING_ACCOUNTANT_EXECUTION
    { id: 2, action: RequestAction.APPROVE, statusAfterAction: RequestStatus.PENDING_ACCOUNTANT_EXECUTION, actorId: 4, actorName: "Hoàng Minh Tuấn", comment: "Đồng ý — đây là thiết bị cần thiết", createdAt: "2026-04-03T10:00:00" },
  ],
  createdAt: "2026-04-03T09:15:00",
  updatedAt: "2026-04-03T10:00:00",
};
// Lấy approver từ timeline: timeline.findLast(t => t.action === RequestAction.APPROVE)
```

### 🧩 State shape
```typescript
const { id } = use(params);
const [detail, setDetail] = useState<DisbursementDetailResponse | null>(null);
const [loading, setLoading] = useState(true);

// Compliance checklist — tất cả 5 items phải = true mới unlock nút giải ngân
const [checklist, setChecklist] = useState({
  identityVerified: false,       // Xác nhận danh tính người nhận
  amountVerified: false,         // Số tiền khớp với chứng từ
  attachmentsReviewed: false,    // Đã xem xét tất cả chứng từ
  budgetAvailable: false,        // Ngân sách phase còn đủ
  approvalChainComplete: false,  // Chuỗi phê duyệt hợp lệ
});

// PIN input
const [pin, setPin] = useState("");           // 5 chữ số
const [pinError, setPinError] = useState<string | null>(null);
const [submitting, setSubmitting] = useState(false);
const [showSuccess, setShowSuccess] = useState(false);
const [successData, setSuccessData] = useState<DisburseResponse | null>(null);

// Reject
const [showRejectModal, setShowRejectModal] = useState(false);
const [rejectReason, setRejectReason] = useState("");
```

### 🖥️ UI layout (2-column VerificationSheet style)
**Layout**: `grid grid-cols-1 lg:grid-cols-2 gap-6`

**Cột trái (thông tin request)**:
1. Breadcrumb + header (requestCode, type badge, approvedAmount VND lớn)
2. **Approval chain** — từ `detail.timeline[]`:
   - Step 1: Employee tạo YC (`timeline[0].actorName` + `createdAt`)
   - Step 2: TL duyệt (`timeline[1].actorName` + `timeline[1].createdAt` + `timeline[1].comment`)
   - Step 3: Accountant (current — chờ xử lý, pulsing indicator)
3. Requester info: avatar placeholder + fullName + employeeCode + departmentName + bankName + bankAccountNum (masked) + bankAccountOwner
4. Request details: mô tả + `project.projectCode + " – " + project.name` / `phase.phaseName` (DisbursementDetailResponse không có categoryName — bỏ qua hoặc lấy từ description)
5. **ComplianceChecklist** (5 items, mỗi item là checkbox):
   - ☐ Đã xác nhận danh tính người nhận
   - ☐ Số tiền khớp với chứng từ (approvedAmount = X VND)
   - ☐ Đã xem xét tất cả chứng từ đính kèm
   - ☐ Ngân sách phase còn đủ để giải ngân
   - ☐ Chuỗi phê duyệt đầy đủ và hợp lệ

**Cột phải (chứng từ + hành động)**:
1. **Receipt Viewer** — list attachments dưới dạng cards với preview:
   - PDF → icon document + fileName + fileSize + link "Xem"
   - Image → thumbnail (nếu có URL) hoặc icon + link "Xem"
2. **PIN input block** (chỉ enabled khi tất cả checklist = true):
   - Label: "Nhập mã PIN của bạn để xác nhận giải ngân"
   - 5 ô số riêng biệt (input type="password" maxLength=1, tự focus sang ô tiếp theo)
   - Hoặc 1 input type="password" maxLength=5
   - Error: pinError (ví dụ "Mã PIN không đúng")
   - Nút "Giải ngân {approvedAmount VND}" (green, disabled nếu pin.length < 5 || submitting || !allChecked)
3. **Nút "Từ chối"** (red outline, luôn hiển thị nếu status = PENDING_ACCOUNTANT_EXECUTION)

### ⚙️ Disburse handler
```typescript
async function handleDisburse() {
  setSubmitting(true);
  setPinError(null);
  try {
    const body: DisburseBody = { pin };
    // const res = await api.post<DisburseResponse>(
    //   `/api/v1/accountant/disbursements/${id}/disburse`, body
    // );
    // setSuccessData(res.data);
    // TODO: Replace when Sprint 6 is complete — simulate success
    // DisburseResponse: { id, requestCode, status: "PAID", transactionCode, amount, disbursedAt }
    // walletBalance không có trong DisburseResponse — dùng local extension nếu muốn hiển thị
    setSuccessData({ id: detail!.id, requestCode: detail!.requestCode, status: "PAID", transactionCode: "TXN-2026-0001A", amount: detail!.approvedAmount, disbursedAt: new Date().toISOString() });
    setShowSuccess(true);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 400 || err.status === 401) setPinError(err.apiMessage);
      else setPinError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  } finally {
    setSubmitting(false);
  }
}
```

### ⚙️ Success state
Sau khi giải ngân thành công → hiển thị success overlay/card:
- "✓ Giải ngân thành công"
- Mã GD: `transactionCode`
- Số tiền: `amount` VND
- Thời gian: `disbursedAt`
- Nút "Quay lại danh sách" → `/accountant/disbursements`

---

## Prompt 3 — Accountant Payroll List + Create Period

### 🎯 Mục tiêu
Page `/accountant/payroll`: danh sách kỳ lương. Tạo kỳ lương mới (nhập tháng/năm). Click row → detail page (xử lý lương).

### 📁 Target file
`app/(dashboard)/accountant/payroll/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\payroll-page.tsx` — period list, create period modal

### 📦 Types
```typescript
import {
  PayrollPeriodListItem, PayrollStatus,
  CreatePayrollPeriodBody, PaginatedResponse,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/accountant/payroll` | Sprint 7 |
| POST | `/api/v1/accountant/payroll` | Sprint 7 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 7 is complete
// PayrollPeriodListItem fields: id, periodCode, name, month, year, startDate, endDate,
// status, employeeCount, totalNetPayroll, createdAt, updatedAt
// KHÔNG có: totalGross, totalNet, completedAt
const MOCK_PERIODS: PayrollPeriodListItem[] = [
  { id: 5, periodCode: "PR-2026-03", name: "Lương tháng 03/2026", month: 3, year: 2026, startDate: "2026-03-01", endDate: "2026-03-31", status: PayrollStatus.COMPLETED, employeeCount: 12, totalNetPayroll: 162_500_000, createdAt: "2026-03-28T08:00:00", updatedAt: "2026-04-02T17:00:00" },
  { id: 4, periodCode: "PR-2026-02", name: "Lương tháng 02/2026", month: 2, year: 2026, startDate: "2026-02-01", endDate: "2026-02-28", status: PayrollStatus.COMPLETED, employeeCount: 12, totalNetPayroll: 159_750_000, createdAt: "2026-02-25T08:00:00", updatedAt: "2026-03-03T16:00:00" },
  { id: 3, periodCode: "PR-2026-01", name: "Lương tháng 01/2026", month: 1, year: 2026, startDate: "2026-01-01", endDate: "2026-01-31", status: PayrollStatus.COMPLETED, employeeCount: 11, totalNetPayroll: 154_000_000, createdAt: "2026-01-28T08:00:00", updatedAt: "2026-02-02T15:00:00" },
];

// Kỳ lương tháng 04/2026 chưa tạo — dùng để test create flow
```

### 🖥️ UI layout
1. **Header**: "Quản lý bảng lương" + nút "Tạo kỳ lương mới" (primary)
2. **Period cards** hoặc table (mỗi kỳ):
   - periodCode + name + tháng/năm
   - Status badge: DRAFT=slate, PROCESSING=amber (pulsing), COMPLETED=emerald
   - employeeCount + totalNet VND
   - createdAt + completedAt (nếu COMPLETED)
   - Nút "Xem chi tiết →"
3. **Create Period Modal**:
   - Input: Tên kỳ lương (auto-fill: "Lương tháng MM/YYYY")
   - Select tháng: 1-12
   - Input năm: number, default = năm hiện tại
   - Buttons: Hủy | Tạo kỳ lương

---

## Prompt 4 — Accountant Payroll Detail (Import Excel + Auto-netting + Run)

### 🎯 Mục tiêu
Page `/accountant/payroll/[id]`: xử lý đầy đủ 1 kỳ lương. 4 bước theo thứ tự: **① Upload Excel** → **② Review entries** (sửa từng dòng) → **③ Auto-netting** (tính bù trừ nợ) → **④ Run payroll** (thực hiện chi lương). Mỗi bước enabled tuần tự theo status.

### 📁 Target file
`app/(dashboard)/accountant/payroll/[id]/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\payroll-page.tsx` — multi-step workflow, import modal, entries table, netting summary, run confirmation

### ⚠️ Business rules
- DRAFT → sau import → vẫn DRAFT (có thể import lại, confirm-overwrite nếu đã có data)
- DRAFT → sau auto-netting → vẫn DRAFT (nhưng `advanceDeduct` được tính)
- DRAFT → sau run → COMPLETED (KHÔNG thể undo)
- Auto-netting: tính `advanceDeduct = min(employee.debtBalance, grossSalary)` cho mỗi nhân viên
- Run payroll: foreach payslip → CompanyFund (COMPANY_FUND wallet).debit → Employee Wallet.credit → reduceDebt → Transaction(PAYSLIP_PAYMENT)
- `UpdatePayslipEntryBody { baseSalary?, bonus?, allowance?, deduction?, advanceDeduct? }` — KHÔNG có `grossSalary`

### 📦 Types
```typescript
import {
  PayrollDetailResponse, PayrollEntry, PayrollImportResponse,
  PayrollImportEntry, PayrollImportError, AutoNettingResponse,
  AutoNettingSummaryItem, PayrollRunResponse, PayrollStatus, PayslipStatus,
  UpdatePayslipEntryBody,
} from "@/types";
import { api, ApiError } from "@/lib/api-client";
import { use } from "react";
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/accountant/payroll/:periodId` | Sprint 7 |
| GET | `/api/v1/accountant/payroll/template` | Sprint 7 |
| POST | `/api/v1/accountant/payroll/:periodId/import` | Sprint 7 |
| POST | `/api/v1/accountant/payroll/:periodId/confirm-overwrite` | Sprint 7 |
| POST | `/api/v1/accountant/payroll/:periodId/auto-netting` | Sprint 7 |
| POST | `/api/v1/accountant/payroll/:periodId/run` | Sprint 7 |
| PUT | `/api/v1/accountant/payroll/:periodId/entries/:payslipId` | Sprint 7 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 7 is complete
// PayrollDetailResponse: id, periodCode, name, month, year, startDate, endDate,
// status, employeeCount, totalNetPayroll, entries: PayrollEntry[], createdAt, updatedAt
// KHÔNG có: totalGross, totalNet, completedAt
const MOCK_PERIOD: PayrollDetailResponse = {
  id: 5, periodCode: "PR-2026-03", name: "Lương tháng 03/2026",
  month: 3, year: 2026, startDate: "2026-03-01", endDate: "2026-03-31",
  status: PayrollStatus.DRAFT,
  employeeCount: 0, totalNetPayroll: 0,
  createdAt: "2026-04-01T08:00:00", updatedAt: "2026-04-01T08:00:00",
  entries: [],
};

// PayrollImportResponse: periodId, periodCode, status, totalRows, successCount, errorCount, entries: PayrollImportEntry[], errors: PayrollImportError[], totalNetPayroll
// PayrollImportEntry extends PayrollEntry { importStatus: "ok"|"error", importError: string|null }
// PayrollEntry: id, payslipCode, userId, fullName, avatar, employeeCode, jobTitle, baseSalary, bonus, allowance, deduction, advanceDeduct, finalNetSalary, status: PayslipStatus
// KHÔNG có: success, importedCount, rowNumber, grossSalary, netSalary
const MOCK_IMPORT_ENTRIES: PayrollEntry[] = [
  { id: 201, payslipCode: "PS-2026-03-001", userId: 11, fullName: "Đỗ Quốc Bảo", avatar: null, employeeCode: "EMP001", jobTitle: "Frontend Developer", baseSalary: 13_500_000, bonus: 1_500_000, allowance: 1_500_000, deduction: 500_000, advanceDeduct: 0, finalNetSalary: 16_000_000, status: PayslipStatus.DRAFT },
  { id: 202, payslipCode: "PS-2026-03-002", userId: 12, fullName: "Vũ Thị Lan", avatar: null, employeeCode: "EMP002", jobTitle: "Backend Developer", baseSalary: 13_000_000, bonus: 1_000_000, allowance: 1_000_000, deduction: 400_000, advanceDeduct: 0, finalNetSalary: 14_600_000, status: PayslipStatus.DRAFT },
  { id: 203, payslipCode: "PS-2026-03-003", userId: 13, fullName: "Phạm Văn Đức", avatar: null, employeeCode: "EMP003", jobTitle: "QA Engineer", baseSalary: 11_500_000, bonus: 500_000, allowance: 800_000, deduction: 300_000, advanceDeduct: 0, finalNetSalary: 12_500_000, status: PayslipStatus.DRAFT },
  { id: 204, payslipCode: "PS-2026-03-004", userId: 14, fullName: "Nguyễn Thị Minh", avatar: null, employeeCode: "EMP004", jobTitle: "Business Analyst", baseSalary: 12_600_000, bonus: 700_000, allowance: 1_200_000, deduction: 250_000, advanceDeduct: 0, finalNetSalary: 14_250_000, status: PayslipStatus.DRAFT },
];

// Tạo mock import response trong component (từ MOCK_IMPORT_ENTRIES):
// const entries = MOCK_IMPORT_ENTRIES.map(e => ({ ...e, importStatus: "ok" as const, importError: null }));
// const MOCK_IMPORT_RESULT: PayrollImportResponse = {
//   periodId: 5, periodCode: "PR-2026-03", status: PayrollStatus.DRAFT,
//   totalRows: entries.length, successCount: entries.length, errorCount: 0,
//   entries, errors: [], totalNetPayroll: entries.reduce((s,e) => s + e.finalNetSalary, 0),
// };

// AutoNettingResponse: periodId, periodCode, totalAdvanceDeducted, summary: AutoNettingSummaryItem[]
// AutoNettingSummaryItem: userId, employeeCode, fullName, outstandingDebt, deductedAmount, remainingDebt, note
// KHÔNG có: totalAdvanceDeduct (phải là totalAdvanceDeducted), totalFinalNet, debtBalance, advanceDeduct
const MOCK_NETTING: AutoNettingResponse = {
  periodId: 5, periodCode: "PR-2026-03",
  totalAdvanceDeducted: 3_700_000,
  summary: [
    { userId: 11, employeeCode: "EMP001", fullName: "Đỗ Quốc Bảo", outstandingDebt: 2_500_000, deductedAmount: 2_500_000, remainingDebt: 0, note: "Bù trừ tạm ứng tháng 03" },
    { userId: 12, employeeCode: "EMP002", fullName: "Vũ Thị Lan", outstandingDebt: 0, deductedAmount: 0, remainingDebt: 0, note: "" },
    { userId: 13, employeeCode: "EMP003", fullName: "Phạm Văn Đức", outstandingDebt: 1_200_000, deductedAmount: 1_200_000, remainingDebt: 0, note: "Bù trừ tạm ứng tháng 02" },
    { userId: 14, employeeCode: "EMP004", fullName: "Nguyễn Thị Minh", outstandingDebt: 0, deductedAmount: 0, remainingDebt: 0, note: "" },
  ],
};
```

### 🧩 State shape
```typescript
const { id } = use(params);
const [period, setPeriod] = useState<PayrollDetailResponse | null>(null);
const [loading, setLoading] = useState(true);
const [importResult, setImportResult] = useState<PayrollImportResponse | null>(null);
const [nettingResult, setNettingResult] = useState<AutoNettingResponse | null>(null);
const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
const [uploading, setUploading] = useState(false);
const [netting, setNetting] = useState(false);
const [running, setRunning] = useState(false);
const [showRunConfirm, setShowRunConfirm] = useState(false);
const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null);
```

### 🖥️ UI layout
1. **Header**: periodCode + name + status badge + month/year
2. **Step indicator** (4 bước horizontal):
   - ① Upload Excel → ② Xem danh sách → ③ Tính bù trừ → ④ Chạy lương
   - Active step nổi bật, completed steps có checkmark
3. **Step ①: Upload Excel**:
   - Link "Tải template Excel" → `GET /accountant/payroll/template`
   - Drag & drop zone hoặc input file (accept=".xlsx,.xls")
   - Nút "Tải lên" (disabled nếu không có file) → POST multipart
   - Sau upload: hiển thị `importResult` — success count + error rows (nếu có lỗi → show error table)
   - Nút "Tiếp theo →" (chỉ khi importedCount > 0)
4. **Step ②: Xem & Sửa danh sách**:
   - Table: Mã NV | Họ tên | Lương gross | Phụ cấp | Khấu trừ | Lương net
   - Mỗi row: nút "Sửa" → modal edit `UpdatePayslipEntryBody`
   - Footer: tổng gross + tổng net
   - Nút "← Quay lại" | "Tính bù trừ →"
5. **Step ③: Auto-netting**:
   - Nút "Tính bù trừ nợ tạm ứng" → POST auto-netting
   - Sau khi tính: table `nettingResult.summary`: Mã NV | Họ tên | Dư nợ | Khấu trừ | Lương thực lĩnh
   - Highlight row có `advanceDeduct > 0` (amber)
   - Footer: tổng khấu trừ + tổng thực lĩnh
   - Nút "← Quay lại" | "Xác nhận & Chạy lương →"
6. **Step ④: Chạy lương**:
   - Summary: tổng nhân viên + tổng thực lĩnh VND
   - Warning banner đỏ: "⚠ Thao tác này KHÔNG THỂ HOÀN TÁC. Hệ thống sẽ chi lương cho {count} nhân viên."
   - Nút "Chạy lương ngay" (red) → confirm dialog → POST run
   - Sau run: success page với summary

---

## Prompt 5 — Accountant Ledger (Sổ cái)

### 🎯 Mục tiêu
Page `/accountant/ledger`: sổ cái double-entry — tất cả transactions hệ thống. Filter theo type/date/search. Click row → detail page.

### 📁 Target file
`app/(dashboard)/accountant/ledger/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\ledger-page.tsx` — filter bar (type + date range), transaction table, LedgerSummaryCard (top), export CSV

### ⚠️ Business rules
- Ledger là immutable — chỉ đọc, không sửa
- Transaction types: DEPOSIT | WITHDRAW | REQUEST_PAYMENT | PAYSLIP_PAYMENT | SYSTEM_ADJUSTMENT | DEPT_QUOTA_ALLOCATION | PROJECT_QUOTA_ALLOCATION
- Mỗi transaction có 2 entries double-entry (debit/credit) — hiển thị 1 dòng per transaction

### 📦 Types
```typescript
import {
  TransactionResponse, TransactionType,
  TransactionStatus, ReferenceType,
  LedgerSummaryResponse, PaginatedResponse,
} from "@/types";
import { api } from "@/lib/api-client";
// Không có TransactionFilterParams trong @/types — dùng URL search params trực tiếp
// Query params: type (TransactionType), from/to (YYYY-MM-DD), search, page, limit=20
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/accountant/ledger` | Sprint 7 |
| GET | `/api/v1/accountant/ledger/summary` | Sprint 7 |
| Query params | `type`, `from`, `to`, `search`, `page`, `limit=20` | | ← dùng `from`/`to` (YYYY-MM-DD), KHÔNG phải `startDate`/`endDate`

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 7 is complete
// LedgerSummaryResponse: currentBalance, totalInflow, totalOutflow, transactionCount
const MOCK_SUMMARY: LedgerSummaryResponse = {
  currentBalance: 1_248_500_000,
  totalInflow: 2_500_000_000,
  totalOutflow: 1_251_500_000,
  transactionCount: 6,
};

// TransactionResponse (v3.0): id, transactionCode, type, status, amount, referenceType, referenceId, description, createdAt
// ⚠ KHÔNG có balanceAfter — field này đã bị xóa ở v3.0. Nếu cần hiển thị "số dư sau", dùng LedgerEntryResponse
// ⚠ KHÔNG có referenceCode — dùng local extension nếu muốn hiển thị mã tham chiếu
// TransactionStatus: SUCCESS | PENDING | FAILED | CANCELLED
// ReferenceType: REQUEST | PAYSLIP | PROJECT | DEPARTMENT | ADVANCE_BALANCE | SYSTEM | WITHDRAWAL | DEPOSIT
type LedgerTransactionView = TransactionResponse & { referenceCode?: string | null };

const MOCK_TRANSACTIONS: LedgerTransactionView[] = [
  { id: 1, transactionCode: "TXN-2026-0001A", type: TransactionType.REQUEST_PAYMENT, amount: -3_500_000, status: TransactionStatus.SUCCESS, referenceId: 1, referenceType: ReferenceType.REQUEST, referenceCode: "REQ-2026-0041", description: "Giải ngân tạm ứng - Đỗ Quốc Bảo", createdAt: "2026-04-03T11:00:00" },
  { id: 2, transactionCode: "TXN-2026-0002B", type: TransactionType.PAYSLIP_PAYMENT, amount: -13_500_000, status: TransactionStatus.SUCCESS, referenceId: 101, referenceType: ReferenceType.PAYSLIP, referenceCode: "PS-2026-03-001", description: "Chi lương T03/2026 - Đỗ Quốc Bảo", createdAt: "2026-04-02T17:05:00" },
  { id: 3, transactionCode: "TXN-2026-0003C", type: TransactionType.DEPOSIT, amount: 500_000_000, status: TransactionStatus.SUCCESS, referenceId: 0, referenceType: ReferenceType.SYSTEM, referenceCode: null, description: "Nạp tiền vào Quỹ hệ thống", createdAt: "2026-04-01T09:00:00" },
  { id: 4, transactionCode: "TXN-2026-0004D", type: TransactionType.DEPT_QUOTA_ALLOCATION, amount: -200_000_000, status: TransactionStatus.SUCCESS, referenceId: 20, referenceType: ReferenceType.DEPARTMENT, referenceCode: null, description: "Cấp quota Phòng IT Q2/2026", createdAt: "2026-04-01T10:30:00" },
  { id: 5, transactionCode: "TXN-2026-0005E", type: TransactionType.PROJECT_QUOTA_ALLOCATION, amount: -50_000_000, status: TransactionStatus.SUCCESS, referenceId: 10, referenceType: ReferenceType.PROJECT, referenceCode: null, description: "Cấp vốn DA PRJ-IT-001 Phase 2", createdAt: "2026-04-01T10:35:00" },
  { id: 6, transactionCode: "TXN-2026-0006F", type: TransactionType.WITHDRAW, amount: -2_000_000, status: TransactionStatus.SUCCESS, referenceId: 0, referenceType: ReferenceType.WITHDRAWAL, referenceCode: null, description: "Rút tiền - Vũ Thị Lan", createdAt: "2026-03-30T14:00:00" },
];
```

### 🖥️ UI layout
1. **Header**: "Sổ cái" + badge "Immutable — Chỉ đọc"
2. **Summary bar (3 cards)**: Tổng nạp vào | Tổng chi ra | Số dư ròng
3. **Filter bar**:
   - Type select (Tất cả | REQUEST_PAYMENT | PAYSLIP_PAYMENT | DEPOSIT | WITHDRAW | DEPT_QUOTA_ALLOCATION | PROJECT_QUOTA_ALLOCATION)
   - Date range: từ ngày — đến ngày
   - Search input
   - Nút "Xuất CSV" (mock: `console.log`)
4. **Table**:
   - Cột: transactionCode (mono) | type badge | description | amount (+ màu nếu dương/âm) | referenceCode (link) | createdAt
   - Amount: dương → text-emerald-600, âm → text-rose-600
   - Row click → `/accountant/ledger/${transaction.id}`
5. **Pagination**

### ⚙️ Transaction type badge colors
- `REQUEST_PAYMENT` → violet
- `PAYSLIP_PAYMENT` → blue
- `DEPOSIT` → emerald
- `WITHDRAW` → rose
- `DEPT_QUOTA_ALLOCATION` → amber
- `PROJECT_QUOTA_ALLOCATION` → orange
- `SYSTEM_ADJUSTMENT` → slate

---

## Prompt 6 — Accountant Ledger Transaction Detail

### 🎯 Mục tiêu
Page `/accountant/ledger/[id]`: chi tiết 1 transaction — TransactionInspectorSheet layout: Financials section, Source section (polymorphic link theo referenceType), Audit section. Immutable.

### 📁 Target file
`app/(dashboard)/accountant/ledger/[id]/page.tsx`

### 🎨 Design reference
`d:\src\components\pages\ledger-page.tsx` — **TransactionInspectorSheet** (3 sections: Financials → Source → Audit & Traceability)

### 📦 Types
```typescript
import {
  TransactionResponse, TransactionType, TransactionStatus,
  ReferenceType,
} from "@/types";
import { api } from "@/lib/api-client";
import { use } from "react";
// ⚠ TransactionDetailResponse KHÔNG tồn tại — v3.0 đã đơn giản hóa TransactionResponse.
// Backend chỉ trả TransactionResponse. Dùng local extension để thêm referenceCode nếu cần.
// Các fields đã bị xóa: balanceAfter, paymentRef, gatewayProvider, walletId, walletOwnerName, actorId, actorName, relatedTransactionId, updatedAt
// UI Section 3 (Audit) chỉ hiển thị createdAt từ TransactionResponse.
type LedgerTxnDetailView = TransactionResponse & {
  referenceCode?: string | null;
};
```

### 🔌 API endpoints
| Method | Endpoint | Sprint |
|--------|----------|--------|
| GET | `/api/v1/accountant/ledger/:transactionId` | Sprint 7 |

### 📊 Mock data
```typescript
// TODO: Replace when Sprint 7 is complete
// TransactionResponse (v3.0): id, transactionCode, type, status, amount, referenceType, referenceId, description, createdAt
// ⚠ KHÔNG có: balanceAfter, paymentRef, gatewayProvider, walletId, walletOwnerName, actorId, actorName, relatedTransactionId, updatedAt
// UI layout phải được điều chỉnh phù hợp — chỉ hiển thị các field có trong type
const MOCK_TXN: LedgerTxnDetailView = {
  id: 1, transactionCode: "TXN-2026-0001A",
  type: TransactionType.REQUEST_PAYMENT, amount: -3_500_000, status: TransactionStatus.SUCCESS,
  referenceId: 1, referenceType: ReferenceType.REQUEST,
  referenceCode: "REQ-2026-0041",
  description: "Giải ngân tạm ứng thiết bị phần cứng",
  createdAt: "2026-04-03T11:00:00",
};
```

### 🖥️ UI layout (TransactionInspectorSheet)
1. **Breadcrumb**: "Sổ cái" → `/accountant/ledger` / `{transactionCode}`
2. **Immutability notice**: "Giao dịch này được ghi nhận bởi hệ thống và KHÔNG THỂ SỬA ĐỔI."

3. **Section 1 — Financials**:
   - transactionCode (mono, lớn) + type badge + status badge
   - Amount: lớn, màu theo +/- (amount dương=tiền vào, âm=tiền ra)
   - Mô tả: `description`
   - Thời gian: `createdAt` (full timestamp)
   - ⚠ `balanceAfter`, `walletId`, `walletOwnerName` đã bị xóa khỏi TransactionResponse v3.0 — không hiển thị

4. **Section 2 — Source (Polymorphic)**:
   - Nếu `referenceType = REQUEST` → "Xem yêu cầu {referenceCode ?? referenceId}" → link `/requests/{referenceId}`
   - Nếu `referenceType = PAYSLIP` → "Xem phiếu lương {referenceCode ?? referenceId}" → link `/payroll/{referenceId}`
   - Nếu `referenceType = SYSTEM` → "Nạp tiền Quỹ hệ thống"
   - Nếu `referenceType = DEPARTMENT` → "Cấp quota phòng ban"
   - Nếu `referenceType = PROJECT` → "Cấp vốn dự án"
   - Nếu `referenceType = WITHDRAWAL` → "Giao dịch rút tiền"
   - Nếu `referenceType = DEPOSIT` → "Giao dịch nạp tiền"

5. **Section 3 — Audit**:
   - Thời gian tạo: `createdAt` (full timestamp)
   - ⚠ `actorName`, `actorId`, `relatedTransactionId`, `gatewayProvider` đã bị xóa khỏi v3.0 — không hiển thị

6. **Back button**: "← Quay lại Sổ cái"

---

*End of Tier 5 prompts*
