"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import { CompanyFundResponse, LedgerSummaryResponse } from "@/types";

// TODO: Replace when Sprint 6 is complete
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getFundHealth(balance: number): {
  label: "HEALTHY" | "LOW" | "CRITICAL";
  tone: string;
  borderTone: string;
  bgTone: string;
} {
  if (balance >= 500_000_000) {
    return {
      label: "HEALTHY",
      tone: "text-emerald-300",
      borderTone: "border-emerald-500/40",
      bgTone: "bg-emerald-500/10",
    };
  }

  if (balance >= 100_000_000) {
    return {
      label: "LOW",
      tone: "text-amber-300",
      borderTone: "border-amber-500/40",
      bgTone: "bg-amber-500/10",
    };
  }

  return {
    label: "CRITICAL",
    tone: "text-rose-300",
    borderTone: "border-rose-500/40",
    bgTone: "bg-rose-500/10",
  };
}

export default function SystemFundPage() {
  const [companyFund, setCompanyFund] = useState<CompanyFundResponse | null>(null);
  const [summary, setSummary] = useState<LedgerSummaryResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [fundRes, summaryRes] = await Promise.all([
          api.get<CompanyFundResponse>("/api/v1/company-fund"),
          api.get<LedgerSummaryResponse>("/api/v1/accountant/ledger/summary"),
        ]);

        if (cancelled) return;

        setCompanyFund(fundRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        if (cancelled) return;

        setCompanyFund(MOCK_COMPANY_FUND);
        setSummary(MOCK_LEDGER_SUMMARY);

        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Khong the tai du lieu API, dang hien thi du lieu mau.");
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

  const currentBalance = companyFund?.currentWalletBalance ?? 0;
  const externalBalance = companyFund?.externalBankBalance ?? 0;
  const discrepancy = companyFund?.bankDiscrepancy ?? 0;

  const health = useMemo(() => getFundHealth(currentBalance), [currentBalance]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Quy he thong</h1>
          <p className="text-slate-400 mt-1">Tier 1 (COMPANY_FUND) - Admin chi co quyen xem so lieu quy.</p>
        </div>

        <span className="inline-flex w-fit px-3 py-1.5 rounded-full border border-slate-500/40 bg-slate-500/15 text-slate-300 text-sm font-medium">
          Read-only
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">So du vi COMPANY_FUND hien tai</p>
            <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${health.borderTone} ${health.bgTone} ${health.tone}`}>
              {health.label}
            </span>
          </div>

          <p className="text-3xl font-bold text-white">
            {loading ? "Dang tai..." : formatCurrency(currentBalance)}
          </p>

          <div className="rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-slate-300">
            Quy tac suc khoe quy: HEALTHY neu lon hon hoac bang 500 trieu, LOW neu tu 100 den duoi 500 trieu,
            CRITICAL neu duoi 100 trieu.
          </div>
        </div>

        <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-semibold text-white">Thong tin doi soat</h2>
          <InfoRow label="Ngan hang" value={companyFund?.bankName ?? "-"} />
          <InfoRow label="So tai khoan" value={companyFund?.bankAccount ?? "-"} />
          <InfoRow label="Ngay sao ke" value={companyFund?.lastStatementDate ?? "-"} />
          <InfoRow label="Cap nhat boi" value={companyFund?.lastStatementUpdatedBy ?? "-"} />
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-white">Doi soat ngan hang</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard title="So du vi noi bo" value={formatCurrency(currentBalance)} tone="text-white" />
          <StatCard title="So du sao ke ngan hang" value={formatCurrency(externalBalance)} tone="text-slate-200" />
          <StatCard
            title="Chenh lech doi soat"
            value={formatCurrency(discrepancy)}
            tone={Math.abs(discrepancy) === 0 ? "text-emerald-300" : "text-rose-300"}
          />
        </div>

        {Math.abs(discrepancy) !== 0 && (
          <div className="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
            Canh bao: so du vi noi bo va so du sao ke ngan hang dang lech nhau.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Tong nap vao" value={formatCurrency(summary?.totalInflow ?? 0)} tone="text-emerald-300" />
        <StatCard title="Tong chi ra" value={formatCurrency(summary?.totalOutflow ?? 0)} tone="text-rose-300" />
        <StatCard
          title="So luong giao dich"
          value={String(summary?.transactionCount ?? 0)}
          tone="text-blue-300"
        />
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white">Truy cap nhanh</h2>
        <div className="mt-3">
          <Link
            href="/accountant/ledger"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
          >
            Xem so cai
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </Link>
        </div>
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
