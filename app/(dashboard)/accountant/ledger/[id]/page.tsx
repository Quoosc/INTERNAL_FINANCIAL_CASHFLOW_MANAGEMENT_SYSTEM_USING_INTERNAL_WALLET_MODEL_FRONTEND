"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  AccountantTransactionDetailResponse,
  ReferenceType,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
} from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getTypeLabel(type: TransactionType): string {
  const labels: Record<string, string> = {
    REQUEST_PAYMENT:          "Giải ngân",
    PAYSLIP_PAYMENT:          "Chi lương",
    SYSTEM_TOPUP:             "Nạp quỹ",
    DEPOSIT:                  "Nạp ví",
    WITHDRAW:                 "Rút tiền",
    DEPT_QUOTA_ALLOCATION:    "Cấp quota phòng ban",
    PROJECT_QUOTA_ALLOCATION: "Cấp quota dự án",
    ADVANCE_RETURN:           "Hoàn tạm ứng",
    REVERSAL:                 "Hoàn đảo",
    SYSTEM_ADJUSTMENT:        "Điều chỉnh",
  };
  return labels[type] ?? type;
}

function getTypeClass(type: TransactionType): string {
  switch (type) {
    case TransactionType.REQUEST_PAYMENT:          return "bg-violet-100 border-violet-200 text-violet-700";
    case TransactionType.PAYSLIP_PAYMENT:          return "bg-blue-50 border-blue-200 text-blue-700";
    case TransactionType.SYSTEM_TOPUP:             return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case TransactionType.DEPOSIT:                  return "bg-teal-100 border-teal-200 text-teal-700";
    case TransactionType.WITHDRAW:                 return "bg-rose-100 border-rose-200 text-rose-700";
    case TransactionType.DEPT_QUOTA_ALLOCATION:    return "bg-amber-100 border-amber-200 text-amber-700";
    case TransactionType.PROJECT_QUOTA_ALLOCATION: return "bg-orange-100 border-orange-200 text-orange-700";
    default: return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function getStatusClass(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.SUCCESS:   return "bg-emerald-100 border-emerald-200 text-emerald-700";
    case TransactionStatus.PENDING:   return "bg-amber-100 border-amber-200 text-amber-700";
    case TransactionStatus.FAILED:    return "bg-rose-100 border-rose-200 text-rose-700";
    case TransactionStatus.CANCELLED: return "bg-slate-100 border-slate-200 text-slate-600";
    default: return "bg-slate-100 border-slate-200 text-slate-600";
  }
}

function getDirectionClass(direction: TransactionDirection): string {
  return direction === TransactionDirection.CREDIT
    ? "bg-emerald-100 border-emerald-200 text-emerald-700"
    : "bg-rose-100 border-rose-200 text-rose-700";
}

function getReferenceLink(txn: AccountantTransactionDetailResponse): { label: string; href?: string } | null {
  if (txn.referenceType === ReferenceType.REQUEST && txn.referenceId) {
    return { label: `Xem yêu cầu #${txn.referenceId}`, href: `/requests/${txn.referenceId}` };
  }
  if (txn.referenceType === ReferenceType.PAYSLIP && txn.referenceId) {
    return { label: `Xem phiếu lương #${txn.referenceId}`, href: `/payroll/${txn.referenceId}` };
  }
  if (txn.referenceType === ReferenceType.PROJECT && txn.referenceId) {
    return { label: `Xem dự án #${txn.referenceId}`, href: `/projects/${txn.referenceId}` };
  }
  if (txn.referenceType === ReferenceType.DEPARTMENT) {
    return { label: "Phân bổ quỹ phòng ban", href: "/manager/department" };
  }
  if (txn.referenceType === ReferenceType.SYSTEM) {
    return { label: "Giao dịch quỹ hệ thống" };
  }
  return null;
}

export default function AccountantLedgerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const toast = useToast();

  const [txn, setTxn]       = useState<AccountantTransactionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const res = await api.get<AccountantTransactionDetailResponse>(`/api/v1/accountant/ledger/${id}`);
        if (cancelled) return;
        setTxn(res.data);
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof ApiError ? err.apiMessage : "Không thể tải dữ liệu giao dịch.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [id, toast]);

  const refLink = useMemo(() => (txn ? getReferenceLink(txn) : null), [txn]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-60 rounded bg-slate-200 animate-pulse" />
        <div className="h-40 rounded-2xl bg-white animate-pulse" />
        <div className="h-64 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="space-y-4">
        <Link href="/accountant/ledger" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại sổ cái
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center text-slate-500">
          Không tìm thấy giao dịch.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/accountant/ledger" className="hover:text-slate-900 transition-colors">Sổ cái</Link>
        <span>/</span>
        <span className="text-slate-600 font-mono">{txn.transactionCode}</span>
      </div>

      {/* Immutable notice */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 text-sm">
        Giao dịch này được ghi nhận bởi hệ thống và <span className="font-semibold text-slate-900">không thể sửa đổi</span>.
      </div>

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Mã giao dịch</p>
            <p className="text-2xl font-bold text-slate-900 font-mono mt-1">{txn.transactionCode}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs ${getTypeClass(txn.type)}`}>
              {getTypeLabel(txn.type)}
            </span>
            <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs ${getStatusClass(txn.status)}`}>
              {txn.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <InfoCard
            label="Số tiền"
            value={formatCurrency(txn.amount)}
            tone={txn.amount > 0 ? "text-emerald-700" : "text-rose-700"}
          />
          <InfoCard label="Số dư sau" value={formatCurrency(txn.balanceAfter)} />
          <InfoCard label="Ví chủ thể" value={`${txn.walletOwnerType} #${txn.walletOwnerId}`} mono />
          <InfoCard label="Thời gian"  value={formatDateTime(txn.createdAt)} />
        </div>

        {txn.description && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Mô tả</p>
            <p className="text-sm text-slate-900">{txn.description}</p>
          </div>
        )}

        {txn.paymentRef && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Mã thanh toán</p>
            <p className="text-sm text-slate-900 font-mono">{txn.paymentRef}</p>
          </div>
        )}
      </div>

      {/* Reference / source */}
      {(txn.referenceType ?? refLink) && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Nguồn gốc giao dịch</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoCard label="Loại tham chiếu" value={txn.referenceType ?? "—"} />
            <InfoCard label="ID tham chiếu"   value={txn.referenceId ? String(txn.referenceId) : "—"} mono />
          </div>

          {refLink?.href ? (
            <Link
              href={refLink.href}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-blue-700 hover:text-blue-600 text-sm"
            >
              {refLink.label}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3h7m0 0v7m0-7L10 14" />
              </svg>
            </Link>
          ) : refLink ? (
            <p className="text-sm text-slate-600">{refLink.label}</p>
          ) : null}
        </div>
      )}

      {/* Ledger entries (double-entry lines) */}
      {txn.ledgerEntries.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Bút toán kép</h2>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-white/70 border-b border-slate-200">
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Chiều</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Ví chủ thể</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Số tiền</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Số dư sau</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {txn.ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${getDirectionClass(entry.direction)}`}>
                        {entry.direction === TransactionDirection.CREDIT ? "Có (Credit)" : "Nợ (Debit)"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                      {entry.walletOwnerType} #{entry.walletOwnerId}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold ${entry.direction === TransactionDirection.CREDIT ? "text-emerald-700" : "text-rose-700"}`}>
                      {entry.direction === TransactionDirection.CREDIT ? "+" : "-"}{formatCurrency(entry.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-900">
                      {formatCurrency(entry.balanceAfter)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDateTime(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Link
        href="/accountant/ledger"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại sổ cái
      </Link>
    </div>
  );
}

function InfoCard({ label, value, tone, mono }: { label: string; value: string; tone?: string; mono?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm mt-1 ${tone ?? "text-slate-900"} ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
