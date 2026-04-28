# CODEX Integration Plan — Frontend ↔ Backend, Role-by-Role

> Version: 1.0 (2026-04-28)
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

## 1. Backend coverage matrix (snapshot 2026-04-28)

Đối chiếu thực tế `*Controller.java` với các đường dẫn FE đang gọi.

| Module                       | Backend status | Notes                                                   |
| ---------------------------- | -------------- | ------------------------------------------------------- |
| `/auth/*`                    | ✅ Đã có       | AuthController                                          |
| `/users/me/*`                | ✅ Đã có       | ProfileController                                       |
| `/users/stream` (SSE)        | ✅ Đã có       | UserController, 4 channels                              |
| `/users/onboard`             | ✅ Đã có       | UserController, ADMIN-only                              |
| `/banks`                     | ✅ Đã có       | BankController                                          |
| `/uploads/signature`         | ✅ Đã có       | FileStorageController                                   |
| `/wallet`                    | ✅ Đã có       | WalletController (3 GET endpoints)                      |
| `/wallet/withdraw*`          | ✅ Đã có       | WithdrawController                                      |
| `/payments*`                 | ✅ Đã có       | PaymentController — thay cho `/wallet/deposit` (đã sửa) |
| `/company-fund*`             | ✅ Đã có       | CompanyFundController                                   |
| `/system-configs*`           | ✅ Đã có       | SystemConfigController                                  |
| `/notifications*`            | ✅ Đã có       | NotificationController                                  |
| `/payslips*`                 | ✅ Đã có       | PayslipController                                       |
| `/projects*`                 | ✅ Đã có       | ProjectController (read-only options)                   |
| `/requests*`                 | ✅ Đã có       | RequestController                                       |
| `/team-leader/projects*`     | ✅ Đã có       | TeamLeaderProjectController                             |
| `/team-leader/categories*`   | ✅ Đã có       | TeamLeaderCategoryController                            |
| `/team-leader/approvals*`    | ✅ Đã có       | TeamLeaderApprovalController                            |
| `/manager/approvals*`        | ✅ Đã có       | ManagerApprovalController                               |
| `/accountant/disbursements*` | ✅ Đã có       | AccountantDisbursementController                        |
| `/team-leader/team-members*` | ❌ Chưa có     | FE còn MOCK — block                                     |
| `/manager/projects*`         | ❌ Chưa có     | FE còn MOCK — block                                     |
| `/manager/department/*`      | ❌ Chưa có     | FE còn MOCK — block (members + team-leaders)            |
| `/accountant/payroll/*`      | ❌ Chưa có     | FE còn MOCK — block                                     |
| `/accountant/ledger/*`       | ❌ Chưa có     | FE còn MOCK — block                                     |
| `/cfo/*`                     | ❌ Chưa có     | FE còn MOCK — block                                     |
| `/admin/users*`              | ❌ Chưa có     | FE còn MOCK — block (chỉ có `POST /users/onboard`)      |
| `/admin/departments*`        | ❌ Chưa có     | FE còn MOCK — block                                     |
| `/admin/audit*`              | ❌ Chưa có     | FE còn MOCK — block                                     |
| `/admin/settings*`           | ⚠ Một phần    | Dùng `/system-configs` (path khác)                      |
| `/dashboard/*`               | ❌ Chưa có     | FE còn MOCK — block                                     |

**Tổng kết**: 20 modules ↔ ~80 endpoints sẵn sàng. ~9 module backend chưa implement.
Plan dưới đây phân biệt rõ phần "WIRE NOW" (backend đã có) và "BLOCKED" (đợi backend).

---

## 2. Thứ tự thực thi (sprint order)

Theo dependency từ thấp lên cao của business graph:

| # | Sprint                              | Roles ảnh hưởng                 | Estimate | Trạng thái |
| - | ----------------------------------- | -------------------------------- | -------- | ---------- |
| 1 | EMPLOYEE — Wallet/Requests/Payslip  | EMPLOYEE                         | 1 ngày   | ✅ Done     |
| 2 | TEAM_LEADER — Approvals + Projects  | TEAM_LEADER                      | 2 ngày   | ✅ Done     |
| 3 | MANAGER — Approvals (PROJECT_TOPUP) | MANAGER                          | 1 ngày   | ✅ Done     |
| 4 | ACCOUNTANT — Disbursements only     | ACCOUNTANT                       | 1 ngày   | ✅ Done     |
| 5 | Cross-cutting — SSE realtime        | All                              | 1 ngày   | ✅ Done     |
| 6 | BLOCKED Sprint — đợi backend        | TL/Manager/Accountant/Admin/CFO  | TBD      | ⏳ Blocked  |

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
- `app/(dashboard)/team-leader/team/page.tsx` ← **BLOCKED**, giữ MOCK

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

### 5.2 Phạm vi BLOCKED (giữ MOCK)

- `manager/projects/page.tsx`, `manager/projects/[id]/page.tsx` — chưa có `/manager/projects*`.
- `manager/department/page.tsx` — chưa có `/manager/department/*`.

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

## 8. BLOCKED Sprint — đợi backend ⏳

Các trang sau **không** được wire ở Sprint 1–5. Codex giữ MOCK + comment block. Khi
backend mở endpoint, mở PR riêng theo plan này (sao chép cấu trúc Sprint 2-4).

| Trang                                 | Endpoint cần                              | Notes                             |
| ------------------------------------- | ----------------------------------------- | --------------------------------- |
| `team-leader/team/page.tsx`           | `/team-leader/team-members*`              | TL xem nhân sự nhóm               |
| `manager/projects/page.tsx`           | `/manager/projects?status&search&page&size` |                                 |
| `manager/projects/[id]/page.tsx`      | `/manager/projects/{id}` + PUT            |                                   |
| `manager/projects/page.tsx`           | `/manager/department/team-leaders`        | populate dropdown TL              |
| `manager/department/page.tsx`         | `/manager/department/members*`            | dashboard + members               |
| `accountant/payroll/*`                | toàn bộ `/accountant/payroll/*`           | import → auto-netting → run       |
| `accountant/ledger/*`                 | `/accountant/ledger/*`                    | sổ cái + transaction inspector    |
| `cfo/approvals/*`                     | `/cfo/approvals/*`                        | duyệt DEPARTMENT_TOPUP            |
| `cfo/audit-logs/page.tsx`             | `/admin/audit*` hoặc `/cfo/audit*`        | TBD                               |
| `admin/users/*`                       | `/admin/users*`                           | trừ `POST /users/onboard` đã có   |
| `admin/departments/*`                 | `/admin/departments*`                     |                                   |
| `admin/audit-logs/page.tsx`           | `/admin/audit*`                           |                                   |
| `admin/roles/page.tsx`                | TBD                                       | scope chưa định nghĩa             |
| `admin/approvals/*`                   | Legacy stub, scope nghi ngờ               | xem `CLAUDE.md` đã chuyển CFO    |
| `dashboard/*` (Manager/Acc/CFO/Admin) | `/dashboard/<role>`                       | composite metrics                 |

> **Đề nghị backend escalation**: ưu tiên `/admin/users*`, `/admin/departments*`,
> `/cfo/approvals*` vì có user-facing impact lớn nhất.

### 8.1 Wire-now sub-tasks (có thể làm ngay — endpoint đã có) ✅

| Trang                        | Endpoint sẵn có             | Trạng thái    |
| ---------------------------- | --------------------------- | ------------- |
| `cfo/system-fund/page.tsx`   | `GET /company-fund`         | ✅ Đã wire    |
| `admin/system-fund/page.tsx` | `GET /company-fund`         | ✅ Đã wire    |
| `admin/settings/page.tsx`    | `GET/PUT /system-configs/*` | ✅ Đã wire    |
| `cfo/settings/page.tsx`      | `GET/PUT /system-configs/*` | ✅ Đã wire    |

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
