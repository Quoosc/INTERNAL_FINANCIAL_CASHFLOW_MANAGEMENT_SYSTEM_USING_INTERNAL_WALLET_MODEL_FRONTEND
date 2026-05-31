"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import {
  getCompanyFund,
  getReconciliationReport,
  topupCompanyFund,
  updateBankStatement,
} from "@/lib/api";
import { CompanyFundResponse, ReconciliationReportResponse } from "@/types";
import { formatCurrency } from "@/lib/format";
import { CurrencyInput } from "@/components/ui/currency-input";
import { SideDrawer } from "@/components/ui/side-drawer";

export default function CfoSystemFundPage() {
  const toast = useToast();
  const [companyFund, setCompanyFund] = useState<CompanyFundResponse | null>(null);
  const [reconciliation, setReconciliation] = useState<ReconciliationReportResponse | null>(null);

  const [loading, setLoading] = useState(true);

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
        toast.error(err.apiMessage);
      } else {
        toast.error("Không thể tải dữ liệu quỹ hệ thống.");
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Số tiền nạp không hợp lệ.");
      return;
    }

    setTopupSubmitting(true);

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
      toast.success("Đã nạp tiền vào quỹ hệ thống.");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.apiMessage);
      } else {
        toast.error("Không thể nạp tiền vào quỹ hệ thống.");
      }
    } finally {
      setTopupSubmitting(false);
    }
  };

  const handleUpdateStatement = async () => {
    const bankBalance = Number(statementBalance.replace(/\D/g, ""));
    if (!Number.isFinite(bankBalance) || bankBalance < 0) {
      toast.error("Số dư ngân hàng không hợp lệ.");
      return;
    }

    setStatementSubmitting(true);

    try {
      await updateBankStatement({
        externalBankBalance: bankBalance,
        lastStatementDate: new Date().toISOString().slice(0, 10),
      });
      setShowStatementModal(false);
      toast.success("Đã cập nhật số dư ngân hàng.");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.apiMessage);
      } else {
        toast.error("Không thể cập nhật số dư ngân hàng.");
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

  const discrepancy = companyFund?.bankDiscrepancy ?? 0;
  const reconciled = Math.abs(discrepancy) === 0;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
              <span className={`h-1.5 w-1.5 rounded-full ${reconciled ? "bg-emerald-300" : "bg-amber-300"}`} />
              CFO treasury
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Quỹ hệ thống</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Theo dõi số dư nội bộ, số dư ngân hàng và đối soát nguồn quỹ toàn hệ thống trước khi duyệt cấp quỹ.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowTopupModal(true)}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg shadow-blue-950/10 transition hover:bg-blue-50"
            >
              Nạp tiền từ ngân hàng
            </button>
            <button
              type="button"
              onClick={() => setShowStatementModal(true)}
              className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Cập nhật sao kê
            </button>
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Tải lại
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Số dư hệ thống" value={formatCurrency(companyFund?.currentWalletBalance ?? 0)} tone="blue" />
        <StatCard title="Số dư ngân hàng" value={formatCurrency(companyFund?.externalBankBalance ?? 0)} tone="slate" />
        <StatCard
          title="Chênh lệch đối soát"
          value={formatCurrency(discrepancy)}
          tone={reconciled ? "emerald" : "rose"}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-blue-50/50 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Báo cáo đối soát</h2>
          <p className="mt-1 text-sm text-slate-500">So sánh số dư ví hệ thống với số dư ngân hàng được CFO cập nhật.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
          <InfoRow label="Số dư ví hệ thống" value={formatCurrency(reconciliation?.companyFundBalance ?? 0)} />
          <InfoRow label="Số dư ngân hàng" value={formatCurrency(reconciliation?.externalBankBalance ?? 0)} />
          <InfoRow label="Chênh lệch" value={formatCurrency(reconciliation?.bankDiscrepancy ?? 0)} />
          <InfoRow label="Thời điểm đối soát" value={reconciliation?.generatedAt ?? "-"} />
        </div>

        {reconEntries.length > 0 && (
          <div className="border-t border-slate-200 p-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-900">Chi tiết đối soát</p>
              <div className="mt-3 divide-y divide-slate-100">
                {reconEntries.map((entry, index) => (
                  <div key={`${entry.label ?? "entry"}-${index}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="text-slate-600">{entry.label ?? entry.description ?? `Dòng ${index + 1}`}</span>
                    <span className="font-semibold text-slate-900">
                      {typeof entry.amount === "number" ? formatCurrency(entry.amount) : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Truy cập nhanh</h2>
            <p className="mt-1 text-sm text-slate-500">Đi tới các màn hình CFO thường dùng.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cfo/approvals"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Duyệt cấp quỹ
            </Link>
            <Link
              href="/cfo/audit-logs"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Nhật ký hoạt động
            </Link>
          </div>
        </div>
      </section>

      <SideDrawer
        open={showTopupModal}
        title="Nạp tiền từ ngân hàng"
        description="Ghi nhận giao dịch nạp tiền vào quỹ hệ thống từ tài khoản ngân hàng đối ứng."
        onClose={() => setShowTopupModal(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowTopupModal(false)}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleTopup()}
              disabled={topupSubmitting}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {topupSubmitting ? "Đang xử lý..." : "Xác nhận nạp"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Số tiền</label>
            <CurrencyInput
              value={topupAmount ? Number(topupAmount) : null}
              onChange={(value) => setTopupAmount(value ? String(value) : "")}
              placeholder="Nhập số tiền"
            />
          </div>
          <InputField label="Ghi chú" value={topupDescription} onChange={setTopupDescription} placeholder="Mô tả giao dịch" />
          <InputField label="Mã tham chiếu ngân hàng" value={topupReferenceCode} onChange={setTopupReferenceCode} placeholder="VD: VCB-2026-001" />
        </div>
      </SideDrawer>

      <SideDrawer
        open={showStatementModal}
        title="Cập nhật số dư ngân hàng"
        description="Nhập số dư thực tế theo sao kê gần nhất để hệ thống tính chênh lệch đối soát."
        onClose={() => setShowStatementModal(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowStatementModal(false)}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleUpdateStatement()}
              disabled={statementSubmitting}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {statementSubmitting ? "Đang cập nhật..." : "Lưu số dư"}
            </button>
          </div>
        }
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Số dư ngân hàng thực tế</label>
          <CurrencyInput
            value={statementBalance ? Number(statementBalance.replace(/\D/g, "")) : null}
            onChange={(value) => setStatementBalance(value ? String(value) : "")}
            placeholder="Nhập số dư"
          />
        </div>
      </SideDrawer>
    </div>
  );
}

function StatCard({ title, value, tone }: { title: string; value: string; tone: "blue" | "slate" | "emerald" | "rose" }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  }[tone];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 h-2 w-12 rounded-full border ${toneClass}`} />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-slate-900">{value}</p>
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
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}
