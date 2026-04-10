"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { ReferenceType, TransactionResponse, TransactionStatus, TransactionType } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ⚠ TransactionResponse v3.0 — fields removed: balanceAfter, paymentRef, gatewayProvider,
// walletId, walletOwnerName, actorId, actorName, relatedTransactionId, updatedAt.
// Local type adds referenceCode (enriched from list page or separate lookup).
type LedgerTxnDetailView = TransactionResponse & {
  referenceCode?: string | null;
};

// TODO: Replace when Sprint 7 is complete
const MOCK_TXN: LedgerTxnDetailView = {
  id: 1,
  transactionCode: "TXN-2026-0001A",
  type: TransactionType.REQUEST_PAYMENT,
  status: TransactionStatus.SUCCESS,
  amount: -3_500_000,
  referenceId: 1,
  referenceType: ReferenceType.REQUEST,
  referenceCode: "REQ-2026-0041",
  description: "Giai ngan tam ung thiet bi",
  createdAt: "2026-04-03T11:00:00",
};

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
    second: "2-digit",
  }).format(new Date(iso));
}

function getTypeClass(type: TransactionType): string {
  switch (type) {
    case TransactionType.REQUEST_PAYMENT:
      return "bg-violet-500/15 border-violet-500/30 text-violet-300";
    case TransactionType.PAYSLIP_PAYMENT:
      return "bg-blue-500/15 border-blue-500/30 text-blue-300";
    case TransactionType.DEPOSIT:
    case TransactionType.SYSTEM_TOPUP:
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

function getStatusClass(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.SUCCESS:
      return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    case TransactionStatus.PENDING:
      return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    case TransactionStatus.FAILED:
      return "bg-rose-500/15 border-rose-500/30 text-rose-300";
    case TransactionStatus.CANCELLED:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
    default:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
  }
}

function getSourceLink(txn: LedgerTxnDetailView): { label: string; href?: string } {
  if (txn.referenceType === ReferenceType.REQUEST && txn.referenceId) {
    return {
      label: `Xem yeu cau ${txn.referenceCode ?? `#${txn.referenceId}`}`,
      href: `/requests/${txn.referenceId}`,
    };
  }

  if (txn.referenceType === ReferenceType.PAYSLIP && txn.referenceId) {
    return {
      label: `Xem phieu luong ${txn.referenceCode ?? `#${txn.referenceId}`}`,
      href: `/payroll/${txn.referenceId}`,
    };
  }

  if (txn.referenceType === ReferenceType.PROJECT && txn.referenceId) {
    return {
      label: `Xem du an ${txn.referenceCode ?? `#${txn.referenceId}`}`,
      href: `/projects/${txn.referenceId}`,
    };
  }

  if (txn.referenceType === ReferenceType.DEPARTMENT) {
    return { label: "Phan bo quy cap phong ban", href: "/manager/department" };
  }

  if (txn.referenceType === ReferenceType.SYSTEM) {
    return { label: "Giao dich quy he thong" };
  }

  return { label: "Giao dich truc tiep" };
}

export default function AccountantLedgerDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [txn, setTxn] = useState<LedgerTxnDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTxn = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace when Sprint 7 is complete
        const res = await api.get<LedgerTxnDetailView>(`/api/v1/accountant/ledger/${id}`);
        if (cancelled) return;
        setTxn(res.data);
      } catch {
        if (cancelled) return;

        const safeId = Number(id);
        setTxn({
          ...MOCK_TXN,
          id: Number.isFinite(safeId) && safeId > 0 ? safeId : MOCK_TXN.id,
          transactionCode: `TXN-2026-${String(id).padStart(4, "0")}A`,
        });
        setError("Khong the tai du lieu API, dang hien thi du lieu mau.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTxn();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const source = useMemo(() => (txn ? getSourceLink(txn) : null), [txn]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-60 rounded bg-slate-800 animate-pulse" />
        <div className="h-40 rounded-2xl bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="space-y-4">
        <Link href="/accountant/ledger" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lai So cai
        </Link>
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
          Khong tim thay giao dich.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/accountant/ledger" className="hover:text-slate-200 transition-colors">
          So cai
        </Link>
        <span>/</span>
        <span className="text-slate-300 font-mono">{txn.transactionCode}</span>
      </div>

      {/* Immutable notice */}
      <div className="rounded-2xl border border-slate-500/30 bg-slate-500/10 px-4 py-3 text-slate-200 text-sm">
        Giao dich nay duoc ghi nhan boi he thong va KHONG THE SUA DOI.
      </div>

      {/* Header card */}
      <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Ma giao dich</p>
            <p className="text-2xl font-bold text-white font-mono mt-1">{txn.transactionCode}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs ${getTypeClass(txn.type)}`}>
              {txn.type}
            </span>
            <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs ${getStatusClass(txn.status)}`}>
              {txn.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InfoCard
            label="So tien"
            value={formatCurrency(txn.amount)}
            tone={txn.amount >= 0 ? "text-emerald-300" : "text-rose-300"}
          />
          <InfoCard label="Mo ta" value={txn.description ?? "-"} />
          <InfoCard label="Thoi gian" value={formatDateTime(txn.createdAt)} />
        </div>
      </div>

      {/* Reference / source */}
      <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-white">Nguon goc giao dich</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard label="Loai tham chieu" value={txn.referenceType ?? "Khong co"} />
          <InfoCard
            label="Ma tham chieu"
            value={txn.referenceCode ?? (txn.referenceId ? `#${txn.referenceId}` : "Khong co")}
            mono
          />
        </div>

        {source?.href ? (
          <Link
            href={source.href}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-blue-300 hover:text-blue-200"
          >
            {source.label}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3h7m0 0v7m0-7L10 14" />
            </svg>
          </Link>
        ) : (
          <p className="text-sm text-slate-300">{source?.label}</p>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
          {error}
        </div>
      )}

      <Link
        href="/accountant/ledger"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-slate-200 hover:bg-slate-700/40"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lai So cai
      </Link>
    </div>
  );
}

function InfoCard({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string;
  tone?: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm mt-1 ${tone ?? "text-slate-200"} ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
