# TODO — Cải tiến khi bắt đầu code UI

> Danh sách các cải tiến cần triển khai khi bắt đầu phát triển giao diện thật.
> Đánh dấu `[x]` khi hoàn thành.

---

## 1. Service Layer (`lib/api/`)

- [ ] `requestService.ts` — CRUD requests, approve, reject, payout, cancel
- [ ] `projectService.ts` — CRUD projects, phases, members, assign leader
- [ ] `walletService.ts` — getWallet, deposit, withdraw, getTransactions
- [ ] `userService.ts` — CRUD users, lock/unlock, resetPassword
- [ ] `payrollService.ts` — CRUD payroll, upload Excel, execute batch
- [ ] `departmentService.ts` — CRUD departments, topup quota
- [ ] `auditService.ts` — getLogs, filter by action/entity/time
- [ ] `notificationService.ts` — getNotifications, markRead, markAllRead
- [ ] `systemConfigService.ts` — getConfigs, updateConfig
- [ ] `systemFundService.ts` — getFund, topup

## 2. Reusable UI Components (`components/ui/`)

- [ ] `Button.tsx` — variants (primary, danger, outline, ghost, loading)
- [ ] `Modal.tsx` — confirm dialog, form modal
- [ ] `Table.tsx` — sortable, pagination, responsive
- [ ] `Form/Input.tsx` — label, error, validation
- [ ] `Badge.tsx` — hiển thị status (PENDING, APPROVED, REJECTED...)
- [ ] `Card.tsx` — stat cards cho Dashboard
- [ ] `FileUpload.tsx` — upload chứng từ, Excel
- [ ] `PinInput.tsx` — nhập PIN 5 số cho giải ngân/rút tiền

## 3. Custom Hooks (`hooks/`)

- [ ] `useRequests(filters)` — fetch + filter + pagination
- [ ] `useProjects(filters)` — fetch + filter + pagination
- [ ] `useUsers(filters)` — fetch + filter + pagination
- [ ] `usePayroll()` — fetch payroll periods
- [ ] `useNotifications()` — fetch + badge count unread

## 4. Utilities (`utils/`)

- [ ] `formatCurrency(amount)` — "1.500.000 ₫"
- [ ] `formatDate(iso)` — "24/03/2026 14:30"
- [ ] `formatStatus(status)` — label + color theo RequestStatus
- [ ] `formatRequestType(type)` — "Tạm ứng", "Cấp vốn DA"...
- [ ] `getStatusColor(status)` — green/yellow/red cho Badge

## 5. Constants (`constants/`)

- [ ] `routes.ts` — all route paths
- [ ] `sidebarMenu.ts` — menu items per role/permission
- [ ] `statusConfig.ts` — status → label + color mapping

## 6. API Client Fix

- [ ] `api-client.ts` — thêm `uploadFile()` method cho FormData (bỏ Content-Type header, để browser tự set multipart/form-data)
