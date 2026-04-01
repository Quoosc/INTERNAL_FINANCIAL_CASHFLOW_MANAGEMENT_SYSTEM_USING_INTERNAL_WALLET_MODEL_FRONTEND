# FLOW.md — Luồng dữ liệu (Data Flow)

> **Version:** 2.0 — Aligned với Backend `API_Spec.md` v2.0
> **Kiến trúc:** 5 Roles — 3 Luồng duyệt — 4 Tầng quỹ — KHÔNG leo thang

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
│  → PostgreSQL DB                │
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
    BE-->>FE: {accessToken, refreshToken, user}
    FE->>FE: Lưu tokens (localStorage + cookie)
    FE->>FE: setUser(user) vào AuthContext
    FE-->>U: Check user.isFirstLogin?

    alt isFirstLogin = true
        FE-->>U: Redirect → /change-password
        U->>FE: Nhập mật khẩu mới → Submit
        FE->>BE: POST /api/v1/auth/change-password {newPassword}
        FE-->>U: Redirect → /create-pin
        U->>FE: Nhập PIN 5 số → Submit
        FE->>BE: POST /api/v1/users/me/pin {pin}
        FE-->>U: Redirect → /dashboard
    else isFirstLogin = false
        FE-->>U: Redirect → /dashboard (theo role)
    end

    Note over FE,BE: Các request tiếp theo

    U->>FE: Truy cập /wallet
    FE->>MW: Cookie có access_token → OK
    FE->>BE: GET /api/v1/wallet (Header: Bearer token)
    BE-->>FE: {balance, pendingBalance, debtBalance, version}
    FE-->>U: Hiển thị Wallet Dashboard

    Note over FE,BE: Khi token hết hạn (401)

    FE->>BE: Bất kỳ API nào → 401 Unauthorized
    FE->>BE: POST /api/v1/auth/refresh-token {refreshToken}
    BE-->>FE: {accessToken, refreshToken} mới
    FE->>FE: Lưu tokens mới
    FE->>BE: Retry request ban đầu với token mới
    BE-->>FE: Response thành công
```

## 3. Hệ thống 5 Vai trò & 4 Tầng quỹ

```
┌──────────────────────────────────────────────────────────┐
│                    5 VAI TRÒ (ROLES)                     │
├──────────┬───────────┬─────────┬────────────┬────────────┤
│ EMPLOYEE │TEAM_LEADER│ MANAGER │ ACCOUNTANT │   ADMIN    │
│ Tạo YC   │Duyệt Flow1│Duyệt F2│ Giải ngân  │ Duyệt F3  │
│ chi tiêu │Quản lý DA │Quản lý │ Chi lương  │ Quản trị  │
│          │Phase/Categ│ PB     │ Sổ cái    │ Hệ thống  │
└──────────┴───────────┴─────────┴────────────┴────────────┘

┌──────────────────────────────────────────────────────────┐
│                 4 TẦNG QUỸ (FUND TIERS)                  │
├──────────────────────────────────────────────────────────┤
│ Tier 1: System Fund (Admin quản lý, Accountant nạp)     │
│    ↓ Flow 3: QUOTA_TOPUP (Manager → Admin duyệt)       │
│ Tier 2: Department Fund (Manager quản lý)               │
│    ↓ Flow 2: PROJECT_TOPUP (TL → Manager duyệt)        │
│ Tier 3: Project Fund → Phase → Category Budget          │
│    ↓ Flow 1: TL duyệt → Accountant giải ngân (PIN)     │
│ Tier 4: Personal Wallet (Nhân viên sử dụng)            │
└──────────────────────────────────────────────────────────┘
```

## 4. Flow 1 — Chi tiêu cá nhân (ADVANCE / EXPENSE / REIMBURSE)

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
    FE->>BE: POST /api/v1/requests {type, projectId, phaseId, categoryId, amount}
    BE->>BE: Validate (Phase budget, Category budget)
    BE->>BE: Set status = PENDING_APPROVAL
    BE-->>FE: {requestCode: "REQ-IT-0326-001"}

    Note over BE: Notification → Team Leader

    TL->>FE: Mở /team-leader/approvals
    TL->>FE: Xem chi tiết + chứng từ → Duyệt
    FE->>BE: POST /api/v1/team-leader/approvals/{id}/approve {approvedAmount}
    BE->>BE: status = PENDING_ACCOUNTANT

    Note over BE: Notification → Accountant

    ACC->>FE: Mở /accountant/disbursements
    ACC->>FE: Kiểm tra chứng từ → Nhập PIN → Giải ngân
    FE->>BE: POST /api/v1/accountant/disbursements/{id}/disburse {pin}
    BE->>BE: project.deductBudget(amount)
    BE->>BE: wallet.credit(amount) (cộng ví NV)
    BE->>BE: Transaction(REQUEST_PAYMENT)
    BE->>BE: status = PAID
    BE-->>FE: {transactionCode: "TXN-8829145A"}
```

## 5. Flow 2 — Cấp vốn Dự án (PROJECT_TOPUP)

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

    MGR->>FE: Mở /manager/approvals → Xem YC
    FE->>BE: POST /api/v1/manager/approvals/{id}/approve {approvedAmount}
    BE->>BE: dept.allocateToProject(amount) — trừ Dept Fund
    BE->>BE: project.addBudget(amount) — cộng Project Fund
    BE->>BE: status = PAID (AUTO — không qua Accountant)
    BE-->>FE: Thành công
```

## 6. Flow 3 — Cấp vốn Phòng ban (QUOTA_TOPUP)

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

    ADM->>FE: Mở /admin/approvals → Xem YC
    FE->>BE: POST /api/v1/admin/approvals/{id}/approve {approvedAmount}
    BE->>BE: fund.totalBalance -= amount — trừ System Fund
    BE->>BE: dept.receiveQuota(amount) — cộng Dept Fund
    BE->>BE: status = PAID (AUTO — không qua Accountant)
    BE-->>FE: Thành công
```

## 7. Bảng tóm tắt 3 Flow

| Flow | Type | Người tạo | Approver | Giải ngân | Dòng tiền |
|------|------|-----------|----------|-----------|-----------| 
| 1 | ADVANCE/EXPENSE/REIMBURSE | Employee/TL | **Team Leader** | **Accountant (PIN)** | Project → Wallet |
| 2 | PROJECT_TOPUP | Team Leader | **Manager** | **Auto** | Dept → Project |
| 3 | QUOTA_TOPUP | Manager | **Admin** | **Auto** | System → Dept |

## 8. Luồng lương (Payroll Flow)

```mermaid
sequenceDiagram
    participant ACC as Accountant
    participant FE as Frontend
    participant BE as Backend
    participant EMP as Employee

    ACC->>FE: Mở /accountant/payroll → Tạo kỳ lương mới
    FE->>BE: POST /api/v1/accountant/payroll {month, year, name}
    BE-->>FE: {periodCode: "PR-2026-03"}

    ACC->>FE: Import Excel → Upload danh sách lương
    FE->>BE: POST /api/v1/accountant/payroll/{id}/import (Excel file)
    BE->>BE: Parse Excel → Tạo Payslip cho từng NV
    BE-->>FE: {entries: [...], errors: [...]}

    ACC->>FE: Nhấn "Tính bù trừ"
    FE->>BE: POST /api/v1/accountant/payroll/{id}/auto-netting
    BE->>BE: Tính advanceDeduct từ debtBalance
    BE-->>FE: {summary: [...]}

    ACC->>FE: Xác nhận "Chạy lương"
    FE->>BE: POST /api/v1/accountant/payroll/{id}/run
    BE->>BE: forEach payslip:
    BE->>BE:   1. SystemFund.debit(finalNetSalary)
    BE->>BE:   2. Wallet.credit(finalNetSalary)
    BE->>BE:   3. Wallet.reduceDebt(advanceDeduct)
    BE->>BE:   4. Tạo Transaction(PAYSLIP_PAYMENT)
    BE-->>FE: Kỳ lương đã chi xong

    EMP->>FE: Mở /payslips → Xem phiếu lương
    FE->>BE: GET /api/v1/payslips
```

## 9. Server Component vs Client Component

| Trường hợp | Dùng | Lý do |
|------------|------|-------|
| Trang list (danh sách) | **Server** | Fetch data server-side, SEO, bảo mật token |
| Trang detail (chi tiết) | **Server** | Fetch chỉ 1 record, bảo mật |
| Form nhập liệu | **Client** | Cần `useState`, `onChange`, `onSubmit` |
| Dashboard với wallet | **Client** | Cần Context (useWallet, useAuth) |
| Upload file | **Client** | Cần File API, progress tracking |

## 10. Cách data chảy trong code

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
