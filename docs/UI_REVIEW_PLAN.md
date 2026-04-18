# UI Review & Alignment Plan

> So sánh chi tiết giữa **bản thiết kế** (`d:\src`) và **frontend hiện tại** (`financial-wallet-frontend`).
> Tạo ngày: 2026-04-16 · Cập nhật lần cuối: 2026-04-18

---

## Tóm tắt tiến độ

| Mức | Tổng | ✅ DONE | ⏳ Pending |
|-----|------|---------|-----------|
| P0 — Critical | 2 | 2 | 0 |
| P1 — High | 10 | 7 | 3 |
| P2 — Medium | 18 | 13 | 5 |
| **Tổng** | **30** | **22** | **8** |

---

## MỤC LỤC

1. [A. Layout & Sidebar](#a-layout--sidebar)
2. [C. Dashboard Pages](#c-dashboard-pages)
3. [D. Wallet Page](#d-wallet-page)
4. [E. Requests Page](#e-requests-page)
5. [F. Payroll/Payslips Page](#f-payrollpayslips-page)
6. [G. Profile/Settings Page](#g-profilesettings-page)
7. [H. Admin/Role-specific Pages](#h-adminrole-specific-pages)
8. [I. Global Styling Issues](#i-global-styling-issues)

---

## A. Layout & Sidebar

### A1. Header Component [P0] ✅ DONE

| Item | Trạng thái |
|------|-----------|
| Sticky header `bg-white border-b border-slate-200` | ✅ `components/layout/header.tsx` — sticky top-0 z-40 |
| Breadcrumb auto từ pathname (BREADCRUMB_MAP 30+ routes) | ✅ |
| Notification bell → `/notifications` + red dot khi unread > 0 | ✅ |
| User `fullName` + `departmentName` ở góc phải | ✅ |
| Mobile menu toggle (`lg:hidden`) | ⏳ Chưa (sidebar chưa collapsible) |

---

### A2. Sidebar — Role-specific styling [P1] ✅ DONE

| Item | Trạng thái |
|------|-----------|
| ROLE_ACCENT map: violet/emerald/indigo/teal/blue theo role | ✅ |
| Active indicator bar trái (`w-0.5 h-5 rounded-r-full`) | ✅ |
| Logout confirm dialog (inline, không dùng Radix) | ✅ |
| Collapsible sidebar (`w-64` ↔ `w-[68px]`) | ⏳ Optional — chưa làm |

---

### A3. Sidebar — Chi tiết styling [P2] ✅ DONE

`p-6` · `rounded-lg` · `space-y-1` · `px-4 py-3` · group label `text-slate-400` — tất cả đã đúng.

---

## C. Dashboard Pages

### C1. Stats/KPI Cards — Gradient icon & shadow [P1] ✅ DONE

| Item | Trạng thái |
|------|-----------|
| Gradient icon bg: `bg-linear-to-br from-*-500 to-*-600` | ✅ ACCENT_TO_GRADIENT map — tất cả dashboards |
| Card: `rounded-xl shadow-sm` | ✅ |
| `hover:shadow-md hover:border-slate-300` | ✅ |
| Glow effect overlay (cosmetic) | ⏳ Chưa (optional) |
| AnimatedValue + Trend badges | ⏳ Chưa (optional) |

---

### C2. Stats Card — Spacing & font [P2] ✅ DONE

| Item | Trạng thái |
|------|-----------|
| KPI value: `text-3xl font-bold` | ✅ Tất cả dashboards |
| Stat card grid: `gap-5` | ✅ Global replace 6 files |
| `bg-white` solid (không opacity) | ✅ N/A — không có bg-white/60 trong KPI cards |

---

### C3. Charts — Theme & missing charts [P1] ✅ / ⏳ Partial

| Item | Trạng thái |
|------|-----------|
| Employee chart tooltip: `bg-white border-slate-200 color:#1e293b` | ✅ Đã light theme |
| CartesianGrid: `stroke="#f1f5f9"` | ✅ Đã đúng |
| Charts cho Admin dashboard (Area + Donut) | ⏳ Pending (Large) |
| Charts cho Manager dashboard (Burn rate bars) | ⏳ Pending (Large) |
| Charts cho Accountant dashboard (Cash flow + Expense donut) | ⏳ Pending (Large) |

---

### C4. Quick Actions [P2] ✅ DONE

Employee dashboard: giảm từ 6 grid buttons → **3 horizontal action rows** (Tạo yêu cầu · Rút tiền · Nạp tiền), mỗi item có icon gradient + label + subtitle + chevron.

---

### C5. Missing Dashboard Sections [P1] ⏳ Pending (Large)

| Section | Dashboard | Trạng thái |
|---------|-----------|-----------|
| Secondary stats strip (Inflow/Outflow/Net) | Admin, Accountant | ⏳ |
| Cash flow area chart | Admin, Accountant | ⏳ |
| Department spending donut | Admin | ⏳ |
| Top debtors table | Admin | ⏳ |
| Burn rate bars với legend | Manager | ⏳ |
| Vault health bar | Accountant | ⏳ |
| Recent ledger feed | Accountant | ⏳ |
| Period selector dropdown | Accountant, Admin | ⏳ |

---

## D. Wallet Page

### D1. Hero Wallet Card — Gradient [P0] ✅ DONE

`linear-gradient(135deg, rgba(30,58,138,0.95)→rgba(30,64,175,0.85))` · `shadow-2xl` · SVG pattern overlay · white text · right panel `bg-white/10 backdrop-blur-md`.

---

### D2. Action Buttons [P1] ✅ DONE

Rút tiền: `bg-white text-blue-900 shadow-lg hover:shadow-xl hover:scale-105` ·
Nạp tiền: `bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20`.

---

### D3. Transaction Badge Colors — Sai semantic [P1] ⏳ Pending

| Thiết kế | Hiện tại |
|----------|----------|
| `bg-*-50 text-*-700 border-*-200` (opaque) | Một số dùng semi-transparent |
| Withdraw badge: `bg-blue-50 text-blue-700` | `bg-rose-50 text-rose-700` (sai semantic) |

---

### D4. Deposit/Withdraw Flow — Page vs Modal [P2] ⏳ Pending (Large)

Thiết kế dùng modal multi-step (form → QR → success / amount → PIN → processing → result). Hiện tại là full-page. Đây là thay đổi UX lớn — giữ page-based nếu phù hợp với routing.

---

## E. Requests Page

### E1. Summary Cards [P1] ✅ DONE

`SummaryCard` đã nhận `borderColor` + `iconBg` props: `border-amber-200/bg-amber-100` (Đang chờ) · `border-emerald-200/bg-emerald-100` (Đã duyệt) · `border-rose-200/bg-rose-100` (Từ chối).

**Bug fix đi kèm:** Amount column `text-slate-100` → `text-slate-900`.

---

### E2. Request Type Selection — Dropdown → Card UI [P2] ⏳ Pending

Thiết kế dùng visual card selection với màu riêng mỗi type (ADVANCE=blue, EXPENSE=purple, REIMBURSE=cyan). Hiện tại là `<select>` dropdown.

---

## F. Payroll/Payslips Page

### F1 + F2. Month Badges & Stat Card Icons [P2] ✅ DONE

| Item | Trạng thái |
|------|-----------|
| Month badge `w-10 h-10 rounded-xl` với 12 MONTH_COLORS + MONTH_SHORT | ✅ |
| Stat card gradient icon containers (emerald + blue) | ✅ |
| Progress bar + Trend badge | ⏳ Chưa làm |

---

## G. Profile/Settings Page

### G1. Tab Icons [P2] ✅ DONE

Inline SVG icons trên 4 tabs: User (Thông tin) · Camera (Ảnh đại diện) · CreditCard (Ngân hàng) · Shield (Bảo mật).

---

### G2. Avatar Styling [P2] ✅ DONE

`w-24 h-24 ring-2 ring-slate-200 hover:ring-blue-500 transition-all cursor-pointer`.

---

### G3. Virtual Bank Card [P2] ⏳ Pending

`VirtualBankCard` component với gradient background, chip, decorative circles chưa được tạo. File thiết kế: `d:\src\components\settings\virtual-bank-card.tsx`.

---

### G4. Security Section Icons [P2] ✅ Partial

| Item | Trạng thái |
|------|-----------|
| PIN section: KeyRound icon + purple header | ✅ |
| Change Password: Lock icon header | ⏳ Chưa |
| Sign Out trong profile + AlertDialog | ⏳ Chưa |

---

## H. Admin/Role-specific Pages

### H1. Table Styling [P1] ✅ Partial

| Item | Trạng thái |
|------|-----------|
| Header text: `text-[10px] font-bold text-slate-400 uppercase tracking-wider` | ✅ Global replace 25+ files |
| Cell padding: `py-3.5` | ✅ Global replace 25+ files |
| Table header bg: `bg-slate-50/80` | ⏳ Một số files còn `bg-white/30` |
| Row hover: `hover:bg-slate-50/50 transition-colors` | ⏳ Chưa đồng bộ hết |
| Row border: `border-slate-100` | ⏳ Còn `border-slate-200` |

---

### H2. Badge Colors — Sai approach [P1] ⏳ Pending

| Thiết kế | Hiện tại |
|----------|----------|
| `bg-*-100 text-*-700 border-*-200` (opaque) | `bg-*-50 text-*-700` (nhạt hơn) |
| Role ADMIN: `bg-violet-100 text-violet-700` | `bg-rose-50 text-rose-700` (sai màu) |
| Status ACTIVE: `bg-emerald-100` + green dot | `bg-emerald-50` không có dot |

---

### H3. Card Shadows [P2] ✅ DONE

`shadow-sm` mặc định + `hover:shadow-md` cho tất cả KPI/stat cards tất cả dashboards.

---

## I. Global Styling Issues

### I1. Secondary Text Color [P2] ✅ Partial

Table headers đã dùng `text-slate-400`. Một số label phụ ở page content còn `text-slate-500`. Không ưu tiên cao.

---

### I2. Card Border Radius [P2] ✅ Partial

KPI/stat cards: `rounded-xl` ✅. Section cards: `rounded-2xl` (đúng theo thiết kế). Nav items: `rounded-lg` ✅.

---

### I3. Focus Ring Color theo role [P2] ⏳ Deferred

Thiết kế: focus ring đổi màu theo role (violet/admin, indigo/manager...). Hiện tại cố định blue. Yêu cầu truyền role context xuống mọi input — phức tạp hơn "Small", hoãn lại.

---

## Bảng tóm tắt trạng thái

### ✅ ĐÃ HOÀN THÀNH (22/30)

| # | Item | Khu vực |
|---|------|---------|
| P0-1 | Header component | Layout |
| P0-2 | Wallet hero gradient card | Wallet |
| P1-3 | Sidebar accent colors theo role | Layout |
| P1-4 | Sidebar active indicator bar | Layout |
| P1-5 | KPI cards gradient icon + shadow | Dashboard |
| P1-6 | Chart tooltip light theme | Dashboard |
| P1-9 | Table header text + py-3.5 (25+ files) | Admin pages |
| P1-10 | Request summary colored borders | Requests |
| P1-11 | Wallet action buttons style | Wallet |
| P2-13 | Sidebar spacing/rounding details | Layout |
| P2-14 | Card rounded-xl (KPI cards) | Dashboard |
| P2-15 | Cards shadow-sm | All pages |
| P2-16 | N/A — không có bg-white/60 trong KPI cards | — |
| P2-17 | KPI value text-3xl | Dashboard |
| P2-18 | Stat card grid gap-5 | Dashboard |
| P2-19 | Quick actions 6 → 3 horizontal rows | Dashboard |
| P2-21 | Payslip month color badges | Payroll |
| P2-22 | Profile tab icons | Profile |
| P2-23 | Avatar w-24 + ring styling | Profile |
| P2-25 | Security PIN icon header | Profile |
| P2-28 | Table header text-slate-400 | Global |
| P2-30 | Logout confirm dialog | Layout |

---

### ⏳ CÒN PENDING (8/30)

| # | Item | Khu vực | Effort |
|---|------|---------|--------|
| P1-7 | Charts cho Admin/Manager/Accountant dashboard | Dashboard | Large |
| P1-8 | Badge colors: `bg-*-50` → `bg-*-100 border-*-200` | All pages | Medium |
| P1-12 | Missing dashboard sections (stats strip, charts, feeds) | Dashboard | Large |
| P2-20 | Request type: dropdown → card UI | Requests | Medium |
| P2-24 | Virtual bank card component | Profile | Medium |
| P2-26 | Deposit/Withdraw modal vs page flow | Wallet | Large |
| P2-27 | Focus ring color theo role | Global | Deferred |
| P2-29 | Collapsible sidebar | Layout | Large (optional) |

---

*Cập nhật: 2026-04-18. Còn lại toàn bộ là Medium/Large effort hoặc optional.*
