"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { PaginatedResponse, PayslipListItem, PayslipStatus } from "@/types";

interface PayrollFilters {
  year?: number;
  month?: number;
  status?: PayslipStatus;
}

const PAGE_LIMIT = 8;

// TODO: Replace with real API call when Sprint 7 is complete
const MOCK_PAYSLIPS: PayslipListItem[] = [
  {
    id: 101,
    payslipCode: "PS-2026-01-EMP017",
    periodId: 5001,
    periodName: "Tháng 1/2026",
    month: 1,
    year: 2026,
    status: PayslipStatus.PAID,
    finalNetSalary: 11_800_000,
  },
  {
    id: 102,
    payslipCode: "PS-2026-02-EMP017",
    periodId: 5002,
    periodName: "Tháng 2/2026",
    month: 2,
    year: 2026,
    status: PayslipStatus.PAID,
    finalNetSalary: 12_000_000,
  },
  {
    id: 103,
    payslipCode: "PS-2026-03-EMP017",
    periodId: 5003,
    periodName: "Tháng 3/2026",
    month: 3,
    year: 2026,
    status: PayslipStatus.PAID,
    finalNetSalary: 12_500_000,
  },
  {
    id: 104,
    payslipCode: "PS-2026-04-EMP017",
    periodId: 5004,
    periodName: "Tháng 4/2026",
    month: 4,
    year: 2026,
    status: PayslipStatus.DRAFT,
    finalNetSalary: 12_700_000,
  },
  {
    id: 105,
    payslipCode: "PS-2026-05-EMP017",
    periodId: 5005,
    periodName: "Tháng 5/2026",
    month: 5,
    year: 2026,
    status: PayslipStatus.DRAFT,
    finalNetSalary: 12_900_000,
  },
  {
    id: 106,
    payslipCode: "PS-2026-06-EMP017",
    periodId: 5006,
    periodName: "Tháng 6/2026",
    month: 6,
    year: 2026,
    status: PayslipStatus.PAID,
    finalNetSalary: 13_100_000,
  },
];

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getStatusClass(status: PayslipStatus): string {
  if (status === PayslipStatus.PAID) {
    return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
  }
  return "bg-amber-500/15 border-amber-500/30 text-amber-300";
}

function getStatusLabel(status: PayslipStatus): string {
  return status === PayslipStatus.PAID ? "Đã chi" : "Nháp";
}

function getPayDate(item: PayslipListItem): string {
  if (item.status !== PayslipStatus.PAID) return "—";
  return formatDate(new Date(item.year, item.month - 1, 28));
}

function getGrossSalary(item: PayslipListItem): number {
  return Math.round(item.finalNetSalary * 1.15);
}

function parseStatus(value: string | null): PayslipStatus | undefined {
  if (!value) return undefined;
  if (value === PayslipStatus.DRAFT || value === PayslipStatus.PAID) {
    return value;
  }
  return undefined;
}

function buildInitialState(searchParams: ReadonlyURLSearchParams): {
  filters: PayrollFilters;
  page: number;
} {
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const yearRaw = Number(searchParams.get("year") ?? "");
  const monthRaw = Number(searchParams.get("month") ?? "");

  return {
    filters: {
      year: Number.isFinite(yearRaw) && yearRaw > 0 ? yearRaw : undefined,
      month: Number.isFinite(monthRaw) && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : undefined,
      status: parseStatus(searchParams.get("status")),
    },
    page,
  };
}

function filterMock(source: PayslipListItem[], filters: PayrollFilters): PayslipListItem[] {
  return source.filter((item) => {
    if (filters.year && item.year !== filters.year) return false;
    if (filters.month && item.month !== filters.month) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  });
}

export default function PayrollPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial = useMemo(() => buildInitialState(searchParams), [searchParams]);

  const [payslips, setPayslips] = useState<PayslipListItem[]>([]);
  const [summaryItems, setSummaryItems] = useState<PayslipListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<PayrollFilters>(initial.filters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = buildInitialState(searchParams);
    setFilters(next.filters);
    setPage(next.page);
  }, [searchParams]);

  const syncUrl = useCallback(
    (nextFilters: PayrollFilters, nextPage: number) => {
      const params = new URLSearchParams();
      if (nextFilters.year) params.set("year", String(nextFilters.year));
      if (nextFilters.month) params.set("month", String(nextFilters.month));
      if (nextFilters.status) params.set("status", nextFilters.status);
      if (nextPage > 1) params.set("page", String(nextPage));

      const query = params.toString();
      router.replace(query ? `/payroll?${query}` : "/payroll");
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;

    const loadPayslips = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (filters.year) query.set("year", String(filters.year));
        if (filters.month) query.set("month", String(filters.month));
        if (filters.status) query.set("status", filters.status);
        query.set("page", String(page));
        query.set("limit", String(PAGE_LIMIT));

        const summaryQuery = new URLSearchParams();
        if (filters.year) summaryQuery.set("year", String(filters.year));
        if (filters.month) summaryQuery.set("month", String(filters.month));
        if (filters.status) summaryQuery.set("status", filters.status);
        summaryQuery.set("page", "1");
        summaryQuery.set("limit", "200");

        // const res = await api.get<PaginatedResponse<PayslipListItem>>('/api/v1/payslips', { params: filters })
        const [res, summaryRes] = await Promise.all([
          api.get<PaginatedResponse<PayslipListItem>>(`/api/v1/payslips?${query.toString()}`),
          api.get<PaginatedResponse<PayslipListItem>>(`/api/v1/payslips?${summaryQuery.toString()}`),
        ]);

        if (cancelled) return;

        setPayslips(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setSummaryItems(summaryRes.data.items);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMock(MOCK_PAYSLIPS, filters);
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_LIMIT));
        const currentPage = Math.min(page, mockTotalPages);
        const start = (currentPage - 1) * PAGE_LIMIT;

        setPayslips(filtered.slice(start, start + PAGE_LIMIT));
        setSummaryItems(filtered);
        setTotal(mockTotal);
        setTotalPages(mockTotalPages);

        if (currentPage !== page) {
          setPage(currentPage);
          syncUrl(filters, currentPage);
        }

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải API phiếu lương, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPayslips();

    return () => {
      cancelled = true;
    };
  }, [filters, page, syncUrl]);

  const handleFilterChange = (key: keyof PayrollFilters, value: string) => {
    let parsed: number | PayslipStatus | undefined;

    if (!value) {
      parsed = undefined;
    } else if (key === "status") {
      parsed = value as PayslipStatus;
    } else {
      const num = Number(value);
      parsed = Number.isFinite(num) ? num : undefined;
    }

    const nextFilters: PayrollFilters = {
      ...filters,
      [key]: parsed,
    };

    setFilters(nextFilters);
    setPage(1);
    syncUrl(nextFilters, 1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    syncUrl(filters, nextPage);
  };

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const totalEarned = summaryItems
    .filter((item) => item.status === PayslipStatus.PAID)
    .reduce((sum, item) => sum + item.finalNetSalary, 0);

  const currentMonthAmount = summaryItems
    .filter((item) => item.year === currentYear && item.month === currentMonth)
    .reduce((sum, item) => sum + item.finalNetSalary, 0);

  const yearOptions = useMemo(() => {
    const years = new Set<number>([currentYear, ...MOCK_PAYSLIPS.map((item) => item.year)]);
    summaryItems.forEach((item) => years.add(item.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [currentYear, summaryItems]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Phiếu lương</h1>
        <p className="text-slate-400 mt-1">Danh sách phiếu lương cá nhân theo từng kỳ.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-5">
          <p className="text-sm text-slate-400">Tổng đã nhận (PAID)</p>
          <p className="text-3xl font-bold text-emerald-300 mt-2">{formatVnd(totalEarned)}</p>
        </div>

        <div className="bg-slate-800 border border-white/10 rounded-2xl p-5">
          <p className="text-sm text-slate-400">Số tiền tháng hiện tại</p>
          <p className="text-3xl font-bold text-white mt-2">{formatVnd(currentMonthAmount)}</p>
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={filters.year ?? ""}
            onChange={(e) => handleFilterChange("year", e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Tất cả năm</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={filters.month ?? ""}
            onChange={(e) => handleFilterChange("month", e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Tất cả tháng</option>
            {Array.from({ length: 12 }).map((_, idx) => (
              <option key={idx + 1} value={idx + 1}>
                Tháng {idx + 1}
              </option>
            ))}
          </select>

          <select
            value={filters.status ?? ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Tất cả trạng thái</option>
            <option value={PayslipStatus.DRAFT}>DRAFT</option>
            <option value={PayslipStatus.PAID}>PAID</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Kỳ lương</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Salary</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Salary</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Ngày chi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang tải phiếu lương...
                    </span>
                  </td>
                </tr>
              ) : payslips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Không có phiếu lương phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                payslips.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/payroll/${item.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-medium">{item.periodName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.payslipCode}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-200 font-medium">
                      {formatVnd(getGrossSalary(item))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white font-semibold">
                      {formatVnd(item.finalNetSalary)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getStatusClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{getPayDate(item)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-white/10 bg-slate-900/30">
          <p className="text-sm text-slate-400">
            Tổng {total} phiếu lương • Trang {page}/{totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-amber-400 text-sm">{error}</p>}
    </div>
  );
}
