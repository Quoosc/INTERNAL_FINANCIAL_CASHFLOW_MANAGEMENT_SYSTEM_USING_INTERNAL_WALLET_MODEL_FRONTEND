# UI Review & Alignment Plan

> So sánh chi tiết giữa **bản thiết kế** (`d:\src`) và **frontend hiện tại** (`financial-wallet-frontend`).
> Tạo ngày: 2026-04-16

---

## Tổng quan

Sau khi chuyển toàn bộ giao diện từ dark theme sang light theme (xanh/trắng), vẫn còn **nhiều khác biệt lớn** giữa bản thiết kế gốc và giao diện hiện tại. Tài liệu này liệt kê tất cả các vấn đề theo mức độ ưu tiên và khu vực.

---

## MỤC LỤC

1. [A. Layout & Sidebar](#a-layout--sidebar)
2. [B. Header](#b-header)
3. [C. Dashboard Pages](#c-dashboard-pages)
4. [D. Wallet Page](#d-wallet-page)
5. [E. Requests Page](#e-requests-page)
6. [F. Payroll/Payslips Page](#f-payrollpayslips-page)
7. [G. Profile/Settings Page](#g-profilesettings-page)
8. [H. Admin/Role-specific Pages](#h-adminrole-specific-pages)
9. [I. Global Styling Issues](#i-global-styling-issues)

---

## A. Layout & Sidebar

### A1. Header Component — THIẾU HOÀN TOÀN [P0]

| Thiết kế | Hiện tại |
|----------|----------|
| Sticky header `bg-white border-b border-slate-200` | Không có header |
| Breadcrumb navigation (props-based) | Không có |
| Notification bell với red dot indicator | Không có |
| User name + department hiển thị ở header | Không có (chỉ có ở sidebar) |
| Mobile menu toggle (`lg:hidden`) | Không có |

**File thiết kế:** `d:\src\components\layout\header.tsx`

**Hành động:** Tạo component `Header` trong `components/layout/header.tsx`, tích hợp vào `(dashboard)/layout.tsx` phía trên `{children}`.

---

### A2. Sidebar — Không có role-specific styling [P1]

| Thiết kế | Hiện tại |
|----------|----------|
| Admin sidebar: màu **violet** (`bg-violet-50 text-violet-700`) | Chỉ có 1 sidebar dùng chung màu **blue** |
| Manager/Accountant sidebar: màu **indigo** (`bg-indigo-50 text-indigo-700`) | Không phân biệt |
| Employee sidebar: màu **blue** (`bg-blue-50 text-blue-600`) | Đúng rồi |
| Collapsible sidebar (`w-64` ↔ `w-[68px]`) | Không có chức năng collapse |
| Active indicator bar trái (`w-0.5 h-5 bg-*-600 rounded-r-full`) | Không có |
| AlertDialog xác nhận logout | Logout trực tiếp không xác nhận |

**File thiết kế:** `d:\src\components\layout\admin-sidebar.tsx`, `manager-sidebar.tsx`, `accountant-sidebar.tsx`

**Hành động:**
- Thêm logic đổi accent color theo role trong sidebar
- Thêm active indicator bar bên trái menu item
- (Optional) Thêm collapsible sidebar

---

### A3. Sidebar — Chi tiết styling nhỏ [P2]

| Thiết kế | Hiện tại | Fix |
|----------|----------|-----|
| Logo section: `p-6` | `p-5` | Đổi thành `p-6` |
| Logo icon: `rounded-lg` | `rounded-xl` | Đổi thành `rounded-lg` |
| Nav spacing: `space-y-1` hoặc `space-y-0.5` | `space-y-4` | Đổi thành `space-y-1` |
| Nav item: `rounded-lg` | `rounded-xl` | Đổi thành `rounded-lg` |
| Nav item padding: `px-4 py-3` | `px-3 py-2.5` | Đổi thành `px-4 py-3` |
| Group label: `text-slate-400` | `text-slate-400` | OK |

---

## B. Header

(Xem A1 — Header hoàn toàn thiếu)

---

## C. Dashboard Pages

### C1. Stats/KPI Cards — Thiếu gradient & glow [P1]

| Thiết kế | Hiện tại |
|----------|----------|
| KPI cards có gradient icon background: `bg-gradient-to-br from-*-500 to-*-600` | Icon trên nền phẳng |
| Glow effect: `absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl` | Không có |
| AnimatedValue component (số đếm animation) | Không có |
| Trend badges (emerald/rose cho tăng/giảm) | Không có |
| Card hover: `hover:shadow-md hover:border-slate-300 transition-all` | Thiếu hover shadow |

**File thiết kế:** `d:\src\components\dashboard\stats-card.tsx`, `d:\src\components\pages\admin-dashboard-page.tsx`

**Hành động:**
- Thêm gradient backgrounds cho icon containers
- Thêm `shadow-sm` mặc định + `hover:shadow-md` cho cards
- Thêm glow effect overlay (optional, cosmetic)
- Thêm trend badge component

---

### C2. Stats Card — Rounded corners & spacing [P2]

| Thiết kế | Hiện tại | Fix |
|----------|----------|-----|
| Cards: `rounded-xl shadow-sm` | `rounded-2xl` không shadow | Đổi `rounded-2xl` → `rounded-xl`, thêm `shadow-sm` |
| Card bg: `bg-white` solid | `bg-white/60` (60% opacity) | Đổi thành `bg-white` |
| Value font: `text-3xl font-bold` | `text-2xl font-bold` | Đổi thành `text-3xl` |
| Layout spacing: `gap-5` giữa sections | `gap-4` hoặc `gap-6` | Chuẩn hóa thành `gap-5` |

---

### C3. Charts — Sai theme tooltip + thiếu charts [P1]

| Thiết kế | Hiện tại |
|----------|----------|
| Chart tooltip: light theme (`bg-white border-slate-200`) | Dark theme (`backgroundColor: "#1e293b"`) |
| CartesianGrid: `stroke="#f1f5f9"` (slate-100) | `stroke="#334155"` (slate-700) |
| Admin dashboard: Area chart + Donut chart | Không có charts |
| Manager dashboard: Burn rate bars | Không có |
| Accountant dashboard: Cash flow + Expense donut | Không có |

**File thiết kế:** `d:\src\components\dashboard\monthly-chart.tsx`, `d:\src\components\dashboard\expense-pie-chart.tsx`

**Hành động:**
- Sửa chart tooltip sang light theme trong `employee-dashboard.tsx`
- Sửa CartesianGrid stroke color
- Thêm charts cho admin, manager, accountant dashboards

---

### C4. Quick Actions [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| 3 main action buttons (New Request, Withdraw, Repay) | 6 grid buttons |
| Thiết kế gọn, ít nút | Quá nhiều nút |

---

### C5. Missing Dashboard Sections [P1]

Các section có trong thiết kế nhưng thiếu trong hiện tại:

| Section | Thuộc Dashboard | File thiết kế |
|---------|----------------|---------------|
| Secondary stats strip (Inflow/Outflow/Net) | Admin, Accountant | `admin-dashboard-page.tsx` |
| Cash flow area chart | Admin, Accountant | `admin-dashboard-page.tsx` |
| Department spending donut | Admin | `admin-dashboard-page.tsx` |
| Top debtors table | Admin | `admin-dashboard-page.tsx` |
| Burn rate bars với legend | Manager | `manager-dashboard-page.tsx` |
| Filter system (search + pills) | Manager | `manager-dashboard-page.tsx` |
| Vault health bar | Accountant | `accountant-finance-dashboard-page.tsx` |
| Recent ledger feed | Accountant | `accountant-finance-dashboard-page.tsx` |
| Period selector dropdown | Accountant, Admin | Multiple files |
| Activity feed component | Employee | `activity-feed.tsx` |

---

## D. Wallet Page

### D1. Hero Wallet Card — Thiếu gradient background [P0]

| Thiết kế | Hiện tại |
|----------|----------|
| Gradient hero: `linear-gradient(135deg, rgba(30,58,138,0.95), rgba(30,64,175,0.85))` | Plain `bg-white border border-slate-200` |
| Shadow: `shadow-2xl` | Không shadow |
| SVG pattern overlay trang trí | Không có |
| Text trên hero: `text-white`, `text-blue-300` | `text-slate-900`, `text-slate-500` |
| Right-side liability box: `bg-white/10 backdrop-blur-md border border-white/20` | Không có panel riêng |

**File thiết kế:** `d:\src\pages\my-wallet.tsx`, `d:\src\components\pages\wallet-page.tsx`

**Hành động:** Tạo lại hero card với gradient background, SVG pattern, và layout 2 cột (balance trái + liability phải).

---

### D2. Action Buttons — Sai style [P1]

| Thiết kế | Hiện tại |
|----------|----------|
| Withdraw: `bg-white text-blue-900 shadow-lg hover:shadow-xl hover:scale-105` | `bg-slate-100 text-slate-700` |
| Deposit: `bg-white/10 backdrop-blur-sm text-white border-white/20` | `bg-blue-600 text-white` |
| Hover scale transform | Không có |

---

### D3. Transaction Badge Colors — Sai semantic [P1]

| Thiết kế | Hiện tại |
|----------|----------|
| Type badges: `bg-*-50 text-*-700 border-*-200` (opaque, light) | `bg-*-500/15 text-*-300 border-*-500/30` (semi-transparent) |
| Status badges: `bg-*-100 text-*-700` | `bg-*-500/15 text-*-300` |

**Ví dụ cụ thể:**
- Deposit: Thiết kế `bg-green-50 text-green-700` → Hiện tại `bg-emerald-50 text-emerald-700` (gần đúng)
- Withdraw: Thiết kế `bg-blue-50 text-blue-700` → Hiện tại `bg-rose-50 text-rose-700` (sai semantic)
- Success: Thiết kế `bg-green-100 text-green-700` → Hiện tại `bg-emerald-50 text-emerald-700` (gần đúng)

**Hành động:** Review lại color mapping cho tất cả badge types.

---

### D4. Deposit/Withdraw Flow — Page vs Modal [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| Deposit: Modal dialog với multi-step (form → QR → success) | Full page form |
| Withdraw: Modal dialog với steps (amount → PIN → processing → result) | Full page form |
| QR code: gradient bg `from-blue-50 to-indigo-50` + pulse animation | Không có |
| InputOTP component cho PIN | 6 input fields riêng lẻ |

**Ghi chú:** Đây là thay đổi lớn về UX flow. Có thể giữ page-based nếu phù hợp hơn với Next.js routing, nhưng cần align styling.

---

## E. Requests Page

### E1. Summary Cards — Thiếu colored borders [P1]

| Thiết kế | Hiện tại |
|----------|----------|
| Pending card: `border-amber-200` + icon bg `bg-amber-100` | `border-slate-200` uniform |
| Approved card: `border-green-200` + icon bg `bg-green-100` | `border-slate-200` uniform |
| Rejected card: `border-rose-200` + icon bg `bg-rose-100` | `border-slate-200` uniform |

**Hành động:** Thêm colored borders và icon backgrounds theo status type.

---

### E2. Request Type Selection — Thiếu card UI [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| Visual card selection: `border-{color}-500 bg-{color}-500 text-white` khi chọn | Simple `<select>` dropdown |
| Mỗi type có màu riêng: ADVANCE=blue, EXPENSE=purple, REIMBURSE=cyan | Không phân biệt |

**File thiết kế:** `d:\src\components\requests\create-request-modal.tsx`

---

## F. Payroll/Payslips Page

### F1. Missing Month Color Badges [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| Month badge: `w-12 h-12 rounded-xl` với 12 màu khác nhau | Không có |
| MONTH_COLORS: `bg-blue-50`, `bg-indigo-50`, `bg-violet-50`... | Không có |
| Progress bar: `w-16 h-1.5 bg-slate-100` với fill | Không có |
| Trend badge: icon + percentage | Không có |

**File thiết kế:** `d:\src\components\pages\payslips-page.tsx`

---

### F2. Stat Cards — Thiếu icons [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| Net Pay: Wallet icon + `bg-emerald-50 text-emerald-600` | No icon |
| Gross: TrendingUp icon + `bg-blue-50 text-blue-600` | No icon |
| Deductions: Receipt icon + `bg-rose-50 text-rose-500` | No icon |

---

## G. Profile/Settings Page

### G1. Tab Icons — Thiếu [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| Tabs: General (User icon), Banking (CreditCard), Security (Shield) | Chỉ text, không icon |
| Tabs dùng Radix UI components | Custom button styling |

---

### G2. Avatar Styling [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| Avatar: `w-24 h-24 ring-2 ring-slate-200 hover:ring-blue-500` | `w-20 h-20 border border-slate-200` |

---

### G3. Virtual Bank Card — THIẾU [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| VirtualBankCard component với gradient, decorative circles, chip | Không có |
| Preview card: `bg-gradient-to-br from-slate-50 to-blue-50` | Chỉ form inputs |

**File thiết kế:** `d:\src\components\settings\virtual-bank-card.tsx`

---

### G4. Security Section — Thiếu icons & status [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| Change Password: Lock icon + `bg-blue-100 text-blue-600` | No icon |
| PIN section: KeyRound icon + `bg-purple-100 text-purple-600` + status badge | No icon |
| Sign Out: LogOut icon + `bg-red-100 text-red-600` + AlertDialog | Không có ở profile |

---

## H. Admin/Role-specific Pages

### H1. Table Styling — Nhiều khác biệt nhỏ [P1]

| Thiết kế | Hiện tại | Fix |
|----------|----------|-----|
| Table header bg: `bg-slate-50/80` | `bg-white/60` | Đổi thành `bg-slate-50/80` |
| Header text: `text-[10px] font-bold text-slate-400 uppercase` | `text-xs font-semibold text-slate-500 uppercase` | Đổi font size & color |
| Row hover: `hover:bg-slate-50/50 transition-colors` | Không có hover | Thêm hover state |
| Row border: `border-slate-100` | `border-slate-200` | Đổi thành `border-slate-100` |
| Cell padding: `py-3.5` | `py-3` | Đổi thành `py-3.5` |

---

### H2. Badge Colors — Sai approach [P1]

| Thiết kế | Hiện tại |
|----------|----------|
| Role ADMIN: `bg-violet-100 text-violet-700 border-violet-200` | `bg-rose-50 text-rose-700` |
| Role ACCOUNTANT: `bg-emerald-100 text-emerald-700 border-emerald-200` | `bg-amber-50 text-amber-700` |
| Status ACTIVE: `bg-emerald-100 text-emerald-700` + green dot | `bg-emerald-50 text-emerald-700` |
| Status LOCKED: `bg-rose-100 text-rose-700` + rose dot | `bg-rose-50 text-rose-700` |
| General approach: `bg-*-100 text-*-700 border-*-200` (opaque) | `bg-*-50 text-*-700` |

---

### H3. Card Shadows — Thiếu consistency [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| Cards: `shadow-sm` mặc định | Không có shadow trên hầu hết cards |
| Hover: `hover:shadow-md transition-shadow` | Không có hover shadow |
| KPI cards: `shadow-sm` | Không shadow |

**Hành động:** Thêm `shadow-sm` cho tất cả card containers, `hover:shadow-md` cho interactive cards.

---

## I. Global Styling Issues

### I1. Focus Ring Color [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| `focus:ring-violet-400/30 focus:border-violet-400` (admin) | `focus:ring-blue-500/40 focus:border-blue-500` |
| Focus ring color theo role | Cố định blue cho tất cả |

---

### I2. Secondary Text Color [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| `text-slate-400` cho secondary/muted text | `text-slate-500` |
| Table header: `text-slate-400` | `text-slate-500` |

---

### I3. Card Border Radius Inconsistency [P2]

| Thiết kế | Hiện tại |
|----------|----------|
| KPI/stat cards: `rounded-xl` | `rounded-2xl` |
| Section cards: `rounded-2xl` | `rounded-2xl` (OK) |
| Nav items: `rounded-lg` | `rounded-xl` |

---

## Tóm tắt theo mức ưu tiên

### P0 — Critical (Khác biệt lớn, ảnh hưởng trực tiếp UX)

| # | Issue | Khu vực | Effort |
|---|-------|---------|--------|
| 1 | Header component thiếu hoàn toàn | Layout | Medium |
| 2 | Wallet hero card thiếu gradient background | Wallet | Medium |

### P1 — High (Khác biệt rõ, cần fix sớm)

| # | Issue | Khu vực | Effort |
|---|-------|---------|--------|
| 3 | Sidebar thiếu role-specific accent colors | Layout | Small |
| 4 | Sidebar thiếu active indicator bar | Layout | Small |
| 5 | KPI cards thiếu gradient icon bg + shadow | Dashboard | Medium |
| 6 | Chart tooltip sai theme (dark → light) | Dashboard | Small |
| 7 | Missing charts (Admin, Manager, Accountant dashboards) | Dashboard | Large |
| 8 | Badge colors sai semantic (semi-transparent → opaque) | All pages | Medium |
| 9 | Table header bg & row hover thiếu | Admin/Role pages | Medium |
| 10 | Request summary cards thiếu colored borders | Requests | Small |
| 11 | Wallet action buttons sai style | Wallet | Small |
| 12 | Missing dashboard sections (stats strip, activity feed, etc.) | Dashboard | Large |

### P2 — Medium (Chi tiết styling, polish)

| # | Issue | Khu vực | Effort |
|---|-------|---------|--------|
| 13 | Sidebar spacing/rounding details (`p-6`, `rounded-lg`, `space-y-1`) | Layout | Small |
| 14 | Card `rounded-xl` vs `rounded-2xl` inconsistency | All pages | Small |
| 15 | Cards thiếu `shadow-sm` mặc định | All pages | Small |
| 16 | `bg-white/60` → `bg-white` (card opacity) | Dashboard | Small |
| 17 | Value font `text-2xl` → `text-3xl` | Dashboard | Small |
| 18 | Layout gap chuẩn hóa (`gap-5`) | Dashboard | Small |
| 19 | Quick actions giảm từ 6 → 3 buttons | Dashboard | Small |
| 20 | Request type selection: dropdown → card UI | Requests | Medium |
| 21 | Payslip month color badges | Payroll | Medium |
| 22 | Profile tab icons | Profile | Small |
| 23 | Avatar sizing `w-24 h-24` + ring styling | Profile | Small |
| 24 | Virtual bank card component | Profile | Medium |
| 25 | Security section icons + status indicators | Profile | Small |
| 26 | Deposit/Withdraw modal vs page flow | Wallet | Large |
| 27 | Focus ring color theo role | Global | Small |
| 28 | Secondary text `text-slate-400` vs `text-slate-500` | Global | Small |
| 29 | Collapsible sidebar | Layout | Large |
| 30 | Logout AlertDialog confirmation | Layout | Small |

---

## Gợi ý thứ tự thực hiện

### Sprint A — Layout & Global (ảnh hưởng toàn bộ app)
1. Tạo Header component (#1)
2. Fix sidebar details: spacing, rounding, active bar (#3, #4, #13)
3. Thêm `shadow-sm` cho tất cả cards (#15)
4. Fix badge color approach từ semi-transparent sang opaque (#8)
5. Fix table styling: header bg, row hover (#9)

### Sprint B — Wallet & Dashboard  
6. Tạo wallet hero gradient card (#2)
7. Fix wallet action buttons (#11)
8. Fix chart tooltip + grid colors (#6)
9. Thêm gradient icon bg cho KPI cards (#5)
10. Fix card opacity & rounding (#14, #16, #17)

### Sprint C — Role Dashboards
11. Thêm charts cho Admin/Manager/Accountant (#7)
12. Thêm missing dashboard sections (#12)
13. Sidebar role-specific colors (#3)

### Sprint D — Detail Pages & Polish
14. Request summary colored borders (#10)
15. Payslip month badges (#21)
16. Profile improvements (#22-25)
17. Remaining P2 items

---

*File này được tạo tự động từ kết quả so sánh thiết kế. Cập nhật khi hoàn thành từng item.*
