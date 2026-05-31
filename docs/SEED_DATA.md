# SEED DATA — IFMS Demo Dataset

> **Phiên bản:** 1.0 — 2026-06-01  
> **Nguồn:** `DataInitializer.java` (@Order 1) + `DataSeeder.java` (@Order 2)  
> **Mục đích:** Cung cấp dữ liệu demo đầy đủ cho toàn bộ 6 roles, bao phủ tất cả pages và flows.

---

## Cách reset và seed lại

```sql
-- 1. Chạy reset_data.sql để xóa toàn bộ business data (giữ roles/users/project)
-- 2. Restart Spring Boot app → DataInitializer (Order 1) → DataSeeder (Order 2)
-- App log sẽ hiện: ✅ DataSeeder completed OK
```

> Idempotent: DataSeeder kiểm tra `requestRepository.count() > 0` — nếu đã có data thì skip toàn bộ.

---

## Tài khoản demo

| Email | Mật khẩu | Role | Ghi chú |
|---|---|---|---|
| `admin@ifms.vn` | `Ifms@2026` | ADMIN | IAM & system config |
| `cfo@ifms.vn` | `Ifms@2026` | CFO | Duyệt DEPARTMENT_TOPUP |
| `accountant@ifms.vn` | `Ifms@2026` | ACCOUNTANT | Giải ngân + Payroll |
| `manager.it@ifms.vn` | `Ifms@2026` | MANAGER | Duyệt PROJECT_TOPUP, quản lý dự án |
| `tl.it@ifms.vn` | `Ifms@2026` | TEAM_LEADER | Duyệt ADVANCE/EXPENSE/REIMBURSE |
| `emp.it1@ifms.vn` | `Ifms@2026` | EMPLOYEE | Nhân viên IT — data phong phú nhất |
| `emp.it2@ifms.vn` | `Ifms@2026` | EMPLOYEE | Nhân viên IT |
| `emp.fin1@ifms.vn` | `Ifms@2026` | EMPLOYEE | Nhân viên FIN (cross-team IT project) |
| `emp.sales1@ifms.vn` | `Ifms@2026` | EMPLOYEE | **LOCKED** — demo admin/users page |

> **Lưu ý:** `emp.sales1` bị khóa tài khoản (LOCKED) để demo tính năng lock/unlock trong `/admin/users`. Không thể đăng nhập bằng tài khoản này. Ba tài khoản employee khác (`emp.it1`, `emp.it2`, `emp.fin1`) hoạt động bình thường.

> **First login:** Tất cả tài khoản có `isFirstLogin = true`. Lần đầu đăng nhập sẽ redirect `/change-password` để đặt mật khẩu mới + PIN (5 chữ số). Dùng PIN `12345` cho demo.

---

## Tổ chức & Dự án

### Phòng ban

| Code | Tên | Budget quota |
|---|---|---|
| `BGD` | Ban Giám Đốc | 5 tỷ |
| `IT` | Phòng Công Nghệ | 20 tỷ |
| `FIN` | Phòng Kế Toán – Tài Chính | 10 tỷ |
| `SALES` | Phòng Kinh Doanh | 15 tỷ |

### Dự án

| Code | Tên | Status | Budget | Wallet |
|---|---|---|---|---|
| `PRJ-ERP-2026` | Hệ Thống ERP Nội Bộ | **ACTIVE** | 500M | ~561M (500M seed + 80M topup − disbursements) |
| `PRJ-MOBILE-2025` | Ứng Dụng Mobile Nhân Sự | **CLOSED** | 100M | Không có (đã giải ngân hết) |

### Phases của PRJ-ERP-2026

| Code | Tên | Status | Budget | CurrentSpent |
|---|---|---|---|---|
| `PH-PREP-00` | Phase 0 – Chuẩn Bị & Lên Kế Hoạch | **CLOSED** | 50M | 12.5M |
| `PH-INIT-01` | Phase 1 – Khởi Động & Phân Tích | **ACTIVE** | 300M | 18.5M |

### Category budgets (Phase 1 ACTIVE)

| Category | Budget | Spent |
|---|---|---|
| Equipment & Software | 150M | 13.5M |
| Outsourcing & Services | 80M | 0 |
| Meals & Entertainment | 40M | 3M |
| Travel & Accommodation | 30M | 2M |

### Project members (PRJ-ERP-2026)

| User | Role | Position |
|---|---|---|
| `tl.it` | LEADER | Technical Lead |
| `emp.it1` | MEMBER | Backend Developer |
| `emp.it2` | MEMBER | Frontend Developer |
| `emp.sales1` | MEMBER | Business Analyst |
| `emp.fin1` | MEMBER | Finance Analyst |
| `manager.it` | MEMBER | IT Manager |

---

## Wallet Balances (sau seed)

| Wallet | Owner | Balance (ước tính) | Ghi chú |
|---|---|---|---|
| COMPANY_FUND | System | ~49.3 tỷ | 50B − payroll 235M − DEPT_TOPUP 200M − các transfers |
| IT DEPT | IT Department | ~120M | 200M DEPT_TOPUP − 80M PROJECT_TOPUP |
| PRJ-ERP-2026 | Project | ~561M | 500M seed + 80M topup − 18.5M disbursements |
| `emp.it1` | Đỗ Quốc Bảo | ~23M | 7.5M disburse + 18.5M payslip + 2M deposit − 5M withdraw |
| `emp.it2` | Vũ Thị Lan | ~25M | 5M + 18M + 1M deposit |
| `emp.sales1` | Phạm Văn Đức | ~17.3M | 1.5M + 15M + 0.8M deposit (LOCKED) |
| `emp.fin1` | Nguyễn Thị Minh | ~16M | 1M + 14M |
| `tl.it` | Hoàng Minh Tuấn | ~16.5M | 25M payslip + 1.5M disburse − 10M locked (PENDING withdraw) |
| `manager.it` | Trần Thị Bích | ~17M | 30M payslip + 2M disburse − 15M withdraw |
| `accountant` | Lê Văn Cường | ~20M | 20M payslip |
| `cfo` | Nguyễn Văn Minh | ~50M | 50M payslip |
| `admin` | Phạm Thị Thanh Hà | ~10M | Credit trực tiếp |

---

## Flow 3 — DEPARTMENT_TOPUP (Manager → CFO)

| Request Code | Requester | Amount | Status | Ghi chú |
|---|---|---|---|---|
| REQ-IT-* | `manager.it` | 200M | **PAID** | CFO đã duyệt, IT DEPT +200M |
| REQ-IT-* | `manager.it` | 100M | **APPROVED_BY_CFO** | Pending auto-pay |
| REQ-IT-* | `manager.it` | 50M | **PENDING** | Chờ CFO duyệt — hiển thị trong `/cfo/approvals` |

---

## Flow 2 — PROJECT_TOPUP (TL → Manager)

| Request Code | Requester | Amount | Status | Ghi chú |
|---|---|---|---|---|
| REQ-IT-* | `tl.it` | 80M | **PAID** | Manager đã duyệt, project wallet +80M |
| REQ-IT-* | `tl.it` | 40M | **APPROVED_BY_MANAGER** | Pending auto-pay |
| REQ-IT-* | `tl.it` | 20M | **PENDING** | Chờ Manager duyệt — hiển thị trong `/manager/approvals` |

---

## Flow 1 — ADVANCE/EXPENSE/REIMBURSE (Employee → TL → Accountant)

### emp.it1 — 7 requests (đủ tất cả statuses)

| Type | Amount | Status | Ghi chú |
|---|---|---|---|
| ADVANCE | 3M | PAID | Tạm ứng laptop — có AdvanceBalance OUTSTANDING |
| EXPENSE | 500K | PAID | Chi phí ăn uống team building |
| REIMBURSE | 2M | APPROVED_BY_TEAM_LEADER | Hoàn ứng — **trong Accountant disbursements queue** · liên kết AdvanceBalance adv1 |
| ADVANCE | 1.5M | PENDING | **Trong TL approvals queue** |
| EXPENSE | 2M | REJECTED | Từ chối — lý do: chưa có phê duyệt |
| EXPENSE | 800K | CANCELLED | Tự hủy |
| ADVANCE | 4M | PAID | Tạm ứng màn hình 4K — có AdvanceBalance OUTSTANDING |

### emp.it2 — 3 requests

| Type | Amount | Status | Ghi chú |
|---|---|---|---|
| EXPENSE | 5M | PAID | Bản quyền JetBrains |
| ADVANCE | 2M | APPROVED_BY_TEAM_LEADER | **Trong Accountant disbursements queue** |
| EXPENSE | 1.2M | PENDING | **Trong TL approvals queue** |

### emp.sales1 — 2 requests

| Type | Amount | Status | Ghi chú |
|---|---|---|---|
| EXPENSE | 1.5M | PAID | Chi phí tiếp khách |
| ADVANCE | 3M | PENDING | **Trong TL approvals queue** |

### emp.fin1 — 2 requests

| Type | Amount | Status | Ghi chú |
|---|---|---|---|
| EXPENSE | 2M | PENDING | **Trong TL approvals queue** |
| ADVANCE | 1M | PAID | Tạm ứng đi lại — có AdvanceBalance OUTSTANDING |

### tl.it — 2 personal requests

| Type | Amount | Status | Ghi chú |
|---|---|---|---|
| EXPENSE | 1.5M | PAID | Nâng cấp thiết bị cá nhân (approved bởi manager.it) |
| ADVANCE | 2M | PENDING | Công tác Hà Nội |

### manager.it — 2 personal requests

| Type | Amount | Status | Ghi chú |
|---|---|---|---|
| EXPENSE | 2M | PAID | Hội nghị quản lý TP.HCM (approved bởi cfo) |
| ADVANCE | 3M | PENDING | Trang thiết bị phòng họp |

> **Accountant disbursements queue** (`/accountant/disbursements`): 2 items → reimb1 (emp.it1, 2M) + it2a1 (emp.it2, 2M)

---

## Payroll

### T5/2026 — COMPLETED (nettingApplied = true)

| Employee | Code | Gross | Allowance | AdvanceDeduct | Net | Status |
|---|---|---|---|---|---|---|
| `emp.it1` | MK004 | 20M | 500K | 1.5M | 18.5M | PAID |
| `emp.it2` | MK005 | 18M | 0 | 0 | 18M | PAID |
| `emp.sales1` | MK006 | 15M | 0 | 0 | 15M | PAID |
| `emp.fin1` | MK007 | 14M | 0 | 0 | 14M | PAID |
| `tl.it` | MK008 | 25M | 0 | 0 | 25M | PAID |
| `manager.it` | MK002 | 30M | 0 | 0 | 30M | PAID |
| `accountant` | MK001 | 20M | 0 | 0 | 20M | PAID |
| `cfo` | MK010 | 50M | 0 | 0 | 50M | PAID |

### T6/2026 — DRAFT (chưa import payslips)

> Period DRAFT phản ánh trạng thái thực tế: Accountant chưa import file Excel tháng 6. Đây là trạng thái hợp lệ để demo `/accountant/payroll`.

---

## Withdrawal Requests

| User | Amount | Status | Bank | Ghi chú |
|---|---|---|---|---|
| `emp.it1` | 5M | COMPLETED | VCB | Wallet debit đã thực hiện |
| `tl.it` | 10M | PENDING | VCB | **10M locked** trong wallet tl.it |
| `manager.it` | 15M | COMPLETED | TCB | Wallet debit đã thực hiện |
| `emp.it2` | 2M | REJECTED | MBB | Lý do: tài khoản đích không khớp |
| `emp.fin1` | 1M | CANCELLED | VCB | User tự hủy |

---

## Deposit History (VNPay)

| User | Amount | Status | Ghi chú |
|---|---|---|---|
| `emp.it1` | 2M | COMPLETED | Wallet đã được cộng tiền |
| `emp.it1` | 500K | PENDING | Đang chờ callback VNPay |
| `emp.it2` | 1M | COMPLETED | Wallet đã được cộng tiền |
| `emp.sales1` | 800K | COMPLETED | Wallet đã được cộng tiền |
| `emp.fin1` | 300K | FAILED | VNPay response code 24 (user hủy) |

---

## Advance Balances (OUTSTANDING)

| User | Linked Request | Original | Remaining | Status |
|---|---|---|---|---|
| `emp.it1` | adv1 (3M ADVANCE) | 3M | 3M | OUTSTANDING |
| `emp.it1` | adv3 (4M ADVANCE) | 4M | 4M | OUTSTANDING |
| `emp.fin1` | fa1 (1M ADVANCE) | 1M | 1M | OUTSTANDING |

> Khi Accountant disburse `reimb1` (REIMBURSE của emp.it1), `advanceBalance.remainingAmount` của adv1 sẽ bị trừ.

---

## Notifications

| Recipient | Loại | Đã đọc |
|---|---|---|
| `emp.it1` | REQUEST_APPROVED_BY_TL | ✅ |
| `emp.it1` | REQUEST_PAID | ✅ |
| `emp.it1` | SALARY_PAID | ❌ (unread) |
| `emp.it2` | REQUEST_PAID | ✅ |
| `emp.it2` | SALARY_PAID | ❌ |
| `emp.sales1` | REQUEST_PAID | ✅ |
| `emp.sales1` | SALARY_PAID | ❌ |
| `emp.fin1` | REQUEST_PAID | ✅ |
| `emp.fin1` | SALARY_PAID | ❌ |
| `tl.it` | SYSTEM (3 YC chờ duyệt) | ❌ |
| `tl.it` | PROJECT_TOPUP_APPROVED | ✅ |
| `tl.it` | SYSTEM (topup đang chờ) | ❌ |
| `manager.it` | SYSTEM (1 topup mới) | ❌ |
| `manager.it` | DEPT_TOPUP_APPROVED | ✅ |
| `manager.it` | SYSTEM (ngân sách chờ CFO) | ❌ |
| `accountant` | SYSTEM (2 YC chờ giải ngân) | ❌ |
| `accountant` | SYSTEM (T5/2026 hoàn tất) | ✅ |
| `cfo` | SYSTEM (1 topup mới) | ❌ |
| `cfo` | DEPT_TOPUP_APPROVED | ✅ |
| `admin` | SYSTEM (hệ thống bình thường) | ✅ |

---

## Audit Logs (10 entries)

| Actor | Action | Entity | Ghi chú |
|---|---|---|---|
| `admin` | UPDATE | SystemConfig | Bật/tắt maintenance mode |
| `admin` | UPDATE | User | Lock một user |
| `admin` | INSERT | User | Tạo emp.fin1 |
| `accountant` | UPDATE | PayrollPeriod | DRAFT → COMPLETED |
| `accountant` | INSERT | PayrollPeriod | Tạo T6/2026 DRAFT |
| `manager.it` | INSERT | Request | Tạo DEPT_TOPUP 50M |
| `admin` | UPDATE | Department | Cập nhật quota IT dept |
| `admin` | UPDATE | SystemConfig | PIN_MAX_RETRY: 3 → 5 |
| `accountant` | UPDATE | Request | APPROVED_BY_TL → PAID |
| `admin` | INSERT | Department | Tạo SALES dept |

---

## System Config (15 entries)

| Key | Value | Mô tả |
|---|---|---|
| PIN_MAX_RETRY | 5 | Số lần nhập sai PIN tối đa |
| PIN_LOCK_MINUTES | 30 | Thời gian khóa PIN (phút) |
| PAYROLL_ADVANCE_NETTING | true | Tự động trừ nợ tạm ứng khi chi lương |
| SYSTEM_MAINTENANCE_MODE | false | Chế độ bảo trì |
| DEFAULT_CURRENCY | VND | Đơn vị tiền tệ |
| MAX_ATTACHMENT_SIZE_MB | 10 | Dung lượng file đính kèm tối đa |
| MAX_ATTACHMENT_COUNT | 5 | Số file đính kèm tối đa |
| JWT_REFRESH_EXPIRY_DAYS | 7 | Thời hạn Refresh Token |
| NOTIFICATION_RETAIN_DAYS | 90 | Số ngày lưu thông báo |
| WITHDRAW_LIMIT_EMPLOYEE | 5,000,000 | Hạn mức rút tự động (Nhân viên) |
| WITHDRAW_LIMIT_TEAM_LEADER | 20,000,000 | Hạn mức rút tự động (TL) |
| WITHDRAW_LIMIT_MANAGER | 50,000,000 | Hạn mức rút tự động (Manager) |
| WITHDRAW_LIMIT_ACCOUNTANT | 100,000,000 | Hạn mức rút tự động (Accountant) |
| WITHDRAW_LIMIT_CFO | 500,000,000 | Hạn mức rút tự động (CFO) |
| WITHDRAW_LIMIT_ADMIN | 0 | Admin không rút tự động |

---

## Coverage matrix — Mỗi role × trang chính

| Role | Trang | Data có sẵn |
|---|---|---|
| EMPLOYEE | `/requests` | 7 statuses đủ (PENDING, APPROVED_BY_TL, PAID×3, REJECTED, CANCELLED) |
| EMPLOYEE | `/payroll` | T5/2026 PAID payslip; T6/2026 DRAFT period |
| EMPLOYEE | `/wallet/transactions` | REQUEST_PAYMENT, PAYSLIP_PAYMENT, DEPOSIT, WITHDRAW |
| EMPLOYEE | `/wallet/deposit/my` | COMPLETED×3, PENDING×1, FAILED×1 |
| EMPLOYEE | `/wallet/withdraw` (via wallet page) | COMPLETED, PENDING, REJECTED, CANCELLED |
| EMPLOYEE | `/projects` | 2 projects: ACTIVE + CLOSED |
| TEAM_LEADER | `/team-leader/approvals` | 6 items PENDING (emp.it1, emp.it2, emp.sales1, emp.fin1, tl.it, manager.it) |
| TEAM_LEADER | `/team-leader/projects/[id]` — Phases | 2 phases: ACTIVE + CLOSED |
| TEAM_LEADER | `/team-leader/projects/[id]` — Budget | catEquip 150M (13.5M spent), catMeals 40M (3M), catTravel 30M (2M) |
| TEAM_LEADER | `/requests` (Cá nhân) | 1 PAID + 1 PENDING |
| TEAM_LEADER | `/payroll` (Cá nhân) | T5/2026 PAID 25M |
| MANAGER | `/manager/approvals` | PROJECT_TOPUP: PENDING (20M) + APPROVED_BY_MANAGER (40M) |
| MANAGER | `/manager/projects` | 2 projects: ACTIVE + CLOSED |
| MANAGER | `/requests` (Cá nhân) | 1 PAID + 1 PENDING |
| MANAGER | `/payroll` (Cá nhân) | T5/2026 PAID 30M |
| ACCOUNTANT | `/accountant/disbursements` | 2 items APPROVED_BY_TL trong queue |
| ACCOUNTANT | `/accountant/payroll` | T5 COMPLETED (8 payslips, netting=true) + T6 DRAFT |
| ACCOUNTANT | `/accountant/ledger` | Nhiều TransactionTypes: DEPT_QUOTA, PROJECT_QUOTA, REQUEST_PAYMENT, PAYSLIP, DEPOSIT, WITHDRAW |
| ACCOUNTANT | `/payroll` (Cá nhân) | T5/2026 PAID 20M |
| CFO | `/cfo/approvals` | DEPT_TOPUP: PENDING (50M) + APPROVED_BY_CFO (100M) |
| CFO | `/cfo/system-fund` | CompanyFund 50B, Vietcombank |
| CFO | `/cfo/settings` | 15 SystemConfig entries |
| CFO | `/cfo/audit-logs` | 10 audit entries |
| CFO | `/payroll` (Cá nhân) | T5/2026 PAID 50M |
| ADMIN | `/admin/users` | 9 users: 8 ACTIVE + 1 **LOCKED** (emp.sales1) |
| ADMIN | `/admin/departments` | 4 departments với manager assigned |
| ADMIN | `/admin/audit-logs` | 10 entries đa dạng |
| ADMIN | `/admin/settings` | 15 SystemConfig entries |

---

## Lưu ý kỹ thuật

### ProjectPhase.currentSpent — Design gap
Backend không tự động cập nhật `ProjectPhase.currentSpent` khi Accountant disburse (chỉ `PhaseCategoryBudget.currentSpent` được cập nhật). DataSeeder set trực tiếp `Phase 1.currentSpent = 18.5M`. Trong production, sau mỗi disbursement thật `Phase 1.currentSpent` sẽ không cập nhật — cần thêm `phase.addSpent(amount)` vào `RequestServiceImpl.disburse()`.

### TlApprovalSummaryResponse — Đã fix
`phase.budgetLimit` và `phase.currentSpent` đã được thêm vào response trong session implement seed data này. Budget overflow warning trong `/team-leader/approvals` giờ hoạt động đúng.

### emp.sales1 LOCKED — Intentional
Tài khoản bị lock để demo tính năng Admin lock/unlock trong `/admin/users`. Không ảnh hưởng đến 3 employee accounts còn lại.
