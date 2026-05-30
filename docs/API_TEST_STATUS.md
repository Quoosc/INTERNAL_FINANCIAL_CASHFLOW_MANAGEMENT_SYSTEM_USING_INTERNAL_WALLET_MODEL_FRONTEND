# API_TEST_STATUS.md — Trạng thái Test Toàn bộ Endpoint

> Cập nhật lần cuối: 2026-05-30 (Sprint 15 — tích hợp tất cả 5.1–5.5)
> Tổng: **153 endpoint** · **144 đã tích hợp FE** · **9 chưa/không tích hợp**
>
> **Chú thích trạng thái:**
> - ✅ **Tested** — đã test thực tế (curl hoặc qua FE), xác nhận response đúng
> - ⚠️ **Integrated, not tested** — FE đã gọi nhưng chưa verify response (blocked by missing test data / env dependency)
> - ❌ **Not integrated** — FE chưa có call tới endpoint này (xem TODO_IMPROVEMENTS.md §5)
> - — **N/A** — không dành cho FE gọi trực tiếp (webhook, SSE chuyên biệt, dev-only)

---

## Tóm tắt

| Trạng thái | Số lượng |
|---|---|
| ✅ Tested | 104 |
| ⚠️ Integrated, not tested | 40 |
| ❌ Not integrated (Group A — thiếu FE feature) | 0 |
| — N/A (webhook / SSE / dev-only) | 9 |
| **Tổng** | **153** |

---

## 1. Auth (`/auth`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| POST | `/auth/login` | ✅ | Tested — trả `LoginResponse` + token |
| POST | `/auth/logout` | ✅ | Tested — invalidates token, returns success |
| POST | `/auth/refresh-token` | ✅ | Auto-called bởi `api-client.ts` khi 401 |
| POST | `/auth/first-login/complete` | ✅ | Tested — emp.it2 first-login flow; body `{setupToken,newPassword,confirmPassword,pin}` (public, no Bearer) |
| POST | `/auth/change-password` | ✅ | Tested — change + restore with re-login |
| POST | `/auth/forgot-password` | ⚠️ | Integrated; skip: cần mail server |
| POST | `/auth/verify-password-reset` | ⚠️ | Integrated; skip: cần OTP từ mail |
| GET | `/auth/me` | ✅ | Tested — trả `AuthUser` |

---

## 2. Profile & Security (`/users/me`, `/banks`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/users/me/profile` | ✅ | Tested |
| PUT | `/users/me/profile` | ✅ | Tested — field `phoneNumber` (không phải `phone`) |
| PUT | `/users/me/avatar` | ⚠️ | Integrated — multipart upload; skip: cần Cloudinary |
| PUT | `/users/me/bank-info` | ✅ | Tested — field `accountOwner` (không phải `accountHolder`) |
| PUT | `/users/me/pin` | ✅ | Tested — change → re-login → restore |
| POST | `/users/me/pin/verify` | ⚠️ | Integrated (Sprint 15) — pre-verify trước disburse; skip: cần test PIN sequence |
| GET | `/banks` | ✅ | Tested — trả `BankOption[]` |

---

## 3. SSE Stream (`/users/stream`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/users/stream` | ✅ | Tested — kết nối SSE, nhận `wallet.updated`, `notification` |
| GET | `/users/project/{projectId}/stream` | — | N/A — specialized SSE, FE chỉ dùng main stream |
| GET | `/users/department/{departmentId}/stream` | — | N/A |
| GET | `/users/company-fund/stream` | — | N/A |

---

## 4. Wallet (`/wallet`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/wallet` | ✅ | Tested — `WalletContext.fetchWallet()` |
| GET | `/wallet/transactions` | ✅ | Tested — trả `LedgerEntryResponse[]` |
| GET | `/wallet/transactions/{transactionId}` | ✅ | Tested — ⚠️ ID bug: list returns `LedgerEntry.id`; detail needs parent `Transaction.id` (xem §Bugs) |

---

## 5. Deposit (`/wallet/deposit`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| POST | `/wallet/deposit` | ✅ | Tested — tạo QR VNPay thành công |
| GET | `/wallet/deposit/my` | ✅ | Tested — trả deposit history |

---

## 6. Withdraw (`/wallet/withdraw`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| POST | `/wallet/withdraw` | ⚠️ | Integrated; skip: MockBank (`localhost:8081`) không chạy |
| DELETE | `/wallet/withdraw/{id}` | ⚠️ | Integrated; skip: phụ thuộc MockBank |
| GET | `/wallet/withdraw/my` | ✅ | Tested — Employee view (empty list) |
| GET | `/wallet/withdraw` | ✅ | Tested — Accountant admin view |
| PUT | `/wallet/withdraw/{id}/execute` | ⚠️ | Integrated; skip: cần MockBank |
| PUT | `/wallet/withdraw/{id}/reject` | ⚠️ | Integrated; skip: không có PENDING withdraw trong DB |

---

## 7. Payment / VNPay (`/payments`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| POST | `/payments` | — | N/A — VNPay, FE dùng `/wallet/deposit` thay thế |
| GET | `/payments/{gateway}/ipn` | — | N/A — VNPay IPN webhook (server-to-server) |
| GET | `/payments/{gateway}/return` | — | N/A — VNPay redirect callback |
| POST | `/payments/cancel` | — | N/A — VNPay server-side |
| GET | `/payments/status` | — | N/A — VNPay server-side |

---

## 8. Notifications (`/notifications`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/notifications` | ✅ | Tested |
| GET | `/notifications/unread-count` | ✅ | Tested |
| PATCH | `/notifications/{id}/read` | ✅ | Tested — tạo notification qua `/notifications/test` trước, rồi mark read |
| PATCH | `/notifications/read-all` | ✅ | Tested — trả `MarkAllReadResponse` |
| POST | `/notifications/test` | — | N/A — dev-only endpoint |

---

## 9. Requests (`/requests`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/requests` | ✅ | Tested |
| GET | `/requests/summary` | ✅ | Tested |
| GET | `/requests/{id}` | ✅ | Tested — lấy chi tiết ADVANCE request vừa tạo |
| POST | `/requests` | ✅ | Tested — tạo ADVANCE request thành công |
| PUT | `/requests/{id}` | ✅ | Tested — update PENDING request |
| DELETE | `/requests/{id}` | ✅ | Tested — cancel/delete PENDING request |

---

## 10. Projects (read-only, `/projects`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/projects` | ✅ | Tested — Employee member view |
| GET | `/projects/{id}/phases` | ✅ | Tested |
| GET | `/projects/{phaseId}` | ✅ | Tested — phase detail với phaseId=1 (Phase 1 of Project 1) |

---

## 11. Team Leader — Approvals (`/team-leader/approvals`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/team-leader/approvals` | ✅ | Tested |
| GET | `/team-leader/approvals/{id}` | ✅ | Tested |
| POST | `/team-leader/approvals/{id}/approve` | ✅ | Tested — Flow 1 Step 1 |
| POST | `/team-leader/approvals/{id}/reject` | ✅ | Tested — reject ADVANCE request C; body `{comment}` |

---

## 12. Team Leader — Projects (`/team-leader/projects`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/team-leader/projects` | ✅ | Tested (sau khi fix lower(bytea)) |
| GET | `/team-leader/projects/{id}` | ✅ | Tested |
| POST | `/team-leader/projects/{id}/phases` | ✅ | Tested — tạo phase mới sau khi PROJECT_TOPUP; body `{name,description,startDate,endDate,budget}` |
| PUT | `/team-leader/projects/{id}/phases/{phaseId}` | ✅ | Tested — update phase name/budget |
| POST | `/team-leader/projects/{id}/members` | ✅ | Tested — body cần `{userId,position}` (không chỉ userId) |
| PUT | `/team-leader/projects/{id}/members/{userId}` | ✅ | Tested — body chỉ `{position}` (không phải `projectRole`) |
| DELETE | `/team-leader/projects/{id}/members/{userId}` | ✅ | Tested — xoá member khỏi project |
| GET | `/team-leader/projects/{id}/available-members` | ✅ | Tested |
| GET | `/team-leader/team-members` | ✅ | Tested |
| GET | `/team-leader/team-members/{userId}` | ✅ | Tested |

---

## 13. Team Leader — Categories (`/team-leader/projects/{id}/categories`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/team-leader/projects/{id}/categories` | ✅ | Tested — trả danh sách `PhaseCategoryBudget` |
| PUT | `/team-leader/projects/{id}/categories` | ✅ | Tested — body single object `{phaseId,categoryId,budgetLimit}`; cần record tồn tại (update-only, không upsert) |
| DELETE | `/team-leader/projects/{id}/categories` | ⚠️ | Integrated (Sprint 15) — body `{phaseId,categoryId}`; disabled khi `currentSpent>0` |
| GET | `/team-leader/expense-categories` | ✅ | Tested |
| POST | `/team-leader/projects/{id}/expense-categories` | ⚠️ | Integrated (Sprint 15) — tạo custom category + phase budget; auto-refresh list sau khi tạo |

---

## 14. Manager — Approvals (`/manager/approvals`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/manager/approvals` | ✅ | Tested |
| GET | `/manager/approvals/{id}` | ✅ | Tested — chi tiết PROJECT_TOPUP request |
| POST | `/manager/approvals/{id}/approve` | ✅ | Tested — Flow 2 approve; body `{comment}` |
| POST | `/manager/approvals/{id}/reject` | ✅ | Tested — reject PROJECT_TOPUP; body `{reason}` |

---

## 15. Manager — Projects (`/manager/projects`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/manager/projects` | ✅ | Tested |
| GET | `/manager/projects/{id}` | ✅ | Tested |
| POST | `/manager/projects` | ✅ | Tested — tạo project với `teamLeaderId` |
| PUT | `/manager/projects/{id}` | ✅ | Tested |

---

## 16. Manager — Department (`/manager/department`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/manager/department/members` | ✅ | Tested — trả department member list |
| GET | `/manager/department/members/{id}` | ✅ | Tested |
| GET | `/manager/department/team-leaders` | ✅ | Tested |

---

## 17. Accountant — Disbursements (`/accountant/disbursements`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/accountant/disbursements` | ✅ | Tested |
| GET | `/accountant/disbursements/{id}` | ✅ | Tested |
| POST | `/accountant/disbursements/{id}/disburse` | ✅ | Tested — Flow 1 Step 2 (với PIN) |
| POST | `/accountant/disbursements/{id}/reject` | ✅ | Tested — reject ADVANCE request đang ở APPROVED_BY_TEAM_LEADER; body `{note}` |

---

## 18. Accountant — Payroll (`/accountant/payroll`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/accountant/payroll` | ✅ | Tested |
| GET | `/accountant/payroll/{periodId}` | ✅ | Tested |
| POST | `/accountant/payroll` | ✅ | Tested — body: `{name,month,year,startDate,endDate}` |
| GET | `/accountant/payroll/template` | ✅ | Tested — trả Excel binary (HTTP 200) |
| POST | `/accountant/payroll/{periodId}/import` | ⚠️ | Integrated — multipart Excel; skip: cần file Excel hợp lệ |
| POST | `/accountant/payroll/{periodId}/confirm-overwrite` | ⚠️ | Integrated; skip: cần import trước |
| POST | `/accountant/payroll/{periodId}/auto-netting` | ✅ | Tested — trả `AutoNettingResponse` (empty summary ok) |
| POST | `/accountant/payroll/{periodId}/run` | ⚠️ | Integrated; skip: sẽ trả lương thực tế, không test trong môi trường dev có dữ liệu |
| PUT | `/accountant/payroll/{periodId}/entries/{payslipId}` | ⚠️ | Integrated; skip: cần payslip tồn tại sau import |

---

## 19. Accountant — Payslips (`/accountant/payslips`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/accountant/payslips/{payslipId}` | ⚠️ | Integrated (Sprint 15) — trang `accountant/payslips/[id]/page.tsx`; link từ payroll detail Step 2 |

---

## 20. Accountant — Ledger (`/accountant/ledger`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/accountant/ledger` | ✅ | Tested |
| GET | `/accountant/ledger/summary` | ✅ | Tested — trả `LedgerSummaryResponse` |
| GET | `/accountant/ledger/{transactionId}` | ✅ | Tested — cần **parent Transaction.id** (không phải LedgerEntry.id) |

---

## 21. Employee — Payslips (`/payslips`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/payslips` | ✅ | Tested — trả empty list (0 payslips seeded) |
| GET | `/payslips/{id}` | ⚠️ | Integrated; skip: không có payslip trong DB |

---

## 22. CFO — Approvals (`/cfo/approvals`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/cfo/approvals` | ✅ | Tested |
| GET | `/cfo/approvals/{id}` | ✅ | Tested — chi tiết DEPARTMENT_TOPUP request |
| POST | `/cfo/approvals/{id}/approve` | ✅ | Tested — Flow 3 approve; body `{comment}` |
| POST | `/cfo/approvals/{id}/reject` | ✅ | Tested — reject DEPARTMENT_TOPUP; body `{reason}` |

---

## 23. Company Fund (`/company-fund`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/company-fund` | ✅ | Tested |
| POST | `/company-fund/topup` | ✅ | Tested — sau khi fix FLOAT_MAIN `version=NULL` (xem §Bugs) |
| PUT | `/company-fund/bank-statement` | ✅ | Tested — body: `{externalBankBalance,lastStatementDate}` |
| GET | `/company-fund/reconciliation` | ✅ | Tested — trả `ReconciliationReportResponse` |

---

## 24. Dashboards

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/dashboard/manager` | ✅ | Tested |
| GET | `/dashboard/accountant` | ✅ | Tested |
| GET | `/cfo/dashboard` | ✅ | Tested (sau khi fix JPQL YEAR/MONTH) |
| GET | `/admin/dashboard` | ✅ | Tested |

---

## 25. Admin — Users (`/admin/users`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/admin/users` | ✅ | Tested |
| GET | `/admin/users/{id}` | ✅ | Tested |
| POST | `/admin/users` | ✅ | Tested — body: `{email,fullName,roleId,departmentId}` (roleId là integer) |
| PUT | `/admin/users/{id}` | ✅ | Tested |
| POST | `/admin/users/{id}/lock` | ✅ | Tested |
| POST | `/admin/users/{id}/unlock` | ✅ | Tested |
| POST | `/admin/users/{id}/reset-password` | ✅ | Tested |

---

## 26. Admin — Departments (`/admin/departments`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/admin/departments` | ✅ | Tested |
| GET | `/admin/departments/{id}` | ✅ | Tested |
| POST | `/admin/departments` | ✅ | Tested — có thể cung cấp `code` tường minh để tránh conflict |
| PUT | `/admin/departments/{id}` | ✅ | Tested |

---

## 27. Admin — Audit (`/admin/audit`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/admin/audit` | ✅ | Tested |

---

## 28. Admin — Settings (`/admin/settings`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/admin/settings` | ⚠️ | Integrated (Sprint 15) — `getAdminSettings()` từ `lib/api/system-config.ts`; dùng trong `admin/settings/page.tsx` |
| PUT | `/admin/settings` | ⚠️ | Integrated (Sprint 15) — `updateAdminSettings({configs:[{key,value}]})` batch update |

---

## 29. System Config (`/system-configs`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/system-configs` | ✅ | Tested |
| GET | `/system-configs/{key}` | ✅ | Tested |
| PUT | `/system-configs/{key}` | ✅ | Tested — update với existing value (idempotent) |
| POST | `/system-configs/{key}` | ✅ | Tested — tạo config key mới với `{value,description}` |
| DELETE | `/system-configs/{key}/cache` | ✅ | Tested |
| DELETE | `/system-configs/cache` | ✅ | Tested — clear toàn bộ cache |

---

## 30. File Storage (`/uploads`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/uploads/signature` | ✅ | Tested — Cloudinary signed URL |

---

## 31. Banks (`/banks`)

| Method | Endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| GET | `/banks` | ✅ | Tested |

---

## Backend Bug Fixes Applied (session 2026-05-12, session 1)

Các lỗi backend đã được sửa trong session kiểm thử đầu tiên:

| File | Lỗi | Fix |
|---|---|---|
| `CompanyFundController.java` | `@RequestMapping("/api/v1/company-fund")` → 404 double prefix | Đổi thành `@RequestMapping("/company-fund")` |
| `SystemConfigController.java` | `@RequestMapping("/api/v1/system-configs")` → 404 double prefix | Đổi thành `@RequestMapping("/system-configs")` |
| `AdminAuditController.java` | `@RequestMapping("/api/v1/admin")` → 404 double prefix | Đổi thành `@RequestMapping("/admin")` |
| `AdminSettingsController.java` | `@RequestMapping("/api/v1/admin")` → 404 double prefix | Đổi thành `@RequestMapping("/admin")` |
| `RequestRepository.java` | `FUNCTION('YEAR',...)` / `FUNCTION('MONTH',...)` — PostgreSQL không hỗ trợ | Đổi thành Hibernate HQL `YEAR(...)` / `MONTH(...)` |
| `ProjectRepository.java` | `lower(concat('%', :search, '%'))` với null param → `lower(bytea)` error | Pre-compute `searchLike` trong service, truyền non-null string |
| `ProjectMemberRepository.java` | Tương tự `lower(bytea)` error | Pre-compute `searchLike` trong `TeamLeaderProjectServiceImpl` |
| `accountant-dashboard.tsx` | `payroll?page=0&size=1` → 400 (payroll dùng 1-indexed `page`/`limit`) | Đổi thành `payroll?page=1&limit=1` |

---

## Known Bugs & Integration Issues (session 2026-05-12, session 2)

### Bug 1: FLOAT_MAIN wallet `version = NULL` — Backend migration issue

**Triệu chứng:** `POST /company-fund/topup` trả HTTP 500 "An unexpected error occurred".

**Nguyên nhân:** Migration V12 seed `Wallet(FLOAT_MAIN, ownerId=0)` qua SQL INSERT không set `version` column. Hibernate `@Version Long version` không thể update row khi DB value là `NULL` (optimistic lock mismatch).

**Fix tạm thời (DB):**
```sql
UPDATE wallets SET version = 0 WHERE version IS NULL AND owner_type = 'FLOAT_MAIN';
```

**Fix lâu dài:** Thêm `DEFAULT 0` cho column `version` trong `wallets` table, hoặc sửa V12 migration INSERT thêm `version = 0`.

---

### Bug 2: `GET /wallet/transactions` trả `LedgerEntry.id`, nhưng `GET /wallet/transactions/{id}` cần `Transaction.id` — **FIXED (session 3)**

**Triệu chứng:** FE page `/wallet/transactions` render link `href=/wallet/transactions/${tx.id}` dùng `LedgerEntryResponse.id` (ID của LedgerEntry trong DB). Nhưng `GET /wallet/transactions/{transactionId}` nhận **parent Transaction entity ID** — không phải LedgerEntry ID.

**Ví dụ:**
- `GET /wallet/transactions` trả `LedgerEntry.id = 2` (CREDIT side của emp.it1)
- `GET /wallet/transactions/2` → 404 "Transaction not found"
- `GET /wallet/transactions/1` → 200 (đây là parent Transaction.id = 1)

**Fix đã áp dụng:**
- Backend: Thêm field `transactionId: Long` vào `LedgerEntryResponse.java` và `WalletMapper.toLedgerEntryResponse()`
- Frontend: `types/wallet.ts` — thêm `transactionId: number` vào `LedgerEntryResponse`
- Frontend: `app/(dashboard)/wallet/transactions/page.tsx` — đổi navigation link từ `tx.id` → `tx.transactionId`

---

### Bug 3 (session 3, FIXED): Notification system gap — request service không publish sự kiện

**Quan sát (đã sửa):** `RequestServiceImpl` trước đây không bao giờ gọi `notificationPublisher.publish()` khi approve/reject request.

**Fix đã áp dụng (backend):**
- `UserRepository` thêm `findActiveUsersByRoleName(String roleName)`
- `UserService` / `UserServiceImpl` thêm `getActiveUsersByRoleName(String roleName)`
- `RequestServiceImpl` inject `NotificationPublisher` + `ProjectMemberRepository`, thêm 9 trigger points:

| Trigger | NotificationType | Recipient |
|---|---|---|
| `createRequest` (ADVANCE/EXPENSE/REIMBURSE) | `REQUEST_SUBMITTED` | TLs của project |
| `approveTlRequest` | `REQUEST_APPROVED_BY_TL` | Tất cả accountants |
| `rejectTlRequest` | `REQUEST_REJECTED` | Requester |
| `approveManagerRequest` | `PROJECT_TOPUP_APPROVED` | Requester (TL) |
| `rejectManagerRequest` | `PROJECT_TOPUP_REJECTED` | Requester (TL) |
| `approveCfoRequest` | `DEPT_TOPUP_APPROVED` | Requester (Manager) |
| `rejectCfoRequest` | `DEPT_TOPUP_REJECTED` | Requester (Manager) |
| `disburse` | `REQUEST_PAID` | Requester |
| `accountantReject` | `REQUEST_REJECTED` | Requester |

Notification failure được wrap trong try/catch để không break business transaction.

---

### Note: Withdraw endpoints — MockBank dependency

`POST /wallet/withdraw`, `DELETE /wallet/withdraw/{id}`, `PUT /wallet/withdraw/{id}/execute` đều gọi MockBank service tại `http://localhost:8081`. Service này phải chạy riêng (không có trong `docker-compose.yml`). Các endpoint này đã được integrate đúng từ FE nhưng **không thể test** khi MockBank không chạy.
