"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import {
  CompanyFundResponse,
  DepartmentListItem,
  LedgerSummaryResponse,
  PaginatedResponse,
} from "@/types";

// TODO: Replace when Sprint 7 is complete
const MOCK_COMPANY_FUND: CompanyFundResponse = {
  id: 1,
  bankName: "Vietcombank",
  bankAccount: "1234-5678-9999",
  currentWalletBalance: 1_248_500_000,
  externalBankBalance: 1_248_500_000,
  bankDiscrepancy: 0,
  lastStatementDate: "2026-04-08",
  lastStatementUpdatedBy: "acc.ifms@ifms.vn",
};

// TODO: Replace when Sprint 7 is complete
const MOCK_LEDGER_SUMMARY: LedgerSummaryResponse = {
  currentBalance: 1_248_500_000,
  totalInflow: 3_500_000_000,
  totalOutflow: 2_251_500_000,
  transactionCount: 245,
};

// TODO: Replace when Sprint 2 is complete
const MOCK_DEPARTMENTS: DepartmentListItem[] = [
  {
    id: 1,
    name: "Phòng CNTT",
    code: "IT",
    manager: { id: 5, fullName: "Trần Thị Bích" },
    employeeCount: 20,
    totalProjectQuota: 800_000_000,
    totalAvailableBalance: 524_500_000,
    createdAt: "2026-01-01T08:00:00",
  },
  {
    id: 2,
    name: "Phòng Kinh doanh",
    code: "SALES",
    manager: { id: 6, fullName: "Nguyễn Văn Tùng" },
    employeeCount: 15,
    totalProjectQuota: 500_000_000,
    totalAvailableBalance: 230_000_000,
    createdAt: "2026-01-01T08:00:00",
  },
  {
    id: 3,
    name: "Phòng Tài chính",
    code: "FIN",
    manager: { id: 7, fullName: "Phạm Hoài Nam" },
    employeeCount: 10,
    totalProjectQuota: 450_000_000,
    totalAvailableBalance: 190_000_000,
    createdAt: "2026-01-01T08:00:00",
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SystemFundPage() {
  const [companyFund, setCompanyFund] = useState<CompanyFundResponse | null>(null);
  const [summary, setSummary] = useState<LedgerSummaryResponse | null>(null);
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [fundRes, summaryRes, deptRes] = await Promise.all([
          api.get<CompanyFundResponse>("/api/v1/company-fund"),
          api.get<LedgerSummaryResponse>("/api/v1/accountant/ledger/summary"),
          api.get<PaginatedResponse<DepartmentListItem> | DepartmentListItem[]>(
            "/api/v1/admin/departments?page=1&limit=100"
          ),
        ]);

        if (cancelled) return;

        setCompanyFund(fundRes.data);
        setSummary(summaryRes.data);
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : deptRes.data.items);
      } catch (err) {
        if (cancelled) return;

        setCompanyFund(MOCK_COMPANY_FUND);
        setSummary(MOCK_LEDGER_SUMMARY);
        setDepartments(MOCK_DEPARTMENTS);

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
  }, []);

  const netFlow = useMemo(() => {
    if (!summary) return 0;
    return summary.totalInflow - summary.totalOutflow;
  }, [summary]);

  const discrepancy = companyFund?.bankDiscrepancy ?? 0;
  const isHealthy = Math.abs(discrepancy) === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Quỹ hệ thống</h1>
        <p className="text-slate-400 mt-1">Tier 1 Fund - tổng quan dòng tiền và sức khỏe ngân quỹ hệ thống.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-800 border border-white/10 rounded-2xl p-5">
          <p className="text-sm text-slate-400">Số dư quỹ hệ thống hiện tại</p>
          <p className="text-3xl font-bold text-white mt-2">
            {loading ? "Đang tải..." : formatCurrency(companyFund?.currentWalletBalance ?? 0)}
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">Số dư ngân hàng đối soát</p>
              <p className="text-sm font-semibold text-slate-200 mt-1">
                {formatCurrency(companyFund?.externalBankBalance ?? 0)}
              </p>
            </div>
            <div
              className={`rounded-xl border p-3 ${
                isHealthy
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-rose-500/30 bg-rose-500/10"
              }`}
            >
              <p className={`text-xs ${isHealthy ? "text-emerald-300" : "text-rose-300"}`}>
                Fund health
              </p>
              <p className={`text-sm font-semibold mt-1 ${isHealthy ? "text-emerald-200" : "text-rose-200"}`}>
                {isHealthy ? "Balanced" : `Lệch ${formatCurrency(discrepancy)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-semibold text-white">Thông tin quỹ</h2>
          <InfoRow label="Ngân hàng" value={companyFund?.bankName ?? "—"} />
          <InfoRow label="Tài khoản" value={companyFund?.bankAccount ?? "—"} />
          <InfoRow label="Ngày đối soát" value={companyFund?.lastStatementDate ?? "—"} />
          <InfoRow label="Cập nhật bởi" value={companyFund?.lastStatementUpdatedBy ?? "—"} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Inflow" value={formatCurrency(summary?.totalInflow ?? 0)} tone="text-emerald-300" />
        <StatCard title="Outflow" value={formatCurrency(summary?.totalOutflow ?? 0)} tone="text-rose-300" />
        <StatCard
          title="Net Flow"
          value={formatCurrency(netFlow)}
          tone={netFlow >= 0 ? "text-blue-300" : "text-amber-300"}
        />
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-white">Phân bổ quota theo phòng ban</h2>

        {departments.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có dữ liệu phòng ban.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/60">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Mã PB</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Tên phòng ban</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Manager</th>
                  <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Quota</th>
                  <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Khả dụng</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.id} className="border-b border-white/5 last:border-b-0">
                    <td className="px-4 py-3 text-sm text-slate-300">{department.code}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{department.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{department.manager?.fullName ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right">
                      {formatCurrency(department.totalProjectQuota)}
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-300 text-right">
                      {formatCurrency(department.totalAvailableBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, tone }: { title: string; value: string; tone: string }) {
  return (
    <div className="bg-slate-800 border border-white/10 rounded-2xl p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className={`text-xl font-bold mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-200 mt-1">{value}</p>
    </div>
  );
}
