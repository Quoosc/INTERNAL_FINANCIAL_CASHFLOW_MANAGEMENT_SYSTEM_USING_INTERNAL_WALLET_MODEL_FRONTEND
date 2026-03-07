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

## 3. Luồng tạo yêu cầu (Request Flow)

```mermaid
sequenceDiagram
    participant EMP as Employee
    participant FE as Frontend
    participant BE as Backend
    participant MGR as Manager
    participant ACC as Accountant

    EMP->>FE: Mở /requests/new
    FE->>BE: GET /api/v1/projects (load danh sách dự án)
    FE-->>EMP: Hiển thị form tạo yêu cầu

    EMP->>FE: Chọn loại (ADVANCE), dự án, số tiền → Submit
    FE->>BE: POST /api/v1/requests {type, projectId, phaseId, amount}
    BE->>BE: Validate (phase budget, permission)
    BE->>BE: Set status = PENDING_MANAGER
    BE-->>FE: {requestCode: "REQ-IT-0326-001"}
    FE-->>EMP: Thông báo "Yêu cầu đã gửi"

    Note over BE: Notification → Manager

    MGR->>FE: Mở /requests (thấy yêu cầu mới)
    MGR->>FE: Click Duyệt
    FE->>BE: POST /api/v1/requests/{id}/approve
    BE->>BE: Nếu trong hạn mức → status = APPROVED
    BE->>BE: Nếu vượt hạn mức → status = PENDING_ADMIN (Leo thang)

    Note over BE: Kế toán giải ngân

    ACC->>FE: Mở /requests?status=APPROVED
    ACC->>FE: Click "Chi tiền"
    FE->>BE: POST /api/v1/requests/{id}/payout
    BE->>BE: SystemFund.debit(amount)
    BE->>BE: Wallet.credit(amount) (cộng ví nhân viên)
    BE->>BE: Tạo Transaction (type=REQUEST_PAYMENT)
    BE->>BE: Set status = PAID
    BE-->>FE: Thành công
```

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
