'use client';

import Link from "next/link";
import { Fragment, type ReactNode, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";

type EventType = "EXPENSE" | "ADVANCE" | "ADVANCE_RETURN" | "ALLOCATION" | "REIMBURSE" | "PAYROLL";
type ViewMode = "wallet" | "journal" | "advances";

type WalletLeg = {
  wallet: string;
  movement: "Tiền vào" | "Tiền ra";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
};

type AdvanceSnapshot = {
  employeeId: string;
  code: string;
  employee: string;
  department: string;
  project: string;
  openingWalletBalance: number;
  originalAmount: number;
  proofSettledAmount: number;
  cashReturnedAmount: number;
  payrollOffsetAmount: number;
  remainingAmount: number;
  asOf: string;
  disbursedAt: string;
  journalIds: string[];
};

type WalletTransaction = {
  id: string;
  code: string;
  title: string;
  type: EventType;
  typeLabel: string;
  source: string;
  date: string;
  amount: number;
  status: string;
  statusTone: "green" | "blue" | "amber";
  summary: string;
  legs: WalletLeg[];
  linkedJournals: string[];
  journalNote?: string;
  proofStatus?: string;
  paymentStatus?: string;
  advanceSnapshot?: AdvanceSnapshot;
};

type JournalLine = {
  account: string;
  effect: string;
  side: "Nợ" | "Có";
  amount: number;
};

type JournalEntry = {
  id: string;
  title: string;
  type: EventType;
  source: string;
  date: string;
  amount: number;
  summary: string;
  walletTransactionId?: string;
  lines: JournalLine[];
};

const nguyenMinhAnAdvance: AdvanceSnapshot = {
  employeeId: "employee-an",
  code: "ADV-2026-017",
  employee: "Nguyễn Minh An",
  department: "Phòng Công nghệ",
  project: "IFMS Mobile",
  openingWalletBalance: 2920000,
  originalAmount: 3000000,
  proofSettledAmount: 850000,
  cashReturnedAmount: 250000,
  payrollOffsetAmount: 500000,
  remainingAmount: 1400000,
  asOf: "25/09/2026",
  disbursedAt: "18/09/2026",
  journalIds: ["JRN-2026-0099", "JRN-2026-0100", "JRN-2026-0101", "JRN-2026-0102"],
};

const leThiMaiAdvance: AdvanceSnapshot = {
  employeeId: "employee-mai",
  code: "ADV-2026-016",
  employee: "Lê Thị Mai",
  department: "Phòng Công nghệ",
  project: "IFMS Mobile",
  openingWalletBalance: 7000000,
  originalAmount: 2000000,
  proofSettledAmount: 1200000,
  cashReturnedAmount: 300000,
  payrollOffsetAmount: 0,
  remainingAmount: 500000,
  asOf: "25/09/2026",
  disbursedAt: "10/09/2026",
  journalIds: ["JRN-2026-0096", "JRN-2026-0097", "JRN-2026-0098"],
};

const outstandingAdvances = [nguyenMinhAnAdvance, leThiMaiAdvance];

const walletTransactions: WalletTransaction[] = [
  {
    id: "expense-payment",
    code: "TXN-EXP-2026-041",
    title: "Thanh toán hoàn chi",
    type: "EXPENSE",
    typeLabel: "Nhân viên tự chi",
    source: "Yêu cầu EXP-2026-041 · Dự án IFMS Mobile",
    date: "26/09/2026 · 10:42",
    amount: 1250000,
    status: "Đã thanh toán",
    statusTone: "green",
    summary: "Nhân viên dùng tiền cá nhân để chi. Chứng từ đã được Kế toán xác nhận; khoản chuyển này là tiền hoàn lại cho nhân viên.",
    proofStatus: "Hợp lệ · chi phí đã được ghi nhận ngày 25/09/2026",
    paymentStatus: "Đã chuyển vào ví nhân viên ngày 26/09/2026",
    legs: [
      { wallet: "Ví dự án · IFMS Mobile", movement: "Tiền ra", amount: 1250000, balanceBefore: 35950000, balanceAfter: 34700000 },
      { wallet: "Ví nhân viên · Lê Thị Mai", movement: "Tiền vào", amount: 1250000, balanceBefore: 8700000, balanceAfter: 9950000 },
    ],
    linkedJournals: ["JRN-2026-0103", "JRN-2026-0104"],
  },
  {
    id: "advance-return",
    code: "TXN-RET-2026-006",
    title: "Nhân viên hoàn tiền tạm ứng",
    type: "ADVANCE_RETURN",
    typeLabel: "Hoàn tiền thật",
    source: "Khoản tạm ứng ADV-2026-017 · Nguyễn Minh An",
    date: "23/09/2026 · 09:06",
    amount: 250000,
    status: "Đã ghi nhận",
    statusTone: "green",
    summary: "Nhân viên chuyển lại tiền chưa sử dụng từ ví của mình về ví dự án. Số dư tạm ứng giảm cùng nghiệp vụ.",
    advanceSnapshot: nguyenMinhAnAdvance,
    legs: [
      { wallet: "Ví nhân viên · Nguyễn Minh An", movement: "Tiền ra", amount: 250000, balanceBefore: 5920000, balanceAfter: 5670000 },
      { wallet: "Ví dự án · IFMS Mobile", movement: "Tiền vào", amount: 250000, balanceBefore: 35700000, balanceAfter: 35950000 },
    ],
    linkedJournals: ["JRN-2026-0101"],
  },
  {
    id: "advance-payment",
    code: "TXN-ADV-2026-017",
    title: "Giải ngân tạm ứng",
    type: "ADVANCE",
    typeLabel: "Tạm ứng",
    source: "Yêu cầu ADV-2026-017 · Dự án IFMS Mobile",
    date: "18/09/2026 · 14:18",
    amount: 3000000,
    status: "Đã giải ngân",
    statusTone: "blue",
    summary: "Tiền được chuyển trước cho nhân viên để thực hiện nhiệm vụ. Khoản này được theo dõi là tạm ứng, chưa phải chi phí.",
    advanceSnapshot: nguyenMinhAnAdvance,
    legs: [
      { wallet: "Ví dự án · IFMS Mobile", movement: "Tiền ra", amount: 3000000, balanceBefore: 38700000, balanceAfter: 35700000 },
      { wallet: "Ví nhân viên · Nguyễn Minh An", movement: "Tiền vào", amount: 3000000, balanceBefore: 2920000, balanceAfter: 5920000 },
    ],
    linkedJournals: ["JRN-2026-0099"],
  },
  {
    id: "project-allocation",
    code: "TXN-ALLOC-2026-021",
    title: "Cấp ngân sách dự án",
    type: "ALLOCATION",
    typeLabel: "Phân bổ nội bộ",
    source: "Ví phòng ban Công nghệ · Đợt cấp tháng 09",
    date: "17/09/2026 · 16:35",
    amount: 8000000,
    status: "Đã hoàn tất",
    statusTone: "blue",
    summary: "Ngân sách được chuyển từ ví phòng ban sang ví dự án. Đây là điều chuyển nội bộ, không tự động được xem là chi phí.",
    legs: [
      { wallet: "Ví phòng ban · Công nghệ", movement: "Tiền ra", amount: 8000000, balanceBefore: 20500000, balanceAfter: 12500000 },
      { wallet: "Ví dự án · IFMS Mobile", movement: "Tiền vào", amount: 8000000, balanceBefore: 30700000, balanceAfter: 38700000 },
    ],
    linkedJournals: [],
    journalNote: "Không phải chi phí. Cách ghi nhận tài khoản cho điều chuyển nội bộ cần theo danh mục tài khoản IFMS được chốt.",
  },
  {
    id: "advance-return-mai",
    code: "TXN-RET-2026-005",
    title: "Lê Thị Mai hoàn tiền tạm ứng",
    type: "ADVANCE_RETURN",
    typeLabel: "Hoàn tiền thật",
    source: "Khoản tạm ứng ADV-2026-016 · Lê Thị Mai",
    date: "14/09/2026 · 11:20",
    amount: 300000,
    status: "Đã ghi nhận",
    statusTone: "green",
    summary: "Nhân viên chuyển lại tiền chưa sử dụng từ ví của mình về ví dự án. Số dư tạm ứng giảm cùng nghiệp vụ.",
    advanceSnapshot: leThiMaiAdvance,
    legs: [
      { wallet: "Ví nhân viên · Lê Thị Mai", movement: "Tiền ra", amount: 300000, balanceBefore: 9000000, balanceAfter: 8700000 },
      { wallet: "Ví dự án · IFMS Mobile", movement: "Tiền vào", amount: 300000, balanceBefore: 30400000, balanceAfter: 30700000 },
    ],
    linkedJournals: ["JRN-2026-0098"],
  },
  {
    id: "advance-payment-mai",
    code: "TXN-ADV-2026-016",
    title: "Giải ngân tạm ứng cho Lê Thị Mai",
    type: "ADVANCE",
    typeLabel: "Tạm ứng",
    source: "Yêu cầu ADV-2026-016 · Dự án IFMS Mobile",
    date: "10/09/2026 · 09:30",
    amount: 2000000,
    status: "Đã giải ngân",
    statusTone: "blue",
    summary: "Tiền được chuyển trước cho nhân viên để thực hiện nhiệm vụ. Khoản này được theo dõi là tạm ứng, chưa phải chi phí.",
    advanceSnapshot: leThiMaiAdvance,
    legs: [
      { wallet: "Ví dự án · IFMS Mobile", movement: "Tiền ra", amount: 2000000, balanceBefore: 32400000, balanceAfter: 30400000 },
      { wallet: "Ví nhân viên · Lê Thị Mai", movement: "Tiền vào", amount: 2000000, balanceBefore: 7000000, balanceAfter: 9000000 },
    ],
    linkedJournals: ["JRN-2026-0096"],
  },
];

const journalEntries: JournalEntry[] = [
  {
    id: "JRN-2026-0104",
    title: "Thanh toán khoản hoàn chi",
    type: "EXPENSE",
    source: "TXN-EXP-2026-041 · Ví dự án → Lê Thị Mai",
    date: "26/09/2026",
    amount: 1250000,
    summary: "Tiền được chuyển vào ví nhân viên. Khoản phải hoàn đã ghi nhận ở bước xác nhận chứng từ được tất toán; không ghi chi phí lần thứ hai.",
    walletTransactionId: "expense-payment",
    lines: [
      { account: "Phải hoàn cho Lê Thị Mai", effect: "Khoản phải trả giảm", side: "Nợ", amount: 1250000 },
      { account: "Tiền trong ví dự án", effect: "Số tiền trong ví giảm", side: "Có", amount: 1250000 },
    ],
  },
  {
    id: "JRN-2026-0103",
    title: "Ghi nhận chi phí sau khi duyệt chứng từ",
    type: "EXPENSE",
    source: "EXP-2026-041 · Lê Thị Mai",
    date: "25/09/2026",
    amount: 1250000,
    summary: "Kế toán xác nhận chứng từ hợp lệ. Chi phí và khoản công ty phải hoàn cho nhân viên được ghi nhận tại thời điểm này.",
    lines: [
      { account: "Chi phí công tác · IFMS Mobile", effect: "Chi phí tăng", side: "Nợ", amount: 1250000 },
      { account: "Phải hoàn cho Lê Thị Mai", effect: "Khoản phải trả tăng", side: "Có", amount: 1250000 },
    ],
  },
  {
    id: "JRN-2026-0102",
    title: "Khấu trừ tạm ứng qua lương",
    type: "PAYROLL",
    source: "Bảng lương tháng 09/2026 · Nguyễn Minh An",
    date: "25/09/2026",
    amount: 500000,
    summary: "Khoản lương công ty còn phải trả và khoản tạm ứng cùng giảm. Đây là bù trừ, không có tiền chuyển từ ví nhân viên về ví dự án.",
    lines: [
      { account: "Lương phải trả cho Nguyễn Minh An", effect: "Khoản phải trả giảm", side: "Nợ", amount: 500000 },
      { account: "Tạm ứng của Nguyễn Minh An", effect: "Khoản tạm ứng giảm", side: "Có", amount: 500000 },
    ],
  },
  {
    id: "JRN-2026-0101",
    title: "Ghi nhận nhân viên hoàn tiền tạm ứng",
    type: "ADVANCE_RETURN",
    source: "TXN-RET-2026-006 · Nguyễn Minh An",
    date: "23/09/2026",
    amount: 250000,
    summary: "Tiền thật quay về ví dự án; số dư tạm ứng còn phải quyết toán giảm tương ứng.",
    walletTransactionId: "advance-return",
    lines: [
      { account: "Tiền trong ví dự án", effect: "Số tiền trong ví tăng", side: "Nợ", amount: 250000 },
      { account: "Tạm ứng của Nguyễn Minh An", effect: "Khoản tạm ứng giảm", side: "Có", amount: 250000 },
    ],
  },
  {
    id: "JRN-2026-0100",
    title: "Quyết toán tạm ứng bằng chứng từ",
    type: "REIMBURSE",
    source: "Chứng từ REB-2026-015 · ADV-2026-017",
    date: "22/09/2026",
    amount: 850000,
    summary: "Chứng từ hợp lệ làm giảm khoản tạm ứng và ghi nhận chi phí. Bước này không chuyển thêm tiền qua ví.",
    lines: [
      { account: "Chi phí công tác · IFMS Mobile", effect: "Chi phí tăng", side: "Nợ", amount: 850000 },
      { account: "Tạm ứng của Nguyễn Minh An", effect: "Khoản tạm ứng giảm", side: "Có", amount: 850000 },
    ],
  },
  {
    id: "JRN-2026-0099",
    title: "Giải ngân tạm ứng",
    type: "ADVANCE",
    source: "TXN-ADV-2026-017 · Nguyễn Minh An",
    date: "18/09/2026",
    amount: 3000000,
    summary: "Ghi tăng khoản nhân viên còn phải quyết toán. Giải ngân chưa được ghi là chi phí thực tế.",
    walletTransactionId: "advance-payment",
    lines: [
      { account: "Tạm ứng của Nguyễn Minh An", effect: "Khoản tạm ứng tăng", side: "Nợ", amount: 3000000 },
      { account: "Tiền trong ví dự án", effect: "Số tiền trong ví giảm", side: "Có", amount: 3000000 },
    ],
  },
  {
    id: "JRN-2026-0098",
    title: "Lê Thị Mai hoàn tiền tạm ứng",
    type: "ADVANCE_RETURN",
    source: "TXN-RET-2026-005 · ADV-2026-016",
    date: "14/09/2026",
    amount: 300000,
    summary: "Tiền thật được trả về ví dự án và khoản tạm ứng còn phải quyết toán giảm 300.000 đ.",
    walletTransactionId: "advance-return-mai",
    lines: [
      { account: "Tiền trong ví dự án", effect: "Số tiền trong ví tăng", side: "Nợ", amount: 300000 },
      { account: "Tạm ứng của Lê Thị Mai", effect: "Khoản tạm ứng giảm", side: "Có", amount: 300000 },
    ],
  },
  {
    id: "JRN-2026-0097",
    title: "Quyết toán tạm ứng bằng chứng từ",
    type: "REIMBURSE",
    source: "Chứng từ REB-2026-014 · ADV-2026-016",
    date: "13/09/2026",
    amount: 1200000,
    summary: "Chứng từ hợp lệ ghi nhận chi phí và làm giảm khoản tạm ứng. Bước này không chuyển tiền qua ví.",
    lines: [
      { account: "Chi phí công tác · IFMS Mobile", effect: "Chi phí tăng", side: "Nợ", amount: 1200000 },
      { account: "Tạm ứng của Lê Thị Mai", effect: "Khoản tạm ứng giảm", side: "Có", amount: 1200000 },
    ],
  },
  {
    id: "JRN-2026-0096",
    title: "Giải ngân tạm ứng cho Lê Thị Mai",
    type: "ADVANCE",
    source: "TXN-ADV-2026-016 · Lê Thị Mai",
    date: "10/09/2026",
    amount: 2000000,
    summary: "Ghi tăng khoản nhân viên còn phải quyết toán; chưa ghi nhận đây là chi phí thực tế.",
    walletTransactionId: "advance-payment-mai",
    lines: [
      { account: "Tạm ứng của Lê Thị Mai", effect: "Khoản tạm ứng tăng", side: "Nợ", amount: 2000000 },
      { account: "Tiền trong ví dự án", effect: "Số tiền trong ví giảm", side: "Có", amount: 2000000 },
    ],
  },
];

const eventTypeOptions: { value: EventType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả nghiệp vụ" },
  { value: "EXPENSE", label: "Nhân viên tự chi (EXPENSE)" },
  { value: "ADVANCE", label: "Tạm ứng (ADVANCE)" },
  { value: "REIMBURSE", label: "Quyết toán tạm ứng (REIMBURSE)" },
  { value: "ADVANCE_RETURN", label: "Hoàn tiền tạm ứng" },
  { value: "PAYROLL", label: "Bù trừ qua lương" },
  { value: "ALLOCATION", label: "Phân bổ nội bộ" },
];

function statusClass(tone: "green" | "blue" | "amber") {
  if (tone === "green") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function eventClass(type: EventType) {
  if (type === "EXPENSE") return "border-violet-200 bg-violet-50 text-violet-700";
  if (type === "ADVANCE") return "border-blue-200 bg-blue-50 text-blue-700";
  if (type === "ADVANCE_RETURN") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (type === "REIMBURSE") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  if (type === "PAYROLL") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function eventLabel(type: EventType) {
  return eventTypeOptions.find((item) => item.value === type)?.label ?? type;
}

function entryTotals(entry: JournalEntry) {
  return entry.lines.reduce(
    (totals, line) => {
      totals[line.side] += line.amount;
      return totals;
    },
    { Nợ: 0, Có: 0 },
  );
}

function isEntryBalanced(entry: JournalEntry) {
  const totals = entryTotals(entry);
  return totals.Nợ === totals.Có;
}

export default function LedgerProposalDemoPage() {
  const [view, setView] = useState<ViewMode>("wallet");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EventType | "ALL">("ALL");
  const [selectedWalletId, setSelectedWalletId] = useState(walletTransactions[0].id);
  const [selectedJournalId, setSelectedJournalId] = useState(journalEntries[0].id);

  const query = search.trim().toLocaleLowerCase("vi");
  const visibleWalletTransactions = useMemo(
    () => walletTransactions.filter((item) => {
      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      const matchesSearch = !query || [item.code, item.title, item.source, item.typeLabel]
        .some((value) => value.toLocaleLowerCase("vi").includes(query));
      return matchesType && matchesSearch;
    }),
    [query, typeFilter],
  );
  const visibleJournals = useMemo(
    () => journalEntries.filter((item) => {
      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      const matchesSearch = !query || [item.id, item.title, item.source, item.summary]
        .some((value) => value.toLocaleLowerCase("vi").includes(query));
      return matchesType && matchesSearch;
    }),
    [query, typeFilter],
  );

  const selectedWallet = visibleWalletTransactions.find((item) => item.id === selectedWalletId) ?? visibleWalletTransactions[0];
  const selectedJournal = visibleJournals.find((item) => item.id === selectedJournalId) ?? visibleJournals[0];

  const walletTotals = visibleWalletTransactions.reduce(
    (totals, transaction) => {
      for (const leg of transaction.legs) {
        if (leg.wallet !== "Ví dự án · IFMS Mobile") continue;
        if (leg.movement === "Tiền vào") totals.incoming += leg.amount;
        else totals.outgoing += leg.amount;
      }
      return totals;
    },
    { incoming: 0, outgoing: 0 },
  );
  const journalTotals = visibleJournals.reduce(
    (totals, entry) => {
      const sums = entryTotals(entry);
      totals.debit += sums.Nợ;
      totals.credit += sums.Có;
      if (isEntryBalanced(entry)) totals.balanced += 1;
      return totals;
    },
    { debit: 0, credit: 0, balanced: 0 },
  );
  const outstandingEmployeeCount = new Set(outstandingAdvances.map((item) => item.employeeId)).size;
  const outstandingAdvanceTotal = outstandingAdvances.reduce((sum, item) => sum + item.remainingAmount, 0);

  function openJournal(id: string) {
    setSearch("");
    setTypeFilter("ALL");
    setSelectedJournalId(id);
    setView("journal");
  }

  function openWalletTransaction(id: string) {
    setSearch("");
    setTypeFilter("ALL");
    setSelectedWalletId(id);
    setView("wallet");
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              BẢN DEMO · DỮ LIỆU MINH HỌA
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Sổ cái theo nghiệp vụ</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Tra cứu giao dịch trong ví và bút toán kế toán riêng biệt; chọn một dòng để xem nguồn gốc và tác động đầy đủ.
            </p>
          </div>
          <Link
            href="/accountant/ledger"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
          >
            <span aria-hidden="true">←</span>
            Sổ cái hiện tại
          </Link>
        </div>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span className="font-semibold">Chỉ dùng để trình bày:</span> dữ liệu bên dưới là minh họa, không đọc hoặc ghi giao dịch thật.
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <ViewTab active={view === "wallet"} onClick={() => setView("wallet")}>Giao dịch ví</ViewTab>
        <ViewTab active={view === "journal"} onClick={() => setView("journal")}>Sổ cái kế toán</ViewTab>
        <button
          type="button"
          onClick={() => setView("advances")}
          title="Tạm ứng còn phải quyết toán theo nhân viên"
          aria-label="Mở danh sách nhân viên còn tạm ứng phải quyết toán"
          aria-pressed={view === "advances"}
          className={"relative ml-1 inline-flex h-11 w-12 items-center justify-center rounded-xl border transition " + (view === "advances"
            ? "border-blue-600 bg-blue-600 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700")}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-1h4m-2-2v4m1-8h-2.5A2.5 2.5 0 0 0 15 7.5v9a2.5 2.5 0 0 0 2.5 2.5H20" />
          </svg>
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {outstandingEmployeeCount}
          </span>
        </button>
      </div>

      {view === "wallet" ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Giao dịch đang hiển thị" value={String(visibleWalletTransactions.length)} helper="Theo từ khóa và loại nghiệp vụ bên dưới" tone="blue" />
          <MetricCard label="Tiền vào ví dự án" value={formatCurrency(walletTotals.incoming)} helper="Theo kết quả lọc · tháng 09/2026" tone="green" />
          <MetricCard label="Tiền ra ví dự án" value={formatCurrency(walletTotals.outgoing)} helper="Theo kết quả lọc · tháng 09/2026" tone="rose" />
          <MetricCard label="Thay đổi ròng ví dự án" value={formatCurrency(walletTotals.incoming - walletTotals.outgoing)} helper="Tiền vào trừ tiền ra trong kết quả lọc" tone="blue" />
        </section>
      ) : view === "journal" ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Bút toán đang hiển thị" value={String(visibleJournals.length)} helper="Theo từ khóa và loại nghiệp vụ bên dưới" tone="blue" />
          <MetricCard label="Tổng bên Nợ" value={formatCurrency(journalTotals.debit)} helper="Cộng các bút toán đang hiển thị" tone="green" />
          <MetricCard label="Tổng bên Có" value={formatCurrency(journalTotals.credit)} helper="Cộng các bút toán đang hiển thị" tone="rose" />
          <MetricCard label="Bút toán cân bằng" value={journalTotals.balanced + " / " + visibleJournals.length} helper="So sánh tổng Nợ và Có từng bút toán" tone="blue" />
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Nhân viên còn tạm ứng" value={String(outstandingEmployeeCount)} helper="Có ít nhất một khoản chưa tất toán" tone="blue" />
          <MetricCard label="Khoản tạm ứng đang mở" value={String(outstandingAdvances.length)} helper="Theo các yêu cầu tạm ứng mẫu" tone="green" />
          <MetricCard label="Tổng còn phải quyết toán" value={formatCurrency(outstandingAdvanceTotal)} helper="Cộng số dư còn lại theo nhân viên" tone="rose" />
        </section>
      )}

      {view === "advances" ? (
        <AdvanceTracker advances={outstandingAdvances} onOpenJournal={openJournal} />
      ) : (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {view === "wallet" ? "Danh sách giao dịch ví" : "Danh sách bút toán kế toán"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {view === "wallet"
                ? "Mỗi dòng là một giao dịch. Chọn dòng để xem ví nguồn, ví nhận và bút toán liên quan."
                : "Chọn dòng để xem tài khoản tăng/giảm, cách ghi Nợ/Có và có phát sinh chuyển tiền qua ví hay không."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_260px] xl:w-[600px]">
            <label className="relative">
              <span className="sr-only">Tìm trong danh sách</span>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm mã, yêu cầu, người dùng..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label>
              <span className="sr-only">Lọc theo nghiệp vụ</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as EventType | "ALL")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                {eventTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
            {view === "wallet" ? "Phạm vi ví: Dự án IFMS Mobile" : "Kỳ ghi sổ: 09/2026"}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
            Chỉ số phía trên tính theo kết quả lọc
          </span>
        </div>

        {view === "wallet" ? (
          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.8fr)]">
            <WalletTable items={visibleWalletTransactions} selectedId={selectedWallet?.id} onSelect={setSelectedWalletId} />
            {selectedWallet
              ? <WalletDetail transaction={selectedWallet} onOpenJournal={openJournal} />
              : <EmptyDetail message="Không có giao dịch phù hợp. Hãy xóa từ khóa hoặc chọn loại nghiệp vụ khác." />}
          </div>
        ) : (
          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.8fr)]">
            <JournalTable items={visibleJournals} selectedId={selectedJournal?.id} onSelect={setSelectedJournalId} />
            {selectedJournal
              ? <JournalDetail journal={selectedJournal} onOpenWallet={openWalletTransaction} />
              : <EmptyDetail message="Không có bút toán phù hợp. Hãy xóa từ khóa hoặc chọn loại nghiệp vụ khác." />}
          </div>
        )}
      </section>
      )}

      {view !== "advances" && <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-blue-900">
        <span className="font-semibold">Cách đọc:</span> giao dịch ví cho biết tiền đi giữa các ví. Sổ cái kế toán cho biết nghiệp vụ làm tăng hoặc giảm tài khoản nào.
        Hai phần có thể liên kết với nhau; quyết toán chứng từ và khấu trừ lương không nhất thiết tạo giao dịch ví.
      </div>}
    </div>
  );
}

function ViewTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={active
        ? "rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
        : "rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"}
    >
      {children}
    </button>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "green" | "rose";
}) {
  const toneClass = tone === "green" ? "text-emerald-700" : tone === "rose" ? "text-rose-700" : "text-blue-700";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={"mt-2 text-xl font-bold " + toneClass}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function AdvanceTracker({
  advances,
  onOpenJournal,
}: {
  advances: AdvanceSnapshot[];
  onOpenJournal: (id: string) => void;
}) {
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const employees = useMemo(() => {
    const grouped = new Map<string, { employeeId: string; employee: string; department: string; advances: AdvanceSnapshot[] }>();
    for (const advance of advances) {
      const employee = grouped.get(advance.employeeId) ?? {
        employeeId: advance.employeeId,
        employee: advance.employee,
        department: advance.department,
        advances: [],
      };
      employee.advances.push(advance);
      grouped.set(advance.employeeId, employee);
    }
    return [...grouped.values()].map((employee) => ({
      ...employee,
      disbursed: employee.advances.reduce((sum, item) => sum + item.originalAmount, 0),
      remaining: employee.advances.reduce((sum, item) => sum + item.remainingAmount, 0),
    })).sort((a, b) => b.remaining - a.remaining);
  }, [advances]);

  return (
    <section className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-amber-100 bg-amber-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Nhân viên còn tạm ứng phải quyết toán</h2>
          <p className="mt-1 text-sm text-slate-600">Mỗi dòng là một nhân viên. Mở chi tiết để xem các khoản tạm ứng còn dư và lịch sử xử lý.</p>
        </div>
        <span className="w-fit rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800">
          Dữ liệu minh họa · {employees.length} nhân viên
        </span>
      </div>

      {employees.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">Hiện không có nhân viên nào còn khoản tạm ứng phải quyết toán.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-white">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Nhân viên</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Khoản đang mở</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng đã giải ngân</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Còn phải quyết toán</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const expanded = expandedEmployeeId === employee.employeeId;
                return (
                  <Fragment key={employee.employeeId}>
                    <tr className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">{employee.employee}</p>
                        <p className="mt-1 text-xs text-slate-500">{employee.department}</p>
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-slate-700">{employee.advances.length}</td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-slate-800">{formatCurrency(employee.disbursed)}</td>
                      <td className="px-4 py-4 text-right text-sm font-bold text-amber-800">{formatCurrency(employee.remaining)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          aria-expanded={expanded}
                          onClick={() => setExpandedEmployeeId(expanded ? null : employee.employeeId)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          {expanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-t border-slate-100 bg-slate-50/60">
                        <td colSpan={5} className="p-5">
                          <div className="space-y-4">
                            {employee.advances.map((advance) => (
                              <AdvanceAccountDetail key={advance.code} advance={advance} onOpenJournal={onOpenJournal} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AdvanceAccountDetail({
  advance,
  onOpenJournal,
}: {
  advance: AdvanceSnapshot;
  onOpenJournal: (id: string) => void;
}) {
  const remaining = advance.remainingAmount;
  const journalLabels = ["Giải ngân", "Chứng từ", "Hoàn tiền", "Khấu trừ lương"];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm font-bold text-blue-700">{advance.code}</p>
          <p className="mt-1 text-xs text-slate-500">Dự án {advance.project} · Giải ngân ngày {advance.disbursedAt} · Cập nhật {advance.asOf}</p>
        </div>
        <p className="text-sm font-bold text-amber-800">Còn {formatCurrency(remaining)}</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SettlementMetric label="Đã giải ngân" amount={advance.originalAmount} tone="blue" />
        <SettlementMetric label="Chứng từ đã duyệt" amount={advance.proofSettledAmount} tone="violet" />
        <SettlementMetric label="Đã hoàn tiền thật" amount={advance.cashReturnedAmount} tone="green" />
        <SettlementMetric label="Đã khấu trừ lương" amount={advance.payrollOffsetAmount} tone="slate" />
        <SettlementMetric label="Còn phải quyết toán" amount={remaining} tone="amber" />
      </div>
      <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {formatCurrency(advance.originalAmount)} − {formatCurrency(advance.proofSettledAmount)} chứng từ − {formatCurrency(advance.cashReturnedAmount)} hoàn tiền − {formatCurrency(advance.payrollOffsetAmount)} khấu trừ lương = <span className="font-bold text-amber-800">{formatCurrency(remaining)} còn lại</span>.
      </p>
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-600">Lần theo các bút toán liên quan:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {advance.journalIds.map((id, index) => (
            <button
              key={id}
              type="button"
              onClick={() => onOpenJournal(id)}
              className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              {journalLabels[index] ?? "Nghiệp vụ"} · {id}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function SettlementMetric({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "blue" | "violet" | "green" | "slate" | "amber";
}) {
  const toneClass = {
    blue: "text-blue-700",
    violet: "text-violet-700",
    green: "text-emerald-700",
    slate: "text-slate-700",
    amber: "text-amber-800",
  }[tone];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] leading-4 text-slate-500">{label}</p>
      <p className={"mt-1 text-sm font-bold " + toneClass}>{formatCurrency(amount)}</p>
    </div>
  );
}

function WalletTable({
  items,
  selectedId,
  onSelect,
}: {
  items: WalletTransaction[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-blue-50/80">
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Giao dịch</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Nghiệp vụ · nguồn</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Số tiền</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelect(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(item.id);
                  }
                }}
                tabIndex={0}
                aria-selected={selectedId === item.id}
                className={"cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/60 " + (selectedId === item.id ? "bg-blue-50/70" : "bg-white")}
              >
                <td className="px-4 py-3.5">
                  <p className="font-mono text-xs font-semibold text-blue-700">{item.code}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.date}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={"inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold " + eventClass(item.type)}>{item.typeLabel}</span>
                  <p className="mt-2 max-w-[300px] truncate text-xs text-slate-600" title={item.source}>{item.source}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{item.legs[0]?.wallet} → {item.legs[1]?.wallet}</p>
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-900">{formatCurrency(item.amount)}</td>
                <td className="px-4 py-3.5 text-right">
                  <span className={"inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold " + statusClass(item.statusTone)}>{item.status}</span>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">Không có giao dịch phù hợp.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
        {items.length} giao dịch · Số tổng hợp tính theo các dòng đang hiển thị
      </div>
    </div>
  );
}

function WalletDetail({
  transaction,
  onOpenJournal,
}: {
  transaction: WalletTransaction;
  onOpenJournal: (id: string) => void;
}) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chi tiết giao dịch ví</p>
          <h3 className="mt-1 font-mono text-sm font-bold text-slate-900">{transaction.code}</h3>
        </div>
        <span className={"shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold " + statusClass(transaction.statusTone)}>{transaction.status}</span>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">{transaction.title}</p>
        <p className="mt-2 text-xs leading-5 text-slate-600">{transaction.summary}</p>
        <p className="mt-3 text-xs text-slate-500">Tham chiếu: <span className="font-medium text-slate-700">{transaction.source}</span></p>
      </div>

      {(transaction.proofStatus || transaction.paymentStatus) && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Chứng từ và hoàn chi</h4>
          {transaction.proofStatus && <InfoRow label="Chứng từ" value={transaction.proofStatus} tone="green" />}
          {transaction.paymentStatus && <InfoRow label="Thanh toán" value={transaction.paymentStatus} tone="blue" />}
        </div>
      )}

      {transaction.advanceSnapshot && <AdvanceReconciliation snapshot={transaction.advanceSnapshot} />}

      <div className="mt-5">
        <h4 className="text-sm font-bold text-slate-900">Tiền đã đi qua ví nào?</h4>
        <div className="mt-3 space-y-2">
          {transaction.legs.map((leg) => (
            <div key={leg.wallet} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-700">{leg.wallet}</span>
                <span className={"text-[11px] font-semibold " + (leg.movement === "Tiền vào" ? "text-emerald-700" : "text-rose-700")}>{leg.movement}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <span className={leg.movement === "Tiền vào" ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                  {leg.movement === "Tiền vào" ? "+" : "−"}{formatCurrency(leg.amount)}
                </span>
                <span className="text-right text-slate-500">
                  Số dư {formatCurrency(leg.balanceBefore)} → {formatCurrency(leg.balanceAfter)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-bold text-slate-900">Bút toán kế toán liên quan</h4>
        <p className="mt-1 text-xs leading-5 text-slate-500">Một giao dịch tiền có thể liên quan đến bước ghi nhận kế toán trước đó.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {transaction.linkedJournals.length > 0 ? transaction.linkedJournals.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onOpenJournal(id)}
              className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Xem {id}
            </button>
          )) : (
            <span className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-600">{transaction.journalNote}</span>
          )}
        </div>
      </div>
    </aside>
  );
}

function AdvanceReconciliation({ snapshot }: { snapshot: AdvanceSnapshot }) {
  const walletBalance = snapshot.openingWalletBalance + snapshot.originalAmount - snapshot.cashReturnedAmount;
  const remainingAdvance = snapshot.originalAmount
    - snapshot.proofSettledAmount
    - snapshot.cashReturnedAmount
    - snapshot.payrollOffsetAmount;

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Đối chiếu khoản tạm ứng {snapshot.code}</p>
        <p className="mt-1 text-xs text-amber-800">Nhân viên: {snapshot.employee} · tính đến {snapshot.asOf}</p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-200/80 bg-white/80 p-3">
          <p className="text-xs font-semibold text-slate-700">Số dư ví ghi nhận trong IFMS</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(walletBalance)}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-600">
            Đầu kỳ {formatCurrency(snapshot.openingWalletBalance)} + nhận tạm ứng {formatCurrency(snapshot.originalAmount)} − hoàn tiền thật {formatCurrency(snapshot.cashReturnedAmount)}.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200/80 bg-white/80 p-3">
          <p className="text-xs font-semibold text-slate-700">Tạm ứng còn phải quyết toán</p>
          <p className="mt-1 text-lg font-bold text-amber-900">{formatCurrency(remainingAdvance)}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-600">
            Đã ứng {formatCurrency(snapshot.originalAmount)} − chứng từ {formatCurrency(snapshot.proofSettledAmount)} − hoàn {formatCurrency(snapshot.cashReturnedAmount)} − khấu trừ lương {formatCurrency(snapshot.payrollOffsetAmount)}.
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-amber-900">
        Hai số này không nên đối chiếu trực tiếp: số dư ví = 2.920.000 đ đầu kỳ giả định + 3.000.000 đ nhận − 250.000 đ hoàn; khoản tạm ứng còn lại = 3.000.000 đ − 850.000 đ chứng từ − 250.000 đ hoàn − 500.000 đ khấu trừ lương. Theo luồng đã chốt, chứng từ và khấu trừ lương không tạo giao dịch ví. Nếu ví USER phải thể hiện đúng số tiền nhân viên còn nắm giữ, cần chốt thêm cách trừ khoản chi đã được chứng từ xác nhận trước khi code.
      </p>
    </div>
  );
}

function JournalTable({
  items,
  selectedId,
  onSelect,
}: {
  items: JournalEntry[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-blue-50/80">
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Bút toán · ngày ghi sổ</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Nghiệp vụ nguồn</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Số tiền</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Đối chiếu</th>
            </tr>
          </thead>
          <tbody>
            {items.map((entry) => (
              <tr
                key={entry.id}
                onClick={() => onSelect(entry.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(entry.id);
                  }
                }}
                tabIndex={0}
                aria-selected={selectedId === entry.id}
                className={"cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/60 " + (selectedId === entry.id ? "bg-blue-50/70" : "bg-white")}
              >
                <td className="px-4 py-3.5">
                  <p className="font-mono text-xs font-semibold text-blue-700">{entry.id}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{entry.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{entry.date} · kỳ 09/2026</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={"inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold " + eventClass(entry.type)}>{eventLabel(entry.type)}</span>
                  <p className="mt-2 max-w-[300px] truncate text-xs text-slate-600" title={entry.source}>{entry.source}</p>
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-900">{formatCurrency(entry.amount)}</td>
                <td className="px-4 py-3.5 text-right">
                  <BalanceBadge balanced={isEntryBalanced(entry)} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">Không có bút toán phù hợp.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
        {items.length} bút toán · Tổng Nợ/Có ở phía trên chỉ tính các dòng đang hiển thị
      </div>
    </div>
  );
}

function JournalDetail({
  journal,
  onOpenWallet,
}: {
  journal: JournalEntry;
  onOpenWallet: (id: string) => void;
}) {
  const totals = entryTotals(journal);
  const balanced = totals.Nợ === totals.Có;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chi tiết bút toán</p>
          <h3 className="mt-1 font-mono text-sm font-bold text-slate-900">{journal.id}</h3>
        </div>
        <BalanceBadge balanced={balanced} />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">{journal.title}</p>
        <p className="mt-2 text-xs leading-5 text-slate-600">{journal.summary}</p>
        <p className="mt-3 text-xs text-slate-500">Nghiệp vụ nguồn: <span className="font-medium text-slate-700">{journal.source}</span></p>
        <p className="mt-1 text-xs text-slate-500">Ngày ghi sổ: <span className="font-medium text-slate-700">{journal.date} · kỳ 09/2026</span></p>
      </div>

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
        <p className="text-xs font-semibold text-blue-800">Tiền có chuyển qua ví ở bước này không?</p>
        {journal.walletTransactionId ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-700">Có · gắn với giao dịch tiền thực tế.</span>
            <button
              type="button"
              onClick={() => onOpenWallet(journal.walletTransactionId!)}
              className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 font-mono text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
            >
              Xem giao dịch ví
            </button>
          </div>
        ) : (
          <p className="mt-1 text-xs leading-5 text-slate-600">Không. Đây là bước ghi nhận chứng từ hoặc bù trừ kế toán.</p>
        )}
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-bold text-slate-900">Tài khoản bị tác động</h4>
        <p className="mt-1 text-xs text-slate-500">Nợ/Có là cách ghi sổ; diễn giải cho biết tài khoản tăng hay giảm.</p>
        <div className="mt-3 space-y-2">
          {journal.lines.map((line) => (
            <div key={line.account} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-semibold text-slate-800">{line.account}</span>
                <span className="shrink-0 text-xs font-bold text-slate-900">{formatCurrency(line.amount)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">{line.effect} · ghi bên <span className="font-semibold text-blue-700">{line.side}</span></p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Tổng bên Nợ</span>
            <span className="font-semibold text-slate-900">{formatCurrency(totals.Nợ)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-slate-600">Tổng bên Có</span>
            <span className="font-semibold text-slate-900">{formatCurrency(totals.Có)}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-[11px] leading-5 text-amber-900">
        Tên tài khoản chỉ mang tính minh họa. Danh mục tài khoản và cách đối ứng cần được chốt theo mô hình quản lý tiền của IFMS.
      </p>
    </aside>
  );
}

function BalanceBadge({ balanced }: { balanced: boolean }) {
  return (
    <span className={"inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold " + (balanced
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700")}>
      {balanced ? "Cân bằng" : "Cần kiểm tra"}
    </span>
  );
}

function InfoRow({ label, value, tone }: { label: string; value: string; tone: "green" | "blue" }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={"text-right text-xs font-semibold " + (tone === "green" ? "text-emerald-700" : "text-blue-700")}>{value}</span>
    </div>
  );
}

function EmptyDetail({ message }: { message: string }) {
  return (
    <aside className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      {message}
    </aside>
  );
}
