"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import { PayslipDetailResponse, PayslipStatus } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface BreakdownItem {
  label: string;
  amount: number;
}

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

function statusLabel(status: PayslipStatus): string {
  return status === PayslipStatus.PAID ? "PAID" : "DRAFT";
}

function statusClass(status: PayslipStatus): string {
  return status === PayslipStatus.PAID
    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : "bg-amber-50 border-amber-200 text-amber-700";
}

function getPayDate(payslip: PayslipDetailResponse): string {
  if (payslip.status !== PayslipStatus.PAID) return "—";

  const date = new Date(payslip.year, payslip.month - 1, 28);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function buildAllowanceBreakdown(totalAllowance: number): BreakdownItem[] {
  if (totalAllowance <= 0) return [];

  const transport = Math.round(totalAllowance * 0.45);
  const meal = Math.round(totalAllowance * 0.35);
  const other = totalAllowance - transport - meal;

  return [
    { label: "Phụ cấp đi lại", amount: transport },
    { label: "Phụ cấp ăn trưa", amount: meal },
    { label: "Phụ cấp khác", amount: other },
  ];
}

function buildDeductionBreakdown(totalDeduction: number): BreakdownItem[] {
  if (totalDeduction <= 0) return [];

  const tax = Math.round(totalDeduction * 0.5);
  const insurance = Math.round(totalDeduction * 0.3);
  const other = totalDeduction - tax - insurance;

  return [
    { label: "Thuế TNCN", amount: tax },
    { label: "Bảo hiểm", amount: insurance },
    { label: "Khấu trừ khác", amount: other },
  ];
}

export default function PayslipDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [payslip, setPayslip] = useState<PayslipDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPayslip = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<PayslipDetailResponse>(`/api/v1/payslips/${id}`);

        if (cancelled) return;
        setPayslip(res.data);
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải chi tiết phiếu lương.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPayslip();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const allowanceItems = useMemo(
    () => buildAllowanceBreakdown(payslip?.allowance ?? 0),
    [payslip?.allowance]
  );

  const deductionItems = useMemo(
    () => buildDeductionBreakdown(payslip?.deduction ?? 0),
    [payslip?.deduction]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-36 rounded bg-white animate-pulse" />
        <div className="h-28 rounded-2xl bg-white animate-pulse" />
        <div className="h-64 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => router.push("/payroll")}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
          Không tìm thấy phiếu lương.
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6 print:p-0 print:m-0 print:bg-white">
        <div className="print:hidden">
          <button
            type="button"
            onClick={() => router.push("/payroll")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 print:bg-white print:border-gray-300">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 print:text-gray-900">{payslip.employee.fullName}</h1>
              <p className="text-slate-500 print:text-gray-700 mt-1">
                {payslip.periodName} • {payslip.employee.employeeCode}
              </p>
              <p className="text-xs text-slate-500 print:text-gray-600 mt-1">
                Chức danh: {payslip.employee.jobTitle} • Phòng ban: {payslip.employee.departmentName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${statusClass(payslip.status)}`}>
                {statusLabel(payslip.status)}
              </span>
              <span className="inline-flex px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 text-sm print:border-gray-300 print:bg-white print:text-gray-700">
                Ngày chi: {getPayDate(payslip)}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="print:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-12 0h12v4H6v-4z"
                  />
                </svg>
                In phiếu lương
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 print:bg-white print:border-gray-300">
            <h2 className="text-lg font-semibold text-slate-900 print:text-gray-900">Earnings</h2>

            <LineRow label="Lương cơ bản" value={payslip.baseSalary} positive />

            {allowanceItems.map((item) => (
              <LineRow key={item.label} label={item.label} value={item.amount} positive />
            ))}

            <LineRow label="Thưởng" value={payslip.bonus} positive />

            <div className="pt-2 border-t border-slate-200 print:border-gray-300">
              <LineRow label="Tổng thu nhập (Gross)" value={payslip.totalEarnings} positive strong />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 print:bg-white print:border-gray-300">
            <h2 className="text-lg font-semibold text-slate-900 print:text-gray-900">Deductions</h2>

            {deductionItems.length > 0 ? (
              deductionItems.map((item) => (
                <LineRow key={item.label} label={item.label} value={item.amount} negative />
              ))
            ) : (
              <p className="text-sm text-slate-500 print:text-gray-600">Không có khấu trừ cố định.</p>
            )}

            <LineRow label="Khấu trừ tạm ứng (Netting)" value={payslip.advanceDeduct} negative />

            <div className="pt-2 border-t border-slate-200 print:border-gray-300">
              <LineRow label="Tổng khấu trừ" value={payslip.totalDeduction} negative strong />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 print:bg-white print:border-gray-300">
          <h2 className="text-lg font-semibold text-slate-900 print:text-gray-900">Tổng hợp thanh toán</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MetricCard title="Gross Salary" value={payslip.totalEarnings} tone="normal" />
            <MetricCard title="Total Deductions" value={payslip.totalDeduction} tone="negative" />
            <MetricCard title="Net Salary" value={payslip.finalNetSalary} tone="highlight" />
          </div>
        </div>

        {payslip.advanceDeduct > 0 && (
          <div className="bg-white border border-blue-200 rounded-2xl p-5 print:bg-white print:border-gray-300">
            <h2 className="text-lg font-semibold text-slate-900 print:text-gray-900">Netting</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <MetricCard title="Debt Offset Applied" value={payslip.advanceDeduct} tone="negative" />
              <MetricCard title="Final Paid" value={payslip.finalNetSalary} tone="highlight" />
            </div>
          </div>
        )}

        {error && (
          <div className="print:hidden px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </>
  );
}

function LineRow({
  label,
  value,
  positive,
  negative,
  strong,
}: {
  label: string;
  value: number;
  positive?: boolean;
  negative?: boolean;
  strong?: boolean;
}) {
  const toneClass = positive
    ? "text-emerald-700 print:text-emerald-700"
    : negative
      ? "text-rose-700 print:text-rose-700"
      : "text-slate-700 print:text-gray-900";

  return (
    <div className="flex items-center justify-between gap-4">
      <p className={`text-sm ${strong ? "font-semibold text-slate-900 print:text-gray-900" : "text-slate-600 print:text-gray-700"}`}>
        {label}
      </p>
      <p className={`${toneClass} ${strong ? "font-bold" : "font-medium"}`}>{formatVnd(value)}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "normal" | "negative" | "highlight";
}) {
  const toneClass =
    tone === "highlight"
      ? "text-blue-700 print:text-blue-700"
      : tone === "negative"
        ? "text-rose-700 print:text-rose-700"
        : "text-slate-100 print:text-gray-900";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 print:bg-white print:border-gray-300">
      <p className="text-xs text-slate-500 print:text-gray-600">{title}</p>
      <p className={`text-xl font-bold mt-1 ${toneClass}`}>{formatVnd(value)}</p>
    </div>
  );
}
