# CODEX — Backend Integration Tasks (APIs Ready)

> ✅ **Hoàn thành: 2026-04-13.** Tất cả 9 tasks đã integrate xong.
> Xem `CODEX_PROMPTS_TIER*.md` để biết các sprint tiếp theo.
> Phần "API chưa sẵn sàng" cuối file là checklist cho đợt tích hợp kế tiếp — khi backend ship thêm nhóm nào, tạo prompt mới dựa theo template này.

---

> **Mục tiêu gốc**: Tích hợp các API backend đã hoàn thành vào frontend.
> Backend base: `http://localhost:8080` — proxied qua Next.js tại `/api/v1/*`.
> File này liệt kê **chỉ những API backend đã sẵn sàng** cần wiring vào UI.
>
> ⚠️ KHÔNG động vào các màn hình đang dùng mock data cho API **chưa sẵn sàng** (Team Leader, Manager, Accountant, CFO, Admin approval flows).

---

## Bước 0 — Đọc tài liệu bắt buộc (trước khi viết bất kỳ dòng code nào)

```
docs/API_CONTRACT.md          → endpoint chính xác, request/response shape
docs/FLOW.md                  → business flow, role matrix, Server vs Client guide
docs/PROJECT_STRUCTURE.md     → cây thư mục, vị trí file
CLAUDE.md                     → conventions: types, api-client, Tailwind v4, icons, language policy
```

**Conventions cứng:**
- Types: chỉ import từ `@/types` barrel — KHÔNG tự định nghĩa interface trùng với type có sẵn
- API: chỉ dùng `api` từ `@/lib/api-client` — KHÔNG dùng `fetch` hoặc `axios` trực tiếp
- `"use client"` chỉ khi cần hooks — default Server Component
- UI text: **tiếng Việt** | Code identifiers: **English**
- Tailwind v4 — không `@apply`, không Shadcn, icons dùng inline SVG
- `use(params)` cho dynamic route params (Next.js 16)
- Import từ `@/lib/api` barrel nếu hàm đã có trong `/lib/api/`

---

## Task 1 — Profile & Security (hoàn toàn chưa có UI)

**Backend endpoints sẵn sàng:**
```
GET  /api/v1/users/me/profile          → UserProfileResponse
PUT  /api/v1/users/me/profile          body: UpdateProfileRequest → UserProfileResponse
PUT  /api/v1/users/me/avatar           body: UpdateAvatarRequest  → UpdateAvatarResponse
PUT  /api/v1/users/me/bank-info        body: UpdateBankInfoRequest → BankInfo
PUT  /api/v1/users/me/pin              body: { currentPin, newPin } → { message }
POST /api/v1/users/me/pin/verify       body: VerifyPinRequest → VerifyPinResponse
GET  /api/v1/banks                     → BankOption[]
GET  /api/v1/uploads/signature?folder=AVATAR  → { signature, timestamp, cloudName, apiKey, folder }
```

**Việc cần làm:**

### 1a. Tạo trang Profile (`app/(dashboard)/profile/page.tsx`)

Tạo route mới `app/(dashboard)/profile/` gồm:
- `page.tsx` — trang profile cá nhân (ALL ROLES)

Nội dung trang:
1. **Tab "Thông tin"**: Hiển thị + edit `fullName`, `email`, `phone`, `address` từ `UserProfileResponse`
   - Load: `GET /api/v1/users/me/profile`
   - Save: `PUT /api/v1/users/me/profile` với body `UpdateProfileRequest`
2. **Tab "Ảnh đại diện"**: Upload avatar
   - Flow: gọi `GET /api/v1/uploads/signature?folder=AVATAR` → upload trực tiếp lên Cloudinary → lấy `secure_url` → `PUT /api/v1/users/me/avatar` với `{ avatarUrl: secure_url }`
   - Hiển thị preview ảnh hiện tại từ `UserProfileResponse.avatarUrl`
3. **Tab "Ngân hàng"**: Xem + cập nhật bank info
   - Load danh sách ngân hàng: `GET /api/v1/banks` → `BankOption[]` (dùng cho dropdown)
   - Load bank hiện tại từ `UserProfileResponse.bankInfo`
   - Save: `PUT /api/v1/users/me/bank-info` với body `UpdateBankInfoRequest`
4. **Tab "Bảo mật"**: Đổi PIN giao dịch
   - Form: `currentPin` (6 số), `newPin` (6 số), `confirmPin`
   - Submit: `PUT /api/v1/users/me/pin`
   - Validation client-side: `newPin === confirmPin`, độ dài 6 số

Types cần dùng: `UserProfileResponse`, `UpdateProfileRequest`, `UpdateAvatarRequest`, `UpdateAvatarResponse`, `UpdateBankInfoRequest`, `BankInfo`, `BankOption`, `CreatePinRequest`, `UpdatePinRequest`

### 1b. Thêm link "Hồ sơ" vào sidebar

Trong `app/(dashboard)/layout.tsx` (hoặc sidebar component), thêm menu item **Hồ sơ cá nhân** trỏ tới `/profile` — hiển thị cho ALL ROLES.

---

## Task 2 — Wallet: Transaction Detail Page

**Backend endpoint sẵn sàng:**
```
GET /api/v1/wallet/transactions/{transactionId}  → TransactionResponse
```

**Việc cần làm:**

Tạo `app/(dashboard)/wallet/transactions/[id]/page.tsx`:
- Load: `GET /api/v1/wallet/transactions/${id}`
- Type: `TransactionResponse`
- Hiển thị: `transactionCode`, `type`, `status`, `amount`, `description`, `createdAt`, `referenceId`
- Nút "Quay lại" → `/wallet/transactions`
- Dùng `use(params)` để lấy `id` (Next.js 16)

Trong `app/(dashboard)/wallet/transactions/page.tsx`:
- Mỗi row trong danh sách giao dịch — wrap thành link `<Link href={/wallet/transactions/${tx.id}}>` hoặc thêm nút "Xem chi tiết"

---

## Task 3 — Wallet: Withdrawal History (User)

**Backend endpoints sẵn sàng:**
```
GET    /api/v1/wallet/withdraw/my?page=0&size=10   → PageResponse<WithdrawRequestResponse>
DELETE /api/v1/wallet/withdraw/{id}                → WithdrawRequestResponse  (cancel PENDING)
```

Hàm đã có trong `/lib/api/withdrawal.ts`: `getMyWithdrawRequests()`, `cancelWithdrawRequest(id)` — nhưng **chưa được dùng** trong bất kỳ component nào.

**Việc cần làm:**

Trong `app/(dashboard)/wallet/withdraw/page.tsx` (trang rút tiền hiện tại):
- Thêm section "Lịch sử yêu cầu rút tiền" phía dưới form
- Load: `getMyWithdrawRequests({ page: 0, size: 10 })`
- Hiển thị danh sách dạng bảng: `amount`, `status`, `userNote`, `createdAt`
- Nếu `status === "PENDING"` → hiển thị nút "Huỷ" → gọi `cancelWithdrawRequest(id)` + reload list
- Status badge màu: PENDING=vàng, COMPLETED/APPROVED=xanh, REJECTED/CANCELLED=đỏ

Types: `WithdrawRequestResponse` (xem `types/wallet.ts`)

---

## Task 4 — Accountant: Withdrawal Management

**Backend endpoints sẵn sàng:**
```
GET /api/v1/wallet/withdraw?status=PENDING&page=0&size=20  → PageResponse<WithdrawRequestResponse>
PUT /api/v1/wallet/withdraw/{id}/execute                   → WithdrawRequestResponse
PUT /api/v1/wallet/withdraw/{id}/reject                    → WithdrawRequestResponse
```

Hàm đã có: `getAllWithdrawRequests()`, `executeWithdraw(id)`, `rejectWithdraw(id)` trong `/lib/api/withdrawal.ts`.

**Việc cần làm:**

Tạo `app/(dashboard)/accountant/withdrawals/page.tsx`:
- Chỉ render khi role = `ACCOUNTANT` (dùng `hasRole(RoleName.ACCOUNTANT)`)
- Load: `getAllWithdrawRequests({ status: "PENDING", page: 0, size: 20 })`
- Bảng: `requester.fullName`, `amount`, `bankAccount`, `bankName`, `userNote`, `createdAt`, `status`
- Nút **"Thực hiện"** → `executeWithdraw(id)` → reload
- Nút **"Từ chối"** → modal nhập lý do → `rejectWithdraw(id, { reason })` → reload
- Filter tab: ALL / PENDING / COMPLETED / REJECTED

Thêm link vào sidebar cho ACCOUNTANT: **"Yêu cầu rút tiền"** → `/accountant/withdrawals`

---

## Task 5 — Company Fund: Full Integration

**Backend endpoints sẵn sàng (tất cả đã có hàm trong `/lib/api/company-fund.ts`):**
```
POST /api/v1/company-fund/topup               body: SystemTopupRequest → TransactionResponse
PUT  /api/v1/company-fund/bank-statement      body: UpdateBankStatementRequest → CompanyFundResponse
GET  /api/v1/company-fund/reconciliation      → ReconciliationReportResponse
```

Hiện tại `app/(dashboard)/admin/system-fund/page.tsx` và `app/(dashboard)/cfo/system-fund/page.tsx` chỉ dùng `getCompanyFund()`.

**Việc cần làm:**

### 5a. Nút "Nạp quỹ hệ thống"

Trong cả hai trang `admin/system-fund` và `cfo/system-fund`:
- Thêm nút **"Nạp tiền từ ngân hàng"**
- Mở modal form: `amount` (số tiền), `description` (ghi chú), `referenceCode` (mã tham chiếu ngân hàng)
- Submit: `topupCompanyFund({ amount, description, referenceCode })`
- Sau khi thành công: reload `getCompanyFund()` để cập nhật số dư

### 5b. Nút "Cập nhật số dư ngân hàng"

- Thêm nút **"Cập nhật số dư ngân hàng"**
- Modal form: `bankBalance` (số tiền thực tế tại ngân hàng)
- Submit: `updateBankStatement({ bankBalance })`
- Reload sau khi thành công

### 5c. Tab/Section "Đối soát" (Reconciliation)

- Thêm tab hoặc section "Báo cáo đối soát"
- Load: `getReconciliationReport()`
- Type: `ReconciliationReportResponse` (xem `types/accounting.ts`)
- Hiển thị: `systemBalance`, `bankBalance`, `discrepancy`, `lastReconciliationAt`, danh sách `entries` nếu có

---

## Task 6 — Admin Settings: Replace Mock with Real API

**Backend endpoints sẵn sàng:**
```
GET    /api/v1/system-configs            → SystemConfigItem[]
GET    /api/v1/system-configs/{key}      → SystemConfigItem
PUT    /api/v1/system-configs/{key}      body: { value } → string
POST   /api/v1/system-configs/{key}      body: { value } → string  (upsert)
DELETE /api/v1/system-configs/{key}/cache
DELETE /api/v1/system-configs/cache
```

Tất cả hàm đã có trong `/lib/api/system-config.ts`: `getAllConfigs()`, `getConfig(key)`, `updateConfig(key, value)`, `setConfig(key, value)`, `evictConfigCache(key)`, `evictAllConfigCache()`.

**Việc cần làm:**

Trong `app/(dashboard)/admin/settings/page.tsx`:
- Xoá `MOCK_SETTINGS` constant và `// TODO: Replace when Sprint 6 is complete` comment
- Thay bằng `useEffect` gọi `getAllConfigs()` thật
- Edit inline: khi user sửa một config value → `PUT /api/v1/system-configs/{key}` qua `updateConfig(key, newValue)`
- Thêm nút **"Làm mới cache"** → `evictAllConfigCache()`
- Loading/error state bình thường

---

## Task 7 — Notifications: Verify & Fix Unread Badge

**Backend endpoints sẵn sàng:**
```
GET   /api/v1/notifications?unreadOnly=false&page=0&size=20  → NotificationListResponse
GET   /api/v1/notifications/unread-count                     → number
PATCH /api/v1/notifications/{id}/read                        → NotificationResponse
PATCH /api/v1/notifications/read-all                         → void
```

Hàm đã có trong `/lib/api/notification.ts`. Trang `notifications/page.tsx` đã import chúng nhưng vẫn còn **MOCK_NOTIFICATIONS** fallback.

**Việc cần làm:**

### 7a. Xoá mock fallback trong `notifications/page.tsx`
- Xoá `MOCK_NOTIFICATIONS` array
- Xoá logic `catch` dùng mock — khi API lỗi chỉ set `error` state, không dùng mock
- Đảm bảo real API được gọi ngay từ `useEffect` ban đầu

### 7b. Unread count badge trong sidebar/header
- Gọi `getUnreadCount()` (`GET /api/v1/notifications/unread-count`) khi mount
- Hiển thị badge số đỏ bên cạnh menu item "Thông báo" trong sidebar nếu count > 0
- Re-fetch count sau khi `markAllAsRead()` được gọi
- (Optional) polling mỗi 60s để cập nhật badge

---

## Task 8 — Requests: Phase Categories Integration

**Backend endpoint sẵn sàng:**
```
GET /api/v1/projects/{phaseId}   → ExpenseCategoryListResponse  (categories của 1 phase)
```

**Việc cần làm:**

Trong `app/(dashboard)/requests/new/page.tsx` (form tạo yêu cầu):
- Khi user chọn **Phase** → gọi `GET /api/v1/projects/${phaseId}` để load danh sách **Category**
- Hiển thị dropdown **"Hạng mục chi phí"** populate từ kết quả
- Type: `ExpenseCategoryResponse[]` (xem `types/project.ts`)
- Chỉ áp dụng cho `RequestType.EXPENSE` và `RequestType.ADVANCE` (có project/phase/category)

---

## Task 9 — Verify PIN in Disbursement Flow

**Backend endpoint sẵn sàng:**
```
POST /api/v1/users/me/pin/verify   body: VerifyPinRequest → VerifyPinResponse { valid: boolean }
```

Type đã có: `VerifyPinRequest`, `VerifyPinResponse` trong `types/user.ts`.

**Việc cần làm:**

Trong `app/(dashboard)/accountant/disbursements/[id]/page.tsx` (màn hình giải ngân):
- Nếu hiện tại form disbursement chỉ send PIN thẳng lên `POST /api/v1/accountant/disbursements/:id/disburse` → đây là đúng, **không cần verify trước** (backend tự verify PIN trong disburse endpoint)
- Nếu có modal nhập PIN riêng chưa được wired → đảm bảo PIN được truyền vào body `DisburseBody.pin`
- **Bonus**: Thêm bước verify PIN inline (`POST /users/me/pin/verify`) trước khi submit để UX nhanh hơn (optional, không bắt buộc)

---

## Thứ tự ưu tiên thực hiện

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 1 | **Task 6** — Admin Settings real API | Cao (xoá mock) | Thấp |
| 2 | **Task 7** — Notifications fix + badge | Cao (UX) | Thấp |
| 3 | **Task 2** — Transaction Detail page | Trung bình | Thấp |
| 4 | **Task 3** — Withdrawal History (User) | Trung bình | Thấp |
| 5 | **Task 1** — Profile page | Cao (chưa có) | Cao |
| 6 | **Task 4** — Accountant Withdrawal Mgmt | Cao (chưa có) | Trung bình |
| 7 | **Task 5** — Company Fund full | Trung bình | Trung bình |
| 8 | **Task 8** — Phase Categories | Trung bình | Thấp |
| 9 | **Task 9** — PIN verify disbursement | Thấp | Thấp |

---

## API chưa sẵn sàng — KHÔNG tích hợp

Các endpoint sau **chưa có trong backend**, tiếp tục dùng mock data:

| Nhóm | Endpoint | Lý do |
|------|----------|-------|
| `/requests` | CRUD requests | Backend chưa implement |
| `/team-leader/*` | Approvals, Projects, Team | Backend chưa implement |
| `/manager/*` | Approvals, Projects, Dept | Backend chưa implement |
| `/accountant/disbursements` | Disburse Flow 1 | Backend chưa implement |
| `/accountant/payroll` | Payroll management | Backend chưa implement |
| `/accountant/ledger` | Ledger entries | Backend chưa implement |
| `/cfo/approvals` | Flow 3 approvals | Backend chưa implement |
| `/admin/users` | CRUD users (ngoài onboard) | Backend chưa implement |
| `/admin/departments` | CRUD departments | Backend chưa implement |
| `/admin/audit-logs` | Audit log list | Backend chưa implement |

---

## Sau khi hoàn thành mỗi task

```bash
npm run lint    # Fix ALL linting errors — đây là quality gate duy nhất
```

Không commit nếu còn lint error.
