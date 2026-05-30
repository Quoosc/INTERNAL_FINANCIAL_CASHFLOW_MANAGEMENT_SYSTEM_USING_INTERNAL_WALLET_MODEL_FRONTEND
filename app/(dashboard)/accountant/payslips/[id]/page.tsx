"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PayslipDetailResponse, PayslipStatus } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getStatusLabel(status: PayslipStatus): string {
  return status === PayslipStatus.PAID ? "Đã chi trả" : "Nháp";
}

function getStatusClass(status: PayslipStatus): string {
  return status === PayslipStatus.PAID
    ? "bg-emerald-100 border-emerald-200 text-emerald-700"
    : "bg-slate-100 border-slate-200 text-slate-600";
}

export default function AccountantPayslipDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const toast = useToast();

  const [payslip, setPayslip] = useState<PayslipDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<PayslipDetailResponse>(`/api/v1/accountant/payslips/${id}`);
        if (cancelled) return;
        setPayslip(res.data);
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof ApiError ? err.apiMessage : "Không thể tải phiếu lương.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [id, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded bg-slate-200 animate-pulse" />
        <div className="h-48 rounded-2xl bg-white animate-pulse" />
        <div className="h-64 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="space-y-4">
        <Link href="/accountant/payroll" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại bảng lương
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
          Không tìm thấy phiếu lương.
        </div>
      </div>
    );
  }

  const totalEarnings = payslip.baseSalary + payslip.bonus + payslip.allowance;
  const totalDeduction = payslip.deduction + payslip.advanceDeduct;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/accountant/payroll" className="hover:text-slate-900 transition-colors">
          Bảng lương
        </Link>
        <span>/</span>
        <Link
          href={`/accountant/payroll/${payslip.periodId}`}
          className="hover:text-slate-900 transition-colors"
        >
          {payslip.periodName}
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-mono">{payslip.payslipCode}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-mono">{payslip.payslipCode}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{payslip.periodName}</h1>
            <p className="text-sm text-slate-500 mt-1">Tháng {payslip.month}/{payslip.year}</p>
          </div>
          <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${getStatusClass(payslip.status)}`}>
            {getStatusLabel(payslip.status)}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Thông tin nhân viên</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard label="Họ tên" value={payslip.employee.fullName} />
          <InfoCard label="Mã nhân viên" value={payslip.employee.employeeCode} mono />
          <InfoCard label="Phòng ban" value={payslip.employee.departmentName} />
          <InfoCard label="Chức danh" value={payslip.employee.jobTitle ?? "—"} />
          <InfoCard label="Ngân hàng" value={payslip.employee.bankName} />
          <InfoCard label="Số tài khoản" value={payslip.employee.bankAccountNum} mono />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Chi tiết lương</h2>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <tbody>
              <SalaryRow label="Lương cơ bản" value={payslip.baseSalary} />
              <SalaryRow label="Thưởng" value={payslip.bonus} />
              <SalaryRow label="Phụ cấp" value={payslip.allowance} />
              <SalaryRow label="Tổng thu nhập" value={totalEarnings} highlight="income" />
              <SalaryRow label="Khấu trừ" value={-payslip.deduction} negative />
              <SalaryRow label="Khấu trừ tạm ứng" value={-payslip.advanceDeduct} negative />
              <SalaryRow label="Tổng khấu trừ" value={-totalDeduction} highlight="deduction" />
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
          <p className="text-slate-700 font-semibold">Thực lĩnh</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(payslip.finalNetSalary)}</p>
        </div>
      </div>

      <div className="text-xs text-slate-400 text-right">
        Cập nhật: {formatDateTime(new Date().toISOString())}
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm mt-1 text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function SalaryRow({
  label,
  value,
  negative,
  highlight,
}: {
  label: string;
  value: number;
  negative?: boolean;
  highlight?: "income" | "deduction";
}) {
  const rowClass = highlight === "income"
    ? "bg-blue-50 border-b border-blue-100"
    : highlight === "deduction"
    ? "bg-rose-50 border-b border-rose-100"
    : "border-b border-slate-100 last:border-b-0";

  const valueClass = negative
    ? "text-rose-700"
    : highlight === "income"
    ? "text-blue-700 font-semibold"
    : highlight === "deduction"
    ? "text-rose-700 font-semibold"
    : "text-slate-900";

  return (
    <tr className={rowClass}>
      <td className="px-4 py-3 text-sm text-slate-700">{label}</td>
      <td className={`px-4 py-3 text-right text-sm ${valueClass}`}>
        {negative && value !== 0 ? `- ${formatCurrency(Math.abs(value))}` : formatCurrency(Math.abs(value))}
      </td>
    </tr>
  );
}
