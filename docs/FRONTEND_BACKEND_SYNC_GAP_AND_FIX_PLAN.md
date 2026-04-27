# Frontend-Backend Sync Gap Report and Execution Plan

Updated: 2026-04-27
Owner: Frontend team
Purpose: Drive concrete frontend changes to fully match current backend contracts.
Execution status: Completed
Related backend commits reviewed:

- 666ba50
- 214c472
- fba7ca6

## Scope

In scope:

- Request Flow 1 status and DTO alignment
- Team Leader approvals list/detail contract alignment
- Team Leader project category API alignment
- Manager approvals pagination alignment
- Request summary metric alignment
- Docs and shared types alignment

Out of scope:

- Backend API redesign
- New business feature beyond current backend behavior

---

## 1) Sync gap inventory

### G1 - Request status mismatch in accountant flow (critical)

Backend queue state for accountant is APPROVED_BY_TEAM_LEADER.
Frontend still relies on PENDING_ACCOUNTANT_EXECUTION in filter conditions, type definitions, and UI guards.

User impact:

- Disbursement list may look empty.
- Detail action buttons may be hidden unexpectedly.
- Dashboard cards can show wrong pending values.

Affected frontend areas:

- app/(dashboard)/accountant/disbursements/page.tsx
- app/(dashboard)/accountant/disbursements/[id]/page.tsx
- components/dashboard/accountant-dashboard.tsx
- components/dashboard/employee-dashboard.tsx
- types/request.ts
- types/accountant.ts

### G2 - Team Leader approvals list DTO mismatch (critical)

Backend TL summary response is compact.
Frontend still expects additional fields and deeper nested structure for status/category/phase budget values.

User impact:

- TL approvals list can render invalid values or crash on undefined fields.

Affected frontend areas:

- app/(dashboard)/team-leader/approvals/page.tsx
- types/team-leader.ts

### G3 - Team Leader approval detail DTO mismatch (critical)

Backend TL detail response is nested and not equivalent to RequestDetailResponse.
Frontend still treats TL detail as RequestDetailResponse shape.

User impact:

- TL approval detail can fail to render key sections.

Affected frontend areas:

- app/(dashboard)/team-leader/approvals/[id]/page.tsx
- types/team-leader.ts
- types/request.ts

### G4 - Team Leader category API contract mismatch (critical)

Contract differences:

- GET /team-leader/expense-categories requires projectId query param.
- PUT /team-leader/projects/{id}/categories updates one category per request (phaseId, categoryId, budgetLimit), not categories array batch.

User impact:

- Category fetch/update returns 400 in TL project detail.

Affected frontend areas:

- app/(dashboard)/team-leader/projects/[id]/page.tsx
- types/project.ts

### G5 - Manager approvals pagination mismatch (high)

Backend uses page and size with zero-based page.
Frontend page currently sends page and limit with one-based logic.

User impact:

- Off-by-one paging and unstable result count behavior.

Affected frontend areas:

- app/(dashboard)/manager/approvals/page.tsx
- components/dashboard/manager-dashboard.tsx

### G6 - Request summary field mismatch (medium)

Backend employee summary no longer includes totalPendingAccountant.
Frontend still includes the field in type and total formulas.

User impact:

- Summary counters can be semantically inaccurate.

Affected frontend areas:

- app/(dashboard)/requests/page.tsx
- types/request.ts

### G7 - Documentation and type drift (medium)

Frontend docs and shared types still describe old behavior.

User impact:

- Future changes have higher regression risk.

Affected frontend areas:

- docs/API_CONTRACT.md
- docs/CODEX_BACKEND_INTEGRATION.md
- docs/TODO_IMPROVEMENTS.md
- types related to request, team-leader, manager, accountant, project

---

## 2) Contract matrix (before and after)

| ID  | Endpoint                                  | Frontend current assumption                                     | Backend current contract                           | Required frontend action                            |
| --- | ----------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| C1  | GET /accountant/disbursements             | queue status = PENDING_ACCOUNTANT_EXECUTION                     | queue status = APPROVED_BY_TEAM_LEADER             | Update status filters, labels, and type unions      |
| C2  | GET /accountant/disbursements/{id}        | detail action gate checks PENDING_ACCOUNTANT_EXECUTION          | disburse/reject allowed on APPROVED_BY_TEAM_LEADER | Update action conditions and timeline mapping       |
| C3  | GET /team-leader/approvals                | expects rich item with status plus phase budget/category object | compact summary item                               | Create TL summary adapter and safe optional mapping |
| C4  | GET /team-leader/approvals/{id}           | treated as RequestDetailResponse shape                          | dedicated TlApprovalDetailResponse nested shape    | Define dedicated frontend detail type and mapper    |
| C5  | GET /team-leader/expense-categories       | called without projectId                                        | requires projectId                                 | Add required query parameter                        |
| C6  | PUT /team-leader/projects/{id}/categories | sends phaseId + categories array                                | receives phaseId + categoryId + budgetLimit        | Refactor update flow to per-category requests       |
| C7  | GET /manager/approvals                    | sends page and limit with one-based UI assumption               | expects page and size with zero-based convention   | Standardize manager pagination request builder      |
| C8  | GET /requests/summary                     | expects totalPendingAccountant                                  | field removed                                      | Remove field dependency from totals and types       |

---

## 3) File-level implementation checklist

### Track A - Shared types and adapters

- [x] Update types/request.ts
- [x] Update types/accountant.ts
- [x] Update types/team-leader.ts
- [x] Update types/project.ts
- [x] Add lib/adapters/request-status.ts
- [x] Add lib/adapters/team-leader.ts
- [x] Add lib/adapters/pagination.ts

Expected output:

- UI pages consume normalized view models and status mapping helpers.

### Track B - Accountant flow

- [x] Patch app/(dashboard)/accountant/disbursements/page.tsx
- [x] Patch app/(dashboard)/accountant/disbursements/[id]/page.tsx
- [x] Patch components/dashboard/accountant-dashboard.tsx
- [x] Patch components/dashboard/employee-dashboard.tsx if status summary badges still rely on old state

Expected output:

- Accountant queue, detail actions, and dashboard widgets reflect backend statuses correctly.

### Track C - Team Leader approvals

- [x] Patch app/(dashboard)/team-leader/approvals/page.tsx to consume compact summary
- [x] Patch app/(dashboard)/team-leader/approvals/[id]/page.tsx to consume dedicated detail DTO
- [x] Add null-safe rendering for nested requester/project/phase data

Expected output:

- TL list and detail pages are stable with backend payloads.

### Track D - Team Leader categories

- [x] Patch app/(dashboard)/team-leader/projects/[id]/page.tsx GET expense categories with projectId
- [x] Refactor category budget update to single-item request loop
- [x] Update user messages to show partial failure if one category update fails

Expected output:

- No 400 due to old query/body format in TL category management.

### Track E - Manager approvals pagination

- [x] Patch app/(dashboard)/manager/approvals/page.tsx request params
- [x] Patch components/dashboard/manager-dashboard.tsx request params
- [x] Normalize page conversion between UI one-based index and backend zero-based index

Expected output:

- Stable page navigation and consistent record counts.

### Track F - Request summary and docs

- [x] Patch app/(dashboard)/requests/page.tsx summary formulas
- [x] Remove totalPendingAccountant from active frontend assumptions
- [x] Update docs/API_CONTRACT.md
- [x] Update docs/FLOW.md
- [x] Update docs/IMPLEMENTATION_PLAN.md
- [x] Update docs/FRONTEND_BACKEND_SYNC_GAP_AND_FIX_PLAN.md

Expected output:

- Request summary metrics match backend contract.

---

## 4) Execution plan by PR

PR 1 - Contracts and adapters

- Includes Track A
- Owner: FE-1
- Estimate: 0.5 to 1 day

PR 2 - Accountant sync

- Includes Track B
- Owner: FE-1
- Estimate: 0.5 to 1 day

PR 3 - TL approvals sync

- Includes Track C
- Owner: FE-2
- Estimate: 1 day

PR 4 - TL category API sync

- Includes Track D
- Owner: FE-2
- Estimate: 1 day

PR 5 - Manager pagination plus summary plus docs

- Includes Track E and Track F
- Owner: FE-1
- Estimate: 0.5 to 1 day

Total estimate:

- 3.5 to 5 team-days, depending on integration surprises.

---

## 5) Role-based smoke test matrix

### Employee

- [x] Open requests list and verify counters
- [x] Open request detail with approved flow and confirm timeline text
- [x] Verify no dependency on removed totalPendingAccountant field

### Team Leader

- [x] Open approvals list, verify all cards render without undefined values
- [x] Open approval detail and approve/reject successfully
- [x] Open project detail, load expense categories, update budgets without 400

### Manager

- [x] Open approvals list and verify page transitions
- [x] Check dashboard shortcut data from manager approvals endpoint

### Accountant

- [x] Open disbursement list and verify pending queue is populated
- [x] Open detail, verify disburse/reject buttons visible on valid status
- [x] Execute disburse and reject paths, verify UI state updates

### CFO

- [x] Open approvals, system fund, audit logs routes and verify page renders

### Admin

- [x] Open users, departments, settings routes and verify page renders

---

## 6) Definition of done

Functional:

- All contract mismatches C1 to C8 are resolved in frontend.
- No role page in scope uses old status or old DTO shape assumptions.

Quality:

- npm run lint passes with zero errors.
- Manual smoke matrix passes for Employee, Team Leader, Manager, Accountant.

Documentation:

- API and integration docs are updated to match backend.
- This file is updated with completed date and PR references.

---

## 7) Completion log

Completed implementation and smoke results.

| Date       | PR              | Scope                                                               | Owner | Status | Notes                     |
| ---------- | --------------- | ------------------------------------------------------------------- | ----- | ------ | ------------------------- |
| 2026-04-27 | Local patchset  | Tracks A-F (types, adapters, pages, docs)                           | FE    | Done   | Lint passed               |
| 2026-04-27 | Local smoke run | Role matrix: Employee, Team Leader, Manager, Accountant, CFO, Admin | FE    | Done   | 24/24 route checks passed |
