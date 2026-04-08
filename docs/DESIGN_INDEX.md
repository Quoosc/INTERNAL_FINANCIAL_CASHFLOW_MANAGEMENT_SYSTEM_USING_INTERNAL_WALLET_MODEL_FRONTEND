# DESIGN_INDEX.md

> **Mục đích**: File này là bản đồ tra cứu nhanh toàn bộ thiết kế mẫu trong `d:\src`.
> Thay vì scan lại toàn bộ thư mục khi code frontend, chỉ cần tìm UI feature cần làm → mở đúng file tham khảo.
>
> **Nguồn gốc**: `d:\src` là export từ **Figma Make** (React + Vite + shadcn/ui + Tailwind v4).
> Toàn bộ data trong đó là **mock tĩnh** — chỉ dùng để tham khảo UI/UX, không copy logic.

---

> [!CAUTION]
>
> ## ⛔ CẢNH BÁO QUAN TRỌNG — ĐỌC TRƯỚC KHI SỬ DỤNG
>
> **Thiết kế mẫu trong `d:\src` được xây dựng theo flow CŨ với 4 roles:**
> `Employee` · `Manager` · `Accountant` · `Admin`
>
> **Dự án thực tế (`financial-wallet-frontend`) implement theo flow MỚI với 6 roles:**
> `EMPLOYEE` · `TEAM_LEADER` · `MANAGER` · `ACCOUNTANT` · `CFO` · `ADMIN`
>
> **Hệ quả — những thứ KHÔNG được copy thẳng từ `d:\src`:**
>
> - ❌ **Role logic & routing**: `d:\src` không có role `TEAM_LEADER` — sidebar, page guards, và toàn bộ routing cho TL phải viết mới hoàn toàn
> - ❌ **Approval flow**: `d:\src` dùng chain Manager → Admin → Accountant. Flow thực tế:
>   - Flow 1 (ADVANCE/EXPENSE/REIMBURSE): `Employee` tạo → `Team Leader` duyệt → `Accountant` giải ngân (nhập PIN) → **KHÔNG qua Manager hay Admin**
>   - Flow 2 (PROJECT_TOPUP): `Team Leader` tạo → `Manager` duyệt → Auto PAID (không qua Accountant)
>   - Flow 3 (DEPARTMENT_TOPUP): `Manager` tạo → `CFO` duyệt → Auto PAID (không qua Accountant)
> - ❌ **RequestStatus enum**: `d:\src` dùng `PENDING_MANAGER | PENDING_ADMIN`. Thực tế dùng flow-specific status: `PENDING`, `APPROVED_BY_TEAM_LEADER`, `PENDING_ACCOUNTANT_EXECUTION`, `APPROVED_BY_MANAGER`, `APPROVED_BY_CFO`, `PAID`, `REJECTED`, `CANCELLED`
> - ❌ **Manager Approvals page** trong `d:\src`: xử lý Flow 1 (chi tiêu cá nhân). Thực tế Manager chỉ duyệt Flow 2 (PROJECT_TOPUP)
> - ❌ **Admin Approvals page** trong `d:\src`: xử lý Flow 2. Thực tế Flow 3 do CFO duyệt (frontend có thể vẫn đặt UI dưới namespace `/admin`)
> - ❌ **Types**: `UserRole`, `RequestStatus`, `RequestType` trong `d:\src\lib\` đều sai — luôn dùng từ `@/types`
>
> ✅ **Chỉ tham khảo UI/UX thuần túy**: layout, màu sắc, component structure, animation, form design, table design.
> ✅ **Logic & flow phải tra cứu từ `docs/FLOW.md`, `docs/API_CONTRACT.md`, và `CLAUDE.md`**, không từ `d:\src`.

---

## 📁 Cấu trúc thư mục

```
d:\src
├── App.tsx                         # Entry: điều phối layout theo role (Employee/Manager/Accountant/Admin)
├── main.tsx                        # Vite entry point
├── index.css                       # Import styles
├── styles/
│   └── globals.css                 # ⭐ Design tokens: CSS variables + dark mode + typography
├── lib/                            # Types + schemas + mock data + helpers
├── components/
│   ├── ui/                         # shadcn/ui primitives (49 components)
│   ├── layout/                     # Sidebars + Header
│   ├── features/                   # Auth pages
│   ├── dashboard/                  # Dashboard widgets
│   ├── wallet/                     # Wallet modals
│   ├── requests/                   # Request form components
│   ├── payslips/                   # Payslip modal
│   └── settings/                   # PIN modal + Virtual card
│   └── pages/                      # ⭐ Full-page designs (22 pages)
├── pages/                          # 2 standalone pages (my-wallet, my-requests)
├── hooks/
│   └── use-multi-upload.ts         # Custom hook: multi-file upload
└── assets/                         # 1 image file
```

---

## 🎨 Design System

### CSS Variables & Tokens

**File**: `d:\src\styles\globals.css`

| Token           | Giá trị            | Dùng cho           |
| --------------- | ------------------ | ------------------ |
| `--background`  | `#ffffff`          | Nền trang          |
| `--foreground`  | `oklch(0.145 0 0)` | Text chính         |
| `--primary`     | `#030213`          | Màu primary        |
| `--destructive` | `#d4183d`          | Lỗi, reject        |
| `--muted`       | `#ececf0`          | Nền muted          |
| `--radius`      | `0.625rem`         | Border radius base |
| `--sidebar-*`   | Nhiều biến         | Toàn bộ sidebar    |
| `--chart-1..5`  | oklch colors       | Màu biểu đồ        |

> Dark mode được định nghĩa đầy đủ trong `.dark { }`.
> Có sẵn: `.tabular-nums`, `.scrollbar-hide`, `.animation-delay-150`.

---

## 🏗️ App Navigation (App.tsx)

**File**: `d:\src\App.tsx`

### Auth States (trước khi authenticate)

```
isAuthenticated = false
  ├── authStep = null        → <AuthFlow> (Login / ForgotPassword / ResetPassword)
  ├── authStep = 'change-password' → <ChangePasswordFirstLogin>
  └── authStep = 'create-pin'     → <CreatePin>
```

### Role-based Layouts (sau khi authenticate)

```
isAuthenticated = true
  ├── role = 'employee'   → <EmployeeLayout>
  ├── role = 'manager'    → <ManagerLayout>
  ├── role = 'accountant' → <AccountantLayout>
  └── role = 'admin'      → <AdminLayout>
```

### NavigationContext API

**File**: `d:\src\lib\navigation-context.tsx`

```ts
interface NavigationContextType {
  currentPage: Page;
  setCurrentPage(page: Page): void;
  requestDetailId: string | null;
  setRequestDetailId(id: string | null): void;
  projectDetailId: string | null;
  setProjectDetailId(id: string | null): void;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  authStep: AuthStep | null;
  signIn(role: UserRole, isFirstLogin?: boolean): void;
  completePasswordChange(): void;
  completePinCreation(): void;
  signOut(): void;
}
```

---

## 🔐 Auth / Onboarding Pages

| Feature                                                               | File thiết kế                                                        |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Trang đăng nhập** (form email+pass, remember me, show/hide pass)    | `d:\src\components\features\login.tsx` (15 KB)                       |
| **Quên mật khẩu** (nhập email, gửi OTP)                               | `d:\src\components\features\forgot-password.tsx` (6.7 KB)            |
| **Reset mật khẩu** (nhập pass mới + confirm)                          | `d:\src\components\features\reset-password.tsx` (8.4 KB)             |
| **Đổi mật khẩu lần đầu** (first-login flow, step 1/2)                 | `d:\src\components\features\change-password-first-login.tsx` (13 KB) |
| **Tạo PIN** (numpad OTP 6 số, confirm PIN, first-login flow step 2/2) | `d:\src\components\features\create-pin.tsx` (17 KB)                  |

---

## 📐 Layout Components

| Component              | File thiết kế                                               | Dành cho                         |
| ---------------------- | ----------------------------------------------------------- | -------------------------------- |
| **Employee Sidebar**   | `d:\src\components\layout\sidebar.tsx` (4.1 KB)             | Role: employee                   |
| **Manager Sidebar**    | `d:\src\components\layout\manager-sidebar.tsx` (11.7 KB)    | Role: manager                    |
| **Accountant Sidebar** | `d:\src\components\layout\accountant-sidebar.tsx` (11.7 KB) | Role: accountant                 |
| **Admin Sidebar**      | `d:\src\components\layout\admin-sidebar.tsx` (11 KB)        | Role: admin                      |
| **Sidebar Wallet**     | `d:\src\components\layout\sidebar-wallet.tsx` (3.5 KB)      | Standalone wallet layout         |
| **Header**             | `d:\src\components\layout\header.tsx` (2.5 KB)              | Topbar: breadcrumb + user avatar |

---

## 👷 Employee Pages

### Pages

| Page               | File thiết kế                                     | Kích thước | Nội dung chính                                          |
| ------------------ | ------------------------------------------------- | ---------- | ------------------------------------------------------- |
| **Dashboard**      | `d:\src\components\pages\dashboard-page.tsx`      | 3.2 KB     | Shell — render các dashboard widgets                    |
| **My Wallet**      | `d:\src\components\pages\wallet-page.tsx`         | 5.7 KB     | Shell — dùng `WalletPage` component                     |
| **Wallet (full)**  | `d:\src\pages\my-wallet.tsx`                      | 15.8 KB    | ⭐ Full wallet UI: hero card, transaction table, filter |
| **My Requests**    | `d:\src\pages\my-requests.tsx`                    | 339 B      | Shell đơn giản                                          |
| **Requests List**  | `d:\src\components\pages\requests-page.tsx`       | 15.6 KB    | Danh sách request của employee                          |
| **Request Detail** | `d:\src\components\pages\request-detail-page.tsx` | 15.8 KB    | Chi tiết 1 request + timeline trạng thái                |
| **Payslips**       | `d:\src\components\pages\payslips-page.tsx`       | 15.4 KB    | Danh sách payslip theo tháng                            |
| **Settings**       | `d:\src\components\pages\settings-page.tsx`       | 31.2 KB    | Cài đặt: profile, bảo mật, thông báo                    |

### Dashboard Widgets

| Component        | File thiết kế                                           | Mô tả                                    |
| ---------------- | ------------------------------------------------------- | ---------------------------------------- |
| Stats Cards      | `d:\src\components\dashboard\stats-card.tsx`            | Balance / Debt / Pending summary cards   |
| Monthly Chart    | `d:\src\components\dashboard\monthly-chart.tsx`         | Bar chart: expense vs advance theo tháng |
| Expense Pie      | `d:\src\components\dashboard\expense-pie-chart.tsx`     | Pie chart phân loại chi phí              |
| Pending Requests | `d:\src\components\dashboard\pending-requests-list.tsx` | Danh sách request đang pending           |
| Activity Feed    | `d:\src\components\dashboard\activity-feed.tsx`         | Recent transactions/activities           |
| Quick Actions    | `d:\src\components\dashboard\quick-actions.tsx`         | Các shortcut action buttons              |

### Wallet Components

| Component                | File thiết kế                                                    | Mô tả                                                |
| ------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------- |
| Deposit Modal            | `d:\src\components\wallet\deposit-modal.tsx` (12.6 KB)           | Modal nạp tiền ví: chọn ngân hàng, QR code           |
| Withdraw Modal           | `d:\src\components\wallet\withdraw-modal.tsx` (20 KB)            | Modal rút tiền: chọn bank, nhập số tiền, confirm PIN |
| Transaction Detail Sheet | `d:\src\components\wallet\transaction-detail-sheet.tsx` (7.1 KB) | Slide-in sheet xem chi tiết giao dịch                |

### Request Components

| Component            | File thiết kế                                                   | Mô tả                                                |
| -------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| Create Request Modal | `d:\src\components\requests\create-request-modal.tsx` (13.9 KB) | Form tạo request: loại, dự án, phase, amount, upload |
| Edit Request Modal   | `d:\src\components\requests\edit-request-modal.tsx` (12.7 KB)   | Form edit request đang pending                       |
| Request Data Table   | `d:\src\components\requests\request-data-table.tsx` (9.9 KB)    | Table với filter, sort, pagination                   |
| Multi File Upload    | `d:\src\components\requests\multi-file-upload.tsx` (12.4 KB)    | Drag & drop upload nhiều file                        |
| Timeline             | `d:\src\components\requests\timeline.tsx` (4.8 KB)              | Timeline approval steps cho request                  |

---

## 👔 Manager Pages

| Page                  | File thiết kế                                          | Kích thước | Nội dung chính                                                                                         |
| --------------------- | ------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| **Manager Dashboard** | `d:\src\components\pages\manager-dashboard-page.tsx`   | 32.6 KB    | KPI cards, charts, pending approvals list                                                              |
| **Approvals**         | `d:\src\components\pages\approvals-page.tsx`           | 43 KB      | ⭐ Table request pending, filter/sort, Sheet chi tiết với BudgetHealthCard, Approve/Reject với timeout |
| **Projects List**     | `d:\src\components\pages\projects-list-page.tsx`       | 24.3 KB    | Grid projects với progress, budget usage                                                               |
| **Project Detail**    | `d:\src\components\pages\project-detail-page.tsx`      | 52.4 KB    | Chi tiết project: phases, members, transactions, Gantt-like timeline                                   |
| **Department**        | `d:\src\components\pages\department-page.tsx`          | 44.7 KB    | Quản lý bộ phận: nhân viên, budget quota, request history                                              |
| Manager Placeholder   | `d:\src\components\pages\manager-placeholder-page.tsx` | 2.1 KB     | Empty state page                                                                                       |

### Approvals Page — Key UI Patterns

- **BudgetHealthCard**: stacked progress bar (spent + request amount vs total budget)
- **RequestSheet**: right slide-in, các section: budget health → request details → attachments → footer actions
- **RejectDialog**: textarea với chip gợi ý lý do, validation min 10 chars
- **Optimistic removal**: approve/reject → item biến mất ngay, toast notification

---

## 💰 Accountant Pages

| Page                  | File thiết kế                                                   | Kích thước | Nội dung chính                                                                                                  |
| --------------------- | --------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| **Finance Dashboard** | `d:\src\components\pages\accountant-finance-dashboard-page.tsx` | 49.3 KB    | ⭐ Tổng quan tài chính: fund status, charts, pending disbursements                                              |
| **Disbursements**     | `d:\src\components\pages\disbursements-page.tsx`                | 55.5 KB    | ⭐ Giải ngân: System Fund Widget, VerificationSheet (2 cột: request data + receipt viewer), ComplianceChecklist |
| **Payroll**           | `d:\src\components\pages\payroll-page.tsx`                      | 59.7 KB    | Quản lý bảng lương: danh sách nhân viên, payslip generation, bulk actions                                       |
| **Ledger**            | `d:\src\components\pages\ledger-page.tsx`                       | 77 KB      | ⭐ Sổ cái double-entry: filter by type/status/ref/date, TransactionInspectorSheet, Export CSV                   |

### Disbursements Page — Key UI Patterns

- **SystemFundWidget**: hiển thị balance + health (healthy/low/critical) + balance after pending
- **ReceiptViewer**: zoom in/out, multi-tab (Doc 1, Doc 2...), fullscreen
- **ComplianceChecklist**: 5 items phải check hết mới unlock "Process Payment" button
- **VerificationSheet** (880px wide): 2 cột — trái: requester + chain of approvals + request details, phải: ReceiptViewer + checklist
- **RejectDialog**: quick reason chips + textarea

### Ledger Page — Key UI Patterns

- **TransactionType**: `DEPOSIT | WITHDRAW | REQUEST_PAYMENT | PAYSLIP_PAYMENT | DEBT`
- **ReferenceType (polymorphic)**: `REQUEST | PAYSLIP | SYSTEM_FUND | EXTERNAL_DEPOSIT | MANUAL_ADJUSTMENT`
- **PaymentProvider**: `PAYOS | MOMO | VNPAY | INTERNAL`
- **TransactionInspectorSheet**: 3 sections: Financials → Source (polymorphic link) → Audit & Traceability
- Immutability note, double-entry opposing entry link

---

## 🛡️ Admin Pages

| Page                | File thiết kế                                        | Kích thước | Nội dung chính                                                                         |
| ------------------- | ---------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| **Admin Dashboard** | `d:\src\components\pages\admin-dashboard-page.tsx`   | 45 KB      | System overview: user stats, fund overview, recent activity                            |
| **Admin Approvals** | `d:\src\components\pages\admin-approvals-page.tsx`   | 70.8 KB    | ⭐ Final approval: bulk select, ReviewSheet (approval chain + lightbox), BulkActionBar |
| **Admin Users**     | `d:\src\components\pages\admin-users-page.tsx`       | 63.6 KB    | Quản lý users: CRUD, filter, role assignment, wallet info                              |
| **Admin Audit**     | `d:\src\components\pages\admin-audit-page.tsx`       | 62 KB      | Audit trail: immutable log, filter by actor/action/date                                |
| **Admin Settings**  | `d:\src\components\pages\admin-settings-page.tsx`    | 63.1 KB    | System settings: roles, budget limits, payment providers                               |
| Admin Placeholder   | `d:\src\components\pages\admin-placeholder-page.tsx` | 3.6 KB     | Empty state                                                                            |

### Admin Approvals Page — Key UI Patterns

- **RequestType**: `ADVANCE | REIMBURSE | PAYMENT | TOPUP`
- **Bulk selection**: checkbox column, sticky BulkActionBar (slide up khi có item selected)
- **ReviewSheet** (560px): Amount hero → Requester meta → ApprovalTimeline → Justification → AttachmentGrid
- **ApprovalTimeline**: 4 steps: Submitted → Manager Approved → Awaiting Admin (current, pulsing) → Finance Disbursement
- **Lightbox**: full-screen image preview (ESC to close, darkened backdrop)
- **TOPUP context banner**: "Approving will increase department quota by X₫"

---

## 📄 Payslips

| Component            | File thiết kế                                                   | Mô tả                                                            |
| -------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| Payslip Detail Modal | `d:\src\components\payslips\payslip-detail-modal.tsx` (17.9 KB) | Modal chi tiết payslip: lương cơ bản, phụ cấp, khấu trừ, net pay |

---

## ⚙️ Settings

| Component         | File thiết kế                                               | Mô tả                                                |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| PIN Modal         | `d:\src\components\settings\pin-modal.tsx` (6.9 KB)         | Dialog nhập PIN 6 số để xác nhận giao dịch           |
| Virtual Bank Card | `d:\src\components\settings\virtual-bank-card.tsx` (2.8 KB) | Card hiển thị thông tin tài khoản ngân hàng liên kết |

---

## 🧩 shadcn/ui Components (`d:\src\components\ui\`)

> Tất cả 49 components có thể tái dùng trực tiếp (MIT license).

| Nhóm             | Components                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Layout**       | `card`, `separator`, `scroll-area`, `resizable`, `aspect-ratio`                                                                   |
| **Navigation**   | `sidebar`, `navigation-menu`, `breadcrumb`, `tabs`, `menubar`                                                                     |
| **Inputs**       | `button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`, `input-otp`                               |
| **Overlay**      | `dialog`, `alert-dialog`, `sheet`, `drawer`, `popover`, `hover-card`, `tooltip`                                                   |
| **Feedback**     | `toast`, `sonner`, `alert`, `badge`, `skeleton`, `progress`                                                                       |
| **Data Display** | `table`, `chart`, `accordion`, `avatar`                                                                                           |
| **Advanced**     | `command`, `dropdown-menu`, `context-menu`, `toggle`, `toggle-group`, `collapsible`, `carousel`, `calendar`, `pagination`, `form` |
| **Utilities**    | `utils.ts`, `use-mobile.ts`                                                                                                       |

---

## 📦 Type Definitions (`d:\src\lib\`)

### Wallet Types

**File**: `d:\src\lib\wallet-types.ts`

```ts
interface WalletData {
  totalBalance: number;
  availableBalance: number; // totalBalance - pendingBalance
  debtBalance: number; // Advance liability
  pendingBalance: number; // Locked funds
}

interface Transaction {
  id: string;
  date: Date;
  description: string;
  requestId?: string;
  type:
    | "salary"
    | "deposit"
    | "withdraw"
    | "expense"
    | "advance"
    | "repayment"
    | "reimbursement";
  amount: number; // Positive = income, negative = outgoing
  status: "success" | "pending" | "failed";
  category?: string;
  notes?: string;
}
```

### Request Types

**File**: `d:\src\lib\request-types.ts`

```ts
type RequestType = "ADVANCE" | "EXPENSE" | "REIMBURSE" | "DEPARTMENT_TOPUP";
type RequestStatus =
  | "PENDING_MANAGER"
  | "PENDING_ADMIN"
  | "APPROVED"
  | "PAID"
  | "REJECTED";

interface Request {
  id: string;
  date: Date;
  type: RequestType;
  projectName: string;
  phaseName: string;
  amount: number;
  status: RequestStatus;
  description: string;
  rejectReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Dashboard Types

**File**: `d:\src\lib\types.ts`

```ts
interface DashboardStats {
  availableBalance: number;
  debtBalance: number;
  pendingApproval: number;
  pendingRequestsCount: number;
  pendingRequestsList: RequestItem[];
  recentActivities: Activity[];
}
```

### Payslip Types

**File**: `d:\src\lib\payslip-types.ts`

### Upload Types

**File**: `d:\src\lib\upload-types.ts`

### User Profile Types

**File**: `d:\src\lib\user-profile-types.ts`

---

## 🗃️ Mock Data Files

> ⚠️ KHÔNG migrate sang frontend — chỉ dùng để hiểu data shape khi implement API calls.

| File                              | Nội dung                                  | Kích thước |
| --------------------------------- | ----------------------------------------- | ---------- |
| `mock-data.ts`                    | User profile, mock chung                  | 3 KB       |
| `wallet-mock-data.ts`             | WalletData + Transactions                 | 3.6 KB     |
| `request-mock-data.ts`            | Employee requests                         | 6.2 KB     |
| `request-detail-mock-data.ts`     | Chi tiết request + timeline               | 14.7 KB    |
| `approvals-mock-data.ts`          | Manager approval requests + budget health | 11.3 KB    |
| `manager-mock-data.ts`            | Manager profile                           | 4.5 KB     |
| `accountant-mock-data.ts`         | System funds + disbursement requests      | 25.4 KB    |
| `department-mock-data.ts`         | Phòng ban + nhân viên                     | 16.2 KB    |
| `project-mock-data.ts`            | Projects + mock data                      | 4.2 KB     |
| `project-management-mock-data.ts` | Chi tiết project management               | 11.4 KB    |
| `payslip-mock-data.ts`            | Payslips                                  | 4 KB       |
| `bank-mock-data.ts`               | Danh sách ngân hàng                       | 423 B      |
| `user-profile-mock.ts`            | User profiles                             | 1.2 KB     |

---

## 🔌 Custom Hooks

| Hook             | File                               | Mô tả                                                      |
| ---------------- | ---------------------------------- | ---------------------------------------------------------- |
| `useMultiUpload` | `d:\src\hooks\use-multi-upload.ts` | Upload nhiều file: drag&drop, progress, validation, remove |

---

## ✅ Schemas (Zod Validation)

| Schema            | File                                  | Dùng cho                               |
| ----------------- | ------------------------------------- | -------------------------------------- |
| Create Request    | `d:\src\lib\create-request-schema.ts` | Validation form tạo request            |
| Withdraw          | `d:\src\lib\withdraw-schema.ts`       | Validation form rút tiền               |
| Settings          | `d:\src\lib\settings-schemas.ts`      | Validation profile + security settings |
| Password Strength | `d:\src\lib\password-strength.ts`     | Kiểm tra độ mạnh mật khẩu              |

---

## 🎯 Quick Reference: Tìm thiết kế theo tính năng

| Tính năng cần code            | Xem file thiết kế                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Login page                    | `components/features/login.tsx`                                                    |
| Forgot / Reset password       | `components/features/forgot-password.tsx`, `reset-password.tsx`                    |
| Change password (first login) | `components/features/change-password-first-login.tsx`                              |
| Create PIN                    | `components/features/create-pin.tsx`                                               |
| Employee dashboard            | `components/pages/dashboard-page.tsx` + `components/dashboard/*`                   |
| Wallet (employee view)        | `pages/my-wallet.tsx`                                                              |
| Deposit modal                 | `components/wallet/deposit-modal.tsx`                                              |
| Withdraw modal                | `components/wallet/withdraw-modal.tsx`                                             |
| Transaction history + filter  | `pages/my-wallet.tsx` (Section B)                                                  |
| Transaction detail            | `components/wallet/transaction-detail-sheet.tsx`                                   |
| Create/Edit request           | `components/requests/create-request-modal.tsx`, `edit-request-modal.tsx`           |
| Request list (employee)       | `components/pages/requests-page.tsx`                                               |
| Request detail + timeline     | `components/pages/request-detail-page.tsx`                                         |
| Multi-file upload             | `components/requests/multi-file-upload.tsx`                                        |
| Payslip list                  | `components/pages/payslips-page.tsx`                                               |
| Payslip detail                | `components/payslips/payslip-detail-modal.tsx`                                     |
| Settings (profile, security)  | `components/pages/settings-page.tsx`                                               |
| PIN confirmation modal        | `components/settings/pin-modal.tsx`                                                |
| Virtual bank card             | `components/settings/virtual-bank-card.tsx`                                        |
| Manager dashboard             | `components/pages/manager-dashboard-page.tsx`                                      |
| Manager approvals             | `components/pages/approvals-page.tsx`                                              |
| Budget health widget          | Inside `approvals-page.tsx` → `BudgetHealthCard`                                   |
| Projects list                 | `components/pages/projects-list-page.tsx`                                          |
| Project detail                | `components/pages/project-detail-page.tsx`                                         |
| Department management         | `components/pages/department-page.tsx`                                             |
| Accountant dashboard          | `components/pages/accountant-finance-dashboard-page.tsx`                           |
| Disbursements (giải ngân)     | `components/pages/disbursements-page.tsx`                                          |
| Compliance checklist          | Inside `disbursements-page.tsx` → `ComplianceChecklist`                            |
| System fund widget            | Inside `disbursements-page.tsx` → `SystemFundWidget`                               |
| Payroll management            | `components/pages/payroll-page.tsx`                                                |
| Transaction ledger (sổ cái)   | `components/pages/ledger-page.tsx`                                                 |
| Transaction inspector sheet   | Inside `ledger-page.tsx` → `TransactionInspectorSheet`                             |
| Admin dashboard               | `components/pages/admin-dashboard-page.tsx`                                        |
| Admin final approvals         | `components/pages/admin-approvals-page.tsx`                                        |
| Approval chain timeline       | Inside `admin-approvals-page.tsx` → `ApprovalTimeline`                             |
| Bulk approve/reject           | Inside `admin-approvals-page.tsx` → `BulkActionBar`                                |
| Image lightbox                | Inside `admin-approvals-page.tsx` → `Lightbox`                                     |
| User management               | `components/pages/admin-users-page.tsx`                                            |
| Audit trail                   | `components/pages/admin-audit-page.tsx`                                            |
| System settings               | `components/pages/admin-settings-page.tsx`                                         |
| Sidebar (by role)             | `components/layout/{sidebar,manager-sidebar,accountant-sidebar,admin-sidebar}.tsx` |
| Header / topbar               | `components/layout/header.tsx`                                                     |

---

## ⚠️ Lưu ý khi implement

1. **FLOW 4-ROLE vs 6-ROLE** — Thiết kế mẫu dùng 4 roles (`Employee, Manager, Accountant, Admin`). Project thực dùng 6 roles (`EMPLOYEE`, `TEAM_LEADER`, `MANAGER`, `ACCOUNTANT`, `CFO`, `ADMIN`). Moi approval chain, routing, sidebar, va business rule lien quan den role phai tra cuu tu backend spec, khong tu `d:\src`.
2. **KHÔNG copy navigation logic** — `lib/navigation-context.tsx` dùng Context API SPA, không phù hợp với Next.js App Router
3. **KHÔNG copy mock data** — thay bằng `useQuery` / `useMutation` (React Query/TanStack Query)
4. **Types cần verify** lại với backend Spring Boot contract trước khi dùng (đặc biệt `UserRole`, `RequestStatus`, approval chain)
5. **CSS design tokens** (`styles/globals.css`) có thể tái dùng trực tiếp
6. **shadcn/ui components** (`components/ui/`) có thể tái dùng — đã được cài sẵn trong `financial-wallet-frontend`
7. **"use client"** directive trong src là di vật từ Figma Make — bỏ khi migrate sang Next.js (Next.js dùng Server Components by default)
