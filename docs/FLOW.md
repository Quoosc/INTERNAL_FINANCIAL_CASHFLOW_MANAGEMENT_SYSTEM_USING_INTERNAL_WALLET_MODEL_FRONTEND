# FLOW.md — Luồng dữ liệu (Data Flow)

## 1. Tổng quan kiến trúc

```
┌─────────────────────────────────┐
│   BROWSER (Next.js Frontend)    │
│   http://localhost:3000         │
├─────────────────────────────────┤
│  app/  │  lib/api-client.ts     │
│  pages │  → fetch("/api/v1/..") │
└────────┬────────────────────────┘
         │ Proxy (next.config.ts rewrites)
         ▼
┌─────────────────────────────────┐
│   Spring Boot Backend           │
│   http://localhost:8080         │
├─────────────────────────────────┤
│  Controller → Service → Repo   │
│  → MySQL/PostgreSQL DB          │
└─────────────────────────────────┘
```

## 2. Luồng xác thực (Authentication Flow)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Next.js Frontend
    participant MW as Middleware
    participant BE as Spring Boot Backend

    U->>FE: Truy cập /dashboard
    FE->>MW: Middleware kiểm tra cookie "access_token"
    MW-->>FE: Không có token → Redirect /login
    FE-->>U: Hiển thị Login Form

    U->>FE: Nhập email + password → Submit
    FE->>BE: POST /api/v1/auth/login {email, password}
    BE-->>FE: {access_token, refresh_token, user}
    FE->>FE: Lưu tokens (localStorage + cookie)
    FE->>FE: setUser(user) vào AuthContext
    FE-->>U: Redirect → /dashboard

    Note over FE,BE: Các request tiếp theo

    U->>FE: Truy cập /wallet
    FE->>MW: Cookie có access_token → OK
    FE->>BE: GET /api/v1/wallet/me (Header: Bearer token)
    BE-->>FE: {balance, pendingBalance, debtBalance}
    FE-->>U: Hiển thị Wallet Dashboard

    Note over FE,BE: Khi token hết hạn (401)

    FE->>BE: Bất kỳ API nào → 401 Unauthorized
    FE->>BE: POST /api/v1/auth/refresh-token {refreshToken}
    BE-->>FE: {new access_token, new refresh_token}
    FE->>FE: Lưu tokens mới
    FE->>BE: Retry request ban đầu với token mới
    BE-->>FE: Response thành công
```

## 3. Luồng yêu cầu — Ủy quyền Tuyệt đối (Absolute Delegation)

> **Kiến trúc mới**: 5 vai trò — 3 luồng duyệt — 4 tầng quỹ — KHÔNG leo thang.
> Mỗi loại yêu cầu có **1 người duyệt duy nhất**, xác định bởi `request.type`.

### 3.1 Cấu trúc 4 tầng quỹ

```
System Fund (Admin quản lý, Accountant nạp)
    ↓ Flow 3: Admin duyệt QUOTA_TOPUP
Department Fund (Manager quản lý)
    ↓ Flow 2: Manager duyệt PROJECT_TOPUP
Project Fund (Team Leader quản lý Phase/Category)
    ↓ Flow 1: TL duyệt → Accountant giải ngân
Personal Wallet (NV sử dụng)
```

### 3.2 Flow 1 — Chi tiêu cá nhân (ADVANCE / EXPENSE / REIMBURSE)

```mermaid
sequenceDiagram
    participant EMP as Employee
    participant FE as Frontend
    participant BE as Backend
    participant TL as Team Leader
    participant ACC as Accountant

    EMP->>FE: Mở /requests/new
    FE->>BE: GET /api/v1/projects (DA Active + member=me)
    FE-->>EMP: Form tạo YC (chọn DA → Phase → Category)

    EMP->>FE: Chọn loại, số tiền, chứng từ → Submit
    FE->>BE: POST /api/v1/requests {type, projectId, phaseId, amount}
    BE->>BE: Validate (Phase budget, Category budget)
    BE->>BE: Set status = PENDING_APPROVAL
    BE-->>FE: {requestCode: "REQ-IT-0326-001"}

    Note over BE: Notification → Team Leader

    TL->>FE: Mở /requests (YC trong DA mình dẫn)
    TL->>FE: Xem chi tiết + chứng từ → Duyệt
    FE->>BE: POST /api/v1/requests/{id}/approve
    BE->>BE: status = PENDING_ACCOUNTANT

    Note over BE: Notification → Accountant

    ACC->>FE: Mở /requests?status=PENDING_ACCOUNTANT
    ACC->>FE: Kiểm tra chứng từ → Nhập PIN → Giải ngân
    FE->>BE: POST /api/v1/requests/{id}/payout {pin}
    BE->>BE: project.deductBudget(amount)
    BE->>BE: wallet.credit(amount) (cộng ví NV)
    BE->>BE: Transaction(REQUEST_PAYMENT)
    BE->>BE: status = PAID
    BE-->>FE: Thành công
```

### 3.3 Flow 2 — Cấp vốn Dự án (PROJECT_TOPUP)

```mermaid
sequenceDiagram
    participant TL as Team Leader
    participant FE as Frontend
    participant BE as Backend
    participant MGR as Manager

    TL->>FE: Nhấn "Xin cấp vốn DA"
    FE->>BE: POST /api/v1/requests {type: PROJECT_TOPUP, projectId, amount}
    BE->>BE: status = PENDING_APPROVAL
    Note over BE: Notification → Manager

    MGR->>FE: Xem YC PROJECT_TOPUP → Duyệt
    FE->>BE: POST /api/v1/requests/{id}/approve
    BE->>BE: dept.allocateToProject(amount) — trừ Dept Fund
    BE->>BE: project.addBudget(amount) — cộng Project Fund
    BE->>BE: status = PAID (AUTO — không qua Accountant)
    BE-->>FE: Thành công
```

### 3.4 Flow 3 — Cấp vốn Phòng ban (QUOTA_TOPUP)

```mermaid
sequenceDiagram
    participant MGR as Manager
    participant FE as Frontend
    participant BE as Backend
    participant ADM as Admin

    MGR->>FE: Nhấn "Xin cấp vốn PB"
    FE->>BE: POST /api/v1/requests {type: QUOTA_TOPUP, amount}
    BE->>BE: status = PENDING_APPROVAL
    Note over BE: Notification → Admin

    ADM->>FE: Xem YC QUOTA_TOPUP → Duyệt
    FE->>BE: POST /api/v1/requests/{id}/approve
    BE->>BE: fund.totalBalance -= amount — trừ System Fund
    BE->>BE: dept.receiveQuota(amount) — cộng Dept Fund
    BE->>BE: status = PAID (AUTO — không qua Accountant)
    BE-->>FE: Thành công
```

### 3.5 Bảng tóm tắt 3 Flow

| Flow | Type | Người tạo | Approver | Giải ngân | Dòng tiền |
|------|------|-----------|----------|-----------|-----------|
| 1 | ADVANCE/EXPENSE/REIMBURSE | Employee/TL | **Team Leader** | **Accountant (PIN)** | Project → Wallet |
| 2 | PROJECT_TOPUP | Team Leader | **Manager** | **Auto** | Dept → Project |
| 3 | QUOTA_TOPUP | Manager | **Admin** | **Auto** | System → Dept |

## 4. Luồng lương (Payroll Flow)

```mermaid
sequenceDiagram
    participant ACC as Accountant
    participant FE as Frontend
    participant BE as Backend
    participant EMP as Employee

    ACC->>FE: Mở /payroll → Tạo kỳ lương mới
    FE->>BE: POST /api/v1/payroll {month, year, name}
    BE-->>FE: {periodCode: "PR-2026-03"}

    ACC->>FE: Import Excel → Upload danh sách lương
    FE->>BE: POST /api/v1/payroll/{id}/upload (Excel file)
    BE->>BE: Parse Excel → Tạo Payslip cho từng NV
    BE->>BE: Auto-netting: tính advanceDeduct từ debtBalance
    BE-->>FE: {payslips: [...]}

    ACC->>FE: Xác nhận "Chốt & Chi lương"
    FE->>BE: POST /api/v1/payroll/{id}/execute
    BE->>BE: forEach payslip:
    BE->>BE:   1. SystemFund.debit(finalNetSalary)
    BE->>BE:   2. Wallet.credit(finalNetSalary)
    BE->>BE:   3. Wallet.reduceDebt(advanceDeduct)
    BE->>BE:   4. Tạo Transaction(PAYSLIP_PAYMENT)
    BE-->>FE: Kỳ lương đã chi xong

    EMP->>FE: Mở /payroll → Xem phiếu lương
    FE->>BE: GET /api/v1/payroll/my-payslips
```

## 5. Server Component vs Client Component

| Trường hợp | Dùng | Lý do |
|------------|------|-------|
| Trang list (danh sách) | **Server** | Fetch data server-side, SEO, bảo mật token |
| Trang detail (chi tiết) | **Server** | Fetch chỉ 1 record, bảo mật |
| Form nhập liệu | **Client** | Cần `useState`, `onChange`, `onSubmit` |
| Dashboard với wallet | **Client** | Cần Context (useWallet, useAuth) |
| Upload file | **Client** | Cần File API, progress tracking |

## 6. Cách data chảy trong code

```
User clicks button
  → Client Component event handler (onClick)
  → api.post("/api/v1/...", body) — lib/api-client.ts
  → next.config.ts rewrites → proxy to localhost:8080
  → Spring Boot Controller receives request
  → Service layer processes business logic
  → Repository saves to Database
  → Controller returns ApiResponse<T>
  → api-client.ts unwraps ApiResponse
  → Component updates state / UI
```
