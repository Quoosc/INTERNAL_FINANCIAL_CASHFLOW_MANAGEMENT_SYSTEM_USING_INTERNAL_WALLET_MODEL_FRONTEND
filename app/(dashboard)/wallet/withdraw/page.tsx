"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/wallet-context";
import { ApiError, api } from "@/lib/api-client";
import { WithdrawRequest, WithdrawResponse } from "@/types";

type WithdrawStep = "form" | "pin" | "success";


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

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function WithdrawPage() {
  const router = useRouter();
  const { wallet, isLoading: walletLoading, fetchWallet, optimisticUpdate } = useWallet();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<WithdrawStep>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<WithdrawResponse | null>(null);

  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);

  const amountNumber = useMemo(() => Number(amount || 0), [amount]);
  const amountDisplay = useMemo(() => formatInputAmount(amount), [amount]);
  const currentBalance = wallet?.balance ?? 0;

  useEffect(() => {
    void fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (step === "pin") {
      pinRefs.current[0]?.focus();
    }
  }, [step]);

  const validateAmount = (): boolean => {
    if (!wallet) {
      setError("Không thể tải thông tin ví. Vui lòng thử lại.");
      return false;
    }

    if (amountNumber <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ.");
      return false;
    }

    if (amountNumber > wallet.balance) {
      setError("Số tiền rút không được vượt quá số dư hiện tại.");
      return false;
    }

    return true;
  };

  const handleAmountChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setAmount(digitsOnly);
  };

  const handleContinueToPin = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateAmount()) return;

    setPin("");
    setStep("pin");
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const next = Array.from({ length: 6 }, (_, i) => pin[i] ?? "");
    next[index] = value;
    const nextPin = next.join("");
    setPin(nextPin);

    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (pin[index]) {
        const next = Array.from({ length: 6 }, (_, i) => pin[i] ?? "");
        next[index] = "";
        setPin(next.join(""));
        return;
      }

      if (index > 0) {
        pinRefs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    e.preventDefault();

    const next = Array.from({ length: 6 }, (_, i) => pasted[i] ?? "");
    const nextPin = next.join("");
    setPin(nextPin);

    const targetIndex = Math.min(pasted.length, 6) - 1;
    if (targetIndex >= 0) {
      pinRefs.current[targetIndex]?.focus();
    }
  };

  const handleSubmitWithdraw = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateAmount()) {
      setStep("form");
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      setError("Vui lòng nhập đầy đủ mã PIN gồm 6 chữ số.");
      return;
    }

    setLoading(true);

    try {
      const payload: WithdrawRequest & { note?: string } = {
        amount: amountNumber,
        pin,
        note: note.trim() || undefined,
      };

      // const res = await api.post<WithdrawResponse>('/api/v1/wallet/withdraw', { amount: Number(amount), pin, note })
      const res = await api.post<WithdrawResponse>("/api/v1/wallet/withdraw", payload);

      optimisticUpdate(-amountNumber);
      setResult(res.data);
      setStep("success");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Không thể kết nối API. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
        <h1 className="text-2xl font-bold text-white">Rút tiền</h1>
        <p className="text-slate-400 mt-1">Rút tiền từ ví nội bộ về tài khoản ngân hàng.</p>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-6">
        <p className="text-sm text-slate-400">Số dư hiện tại</p>
        {walletLoading ? (
          <div className="mt-2 h-9 w-48 rounded bg-slate-700 animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-white mt-2">{formatVnd(currentBalance)}</p>
        )}
      </div>

      {step === "form" && (
        <form onSubmit={handleContinueToPin} className="bg-slate-800 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
              Số tiền rút
            </label>
            <input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amountDisplay}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Nhập số tiền"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-slate-300 mb-2">
              Ghi chú (không bắt buộc)
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Rút tiền chi tiêu cá nhân"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            Tiếp tục
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      )}

      {step === "pin" && (
        <form onSubmit={handleSubmitWithdraw} className="bg-slate-800 border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Xác nhận mã PIN</h2>
            <p className="text-sm text-slate-400 mt-1">Nhập mã PIN 6 chữ số để hoàn tất giao dịch rút tiền.</p>
          </div>

          <div>
            <p className="text-sm text-slate-300 mb-3">Số tiền rút: <span className="font-semibold text-white">{formatVnd(amountNumber)}</span></p>
            <div className="flex gap-2 sm:gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    pinRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={pin[index] ?? ""}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  onPaste={handlePinPaste}
                  className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận rút tiền"
              )}
            </button>
          </div>
        </form>
      )}

      {step === "success" && result && (
        <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Rút tiền thành công</h2>
              <p className="text-sm text-slate-400">Giao dịch đã được ghi nhận.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow label="Mã giao dịch" value={result.transactionCode} />
            <InfoRow label="Thời gian" value={formatDateTime(result.createdAt)} />
            <InfoRow label="Số tiền rút" value={formatVnd(result.amount)} />
            <InfoRow label="Số dư mới" value={formatVnd(result.balanceAfter)} />
          </div>

          {error && (
            <p className="text-xs text-amber-400">{error}</p>
          )}

          <Link
            href="/wallet"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            Về ví
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-white font-medium mt-1">{value}</p>
    </div>
  );
}
