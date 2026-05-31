"use client";

import Link from "next/link";
import React, { use, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import { TransactionResponse, TransactionStatus, TransactionType } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>;
}



function getTypeLabel(type: TransactionType): string {
  switch (type) {
    case TransactionType.DEPOSIT:
      return "Nap tien";
    case TransactionType.WITHDRAW:
      return "Rut tien";
    case TransactionType.SYSTEM_TOPUP:
      return "Nap quy cong ty";
    case TransactionType.REQUEST_PAYMENT:
      return "Thanh toan yeu cau";
    case TransactionType.PAYSLIP_PAYMENT:
      return "Nhan luong";
    case TransactionType.ADVANCE_RETURN:
      return "Hoan tam ung";
    case TransactionType.REVERSAL:
      return "Hoan tien";
    case TransactionType.DEPT_QUOTA_ALLOCATION:
      return "Cap quy phong ban";
    case TransactionType.PROJECT_QUOTA_ALLOCATION:
      return "Cap quy du an";
    case TransactionType.SYSTEM_ADJUSTMENT:
      return "Dieu chinh he thong";
    default:
      return type;
  }
}

function getStatusLabel(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.SUCCESS:
      return "Thanh cong";
    case TransactionStatus.PENDING:
      return "Dang cho";
    case TransactionStatus.FAILED:
      return "That bai";
    case TransactionStatus.CANCELLED:
      return "Da huy";
    default:
      return status;
  }
}

export default function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { id } = use(params);
  const toast = useToast();

  const [transaction, setTransaction] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTransaction = async () => {
      setLoading(true);

      try {
        const res = await api.get<TransactionResponse>(`/api/v1/wallet/transactions/${id}`);
        if (cancelled) return;
        setTransaction(res.data);
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError) {
          toast.error(err.apiMessage);
        } else {
          toast.error("Khong the tai chi tiet giao dich.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTransaction();

    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  return (
    <div className="max-w-3xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-cyan-600 text-white shadow-xl shadow-blue-900/15">
        <div className="relative p-6 sm:p-8">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">IFMS workspace</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Transaction detail</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100">Inspect transaction code, amount, type and processing timestamp.</p>
          </div>
        </div>
      </section>

      <Link
        href="/wallet/transactions"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lai
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Chi tiet giao dich</h1>
        <p className="text-slate-500 mt-1">Ma giao dich: {transaction?.transactionCode ?? id}</p>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-white animate-pulse" />
      ) : transaction ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
          <DetailRow label="Ma giao dich" value={transaction.transactionCode} />
          <DetailRow label="Loai" value={getTypeLabel(transaction.type)} />
          <DetailRow label="Trang thai" value={getStatusLabel(transaction.status)} />
          <DetailRow label="So tien" value={formatCurrency(transaction.amount)} />
          <DetailRow label="Mo ta" value={transaction.description || "-"} />
          <DetailRow label="Thoi gian tao" value={formatDateTime(transaction.createdAt)} />
          <DetailRow label="Reference ID" value={String(transaction.referenceId)} />
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600">
          Khong tim thay giao dich.
        </div>
      )}

    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-900 font-medium mt-1 break-all">{value}</p>
    </div>
  );
}
