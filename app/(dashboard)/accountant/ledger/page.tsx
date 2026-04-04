"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import {
  LedgerSummaryResponse,
  PaginatedResponse,
  ReferenceType,
  TransactionFilterParams,
  TransactionResponse,
  TransactionStatus,
  TransactionType,
} from "@/types";

interface LedgerTransactionView extends TransactionResponse {
  referenceCode?: string | null;
}

const PAGE_LIMIT = 20;

const MOCK_SUMMARY: LedgerSummaryResponse = {
  currentBalance: 1_248_500_000,
  totalInflow: 2_500_000_000,
  totalOutflow: 1_251_500_000,
  transactionCount: 6,
};

// TODO: Replace when Sprint 7 is complete
const MOCK_TRANSACTIONS: LedgerTransactionView[] = [
  {
    id: 1,
    transactionCode: "TXN-2026-0001A",
    type: TransactionType.REQUEST_PAYMENT,
    status: TransactionStatus.SUCCESS,
    amount: -3_500_000,
    balanceAfter: 1_246_500_000,
    referenceId: 1,
    referenceType: ReferenceType.REQUEST,
    referenceCode: "REQ-2026-0041",
    description: "Giai ngan tam ung - Do Quoc Bao",
    createdAt: "2026-04-03T11:00:00",
  },
  {
    id: 2,
    transactionCode: "TXN-2026-0002B",
    type: TransactionType.PAYSLIP_PAYMENT,
    status: TransactionStatus.SUCCESS,
    amount: -13_500_000,
    balanceAfter: 1_233_000_000,
    referenceId: 101,
    referenceType: ReferenceType.PAYSLIP,
    referenceCode: "PS-2026-03-001",
    description: "Chi luong T03/2026 - Do Quoc Bao",
    createdAt: "2026-04-02T17:05:00",
  },
  {
    id: 3,
    transactionCode: "TXN-2026-0003C",
    type: TransactionType.DEPOSIT,
    status: TransactionStatus.SUCCESS,
    amount: 500_000_000,
    balanceAfter: 1_500_000_000,
    referenceId: null,
    referenceType: ReferenceType.SYSTEM,
    referenceCode: null,
    description: "Nap tien vao Quy he thong",
    createdAt: "2026-04-01T09:00:00",
  },
  {
    id: 4,
    transactionCode: "TXN-2026-0004D",
    type: TransactionType.DEPT_QUOTA_ALLOCATION,
    status: TransactionStatus.SUCCESS,
    amount: -200_000_000,
    balanceAfter: 1_300_000_000,
    referenceId: 20,
    referenceType: ReferenceType.DEPARTMENT,
    referenceCode: "DEPT-Q2-2026",
    description: "Cap quota Phong IT Q2/2026",
    createdAt: "2026-04-01T10:30:00",
  },
  {
    id: 5,
    transactionCode: "TXN-2026-0005E",
    type: TransactionType.PROJECT_QUOTA_ALLOCATION,
    status: TransactionStatus.SUCCESS,
    amount: -50_000_000,
    balanceAfter: 1_250_000_000,
    referenceId: 10,
    referenceType: ReferenceType.PROJECT,
    referenceCode: "PRJ-IT-001",
    description: "Cap von DA PRJ-IT-001 Phase 2",
    createdAt: "2026-04-01T10:35:00",
  },
  {
    id: 6,
    transactionCode: "TXN-2026-0006F",
    type: TransactionType.WITHDRAW,
    status: TransactionStatus.SUCCESS,
    amount: -2_000_000,
    balanceAfter: 1_248_000_000,
    referenceId: null,
    referenceType: null,
    referenceCode: null,
    description: "Rut tien vi nhan vien",
    createdAt: "2026-03-30T14:00:00",
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function parsePage(value: string | null): number {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseType(value: string | null): TransactionType | undefined {
  if (!value) return undefined;

  const values = Object.values(TransactionType);
  return values.includes(value as TransactionType) ? (value as TransactionType) : undefined;
}

function pickItems<T>(payload: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

function getTypeClass(type: TransactionType): string {
  switch (type) {
    case TransactionType.REQUEST_PAYMENT:
      return "bg-violet-500/15 border-violet-500/30 text-violet-300";
    case TransactionType.PAYSLIP_PAYMENT:
      return "bg-blue-500/15 border-blue-500/30 text-blue-300";
    case TransactionType.DEPOSIT:
      return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    case TransactionType.WITHDRAW:
      return "bg-rose-500/15 border-rose-500/30 text-rose-300";
    case TransactionType.DEPT_QUOTA_ALLOCATION:
      return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    case TransactionType.PROJECT_QUOTA_ALLOCATION:
      return "bg-orange-500/15 border-orange-500/30 text-orange-300";
    default:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
  }
}

function filterMock(
  source: LedgerTransactionView[],
  type?: TransactionType,
  startDate?: string,
  endDate?: string,
  search?: string
): LedgerTransactionView[] {
  const q = search?.trim().toLowerCase() ?? "";
  const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : null;
  const end = endDate ? new Date(`${endDate}T23:59:59`).getTime() : null;

  return source.filter((item) => {
    if (type && item.type !== type) return false;

    const created = new Date(item.createdAt).getTime();
    if (start && created < start) return false;
    if (end && created > end) return false;

    if (!q) return true;

    const haystack = [
      item.transactionCode,
      item.type,
      item.description ?? "",
      item.referenceCode ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export default function AccountantLedgerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();
  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);
  const type = useMemo(() => parseType(searchParams.get("type")), [searchParams]);
  const startDate = useMemo(() => searchParams.get("startDate") ?? "", [searchParams]);
  const endDate = useMemo(() => searchParams.get("endDate") ?? "", [searchParams]);
  const search = useMemo(() => searchParams.get("search") ?? "", [searchParams]);

  const [summary, setSummary] = useState<LedgerSummaryResponse | null>(null);
  const [items, setItems] = useState<LedgerTransactionView[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const pushWithParams = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router]
  );

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParamsString);
      if (value && value.trim()) {
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }

      if (key !== "page") params.delete("page");
      pushWithParams(params);
    },
    [pushWithParams, searchParamsString]
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParamsString);
      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));
      pushWithParams(params);
    },
    [pushWithParams, searchParamsString]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed === search) return;
      updateParam("search", trimmed || undefined);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput, search, updateParam]);

  useEffect(() => {
    let cancelled = false;

    const loadLedger = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters: TransactionFilterParams = {
          type,
          page,
          limit: PAGE_LIMIT,
          search: search.trim() || undefined,
          from: startDate || undefined,
          to: endDate || undefined,
        };

        const query = new URLSearchParams();
        if (filters.type) query.set("type", filters.type);
        if (filters.search) query.set("search", filters.search);
        if (startDate) query.set("startDate", startDate);
        if (endDate) query.set("endDate", endDate);
        query.set("page", String(filters.page ?? 1));
        query.set("limit", String(filters.limit ?? PAGE_LIMIT));

        const [summaryRes, listRes] = await Promise.all([
          api.get<LedgerSummaryResponse>("/api/v1/accountant/ledger/summary"),
          api.get<PaginatedResponse<TransactionResponse> | TransactionResponse[]>(
            `/api/v1/accountant/ledger?${query.toString()}`
          ),
        ]);

        if (cancelled) return;

        const listItems = pickItems(listRes.data).map((item) => ({ ...item }));
        const apiTotal = Array.isArray(listRes.data) ? listItems.length : listRes.data.total;
        const apiTotalPages = Array.isArray(listRes.data)
          ? Math.max(1, Math.ceil(apiTotal / PAGE_LIMIT))
          : listRes.data.totalPages;

        setSummary(summaryRes.data);
        setItems(listItems);
        setTotal(apiTotal);
        setTotalPages(apiTotalPages);
      } catch {
        if (cancelled) return;

        const filtered = filterMock(MOCK_TRANSACTIONS, type, startDate, endDate, search);
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_LIMIT));
        const safePage = Math.min(page, mockTotalPages);
        const start = (safePage - 1) * PAGE_LIMIT;

        setSummary(MOCK_SUMMARY);
        setItems(filtered.slice(start, start + PAGE_LIMIT));
        setTotal(mockTotal);
        setTotalPages(mockTotalPages);

        if (safePage !== page) {
          goToPage(safePage);
        }

        setError("Khong the tai du lieu API, dang hien thi du lieu mau.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadLedger();

    return () => {
      cancelled = true;
    };
  }, [endDate, goToPage, page, search, startDate, type]);

  const handleExportCsv = () => {
    const csvRows = [
      ["transactionCode", "type", "amount", "description", "reference", "createdAt"],
      ...items.map((item) => [
        item.transactionCode,
        item.type,
        String(item.amount),
        item.description ?? "",
        item.referenceCode ?? (item.referenceId ? `${item.referenceType}#${item.referenceId}` : ""),
        item.createdAt,
      ]),
    ];

    const csv = csvRows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    console.log(csv);
  };

  const typeOptions = [
    TransactionType.REQUEST_PAYMENT,
    TransactionType.PAYSLIP_PAYMENT,
    TransactionType.DEPOSIT,
    TransactionType.WITHDRAW,
    TransactionType.DEPT_QUOTA_ALLOCATION,
    TransactionType.PROJECT_QUOTA_ALLOCATION,
    TransactionType.SYSTEM_ADJUSTMENT,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">So cai</h1>
          <p className="text-slate-400 mt-1">Tat ca giao dich he thong theo nguyen tac double-entry immutable.</p>
        </div>
        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-slate-500/40 bg-slate-500/15 text-slate-300 text-sm font-medium">
          Immutable - Chi doc
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Tong nap vao" value={formatCurrency(summary?.totalInflow ?? 0)} tone="text-emerald-300" />
        <SummaryCard label="Tong chi ra" value={formatCurrency(summary?.totalOutflow ?? 0)} tone="text-rose-300" />
        <SummaryCard label="So du rong" value={formatCurrency(summary?.currentBalance ?? 0)} tone="text-white" />
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <select
            value={type ?? ""}
            onChange={(event) => updateParam("type", event.target.value || undefined)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm"
          >
            <option value="">Tat ca loai</option>
            {typeOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(event) => updateParam("startDate", event.target.value || undefined)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm"
          />

          <input
            type="date"
            value={endDate}
            onChange={(event) => updateParam("endDate", event.target.value || undefined)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm"
          />

          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Tim giao dich..."
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm"
          />

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm"
          >
            Xuat CSV
          </button>
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-slate-900/70 border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Ma GD</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Loai</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Mo ta</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">So tien</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Tham chieu</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Thoi gian</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">Dang tai du lieu so cai...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">Khong co giao dich phu hop bo loc.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/accountant/ledger/${item.id}`)}
                  >
                    <td className="px-4 py-3 text-sm text-slate-200 font-mono">{item.transactionCode}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getTypeClass(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">{item.description ?? "-"}</td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold ${item.amount >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-blue-300">
                      {item.referenceCode ?? (item.referenceId ? `${item.referenceType}#${item.referenceId}` : "Giao dich truc tiep")}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-white/10 bg-slate-900/30">
          <p className="text-sm text-slate-400">
            Trang {page}/{totalPages} • Tong {total} giao dich
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
            >
              Truoc
            </button>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="bg-slate-800 border border-white/10 rounded-2xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
    </div>
  );
}
