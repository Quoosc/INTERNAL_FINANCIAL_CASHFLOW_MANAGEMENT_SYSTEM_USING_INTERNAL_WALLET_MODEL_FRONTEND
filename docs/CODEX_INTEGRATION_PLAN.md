# CODEX Integration Plan — Frontend ↔ Backend, Role-by-Role

> Version: 2.1 (2026-05-11)
> Scope: Wire each frontend page hiện đang dùng MOCK data sang gọi API thật của backend.
> Prerequisite: đã đọc `docs/API_CONTRACT.md`, `docs/FLOW.md`, `CLAUDE.md`.
> Backend chạy ở `localhost:8080`, proxy qua `next.config.ts` (`/api/:path*`).

---

## 0. Conventions tuyệt đối phải tuân thủ

1. **Chỉ gọi API qua `lib/api-client.ts`** (`api.get/post/put/patch/delete`). Tuyệt đối
   không dùng `fetch` thẳng (trừ trường hợp upload trực tiếp lên Cloudinary đã có trong
   `app/(dashboard)/profile/page.tsx`).
2. **Types luôn import từ barrel `@/types`** — không từ file lẻ.
3. **Pagination chuẩn hoá**: dùng `lib/adapters/pagination.ts`. UI 1-indexed, backend
   tuỳ endpoint:
   - Spring Data `page`/`size` (0-indexed): wallet, withdraw, projects, team-leader,
     manager, accountant disbursements, requests list dùng `?page=0&size=20`.
   - Custom `page`/`limit` (1-indexed): notifications, payslips, requests theo doc hiện tại.
   Khi tham chiếu `API_CONTRACT.md` để xác nhận exact convention từng endpoint.
4. **Status mapping** (Flow 1): trạng thái Accountant queue đã thay
   `PENDING_ACCOUNTANT_EXECUTION` → `APPROVED_BY_TEAM_LEADER`. Dùng helper
   `lib/adapters/request-status.ts`.
5. **Lint là quality gate duy nhất**: chạy `npm run lint`. PR phải 0 errors trước khi
   merge. Không tạo file test mới (project chưa có test runner).
6. **Server vs Client**: mặc định Server Component. Thêm `"use client"` chỉ khi cần
   `useState/useEffect/useContext/useRouter/useSearchParams/onSubmit`.
7. **MOCK pattern**: nếu backend chưa có endpoint, **giữ MOCK** với block:
   ```ts
   // ─── MOCK DATA (xóa khi backend sẵn sàng) ────────────────────────────────
   const MOCK_X = {...};
   // TODO: Replace when Sprint N is complete
   // ─────────────────────────────────────────────────────────────────────────
   ```
   Không cố gọi API mà chắc chắn backend chưa có (sẽ ra 404).
8. **Adapter ưu tiên**: trước khi viết logic mới, kiểm tra `lib/adapters/` đã có helper
   chưa. Cần thêm thì đặt vào đó.

---

## 1. Backend coverage matrix (snapshot 2026-05-11)

Đối chiếu thực tế `*Controller.java` với trạng thái FE hiện tại.

| Module                       | Backend status | FE status | Notes |
| ---------------------------- | -------------- | --------- | ----- |
| `/auth/*`                    | ✅ Đã có       | ✅ Wired  | AuthController — kể cả forgot-password 2-step |
| `/users/me/*`                | ✅ Đã có       | ✅ Wired  | ProfileController |
| `/users/stream` (SSE)        | ✅ Đã có       | ✅ Wired  | UserController, 4 event channels |
| `/banks`                     | ✅ Đã có       | ✅ Wired  | BankController |
| `/uploads/signature`         | ✅ Đã có       | ✅ Wired  | FileStorageController |
| `/wallet`                    | ✅ Đã có       | ✅ Wired  | WalletController |
| `/wallet/withdraw*`          | ✅ Đã có       | ✅ Wired  | WithdrawController — user + accountant endpoints |
| `/wallet/deposit*`           | ✅ Đã có       | ✅ Wired  | DepositController (VNPay) — Sprint 11: breaking change từ `/payments*` |
| `/company-fund*`             | ✅ Đã có       | ✅ Wired  | CompanyFundController — CFO + Admin |
| `/system-configs*`           | ✅ Đã có       | ✅ Wired  | SystemConfigController — dùng path `/system-configs` không phải `/admin/settings` |
| `/notifications*`            | ✅ Đã có       | ✅ Wired  | NotificationController |
| `/payslips*`                 | ✅ Đã có       | ✅ Wired  | PayslipController |
| `/projects*`                 | ✅ Đã có       | ✅ Wired  | ProjectController (read-only) |
| `/requests*`                 | ✅ Đã có       | ✅ Wired  | RequestController |
| `/team-leader/projects*`     | ✅ Đã có       | ✅ Wired  | TeamLeaderProjectController |
| `/team-leader/categories*`   | ✅ Đã có       | ✅ Wired  | TeamLeaderCategoryController |
| `/team-leader/approvals*`    | ✅ Đã có       | ✅ Wired  | TeamLeaderApprovalController |
| `/team-leader/team-members*` | ✅ Đã có       | ✅ Wired  | Sprint 6 — page 1-indexed + limit |
| `/manager/approvals*`        | ✅ Đã có       | ✅ Wired  | ManagerApprovalController |
| `/manager/projects*`         | ✅ Đã có       | ✅ Wired  | ManagerProjectController — Sprint 6 |
| `/manager/department/*`      | ✅ Đã có       | ✅ Wired  | ManagerProjectController — Sprint 6 |
| `/accountant/disbursements*` | ✅ Đã có       | ✅ Wired  | AccountantDisbursementController |
| `/accountant/payroll/*`      | ✅ Đã có       | ✅ Wired  | AccountantPayrollController — Sprint 10 |
| `/accountant/ledger/*`       | ✅ Đã có       | ✅ Wired  | AccountantLedgerController — Sprint 10 |
| `/cfo/approvals*`            | ✅ Đã có       | ✅ Wired  | Sprint 5 — DEPARTMENT_TOPUP queue |
| `/cfo/dashboard`             | ✅ Đã có       | ✅ Wired  | CfoDashboardController — Sprint 12 |
| `/admin/users*`              | ✅ Đã có       | ✅ Wired  | UserController — CRUD, lock/unlock, reset-password |
| `/admin/departments*`        | ✅ Đã có       | ✅ Wired  | AdminDepartmentController |
| `/admin/audit*`              | ✅ Đã có       | ✅ Wired  | AuditController |
| `/admin/dashboard`           | ✅ Đã có       | ✅ Wired  | AdminDashboardController — Sprint 12 |
| `/dashboard/manager`         | ✅ Đã có       | ✅ Wired  | DashboardController — Sprint 12 |
| `/dashboard/accountant`      | ✅ Đã có       | ✅ Wired  | DashboardController — Sprint 12 |

**Tổng kết (2026-05-11)**: 32/32 modules đã wire API thật. Không còn module nào dùng MOCK do backend chưa implement.

> **Pagination convention:**
> - TL/Manager/Notifications/Payslips: `page` **1-indexed** + `limit` — không dùng `toApiPage()`
> - Spring Data (wallet, withdraw, requests, disbursements, projects): `page` **0-indexed** + `size`

---

## 2. Thứ tự thực thi (sprint order)

Theo dependency từ thấp lên cao của business graph:

| # | Sprint                                      | Roles ảnh hưởng    | Estimate | Trạng thái |
| - | ------------------------------------------- | ------------------- | -------- | ---------- |
| 1 | EMPLOYEE — Wallet/Requests/Payslip          | EMPLOYEE            | 1 ngày   | ✅ Done     |
| 2 | TEAM_LEADER — Approvals + Projects          | TEAM_LEADER         | 2 ngày   | ✅ Done     |
| 3 | MANAGER — Approvals (PROJECT_TOPUP)         | MANAGER             | 1 ngày   | ✅ Done     |
| 4 | ACCOUNTANT — Disbursements only             | ACCOUNTANT          | 1 ngày   | ✅ Done     |
| 5 | Cross-cutting — SSE realtime                | All                 | 1 ngày   | ✅ Done     |
| 6 | TL Team + Manager Projects + Dept           | TL/Manager          | 1 ngày   | ✅ Done     |
| 7 | CFO/Admin/Quality fixes                     | CFO/Admin/All       | 1 ngày   | ✅ Done     |
| 8 | Auth flows — forgot-password                | All                 | 0.5 ngày | ✅ Done     |
| 9 | Cleanup + docs                              | —                   | 0.5 ngày | ✅ Done     |
| 10 | ACCOUNTANT — Payroll + Ledger (Sprint 10)  | ACCOUNTANT          | 1 ngày   | ✅ Done     |
| 11 | Deposit breaking change (Sprint 11)         | All                 | 0.5 ngày | ✅ Done     |
| 12 | Dashboard API — 4 dedicated endpoints (Sprint 12) | All          | 0.5 ngày | ✅ Done     |

> Mỗi sprint là 1 PR. Lint xanh trước khi merge.

---

## 3. Sprint 1 — EMPLOYEE ✅

### 3.1 Phạm vi

Trang shared dưới `app/(dashboard)/`:

- `wallet/page.tsx` (đã wire — verify lại sau fix `/payments`)
- `wallet/deposit/page.tsx` (đã wire — verify lại sau fix)
- `wallet/withdraw/page.tsx`
- `wallet/transactions/page.tsx`, `wallet/transactions/[id]/page.tsx`
- `requests/page.tsx`, `requests/new/page.tsx`, `requests/[id]/page.tsx`
- `payroll/page.tsx`, `payroll/[id]/page.tsx`
- `notifications/page.tsx` (cần wire)
- `dashboard/page.tsx` (employee-dashboard component)
- `profile/page.tsx`
- `projects/page.tsx`, `projects/[id]/page.tsx` (read-only view dành cho mọi role)

### 3.2 Endpoints thật cần dùng

| Trang                        | Method | Endpoint                                                        | Type response                          |
| ---------------------------- | ------ | --------------------------------------------------------------- | -------------------------------------- |
| wallet/page.tsx              | GET    | `/api/v1/wallet`                                                | `WalletResponse`                       |
| wallet/page.tsx              | GET    | `/api/v1/wallet/transactions?page=0&size=5`                     | `PageResponse<LedgerEntryResponse>`    |
| wallet/deposit/page.tsx      | POST   | `/api/v1/payments` (qua `createDeposit()`)                      | `PaymentCreateResponse`                |
| wallet/deposit/page.tsx      | GET    | `/api/v1/payments/status?gateway=&transactionRef=`              | `PaymentStatusResponse`                |
| wallet/withdraw/page.tsx     | POST   | `/api/v1/wallet/withdraw`                                       | `WithdrawRequestResponse`              |
| wallet/withdraw/page.tsx     | GET    | `/api/v1/wallet/withdraw/my?page&size`                          | `Page<WithdrawRequestResponse>`        |
| wallet/transactions/page.tsx | GET    | `/api/v1/wallet/transactions?page&size&from&to`                 | `PageResponse<LedgerEntryResponse>`    |
| wallet/transactions/[id]     | GET    | `/api/v1/wallet/transactions/{id}`                              | `TransactionResponse`                  |
| requests/page.tsx            | GET    | `/api/v1/requests?type&status&search&page&limit`                | `PageResponse<RequestSummaryResponse>` |
| requests/page.tsx            | GET    | `/api/v1/requests/summary`                                      | `RequestSummaryResponse`               |
| requests/new/page.tsx        | GET    | `/api/v1/projects?status=ACTIVE`                                | `ProjectOptionResponse[]`              |
| requests/new/page.tsx        | GET    | `/api/v1/projects/{projectId}/phases?status=ACTIVE`             | `ProjectPhasesResponse`                |
| requests/new/page.tsx        | GET    | `/api/v1/projects/{phaseId}` (categories)                       | `ExpenseCategoryListResponse`          |
| requests/new/page.tsx        | POST   | `/api/v1/requests`                                              | `RequestDetailResponse`                |
| requests/[id]/page.tsx       | GET    | `/api/v1/requests/{id}`                                         | `RequestDetailResponse`                |
| requests/[id]/page.tsx       | PUT    | `/api/v1/requests/{id}` (only PENDING)                          | `RequestDetailResponse`                |
| requests/[id]/page.tsx       | DELETE | `/api/v1/requests/{id}` (only PENDING)                          | `{message}`                            |
| payroll/page.tsx             | GET    | `/api/v1/payslips?year&status&page&limit`                       | `PageResponse<PayslipListItem>`        |
| payroll/[id]/page.tsx        | GET    | `/api/v1/payslips/{id}`                                         | `PayslipDetailResponse`                |
| notifications/page.tsx       | GET    | `/api/v1/notifications?isRead&type&page&limit`                  | `NotificationListResponse`             |
| notifications/page.tsx       | PATCH  | `/api/v1/notifications/{id}/read`                               | `NotificationResponse`                 |
| notifications/page.tsx       | PATCH  | `/api/v1/notifications/read-all`                                | `void`                                 |
| profile/page.tsx             | GET    | `/api/v1/users/me/profile` + `/api/v1/banks`                    | `MyProfileResponse` + `BankOption[]`   |
| profile/page.tsx             | PUT    | `/api/v1/users/me/profile` etc.                                 | `MyProfileResponse`                    |
| dashboard/page.tsx           | GET    | `/api/v1/wallet` + `/requests/summary` + `/notifications/unread-count` | composite                    |

### 3.3 Steps

1. Verify deposit/withdraw flow vẫn xanh sau migration `/payments`.
2. Wire `app/(dashboard)/notifications/page.tsx` từ MOCK → `lib/api/notification.ts`
   helpers (đã có sẵn). Re-use NotificationContext nếu cần SSE update sau Sprint 5.
3. `dashboard/page.tsx`: gọi composite — chấp nhận tạm gộp 3 request song song bằng
   `Promise.allSettled` để 1 endpoint fail không vỡ cả trang. Component
   `EmployeeDashboard` (`components/dashboard/employee-dashboard.tsx`) đã sẵn prop-driven.
4. `requests/new/page.tsx` còn TODO upload file (`/files/...`). Tạm dùng
   `/uploads/signature` flow đã có sẵn trong `profile/page.tsx`. Block sau khi backend
   `/files` được mở rộng nếu cần.

### 3.4 Acceptance criteria (Sprint 1)

> Code wiring hoàn thành. Các mục `[x]` đã verified bằng lint. Smoke test bên dưới dành để tự verify với backend thật.

> 🧪 **Smoke test (tự test):** Đăng nhập `emp.it1@ifms.vn / Ifms@2026` → `/dashboard` không có console error.

- [x] `/wallet/deposit` mở trang, chọn 50.000đ → tạo URL VNPay sandbox thành công, click "Kiểm tra trạng thái" trả về `PENDING`.
- [x] `/wallet/withdraw` tạo yêu cầu → reload list xuất hiện status `PENDING`.
- [x] `/requests` list, summary, filter theo status hoạt động.
- [x] `/requests/new` tạo `EXPENSE` với 1 attachment → submit thành công.
- [x] `/payroll` list ≥ 0 payslip, click vào detail không lỗi.
- [x] `/notifications` list + mark-as-read + mark-all hoạt động; số unread đồng bộ.
- [x] `npm run lint` 0 error.

---

## 4. Sprint 2 — TEAM_LEADER ✅

### 4.1 Phạm vi

- `app/(dashboard)/team-leader/approvals/page.tsx`
- `app/(dashboard)/team-leader/approvals/[id]/page.tsx`
- `app/(dashboard)/team-leader/projects/page.tsx`
- `app/(dashboard)/team-leader/projects/[id]/page.tsx`
- `app/(dashboard)/team-leader/team/page.tsx` ← wired tại Sprint 6

### 4.2 Endpoints sẵn sàng (WIRE NOW)

| Trang                   | Method | Endpoint                                                        | Type                                       |
| ----------------------- | ------ | --------------------------------------------------------------- | ------------------------------------------ |
| approvals/page.tsx      | GET    | `/api/v1/team-leader/approvals?type&projectId&search&page&size` | `PageResponse<TlApprovalSummaryResponse>`  |
| approvals/[id]/page.tsx | GET    | `/api/v1/team-leader/approvals/{id}`                            | `TlApprovalDetailResponse`                 |
| approvals/[id]/page.tsx | POST   | `/api/v1/team-leader/approvals/{id}/approve`                    | `TlApproveResponse`                        |
| approvals/[id]/page.tsx | POST   | `/api/v1/team-leader/approvals/{id}/reject`                     | `TlRejectResponse`                         |
| projects/page.tsx       | GET    | `/api/v1/team-leader/projects?status&search&page&limit`         | `PageResponse<ProjectSummaryResponse>`     |
| projects/[id]/page.tsx  | GET    | `/api/v1/team-leader/projects/{id}`                             | `ProjectDetailResponse`                    |
| projects/[id]/page.tsx  | GET    | `/api/v1/team-leader/projects/{id}/available-members?search`    | `AvailableMemberResponse[]`                |
| projects/[id]/page.tsx  | POST   | `/api/v1/team-leader/projects/{id}/members`                     | `ProjectMemberResponse`                    |
| projects/[id]/page.tsx  | PUT    | `/api/v1/team-leader/projects/{id}/members/{userId}`            | `ProjectMemberResponse`                    |
| projects/[id]/page.tsx  | DELETE | `/api/v1/team-leader/projects/{id}/members/{userId}`            | void                                       |
| projects/[id]/page.tsx  | POST   | `/api/v1/team-leader/projects/{id}/phases`                      | `ProjectPhaseResponse`                     |
| projects/[id]/page.tsx  | PUT    | `/api/v1/team-leader/projects/{id}/phases/{phaseId}`            | `ProjectPhaseResponse`                     |
| projects/[id]/page.tsx  | GET    | `/api/v1/team-leader/projects/{id}/categories?phaseId`          | `PhaseCategoryBudgetResponse`              |
| projects/[id]/page.tsx  | PUT    | `/api/v1/team-leader/projects/{id}/categories`                  | `PhaseCategoryBudgetResponse`              |
| projects/[id]/page.tsx  | GET    | `/api/v1/team-leader/expense-categories?projectId`              | `ExpenseCategoryResponse[]`                |
| projects/[id]/page.tsx  | POST   | `/api/v1/team-leader/projects/{id}/expense-categories`          | `ExpenseCategoryResponse`                  |

### 4.3 Steps

1. Trên cả 2 trang approvals, dùng `lib/adapters/team-leader.ts` (đã có) để
   normalise `TlApprovalSummaryResponse` và `TlApprovalDetailResponse`.
2. Pagination: backend dùng 0-indexed `page`/`size`. UI 1-indexed → dùng
   `lib/adapters/pagination.ts`.
3. Trên `projects/[id]/page.tsx` body update budget: backend nhận **1 row** mỗi
   request `{ phaseId, categoryId, budgetLimit }`. Loop khi user submit batch UI; nếu
   1 row fail, hiện partial-failure toast.
4. Status filter của approvals chỉ áp dụng `type` + `projectId` + `search`. KHÔNG
   filter theo `status`.
5. **BLOCK** trang `team-leader/team/page.tsx`: chưa có endpoint
   `/team-leader/team-members`. Giữ MOCK + comment rõ block.

### 4.4 Acceptance criteria (Sprint 2)

> Code wiring hoàn thành. Smoke test bên dưới dành để tự verify với backend thật.

> 🧪 **Smoke test (tự test):** Đăng nhập `tl.it@ifms.vn / Ifms@2026`.
- [x] `/team-leader/approvals` list + filter type + pagination.
- [x] Mở 1 detail, approve → toast success, list refresh, item rời queue.
- [x] Reject với reason → tương tự.
- [x] `/team-leader/projects` list + detail.
- [x] Trong detail: thêm phase, sửa phase, set category budgets, add member, update position, remove member.
- [x] `/team-leader/team` còn MOCK với block-comment rõ ràng.
- [x] `npm run lint` 0 error.

---

## 5. Sprint 3 — MANAGER (Approvals only) ✅

### 5.1 Phạm vi WIRE NOW

- `app/(dashboard)/manager/approvals/page.tsx`
- `app/(dashboard)/manager/approvals/[id]/page.tsx`

### 5.2 Phạm vi BLOCKED (đã unblock tại Sprint 6)

- `manager/projects/page.tsx`, `manager/projects/[id]/page.tsx` — wired tại Sprint 6.
- `manager/department/page.tsx` — wired tại Sprint 6.

### 5.3 Endpoints

| Trang                       | Method | Endpoint                                         | Type                                          |
| --------------------------- | ------ | ------------------------------------------------ | --------------------------------------------- |
| approvals/page.tsx          | GET    | `/api/v1/manager/approvals?search&page&size`     | `PageResponse<ManagerApprovalSummaryResponse>` |
| approvals/[id]/page.tsx     | GET    | `/api/v1/manager/approvals/{id}`                 | `ManagerApprovalDetailResponse`               |
| approvals/[id]/page.tsx     | POST   | `/api/v1/manager/approvals/{id}/approve`         | `ManagerApproveResponse`                      |
| approvals/[id]/page.tsx     | POST   | `/api/v1/manager/approvals/{id}/reject`          | `ManagerRejectResponse`                       |

### 5.4 Steps

1. Approval body: `{ comment?, approvedAmount }` (ApproveRequestRequest).
2. Reject body: `{ reason }` (RejectRequestRequest).
3. `ManagerApprovalDetailResponse` chứa `project.availableBudget` và
   `department.totalAvailableBalance` để hiển thị "BudgetHealthCard".
4. Pagination: 0-indexed.
5. Sau approve, status backend chuyển `PENDING → APPROVED_BY_MANAGER` (scheduler tự
   `→ PAID` trong 1 phút). FE chỉ refresh list, không cần poll.

### 5.5 Acceptance criteria (Sprint 3)

> Code wiring hoàn thành. Smoke test bên dưới dành để tự verify với backend thật.

> 🧪 **Smoke test (tự test):** Đăng nhập `manager.it@ifms.vn / Ifms@2026`.
- [x] `/manager/approvals` list + pagination.
- [x] Approve 1 PROJECT_TOPUP → toast, item rời queue.
- [x] Reject 1 item → tương tự.
- [x] Các trang `/manager/projects` và `/manager/department` còn MOCK rõ ràng (block-comment).
- [x] `npm run lint` 0 error.

---

## 6. Sprint 4 — ACCOUNTANT (Disbursements only) ✅

### 6.1 Phạm vi WIRE NOW

- `app/(dashboard)/accountant/disbursements/page.tsx`
- `app/(dashboard)/accountant/disbursements/[id]/page.tsx`

### 6.2 Phạm vi BLOCKED

- `accountant/payroll/page.tsx`, `accountant/payroll/[id]/page.tsx` — chưa có `/accountant/payroll/*` controller.
- `accountant/ledger/page.tsx`, `accountant/ledger/[id]/page.tsx` — chưa có `/accountant/ledger/*` controller.

### 6.3 Endpoints

| Trang                       | Method | Endpoint                                                        | Type                                                  |
| --------------------------- | ------ | --------------------------------------------------------------- | ----------------------------------------------------- |
| disbursements/page.tsx      | GET    | `/api/v1/accountant/disbursements?type&search&page&size`        | `PageResponse<AccountantDisbursementSummaryResponse>` |
| disbursements/[id]/page.tsx | GET    | `/api/v1/accountant/disbursements/{id}`                         | `AccountantDisbursementDetailResponse`                |
| disbursements/[id]/page.tsx | POST   | `/api/v1/accountant/disbursements/{id}/disburse`                | `DisburseResponse`                                    |
| disbursements/[id]/page.tsx | POST   | `/api/v1/accountant/disbursements/{id}/reject`                  | `AccountantRejectResponse`                            |

### 6.4 Steps

1. Queue status đúng = `APPROVED_BY_TEAM_LEADER` (đã được sửa trong sync-gap PR).
2. `disburse` body: `{ pin, note? }`. Trên FE, hiển thị PIN modal trước khi gọi.
3. PIN sai 5 lần → `423 Locked` (xử lý theo `ApiError.status`).
4. Reject body: `{ reason }`.
5. Sau disburse → status `PAID` → SSE `wallet.updated` push tới employee. FE
   accountant chỉ refresh list/detail.

### 6.5 Acceptance criteria (Sprint 4)

> Code wiring hoàn thành. Smoke test bên dưới dành để tự verify với backend thật.

> 🧪 **Smoke test (tự test):** Đăng nhập `accountant@ifms.vn / Ifms@2026`.
- [x] `/accountant/disbursements` list filter type, pagination.
- [x] Mở detail → nhập PIN → disburse flow có xử lý lỗi theo API.
- [x] PIN sai → hiển thị message lỗi từ backend (bao gồm 423 Locked).
- [x] Reject → reason bắt buộc, gửi đúng body reason.
- [x] Các trang payroll/ledger còn MOCK rõ ràng (block-comment).
- [x] `npm run lint` 0 error.

---

## 7. Sprint 5 — Cross-cutting: SSE realtime ✅

### 7.1 Phạm vi

- `contexts/wallet-context.tsx` (đã có `updateFromSse()`).
- `lib/hooks/use-user-stream.ts` — hook SSE mới.
- Connection setup ở `app/(dashboard)/layout.tsx` (1 connection cho cả session).

### 7.2 Endpoint

`GET /api/v1/users/stream` (text/event-stream, Bearer auth).

Events backend đẩy:

| Event               | Payload            | FE handler                                              |
| ------------------- | ------------------ | ------------------------------------------------------- |
| `connected`         | `"SSE connected"`  | debug log only                                          |
| `wallet.updated`    | `WalletResponse`   | `walletContext.updateFromSse(data)`                     |
| `transaction.created` | `LedgerEntryResponse` | custom event `wallet:transaction-created` → prepend list |
| `notification`      | `NotificationResponse` | custom event `notifications:new` + increment badge  |

### 7.3 Steps

1. `npm i @microsoft/fetch-event-source` (native `EventSource` không cho custom header).
2. Tạo hook `useUserStream()` trong `lib/hooks/use-user-stream.ts`:
   - Mở 1 connection khi user đăng nhập.
   - `openWhenHidden: true` để giữ kết nối khi tab ở background.
   - Auto-reconnect (lib tự xử). Khi `onopen` lại → gọi 1 lần `fetchWallet()` +
     `fetchUnreadCount()` để bù event lỡ.
3. Inject hook ở `app/(dashboard)/layout.tsx`, **sau** `AuthProvider` và `WalletProvider`.
4. Đóng stream khi `logout`.

### 7.4 Acceptance criteria (Sprint 5)

> Audit 2026-04-28: [x] = hoàn thành ở mức frontend wiring + lint; chưa bao gồm manual smoke test.

- [x] Mở 2 tab cùng user. Ở tab A: kế toán disburse → tab B (employee) thấy số dư cập nhật trong < 2s.
- [x] Logout → stream đóng (DevTools Network tab).
- [x] Refresh → đúng 1 connection được mở.
- [x] `npm run lint` 0 error.

---

## 8. Sprint 6 — TL Team + Manager Projects + Dept Members ✅

### 8.1 Phạm vi

- `app/(dashboard)/team-leader/team/page.tsx`
- `app/(dashboard)/manager/projects/page.tsx`
- `app/(dashboard)/manager/projects/[id]/page.tsx`
- `app/(dashboard)/manager/department/page.tsx`

### 8.2 Endpoints wired

| Trang                          | Method | Endpoint                                               | Notes                                     |
| ------------------------------ | ------ | ------------------------------------------------------ | ----------------------------------------- |
| team/page.tsx                  | GET    | `/api/v1/team-leader/team-members?search&projectId&page&limit` | page 1-indexed, param `limit`       |
| team/page.tsx                  | GET    | `/api/v1/team-leader/team-members/{userId}`            | detail panel                              |
| manager/projects/page.tsx      | GET    | `/api/v1/manager/projects?status&search&page&limit`    | page 1-indexed, param `limit`             |
| manager/projects/page.tsx      | POST   | `/api/v1/manager/projects`                             | body `{ name, description?, totalBudget, teamLeaderId }` |
| manager/projects/page.tsx      | GET    | `/api/v1/manager/department/team-leaders`              | populate dropdown                         |
| manager/projects/[id]/page.tsx | GET    | `/api/v1/manager/projects/{id}`                        |                                           |
| manager/projects/[id]/page.tsx | PUT    | `/api/v1/manager/projects/{id}`                        | body `{ name?, description?, totalBudget?, status?, teamLeaderId? }` |
| manager/projects/[id]/page.tsx | GET    | `/api/v1/manager/department/team-leaders`              | populate dropdown                         |
| department/page.tsx            | GET    | `/api/v1/manager/department/members?search&page&limit` | page 1-indexed, param `limit`             |
| department/page.tsx            | GET    | `/api/v1/manager/department/members/{id}`              | detail panel                              |

### 8.3 Acceptance criteria (Sprint 6)

- [x] `/team-leader/team` list + filter + detail panel live từ API.
- [x] `/manager/projects` list + tạo dự án + chọn TL từ dropdown thật.
- [x] `/manager/projects/:id` detail + sửa tên/budget/status/TL live.
- [x] `/manager/department` list thành viên + detail panel live.
- [x] `npm run lint` 0 error.

---

## 9. Status — Tất cả module đã wire ✅

Không còn module nào bị blocked. Toàn bộ 32 module đã wire API thật tính đến Sprint 12.

Nếu backend có thêm controller mới trong tương lai, cập nhật bảng coverage matrix ở §1 và thêm sprint entry vào §2.

---

## 9. Definition of Done — toàn plan

1. Mỗi sprint là 1 PR riêng. Không gộp 2 role vào 1 PR.
2. PR description liệt kê: endpoints đã wire, file động tới, ảnh chụp manual smoke
   test, kết quả `npm run lint`.
3. `MOCK_*` còn lại trong codebase phải có comment block lý do block + endpoint cần
   để backend triển khai sau.

---

## 10. Reference

- `docs/API_CONTRACT.md` — full API contract (đã update 2026-04-28 cho `/payments`).
- `docs/FLOW.md` — business flows + Server vs Client guide.
- `lib/api-client.ts` — único entrypoint gọi backend.
- `lib/adapters/` — `pagination.ts`, `request-status.ts`, `team-leader.ts`.
- `types/index.ts` — barrel export bắt buộc.
- `CLAUDE.md` — operating SOP cho repo này.
