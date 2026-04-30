# CODEX — UI Completion Plan (All Roles)

> **Ngày tạo:** 2026-04-13  | **Cập nhật lần cuối:** 2026-04-30
> **Mục tiêu:** Hoàn thiện 100% UI + API wiring cho toàn bộ 6 roles.

---

## Bước 0 — Đọc tài liệu bắt buộc

```
docs/API_CONTRACT.md        → endpoint chính xác, request/response shape
docs/FLOW.md                → business flow, role matrix
docs/PROJECT_STRUCTURE.md   → cây thư mục
CLAUDE.md                   → conventions: types, api-client, Tailwind v4, language
```

**Conventions cứng:**
- Types: chỉ import từ `@/types` barrel
- API: chỉ dùng `api` từ `@/lib/api-client`
- Mock pattern (giữ cho đến khi backend sẵn sàng):
  ```ts
  // ─── MOCK (xóa khi backend sẵn sàng) ──────────────────────
  const MOCK_X: SomeType[] = [...];
  // TODO: Replace when backend ready
  // ──────────────────────────────────────────────────────────
  ```
- UI text: **tiếng Việt có dấu** | Code: **English**
- Tailwind v4 — không `@apply`, không Shadcn, icon dùng inline SVG
- `use(params)` cho dynamic route params (Next.js 16)

---

## Trạng thái tổng quan (cập nhật 2026-05-01)

| Nhóm | Tổng | ✅ Done | ⚠️ Mock/Partial | ❌ Còn lại |
|------|------|---------|-----------------|-----------|
| A — Backend ready → integrate | 7 | **7** | 0 | 0 |
| B — Mock chờ backend | 21 | **21** | 0 | 0 |
| C — Skeleton | 1 | **1** | 0 | 0 |
| Auth pages | 3 | **3** | 0 | 0 |

> **Nhóm A + B + C hoàn thành 100%.** Sprint 10 unblocked accountant/payroll (x2) + accountant/ledger (x2).
> Auth pages: login, change-password, forgot-password đều LIVE.
> Chỉ còn `dashboard/page.tsx` render tĩnh — chờ backend `/api/v1/dashboard/*`.

---

## NHÓM A — ✅ Đã hoàn thành (Backend ready → Real API)

> Tất cả 7 tasks đã xong. Mock đã xóa, API thật đang được gọi, lint sạch.

| # | File | API endpoint | Trạng thái |
|---|------|-------------|------------|
| A1 | `payroll/page.tsx` | `GET /api/v1/payslips` | ✅ Done |
| A2 | `payroll/[id]/page.tsx` | `GET /api/v1/payslips/{id}` | ✅ Done |
| A3 | `projects/page.tsx` | `GET /api/v1/projects` | ✅ Done |
| A4 | `projects/[id]/page.tsx` | `GET /api/v1/projects/{id}/phases` | ✅ Done |
| A5 | `wallet/deposit/page.tsx` | `POST /api/v1/payments` (VNPay via PaymentController) | ✅ Done |
| A6 | `wallet/page.tsx` | `WalletContext` + `GET /api/v1/wallet/transactions?size=5` | ✅ Done |
| A7 | `wallet/transactions/page.tsx` | `GET /api/v1/wallet/transactions` | ✅ Done |

---

## NHÓM B — Trạng thái UI + API

---

### ✅ B-DONE — Đã hoàn chỉnh UI + API thật (2026-05-01)

| File | Endpoint | Ghi chú |
|------|----------|---------|
| `requests/page.tsx` | `GET /api/v1/requests` + `/requests/summary` | Filter, pagination, summary cards |
| `requests/new/page.tsx` | `POST /api/v1/requests` | Cascading project/phase/category, attachment |
| `requests/[id]/page.tsx` | `GET/PUT/DELETE /api/v1/requests/{id}` | Timeline, cancel, edit PENDING |
| `team-leader/approvals/page.tsx` | `GET /api/v1/team-leader/approvals` | Filter type, pagination |
| `team-leader/approvals/[id]/page.tsx` | `GET/POST approve/reject` | PIN-less flow, reason modal |
| `team-leader/projects/page.tsx` | `GET /api/v1/team-leader/projects` | Filter status, search |
| `team-leader/projects/[id]/page.tsx` | CRUD phases, members, category budgets | Tab: Phases / Ngân sách / Thành viên |
| `team-leader/team/page.tsx` | `GET /api/v1/team-leader/team-members` | Sprint 6 — page 1-indexed + limit |
| `manager/approvals/page.tsx` | `GET /api/v1/manager/approvals` | PROJECT_TOPUP queue |
| `manager/approvals/[id]/page.tsx` | `GET/POST approve/reject` | BudgetHealthCard, confirm modal |
| `manager/projects/page.tsx` | `GET/POST /api/v1/manager/projects` | Sprint 6 — tạo dự án, dropdown TL |
| `manager/projects/[id]/page.tsx` | `GET/PUT /api/v1/manager/projects/{id}` | Sprint 6 — sửa tên/budget/status/TL |
| `manager/department/page.tsx` | `GET /api/v1/manager/department/members` | Sprint 6 — list + detail panel |
| `accountant/disbursements/page.tsx` | `GET /api/v1/accountant/disbursements` | Status filter APPROVED_BY_TEAM_LEADER |
| `accountant/disbursements/[id]/page.tsx` | `POST disburse` (PIN) + `POST reject` | PIN modal, 423 Locked handling |
| `accountant/withdrawals/page.tsx` | `GET/PUT /api/v1/wallet/withdraw` | Quản lý rút tiền user — có trong sidebar |
| `accountant/payroll/page.tsx` | `GET/POST /api/v1/accountant/payroll` + template | List + tạo + tải template — Sprint 10 |
| `accountant/payroll/[id]/page.tsx` | import/confirm-overwrite/auto-netting/run + PUT entries | 4-step workflow — Sprint 10 |
| `accountant/ledger/page.tsx` | `GET /api/v1/accountant/ledger` + `/summary` | Filter type/status/refType, direction badge — Sprint 10 |
| `accountant/ledger/[id]/page.tsx` | `GET /api/v1/accountant/ledger/{id}` | Detail + bút toán kép table — Sprint 10 |
| `admin/users/page.tsx` | `GET/POST /api/v1/admin/users` | lock/unlock/reset-password wired |
| `admin/users/[id]/page.tsx` | `GET/PUT /api/v1/admin/users/{id}` | Role + dept edit |
| `admin/departments/page.tsx` | `GET/POST /api/v1/admin/departments` | CRUD |
| `admin/departments/[id]/page.tsx` | `GET/PUT/DELETE /api/v1/admin/departments/{id}` | — |
| `admin/audit-logs/page.tsx` | `GET /api/v1/admin/audit` | Filter, pagination, detail modal |
| `notifications/page.tsx` | `GET /api/v1/notifications` + mark-read | SSE prepend listener |
| `cfo/approvals/page.tsx` | `GET /api/v1/cfo/approvals` | DEPARTMENT_TOPUP queue |
| `cfo/approvals/[id]/page.tsx` | `GET/POST approve/reject` | — |
| `cfo/system-fund/page.tsx` | `GET /api/v1/company-fund` + topup + reconciliation | — |
| `admin/system-fund/page.tsx` | `GET /api/v1/company-fund` | Re-use CompanyFundController |
| `admin/settings/page.tsx` | `GET/PUT /api/v1/system-configs/*` | evict cache |
| `cfo/settings/page.tsx` | Re-export từ admin/settings | — |
| `cfo/audit-logs/page.tsx` | Re-export từ admin/audit-logs | — |

---

## NHÓM C — ✅ Đã hoàn thành (Skeleton → Full UI)

| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `admin/roles/page.tsx` | ✅ Done | Static UI: 6 roles, permission matrix, ROLE_PERMISSION_SET mapping |

---

## Còn lại — (2026-05-01)

| # | Task | Endpoint cần | Priority |
|---|------|-------------|----------|
| 1 | Dashboard live stats | `/api/v1/dashboard/*` | 🟡 Nice-to-have |

> **Tất cả pages đã wired với API thật.** Chỉ còn `dashboard/page.tsx` render tĩnh vì backend chưa có `/api/v1/dashboard/*`.
> B14–B17 (accountant/payroll + accountant/ledger) đã wired Sprint 10 sau khi backend commit `d3b30aa` unblock 2 controllers.

---

## Sau mỗi task

```bash
npm run lint    # Fix ALL errors — quality gate duy nhất
```
