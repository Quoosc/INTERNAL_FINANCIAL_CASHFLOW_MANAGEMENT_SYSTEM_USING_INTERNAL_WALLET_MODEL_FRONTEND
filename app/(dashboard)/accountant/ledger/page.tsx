"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  AccountantLedgerFilterParams,
  AccountantLedgerItemResponse,
  LedgerSummaryResponse,
  PaginatedResponse,
  ReferenceType,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  WalletOwnerType,
} from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";

const PAGE_LIMIT = 20;

// ─── MOCK fallback (dùng khi API lỗi) ──────────────────────────────────────
const MOCK_SUMMARY: LedgerSummaryResponse = {
  currentBalance: 1_248_500_000,
  totalInflow: 2_500_000_000,
  totalOutflow: 1_251_500_000,
  transactionCount: 6,
};

const MOCK_ITEMS: AccountantLedgerItemResponse[] = [
  { id: 1, transactionCode: "TXN-2026-0001A", type: TransactionType.REQUEST_PAYMENT,      status: TransactionStatus.SUCCESS, direction: TransactionDirection.DEBIT,  amount: 3_500_000,   balanceAfter: 1_248_500_000, walletOwnerType: WalletOwnerType.COMPANY_FUND, ownerId: 1, timestamp: "2026-04-03T11:00:00" },
  { id: 2, transactionCode: "TXN-2026-0002B", type: TransactionType.PAYSLIP_PAYMENT,      status: TransactionStatus.SUCCESS, direction: TransactionDirection.DEBIT,  amount: 13_500_000,  balanceAfter: 1_252_000_000, walletOwnerType: WalletOwnerType.COMPANY_FUND, ownerId: 1, timestamp: "2026-04-02T17:05:00" },
  { id: 3, transactionCode: "TXN-2026-0003C", type: TransactionType.SYSTEM_TOPUP,         status: TransactionStatus.SUCCESS, direction: TransactionDirection.CREDIT, amount: 500_000_000, balanceAfter: 1_265_500_000, walletOwnerType: WalletOwnerType.COMPANY_FUND, ownerId: 1, timestamp: "2026-04-01T09:00:00" },
  { id: 4, transactionCode: "TXN-2026-0004D", type: TransactionType.DEPT_QUOTA_ALLOCATION, status: TransactionStatus.SUCCESS, direction: TransactionDirection.DEBIT, amount: 200_000_000, balanceAfter: 765_500_000,  walletOwnerType: WalletOwnerType.DEPARTMENT,   ownerId: 2, timestamp: "2026-04-01T10:30:00" },
  { id: 5, transactionCode: "TXN-2026-0005E", type: TransactionType.PROJECT_QUOTA_ALLOCATION, status: TransactionStatus.SUCCESS, direction: TransactionDirection.DEBIT, amount: 50_000_000, balanceAfter: 565_500_000, walletOwnerType: WalletOwnerType.PROJECT, ownerId: 10, timestamp: "2026-04-01T10:35:00" },
  { id: 6, transactionCode: "TXN-2026-0006F", type: TransactionType.WITHDRAW,             status: TransactionStatus.SUCCESS, direction: TransactionDirection.DEBIT,  amount: 2_000_000,   balanceAfter: 515_500_000,  walletOwnerType: WalletOwnerType.USER,         ownerId: 11, timestamp: "2026-03-30T14:00:00" },
];
// ────────────────────────────────────────────────────────────────────────────

function parsePage(value: string | null): number {
  const p = Number(value ?? "1");
  return Number.isFinite(p) && p > 0 ? p : 1;
}

function parseEnum<T extends string>(value: string | null, values: T[]): T | undefined {
  if (!value) return undefined;
  return values.includes(value as T) ? (value as T) : undefined;
}

function pickPaginated<T>(payload: PaginatedResponse<T> | T[]): { items: T[]; total: number; totalPages: number } {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length, totalPages: Math.max(1, Math.ceil(payload.length / PAGE_LIMIT)) };
  }
  return { items: payload.items, total: payload.total, totalPages: Math.max(1, payload.totalPages) };
}

function getTypeLabel(type: TransactionType): string {
  const labels: Record<string, string> = {
    REQUEST_PAYMENT:        "Giải ngân",
    PAYSLIP_PAYMENT:        "Chi lương",
    SYSTEM_TOPUP:           "Nạp quỹ",
    DEPOSIT:                "Nạp ví",
    WITHDRAW:               "Rút tiền",
    DEPT_QUOTA_ALLOCATION:  "Cấp quota phòng ban",
    PROJECT_QUOTA_ALLOCATION: "Cấp quota dự án",
    ADVANCE_RETURN:         "Hoàn tạm ứng",
    REVERSAL:               "Hoàn đảo",
    SYSTEM_ADJUSTMENT:      "Điều chỉnh",
  };
  return labels[type] ?? type;
}

function getTypeClass(type: TransactionType): string {
  switch (type) {
    case TransactionType.REQUEST_PAYMENT:         return "bg-violet-100 border-violet-200 text-violet-700";
    case TransactionType.PAYSLIP_PAYMENT:         return "bg-blue-50 border-blue-200 text-blue-700";
    case TransactionType.SYSTEM_TOPUP:            return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case TransactionType.DEPOSIT:                 return "bg-teal-100 border-teal-200 text-teal-700";
    case TransactionType.WITHDRAW:                return "bg-rose-100 border-rose-200 text-rose-700";
    case TransactionType.DEPT_QUOTA_ALLOCATION:   return "bg-amber-100 border-amber-200 text-amber-700";
    case TransactionType.PROJECT_QUOTA_ALLOCATION: return "bg-orange-100 border-orange-200 text-orange-700";
    default: return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function getDirectionClass(direction: TransactionDirection): string {
  return direction === TransactionDirection.CREDIT
    ? "bg-emerald-100 border-emerald-200 text-emerald-700"
    : "bg-rose-100 border-rose-200 text-rose-700";
}

export default function AccountantLedgerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();

  const page = useMemo(() => parsePage(searchParams.get("page")), [searchParams]);
  const type = useMemo(
    () => parseEnum(searchParams.get("type"), Object.values(TransactionType)),
    [searchParams]
  );
  const txStatus = useMemo(
    () => parseEnum(searchParams.get("status"), Object.values(TransactionStatus)),
    [searchParams]
  );
  const refType = useMemo(
    () => parseEnum(searchParams.get("referenceType"), Object.values(ReferenceType)),
    [searchParams]
  );
  const from = useMemo(() => searchParams.get("from") ?? "", [searchParams]);
  const to   = useMemo(() => searchParams.get("to")   ?? "", [searchParams]);

  const [summary, setSummary] = useState<LedgerSummaryResponse | null>(null);
  const [items, setItems]     = useState<AccountantLedgerItemResponse[]>([]);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

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
      if (value && value.trim()) params.set(key, value.trim());
      else params.delete(key);
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
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters: AccountantLedgerFilterParams = {
          type,
          status: txStatus,
          referenceType: refType,
          from: from || undefined,
          to: to || undefined,
          page,
          limit: PAGE_LIMIT,
        };

        const q = new URLSearchParams();
        if (filters.type)          q.set("type", filters.type);
        if (filters.status)        q.set("status", filters.status);
        if (filters.referenceType) q.set("referenceType", filters.referenceType);
        if (filters.from)          q.set("from", filters.from);
        if (filters.to)            q.set("to", filters.to);
        q.set("page",  String(page));
        q.set("limit", String(PAGE_LIMIT));

        const summaryQ = new URLSearchParams();
        if (filters.from) summaryQ.set("from", filters.from);
        if (filters.to)   summaryQ.set("to",   filters.to);

        const [summaryRes, listRes] = await Promise.all([
          api.get<LedgerSummaryResponse>(`/api/v1/accountant/ledger/summary?${summaryQ.toString()}`),
          api.get<PaginatedResponse<AccountantLedgerItemResponse> | AccountantLedgerItemResponse[]>(
            `/api/v1/accountant/ledger?${q.toString()}`
          ),
        ]);

        if (cancelled) return;

        const { items: pageItems, total: apiTotal, totalPages: apiTotalPages } = pickPaginated(listRes.data);
        setSummary(summaryRes.data);
        setItems(pageItems);
        setTotal(apiTotal);
        setTotalPages(apiTotalPages);

        const safePage = Math.min(page, Math.max(1, apiTotalPages));
        if (safePage !== page) goToPage(safePage);
      } catch (err) {
        if (cancelled) return;

        // Defensive fallback: hiển thị mock khi API lỗi
        const filtered = MOCK_ITEMS.filter((item) => {
          if (type && item.type !== type) return false;
          if (txStatus && item.status !== txStatus) return false;
          if (from && item.timestamp < `${from}T00:00:00`) return false;
          if (to   && item.timestamp > `${to}T23:59:59`)   return false;
          return true;
        });
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_LIMIT));
        const safePage = Math.min(page, mockTotalPages);
        const start = (safePage - 1) * PAGE_LIMIT;

        setSummary(MOCK_SUMMARY);
        setItems(filtered.slice(start, start + PAGE_LIMIT));
        setTotal(mockTotal);
        setTotalPages(mockTotalPages);
        if (safePage !== page) goToPage(safePage);

        setError(err instanceof ApiError ? err.apiMessage : "Không thể tải dữ liệu sổ cái, đang hiển thị dữ liệu mẫu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [from, goToPage, page, refType, to, txStatus, type]);

  const typeOptions = Object.values(TransactionType);
  const statusOptions = Object.values(TransactionStatus);
  const refTypeOptions = Object.values(ReferenceType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sổ cái</h1>
          <p className="text-slate-500 mt-1">Tất cả giao dịch hệ thống — immutable, chỉ đọc.</p>
        </div>
        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-slate-300 bg-slate-100 text-slate-600 text-sm font-medium">
          Immutable · Chỉ đọc
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Số dư quỹ"       value={formatCurrency(summary?.currentBalance ?? 0)} tone="text-slate-900" />
        <SummaryCard label="Tổng nạp vào"    value={formatCurrency(summary?.totalInflow ?? 0)}    tone="text-emerald-700" />
        <SummaryCard label="Tổng chi ra"     value={formatCurrency(summary?.totalOutflow ?? 0)}   tone="text-rose-700" />
        <SummaryCard label="Số giao dịch"    value={String(summary?.transactionCount ?? 0)}       tone="text-blue-700" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <select
            value={type ?? ""}
            onChange={(e) => updateParam("type", e.target.value || undefined)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Tất cả loại</option>
            {typeOptions.map((v) => (
              <option key={v} value={v}>{getTypeLabel(v)}</option>
            ))}
          </select>

          <select
            value={txStatus ?? ""}
            onChange={(e) => updateParam("status", e.target.value || undefined)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <select
            value={refType ?? ""}
            onChange={(e) => updateParam("referenceType", e.target.value || undefined)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Tất cả nguồn</option>
            {refTypeOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => updateParam("from", e.target.value || undefined)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />

          <input
            type="date"
            value={to}
            onChange={(e) => updateParam("to", e.target.value || undefined)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-white/70 border-b border-slate-200">
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã GD</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Loại</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Chiều</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Số tiền</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Số dư sau</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Ví chủ thể</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Đang tải dữ liệu sổ cái...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Không có giao dịch phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/accountant/ledger/${item.id}`)}
                  >
                    <td className="px-4 py-3 text-sm text-slate-900 font-mono">{item.transactionCode}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getTypeClass(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getDirectionClass(item.direction)}`}>
                        {item.direction === TransactionDirection.CREDIT ? "Vào" : "Ra"}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold ${item.direction === TransactionDirection.CREDIT ? "text-emerald-700" : "text-rose-700"}`}>
                      {item.direction === TransactionDirection.CREDIT ? "+" : "-"}{formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-900">{formatCurrency(item.balanceAfter)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.walletOwnerType} #{item.ownerId}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(item.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-slate-200 bg-white/30">
          <p className="text-sm text-slate-500">
            Trang {page}/{totalPages} · Tổng {total} giao dịch
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
    </div>
  );
}
