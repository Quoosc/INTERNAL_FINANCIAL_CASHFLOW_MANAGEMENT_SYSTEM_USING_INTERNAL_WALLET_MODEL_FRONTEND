# Tiến độ phát triển Frontend

> File này được cập nhật sau **mỗi lần hoàn thành task**.
> Cập nhật lần cuối: **2026-04-29**

---

## Tổng quan nhanh

| Hạng mục | Số lượng | Tỉ lệ |
|---|---|---|
| Pages LIVE (gọi API thật / hoàn chỉnh) | 40 | ~89% |
| Pages BLOCKED (chờ backend) | 4 | ~9% |
| Pages chưa có backend API | 1 | ~2% |
| **Tổng pages** | **45** | 100% |

---

## ✅ LIVE — Hoàn chỉnh (API thật + UI đúng)

| Page | Endpoint chính | Ghi chú |
|---|---|---|
| `wallet/page.tsx` | `GET /api/v1/wallet` + transactions | WalletContext |
| `wallet/transactions/page.tsx` | `GET /api/v1/wallet/transactions` | Filter, pagination |
| `wallet/transactions/[id]/page.tsx` | `GET /api/v1/wallet/transactions/{id}` | — |
| `wallet/deposit/page.tsx` | `POST /api/v1/payments` | VNPay flow |
| `wallet/withdraw/page.tsx` | `POST /api/v1/wallet/withdraw` + lịch sử | Form + cancel |
| `profile/page.tsx` | `GET/PUT /api/v1/users/me` | Avatar upload Cloudinary |
| `projects/page.tsx` | `GET /api/v1/projects` | Read-only, all roles |
| `projects/[id]/page.tsx` | `GET /api/v1/projects/{id}/phases` | — |
| `requests/page.tsx` | `GET /api/v1/requests` + summary | Employee, filter + pagination |
| `requests/new/page.tsx` | `POST /api/v1/requests` | Cascading project/phase/category |
| `requests/[id]/page.tsx` | `GET/PUT/DELETE /api/v1/requests/{id}` | Timeline, cancel, edit |
| `payroll/page.tsx` | `GET /api/v1/payslips` | Employee payslip list |
| `payroll/[id]/page.tsx` | `GET /api/v1/payslips/{id}` | Employee payslip detail |
| `notifications/page.tsx` | `GET /api/v1/notifications` | SSE prepend, mark-read |
| `team-leader/approvals/page.tsx` | `GET /api/v1/team-leader/approvals` | Flow 1 queue |
| `team-leader/approvals/[id]/page.tsx` | `POST approve/reject` | — |
| `team-leader/projects/page.tsx` | `GET /api/v1/team-leader/projects` | — |
| `team-leader/projects/[id]/page.tsx` | CRUD phases, members, budgets | 3 tabs |
| `team-leader/team/page.tsx` | `GET /api/v1/team-leader/team-members` | Wired Sprint 6 |
| `manager/approvals/page.tsx` | `GET /api/v1/manager/approvals` | PROJECT_TOPUP queue |
| `manager/approvals/[id]/page.tsx` | `POST approve/reject` | — |
| `manager/projects/page.tsx` | `GET /api/v1/manager/projects` | Wired Sprint 6 |
| `manager/projects/[id]/page.tsx` | `GET/PUT /api/v1/manager/projects/{id}` | Wired Sprint 6 |
| `manager/department/page.tsx` | `GET /api/v1/manager/department/members` | Wired Sprint 6 |
| `accountant/disbursements/page.tsx` | `GET /api/v1/accountant/disbursements` | APPROVED_BY_TEAM_LEADER queue |
| `accountant/disbursements/[id]/page.tsx` | `POST disburse` (PIN) + `POST reject` | 423 Locked handling |
| `admin/users/page.tsx` | `GET/POST /api/v1/admin/users` | Lock/unlock/reset-password |
| `admin/users/[id]/page.tsx` | `GET/PUT /api/v1/admin/users/{id}` | Role + dept edit |
| `admin/departments/page.tsx` | `GET /api/v1/admin/departments` | CRUD |
| `admin/departments/[id]/page.tsx` | `GET/PUT/DELETE /api/v1/admin/departments/{id}` | — |
| `admin/audit-logs/page.tsx` | `GET /api/v1/admin/audit` | Filter, pagination, detail modal |
| `admin/settings/page.tsx` | `GET/PUT /api/v1/system-configs` | Evict cache |
| `admin/system-fund/page.tsx` | `GET /api/v1/company-fund` + topup | Fixed diacritics Sprint 7 |
| `admin/roles/page.tsx` | — | Static permission matrix, no API needed |
| `admin/approvals/page.tsx` | — | Redirect → `/dashboard` (by design) |
| `cfo/approvals/page.tsx` | `GET /api/v1/cfo/approvals` | DEPARTMENT_TOPUP queue |
| `cfo/approvals/[id]/page.tsx` | `POST approve/reject` | — |
| `cfo/system-fund/page.tsx` | `GET /api/v1/company-fund` + topup | Fixed diacritics Sprint 7 |
| `cfo/audit-logs/page.tsx` | — | Re-export từ `admin/audit-logs/page` |
| `cfo/settings/page.tsx` | — | Re-export từ `admin/settings/page` |

---

## ❌ BLOCKED — Chờ backend implement

| Page | Endpoint cần | Lý do block |
|---|---|---|
| `accountant/payroll/page.tsx` | `GET /api/v1/accountant/payroll` | `AccountantPayrollController` chưa có |
| `accountant/payroll/[id]/page.tsx` | CRUD + import Excel + run | Backend chưa implement |
| `accountant/ledger/page.tsx` | `GET /api/v1/accountant/ledger` | `AccountantLedgerController` chưa có |
| `accountant/ledger/[id]/page.tsx` | `GET /api/v1/accountant/ledger/{id}` | Backend chưa implement |

---

## 🟡 TODO — Backend thiếu

| Page | Tình trạng |
|---|---|
| `dashboard/page.tsx` | Dashboard API (`/api/v1/dashboard/*`) chưa có backend — render tĩnh |

---

## Nhật ký thay đổi

### Sprint 7 — 2026-04-29

**Mục tiêu:** Phát hiện và sửa các lỗi chất lượng UI trên pages đã LIVE

| Task | Kết quả |
|---|---|
| Phát hiện: nhiều pages STATIC/TODO đã thực ra LIVE | `payroll/page`, `wallet/withdraw`, tất cả CFO/Admin pages |
| Fix diacritics `cfo/system-fund/page.tsx` | ~20 chuỗi tiếng Việt không dấu → đúng chuẩn |
| Fix diacritics `admin/system-fund/page.tsx` | ~20 chuỗi tiếng Việt không dấu → đúng chuẩn |
| Fix diacritics `admin/audit-logs/page.tsx` | ~15 chuỗi tiếng Việt không dấu → đúng chuẩn |
| Fix color bug `cfo/approvals/page.tsx` | 2 chỗ `text-slate-100` → `text-slate-900` (text vô hình) |
| Fix color bug `admin/audit-logs/page.tsx` (InfoCard) | `text-slate-100` → `text-slate-900` trong modal chi tiết |
| Cập nhật `PROGRESS.md` | Sửa lại trạng thái thực tế: 40/45 pages LIVE (~89%) |

**Lưu ý:** `text-slate-100` trên `bg-white` = text gần như vô hình. Luôn kiểm tra color contrast khi render số tiền.

---

### Sprint 6 — 2026-04-29

**Mục tiêu:** Unblock + wire 4 pages Manager/TL vừa có backend endpoint

| Task | Kết quả |
|---|---|
| Fix type mismatch `ManagerDeptMemberDetailResponse` | Xóa field `recentRequests` không tồn tại ở backend |
| Wire `team-leader/team/page.tsx` | Xóa `TL_TEAM_ENDPOINT_BLOCKED`, fix `projectOptions` mock contamination |
| Wire `manager/projects/page.tsx` | Xóa block flag, fix pagination `toApiPage` → 1-indexed + `limit` param |
| Wire `manager/projects/[id]/page.tsx` | Xóa block flag + xóa 90 dòng dead code |
| Wire `manager/department/page.tsx` | Xóa block flag, fix pagination, xóa UI "Yêu cầu gần đây" |
| Cập nhật `docs/CODEX_INTEGRATION_PLAN.md` | Thêm Sprint 6, cập nhật coverage matrix |

**Lưu ý kỹ thuật:**
- Endpoints TL/Manager mới: `page` 1-indexed + `limit` param (≠ Spring Data `page`/`size` 0-indexed)

---

### Sprint 5 — 2026-04-28 (tóm tắt)

Wire `notifications`, `cfo/system-fund`, `admin/settings`, `cfo/approvals/[id]`, nhiều pages nhóm A+B.

---

## Backend còn thiếu (blocker cho FE)

| Controller | Endpoints | Ảnh hưởng |
|---|---|---|
| `AccountantPayrollController` | `/api/v1/accountant/payroll/*` | 2 pages BLOCKED |
| `AccountantLedgerController` | `/api/v1/accountant/ledger/*` | 2 pages BLOCKED |
| Dashboard API | `/api/v1/dashboard/*` | `dashboard/page.tsx` render tĩnh |

---

## Ghi chú conventions quan trọng

- **Pagination mới** (TL/Manager): `page=1` (1-indexed) + `limit=N` — KHÔNG dùng `toApiPage()`
- **Pagination cũ** (Spring Data): `page=0` (0-indexed) + `size=N` — dùng `toApiPage()`
- **Mock fallback trong catch**: là OK — defensive UX. BLOCKED = có constant `ENDPOINT_BLOCKED = true`
- **Color**: không dùng `text-slate-100`/`text-slate-200` cho text trên nền trắng
- **API client**: chỉ dùng `api` từ `@/lib/api-client`
- **Types**: chỉ import từ `@/types` barrel
