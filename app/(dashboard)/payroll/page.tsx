"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { PaginatedResponse, PayslipListItem, PayslipStatus } from "@/types";

interface PayrollFilters {
  year?: number;
  status?: PayslipStatus;
}

const PAGE_LIMIT = 12;

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
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  }
  return "bg-amber-50 border-amber-200 text-amber-700";
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

function buildInitialState(searchParams: { get: (key: string) => string | null }): {
  filters: PayrollFilters;
  page: number;
} {
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const yearRaw = Number(searchParams.get("year") ?? "");

  return {
    filters: {
      year: Number.isFinite(yearRaw) && yearRaw > 0 ? yearRaw : undefined,
      status: parseStatus(searchParams.get("status")),
    },
    page,
  };
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
        if (filters.status) query.set("status", filters.status);
        query.set("page", String(page));
        query.set("limit", String(PAGE_LIMIT));

        const summaryQuery = new URLSearchParams();
        if (filters.year) summaryQuery.set("year", String(filters.year));
        if (filters.status) summaryQuery.set("status", filters.status);
        summaryQuery.set("page", "1");
        summaryQuery.set("limit", "200");

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

        setPayslips([]);
        setSummaryItems([]);
        setTotal(0);
        setTotalPages(1);

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải danh sách phiếu lương.");
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
    const years = new Set<number>([currentYear]);
    summaryItems.forEach((item) => years.add(item.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [currentYear, summaryItems]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Phiếu lương</h1>
        <p className="text-slate-500 mt-1">Danh sách phiếu lương cá nhân theo từng kỳ.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm text-slate-500">Tổng đã nhận (PAID)</p>
          <p className="text-3xl font-bold text-emerald-700 mt-2">{formatVnd(totalEarned)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm text-slate-500">Số tiền tháng hiện tại</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{formatVnd(currentMonthAmount)}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={filters.year ?? ""}
            onChange={(e) => handleFilterChange("year", e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Tất cả năm</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={filters.status ?? ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Tất cả trạng thái</option>
            <option value={PayslipStatus.DRAFT}>DRAFT</option>
            <option value={PayslipStatus.PAID}>PAID</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-230">
            <thead>
              <tr className="border-b border-slate-200 bg-blue-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỳ lương</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Salary</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Salary</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày chi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-sm">
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
                    className="border-b border-slate-200 hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/payroll/${item.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-900 font-medium">{item.periodName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.payslipCode}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700 font-medium">
                      {formatVnd(getGrossSalary(item))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-900 font-semibold">
                      {formatVnd(item.finalNetSalary)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getStatusClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{getPayDate(item)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-slate-200 bg-blue-50">
          <p className="text-sm text-slate-500">
            Tổng {total} phiếu lương • Trang {page}/{totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-amber-700 text-sm">{error}</p>}
    </div>
  );
}
