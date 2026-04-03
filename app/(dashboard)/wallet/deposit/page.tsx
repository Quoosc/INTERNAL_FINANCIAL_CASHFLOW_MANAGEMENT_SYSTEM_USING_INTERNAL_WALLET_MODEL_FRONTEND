"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ApiError, api } from "@/lib/api-client";
import { DepositQRRequest, DepositQRResponse } from "@/types";

const MIN_AMOUNT = 10_000;
const INITIAL_SECONDS = 300;

// TODO: Replace with real API call when Sprint 3 is complete
const MOCK_QR_RESPONSE: DepositQRResponse = {
  qrCodeUrl: "https://via.placeholder.com/256",
  bankName: "Vietcombank",
  bankAccount: "1234567890",
  accountOwner: "NGUYEN VAN A",
  amount: 500_000,
  description: "NAP-EMP001-1712345678",
  expiresAt: new Date(Date.now() + INITIAL_SECONDS * 1000).toISOString(),
};

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatInputAmount(raw: string): string {
  if (!raw) return "";
  return `${Number(raw).toLocaleString("vi-VN")} ₫`;
}

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
  const [qrData, setQrData] = useState<DepositQRResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);

  const amountNumber = useMemo(() => Number(amount || 0), [amount]);
  const amountDisplay = useMemo(() => formatInputAmount(amount), [amount]);

  useEffect(() => {
    if (!qrData) return;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [qrData]);

  const handleAmountChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setAmount(digitsOnly);
  };

  const handleGenerateQr = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setCopied(false);

    if (amountNumber < MIN_AMOUNT) {
      setError("Số tiền nạp tối thiểu là 10.000 ₫.");
      return;
    }

    setLoading(true);

    try {
      const payload: DepositQRRequest = { amount: amountNumber };

      // const res = await api.post<DepositQRResponse>('/api/v1/wallet/deposit/generate-qr', { amount: Number(amount) })
      const res = await api.post<DepositQRResponse>(
        "/api/v1/wallet/deposit/generate-qr",
        payload
      );

      setQrData(res.data);
      setSecondsLeft(INITIAL_SECONDS);
    } catch (err) {
      setQrData({
        ...MOCK_QR_RESPONSE,
        amount: amountNumber,
        description: `NAP-EMP001-${Date.now()}`,
        expiresAt: new Date(Date.now() + INITIAL_SECONDS * 1000).toISOString(),
      });
      setSecondsLeft(INITIAL_SECONDS);

      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Không thể tạo mã QR, đang hiển thị dữ liệu mẫu.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = async () => {
    if (!qrData) return;

    try {
      await navigator.clipboard.writeText(qrData.description);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Không thể sao chép nội dung chuyển khoản.");
    }
  };

  const isExpired = qrData !== null && secondsLeft <= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Nạp tiền bằng mã QR</h1>
        <p className="text-slate-400 mt-1">
          Nhập số tiền, tạo mã QR và chuyển khoản theo thông tin hiển thị.
        </p>
      </div>

      <form onSubmit={handleGenerateQr} className="bg-slate-800 border border-white/10 rounded-2xl p-6 space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
            Số tiền nạp
          </label>
          <input
            id="amount"
            type="text"
            inputMode="numeric"
            placeholder="Nhập số tiền"
            value={amountDisplay}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <p className="text-xs text-slate-500 mt-2">Tối thiểu: {formatVnd(MIN_AMOUNT)}</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
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
              Đang tạo QR...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
              </svg>
              Tạo mã QR
            </>
          )}
        </button>
      </form>

      {qrData && (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Thông tin chuyển khoản</h2>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full border ${
                isExpired
                  ? "text-rose-300 bg-rose-500/10 border-rose-500/30"
                  : "text-amber-300 bg-amber-500/10 border-amber-500/30"
              }`}
            >
              {isExpired ? "Mã đã hết hạn" : `Hết hạn sau ${formatSecondsToClock(secondsLeft)}`}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-4 flex items-center justify-center">
              <Image
                src={qrData.qrCodeUrl}
                alt="Mã QR nạp tiền"
                width={256}
                height={256}
                className="w-64 h-64 object-contain rounded-lg bg-white p-2"
              />
            </div>

            <div className="space-y-3">
              <InfoRow label="Ngân hàng" value={qrData.bankName} />
              <InfoRow label="Số tài khoản" value={qrData.bankAccount} />
              <InfoRow label="Tên tài khoản" value={qrData.accountOwner} />
              <InfoRow label="Số tiền" value={formatVnd(qrData.amount)} />
              <InfoRow label="Nội dung chuyển khoản" value={qrData.description} mono />

              <button
                type="button"
                onClick={handleCopyContent}
                disabled={isExpired}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {copied ? "Đã sao chép" : "Sao chép nội dung"}
              </button>

              <p className="text-xs text-slate-500">
                Sau khi chuyển khoản thành công, số dư ví sẽ được cập nhật tự động.
              </p>
            </div>
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
    <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm text-white mt-1 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
