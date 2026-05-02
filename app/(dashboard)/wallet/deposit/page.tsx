"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { createDeposit } from "@/lib/api";
import { formatCurrency, formatInputAmount } from "@/lib/format";
import { DepositLogResponse } from "@/types";

const MIN_AMOUNT = 10_000;

export default function DepositPage() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [paymentData, setPaymentData] = useState<DepositLogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const amountNumber = useMemo(() => Number(amount || 0), [amount]);
  const amountDisplay = useMemo(() => formatInputAmount(amount), [amount]);

  const handleAmountChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setAmount(digitsOnly);
  };

  const handleGeneratePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setCopied(false);

    if (amountNumber < MIN_AMOUNT) {
      setError("Số tiền nạp tối thiểu là 10.000 ₫.");
      return;
    }

    setLoading(true);

    try {
      const res = await createDeposit({ amount: amountNumber });
      setPaymentData(res.data);
    } catch (err) {
      setPaymentData(null);
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Không thể tạo liên kết thanh toán VNPay.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!paymentData) return;
    try {
      await navigator.clipboard.writeText(paymentData.depositCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Không thể sao chép mã nạp tiền.");
    }
  };

  const handleOpenVnpay = () => {
    if (!paymentData?.paymentUrl) return;
    window.open(paymentData.paymentUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nạp tiền qua VNPay</h1>
        <p className="text-slate-500 mt-1">
          Nhập số tiền để tạo liên kết thanh toán. Hệ thống sẽ chuyển hướng đến VNPay để hoàn tất giao dịch.
        </p>
      </div>

      <form onSubmit={handleGeneratePayment} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-2">
            Số tiền nạp
          </label>
          <input
            id="amount"
            type="text"
            inputMode="numeric"
            placeholder="Nhập số tiền"
            value={amountDisplay}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <p className="text-xs text-slate-500 mt-2">Tối thiểu: {formatCurrency(MIN_AMOUNT)}</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang tạo liên kết thanh toán...
            </>
          ) : (
            "Tạo thanh toán"
          )}
        </button>
      </form>

      {paymentData && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Thông tin thanh toán</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InfoRow label="Mã nạp tiền" value={paymentData.depositCode} mono />
            <InfoRow label="Số tiền" value={formatCurrency(paymentData.amount)} />
            <InfoRow label="Trạng thái" value={paymentData.status} />
          </div>

          {paymentData.paymentUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
              Nhấn nút bên dưới để thanh toán qua VNPay. Số dư ví sẽ tự động cập nhật sau khi giao dịch thành công.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleOpenVnpay}
              disabled={!paymentData.paymentUrl}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              Thanh toán qua VNPay
            </button>

            <button
              type="button"
              onClick={() => void handleCopyCode()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
            >
              {copied ? "Đã sao chép mã" : "Sao chép mã nạp tiền"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm text-slate-900 mt-1 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
