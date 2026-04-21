"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ApiError, api } from "@/lib/api-client";
import { formatCurrency, formatInputAmount } from "@/lib/format";
import { DepositQRRequest, DepositQRResponse, PaymentStatusResponse } from "@/types";

const MIN_AMOUNT = 10_000;

function formatSecondsToClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function DepositPage() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [paymentData, setPaymentData] = useState<DepositQRResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);

  const amountNumber = useMemo(() => Number(amount || 0), [amount]);
  const amountDisplay = useMemo(() => formatInputAmount(amount), [amount]);

  useEffect(() => {
    if (!paymentData) {
      setSecondsLeft(0);
      return;
    }

    const updateRemaining = () => {
      const expireMs = new Date(paymentData.expiredAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expireMs - now) / 1000));
      setSecondsLeft(remaining);
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);

    return () => window.clearInterval(intervalId);
  }, [paymentData]);

  const handleAmountChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setAmount(digitsOnly);
  };

  const handleGeneratePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setCopied(false);
    setPaymentStatusMessage(null);

    if (amountNumber < MIN_AMOUNT) {
      setError("Số tiền nạp tối thiểu là 10.000 ₫.");
      return;
    }

    setLoading(true);

    try {
      const payload: DepositQRRequest = { amount: amountNumber };
      const res = await api.post<DepositQRResponse>("/api/v1/wallet/deposit", payload);
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

  const handleCopyReference = async () => {
    if (!paymentData) return;

    try {
      await navigator.clipboard.writeText(paymentData.transactionRef);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Không thể sao chép mã tham chiếu giao dịch.");
    }
  };

  const handleOpenVnpay = () => {
    if (!paymentData?.paymentUrl) return;
    window.open(paymentData.paymentUrl, "_blank", "noopener,noreferrer");
  };

  const handleCheckStatus = async () => {
    if (!paymentData?.transactionRef) return;

    setCheckingStatus(true);
    setPaymentStatusMessage(null);

    try {
      const res = await api.get<PaymentStatusResponse>(
        `/api/v1/payments/status?transactionRef=${encodeURIComponent(paymentData.transactionRef)}`
      );
      setPaymentStatusMessage(
        res.data.message
          ? `${res.data.status}: ${res.data.message}`
          : `Trạng thái hiện tại: ${res.data.status}`
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setPaymentStatusMessage(`Không thể kiểm tra trạng thái: ${err.apiMessage}`);
      } else {
        setPaymentStatusMessage("Không thể kiểm tra trạng thái thanh toán.");
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const isExpired = paymentData !== null && secondsLeft <= 0;

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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Thông tin thanh toán</h2>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full border ${
                isExpired
                  ? "text-rose-700 bg-rose-50 border-rose-200"
                  : "text-amber-700 bg-amber-50 border-amber-200"
              }`}
            >
              {isExpired ? "Liên kết đã hết hạn" : `Hết hạn sau ${formatSecondsToClock(secondsLeft)}`}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InfoRow label="Mã tham chiếu" value={paymentData.transactionRef} mono />
            <InfoRow label="Số tiền" value={formatCurrency(paymentData.amount)} />
            <InfoRow label="Trạng thái" value={paymentData.status ?? "PENDING"} />
            <InfoRow label="Thông báo" value={paymentData.message ?? "Đã tạo liên kết thanh toán"} />
          </div>

          {paymentData.qrDataUrl && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-center">
              <Image
                src={paymentData.qrDataUrl}
                alt="Mã QR thanh toán"
                width={256}
                height={256}
                unoptimized
                className="w-64 h-64 object-contain rounded-lg bg-white p-2"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleOpenVnpay}
              disabled={isExpired}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              Thanh toán qua VNPay
            </button>

            <button
              type="button"
              onClick={handleCopyReference}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
            >
              {copied ? "Đã sao chép mã" : "Sao chép mã tham chiếu"}
            </button>

            <button
              type="button"
              onClick={() => void handleCheckStatus()}
              disabled={checkingStatus}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {checkingStatus ? "Đang kiểm tra..." : "Kiểm tra trạng thái"}
            </button>
          </div>

          {paymentStatusMessage && (
            <div className="px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm">
              {paymentStatusMessage}
            </div>
          )}
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
