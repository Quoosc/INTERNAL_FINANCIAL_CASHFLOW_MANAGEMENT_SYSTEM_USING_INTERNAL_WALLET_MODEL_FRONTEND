"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { RequestStatusBadge, RequestTypeBadge } from "@/components/ui/status-badge";
import {
  PaginatedResponse,
  RequestFilterParams,
  RequestListItem,
  RequestStatus,
  RequestSummaryResponse,
  RequestType,
} from "@/types";

const PAGE_LIMIT = 8;

// TODO: Replace with real API calls when Sprint 5 is complete
const MOCK_SUMMARY: RequestSummaryResponse = {
  totalPendingApproval: 3,
  totalPendingAccountant: 1,
  totalApproved: 4,
  totalRejected: 2,
  totalPaid: 5,
  totalCancelled: 1,
};

// TODO: Replace with real API calls when Sprint 5 is complete
const MOCK_REQUESTS: RequestListItem[] = [
  {
    id: 101,
    requestCode: "REQ-EMP-0326-001",
    type: RequestType.ADVANCE,
    status: RequestStatus.PENDING,
    amount: 1_200_000,
    approvedAmount: null,
    description: "Tạm ứng chi phí công tác Đà Nẵng",
    rejectReason: null,
    projectId: 5,
    projectName: "Hệ thống quản lý nội bộ",
    phaseId: 12,
    phaseName: "Phase 2",
    categoryId: 3,
    categoryName: "Di chuyển",
    createdAt: "2026-04-02T09:15:00",
    updatedAt: "2026-04-02T09:15:00",
  },
  {
    id: 102,
    requestCode: "REQ-EMP-0326-002",
    type: RequestType.EXPENSE,
    status: RequestStatus.PENDING_ACCOUNTANT_EXECUTION,
    amount: 700_000,
    approvedAmount: 700_000,
    description: "Chi phí mua vật tư văn phòng",
    rejectReason: null,
    projectId: 5,
    projectName: "Hệ thống quản lý nội bộ",
    phaseId: 12,
    phaseName: "Phase 2",
    categoryId: 8,
    categoryName: "Vật tư",
    createdAt: "2026-04-01T13:30:00",
    updatedAt: "2026-04-01T18:00:00",
  },
  {
    id: 103,
    requestCode: "REQ-EMP-0326-003",
    type: RequestType.REIMBURSE,
    status: RequestStatus.APPROVED_BY_TEAM_LEADER,
    amount: 450_000,
    approvedAmount: 450_000,
    description: "Hoàn ứng chi phí tiếp khách",
    rejectReason: null,
    projectId: 4,
    projectName: "Ứng dụng mobile",
    phaseId: 9,
    phaseName: "Phase 1",
    categoryId: 6,
    categoryName: "Tiếp khách",
    createdAt: "2026-03-31T10:05:00",
    updatedAt: "2026-03-31T17:12:00",
  },
  {
    id: 104,
    requestCode: "REQ-EMP-0326-004",
    type: RequestType.ADVANCE,
    status: RequestStatus.PAID,
    amount: 2_000_000,
    approvedAmount: 1_800_000,
    description: "Tạm ứng triển khai onsite",
    rejectReason: null,
    projectId: 3,
    projectName: "ERP nâng cấp",
    phaseId: 6,
    phaseName: "Go-live",
    categoryId: 2,
    categoryName: "Onsite",
    createdAt: "2026-03-28T08:20:00",
    updatedAt: "2026-03-29T09:40:00",
  },
  {
    id: 105,
    requestCode: "REQ-EMP-0326-005",
    type: RequestType.EXPENSE,
    status: RequestStatus.REJECTED,
    amount: 1_150_000,
    approvedAmount: null,
    description: "Thanh toán hóa đơn thiết bị",
    rejectReason: "Thiếu chứng từ hợp lệ",
    projectId: 5,
    projectName: "Hệ thống quản lý nội bộ",
    phaseId: 11,
    phaseName: "Phase 1",
    categoryId: 9,
    categoryName: "Thiết bị",
    createdAt: "2026-03-27T14:10:00",
    updatedAt: "2026-03-27T18:22:00",
  },
  {
    id: 106,
    requestCode: "REQ-EMP-0326-006",
    type: RequestType.REIMBURSE,
    status: RequestStatus.CANCELLED,
    amount: 300_000,
    approvedAmount: null,
    description: "Hoàn ứng taxi",
    rejectReason: null,
    projectId: 2,
    projectName: "BI Dashboard",
    phaseId: 5,
    phaseName: "UAT",
    categoryId: 4,
    categoryName: "Di chuyển",
    createdAt: "2026-03-25T16:40:00",
    updatedAt: "2026-03-25T18:00:00",
  },
  {
    id: 107,
    requestCode: "REQ-EMP-0326-007",
    type: RequestType.ADVANCE,
    status: RequestStatus.PENDING,
    amount: 950_000,
    approvedAmount: null,
    description: "Tạm ứng workshop khách hàng",
    rejectReason: null,
    projectId: 1,
    projectName: "CRM Revamp",
    phaseId: 3,
    phaseName: "Design",
    categoryId: 7,
    categoryName: "Workshop",
    createdAt: "2026-03-24T09:00:00",
    updatedAt: "2026-03-24T09:00:00",
  },
  {
    id: 108,
    requestCode: "REQ-EMP-0326-008",
    type: RequestType.EXPENSE,
    status: RequestStatus.PAID,
    amount: 620_000,
    approvedAmount: 620_000,
    description: "Chi phí công cụ làm việc",
    rejectReason: null,
    projectId: 4,
    projectName: "Ứng dụng mobile",
    phaseId: 9,
    phaseName: "Phase 1",
    categoryId: 10,
    categoryName: "Công cụ",
    createdAt: "2026-03-21T11:25:00",
    updatedAt: "2026-03-22T08:15:00",
  },
];

function parseStatus(value: string | null): RequestStatus | undefined {
  if (!value) return undefined;
  const valid = new Set<string>(Object.values(RequestStatus));
  return valid.has(value) ? (value as RequestStatus) : undefined;
}

function parseType(value: string | null): RequestType | undefined {
  if (!value) return undefined;
  const valid = new Set<string>([
    RequestType.ADVANCE,
    RequestType.EXPENSE,
    RequestType.REIMBURSE,
  ]);
  return valid.has(value) ? (value as RequestType) : undefined;
}

function buildInitialState(searchParams: { get: (key: string) => string | null }): {
  filters: RequestFilterParams;
  fromDate: string;
  toDate: string;
  page: number;
} {
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return {
    filters: {
      status: parseStatus(searchParams.get("status")),
      type: parseType(searchParams.get("type")),
      page,
      limit: PAGE_LIMIT,
    },
    fromDate: searchParams.get("from") ?? "",
    toDate: searchParams.get("to") ?? "",
    page,
  };
}

function filterMock(
  source: RequestListItem[],
  filters: RequestFilterParams,
  fromDate: string,
  toDate: string
): RequestListItem[] {
  return source.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.type && item.type !== filters.type) return false;

    if (fromDate) {
      const fromTs = new Date(`${fromDate}T00:00:00`).getTime();
      if (new Date(item.createdAt).getTime() < fromTs) return false;
    }

    if (toDate) {
      const toTs = new Date(`${toDate}T23:59:59`).getTime();
      if (new Date(item.createdAt).getTime() > toTs) return false;
    }

    return true;
  });
}

export default function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial = useMemo(() => buildInitialState(searchParams), [searchParams]);

  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [summary, setSummary] = useState<RequestSummaryResponse | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<RequestFilterParams>(initial.filters);
  const [fromDate, setFromDate] = useState(initial.fromDate);
  const [toDate, setToDate] = useState(initial.toDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = buildInitialState(searchParams);
    setFilters(next.filters);
    setFromDate(next.fromDate);
    setToDate(next.toDate);
    setPage(next.page);
  }, [searchParams]);

  const syncUrl = useCallback(
    (nextFilters: RequestFilterParams, nextPage: number, nextFrom: string, nextTo: string) => {
      const params = new URLSearchParams();
      if (nextFilters.status) params.set("status", nextFilters.status);
      if (nextFilters.type) params.set("type", nextFilters.type);
      if (nextFrom) params.set("from", nextFrom);
      if (nextTo) params.set("to", nextTo);
      if (nextPage > 1) params.set("page", String(nextPage));

      const query = params.toString();
      router.replace(query ? `/requests?${query}` : "/requests");
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (filters.status) query.set("status", filters.status);
        if (filters.type) query.set("type", filters.type);
        if (fromDate) query.set("from", fromDate);
        if (toDate) query.set("to", toDate);
        query.set("page", String(page));
        query.set("limit", String(PAGE_LIMIT));

        // const [reqRes, sumRes] = await Promise.all([
        //   api.get<PaginatedResponse<RequestListItem>>('/api/v1/requests', { params: filters }),
        //   api.get<RequestSummaryResponse>('/api/v1/requests/summary')
        // ])
        const [reqRes, sumRes] = await Promise.all([
          api.get<PaginatedResponse<RequestListItem>>(`/api/v1/requests?${query.toString()}`),
          api.get<RequestSummaryResponse>("/api/v1/requests/summary"),
        ]);

        if (cancelled) return;

        setRequests(reqRes.data.items);
        setTotal(reqRes.data.total);
        setTotalPages(reqRes.data.totalPages);
        setSummary(sumRes.data);
      } catch (err) {
        if (cancelled) return;

        const filtered = filterMock(MOCK_REQUESTS, filters, fromDate, toDate);
        const mockTotal = filtered.length;
        const mockTotalPages = Math.max(1, Math.ceil(mockTotal / PAGE_LIMIT));
        const currentPage = Math.min(page, mockTotalPages);
        const start = (currentPage - 1) * PAGE_LIMIT;

        setRequests(filtered.slice(start, start + PAGE_LIMIT));
        setTotal(mockTotal);
        setTotalPages(mockTotalPages);
        setSummary(MOCK_SUMMARY);

        if (currentPage !== page) {
          setPage(currentPage);
          syncUrl(filters, currentPage, fromDate, toDate);
        }

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải dữ liệu API, đang hiển thị dữ liệu mẫu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [filters, page, fromDate, toDate, syncUrl]);

  const handleStatusChange = (value: string) => {
    const nextFilters: RequestFilterParams = {
      ...filters,
      status: value === "ALL" ? undefined : (value as RequestStatus),
      page: 1,
      limit: PAGE_LIMIT,
    };
    setFilters(nextFilters);
    setPage(1);
    syncUrl(nextFilters, 1, fromDate, toDate);
  };

  const handleTypeChange = (value: string) => {
    const nextFilters: RequestFilterParams = {
      ...filters,
      type: value === "ALL" ? undefined : (value as RequestType),
      page: 1,
      limit: PAGE_LIMIT,
    };
    setFilters(nextFilters);
    setPage(1);
    syncUrl(nextFilters, 1, fromDate, toDate);
  };

  const handleDateChange = (key: "from" | "to", value: string) => {
    if (key === "from") {
      setFromDate(value);
      syncUrl(filters, 1, value, toDate);
    } else {
      setToDate(value);
      syncUrl(filters, 1, fromDate, value);
    }

    const nextFilters: RequestFilterParams = {
      ...filters,
      page: 1,
      limit: PAGE_LIMIT,
    };
    setFilters(nextFilters);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    syncUrl(filters, nextPage, fromDate, toDate);
  };

  const pendingCount = (summary?.totalPendingApproval ?? 0) + (summary?.totalPendingAccountant ?? 0);
  const approvedCount = summary?.totalApproved ?? 0;
  const rejectedCount = summary?.totalRejected ?? 0;
  const totalCount =
    (summary?.totalPendingApproval ?? 0) +
    (summary?.totalPendingAccountant ?? 0) +
    (summary?.totalApproved ?? 0) +
    (summary?.totalPaid ?? 0) +
    (summary?.totalRejected ?? 0) +
    (summary?.totalCancelled ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yêu cầu của tôi</h1>
          <p className="text-slate-500 mt-1">Theo dõi toàn bộ yêu cầu tạm ứng, chi phí, hoàn ứng.</p>
        </div>

        <Link
          href="/requests/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m6-6H6" />
          </svg>
          Tạo yêu cầu mới
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard title="Tổng yêu cầu" value={totalCount} accent="text-slate-900" borderColor="border-slate-200" iconBg="bg-slate-100" iconColor="text-slate-600" />
        <SummaryCard title="Đang chờ" value={pendingCount} accent="text-amber-700" borderColor="border-amber-200" iconBg="bg-amber-100" iconColor="text-amber-600" />
        <SummaryCard title="Đã duyệt" value={approvedCount} accent="text-emerald-700" borderColor="border-emerald-200" iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <SummaryCard title="Từ chối" value={rejectedCount} accent="text-rose-700" borderColor="border-rose-200" iconBg="bg-rose-100" iconColor="text-rose-600" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <select
            value={filters.status ?? "ALL"}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.values(RequestStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={filters.type ?? "ALL"}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">Tất cả loại</option>
            <option value={RequestType.ADVANCE}>ADVANCE</option>
            <option value={RequestType.EXPENSE}>EXPENSE</option>
            <option value={RequestType.REIMBURSE}>REIMBURSE</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => handleDateChange("from", e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => handleDateChange("to", e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-200 bg-white/30">
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã yêu cầu</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loại</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số tiền</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dự án</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang tải dữ liệu yêu cầu...
                    </span>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                    Không có yêu cầu phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/requests/${request.id}`)}
                  >
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{request.requestCode}</td>
                    <td className="px-4 py-3">
                      <RequestTypeBadge type={request.type} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(request.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <RequestStatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{request.projectName ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDateTime(request.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/requests/${request.id}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-slate-200 bg-white/30">
          <p className="text-sm text-slate-500">
            Tổng {total} yêu cầu • Trang {page}/{totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm transition-colors"
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

function SummaryCard({
  title,
  value,
  accent,
  borderColor,
  iconBg,
  iconColor,
}: {
  title: string;
  value: number;
  accent: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className={`bg-white border ${borderColor} rounded-xl shadow-sm p-5 flex items-center justify-between`}>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
        <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    </div>
  );
}
