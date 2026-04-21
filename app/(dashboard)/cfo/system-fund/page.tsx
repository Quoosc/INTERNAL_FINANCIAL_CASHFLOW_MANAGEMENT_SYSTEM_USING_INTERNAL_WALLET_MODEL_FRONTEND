"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api-client";
import {
  getCompanyFund,
  getReconciliationReport,
  topupCompanyFund,
  updateBankStatement,
} from "@/lib/api";
import { CompanyFundResponse, ReconciliationReportResponse } from "@/types";
import { formatCurrency } from "@/lib/format";


export default function CfoSystemFundPage() {
  const [companyFund, setCompanyFund] = useState<CompanyFundResponse | null>(null);
  const [reconciliation, setReconciliation] = useState<ReconciliationReportResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);

  const [topupAmount, setTopupAmount] = useState("");
  const [topupDescription, setTopupDescription] = useState("");
  const [topupReferenceCode, setTopupReferenceCode] = useState("");
  const [statementBalance, setStatementBalance] = useState("");

  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [statementSubmitting, setStatementSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [fundRes, reconRes] = await Promise.all([
        getCompanyFund(),
        getReconciliationReport(),
      ]);

      setCompanyFund(fundRes.data);
      setReconciliation(reconRes.data);
      setStatementBalance(String(fundRes.data.externalBankBalance ?? 0));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Khong the tai du lieu quy he thong.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleTopup = async () => {
    const amount = Number(topupAmount.replace(/\D/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("So tien nap khong hop le.");
      return;
    }

    setTopupSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await topupCompanyFund({
        amount,
        description: topupDescription.trim() || undefined,
        paymentRef: topupReferenceCode.trim() || undefined,
      });
      setShowTopupModal(false);
      setTopupAmount("");
      setTopupDescription("");
      setTopupReferenceCode("");
      setNotice("Da nap tien vao quy he thong.");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Khong the nap tien vao quy he thong.");
      }
    } finally {
      setTopupSubmitting(false);
    }
  };

  const handleUpdateStatement = async () => {
    const bankBalance = Number(statementBalance.replace(/\D/g, ""));
    if (!Number.isFinite(bankBalance) || bankBalance < 0) {
      setError("So du ngan hang khong hop le.");
      return;
    }

    setStatementSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await updateBankStatement({
        externalBankBalance: bankBalance,
        lastStatementDate: new Date().toISOString().slice(0, 10),
      });
      setShowStatementModal(false);
      setNotice("Da cap nhat so du ngan hang.");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Khong the cap nhat so du ngan hang.");
      }
    } finally {
      setStatementSubmitting(false);
    }
  };

  const reconEntries = useMemo(() => {
    if (!reconciliation) return [];

    const raw = reconciliation as ReconciliationReportResponse & {
      entries?: Array<{ label?: string; description?: string; amount?: number }>;
    };

    return raw.entries ?? [];
  }, [reconciliation]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quy he thong</h1>
          <p className="text-slate-500 mt-1">CFO theo doi va dieu phoi nguon quy toan he thong.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowTopupModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
          >
            Nap tien tu ngan hang
          </button>
          <button
            type="button"
            onClick={() => setShowStatementModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
          >
            Cap nhat so du ngan hang
          </button>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-blue-100 hover:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm font-semibold"
          >
            Tai lai
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="So du he thong"
          value={formatCurrency(companyFund?.currentWalletBalance ?? 0)}
          tone="text-slate-900"
        />
        <StatCard
          title="So du ngan hang"
          value={formatCurrency(companyFund?.externalBankBalance ?? 0)}
          tone="text-slate-700"
        />
        <StatCard
          title="Chenh lech doi soat"
          value={formatCurrency(companyFund?.bankDiscrepancy ?? 0)}
          tone={Math.abs(companyFund?.bankDiscrepancy ?? 0) > 0 ? "text-rose-700" : "text-emerald-700"}
        />
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Bao cao doi soat</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow
            label="System balance"
            value={formatCurrency(reconciliation?.companyFundBalance ?? 0)}
          />
          <InfoRow
            label="Bank balance"
            value={formatCurrency(reconciliation?.externalBankBalance ?? 0)}
          />
          <InfoRow
            label="Discrepancy"
            value={formatCurrency(reconciliation?.bankDiscrepancy ?? 0)}
          />
          <InfoRow
            label="Last reconciliation"
            value={reconciliation?.generatedAt ?? "-"}
          />
        </div>

        {reconEntries.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-sm text-slate-900 font-medium">Chi tiet doi soat</p>
            {reconEntries.map((entry, index) => (
              <div key={`${entry.label ?? "entry"}-${index}`} className="text-sm text-slate-600 flex items-center justify-between gap-2">
                <span>{entry.label ?? entry.description ?? `Entry ${index + 1}`}</span>
                <span>{typeof entry.amount === "number" ? formatCurrency(entry.amount) : "-"}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-slate-900">Truy cap nhanh</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/cfo/approvals"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
          >
            Duyet cap quy
          </Link>
          <Link
            href="/cfo/audit-logs"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
          >
            Nhat ky hoat dong
          </Link>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {notice && (
        <div className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
          {notice}
        </div>
      )}

      {showTopupModal && (
        <Modal title="Nap tien tu ngan hang" onClose={() => setShowTopupModal(false)}>
          <div className="space-y-3">
            <InputField
              label="So tien"
              value={topupAmount}
              onChange={setTopupAmount}
              placeholder="Nhap so tien"
            />
            <InputField
              label="Ghi chu"
              value={topupDescription}
              onChange={setTopupDescription}
              placeholder="Mo ta giao dich"
            />
            <InputField
              label="Ma tham chieu ngan hang"
              value={topupReferenceCode}
              onChange={setTopupReferenceCode}
              placeholder="VD: VCB-2026-001"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
              >
                Huy
              </button>
              <button
                type="button"
                onClick={() => void handleTopup()}
                disabled={topupSubmitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm"
              >
                {topupSubmitting ? "Dang xu ly..." : "Xac nhan nap"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showStatementModal && (
        <Modal title="Cap nhat so du ngan hang" onClose={() => setShowStatementModal(false)}>
          <div className="space-y-3">
            <InputField
              label="So du ngan hang thuc te"
              value={statementBalance}
              onChange={setStatementBalance}
              placeholder="Nhap so du"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStatementModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
              >
                Huy
              </button>
              <button
                type="button"
                onClick={() => void handleUpdateStatement()}
                disabled={statementSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm"
              >
                {statementSubmitting ? "Dang cap nhat..." : "Luu so du"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ title, value, tone }: { title: string; value: string; tone: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className={`text-xl font-bold mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-700 mt-1 break-all">{value}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-600 mb-2">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900"
      />
    </label>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}
