"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/wallet-context";
import { ApiError } from "@/lib/api-client";
import { createWithdrawRequest } from "@/lib/api";
import { WithdrawRequestResponse } from "@/types";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatInputAmount(raw: string): string {
  if (!raw) return "";
  return `${Number(raw).toLocaleString("vi-VN")} ?`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
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
  const { wallet, isLoading: walletLoading, fetchWallet } = useWallet();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WithdrawRequestResponse | null>(null);

  const amountNumber = useMemo(() => Number(amount || 0), [amount]);
  const amountDisplay = useMemo(() => formatInputAmount(amount), [amount]);
  const currentBalance = wallet?.balance ?? 0;
  const availableBalance = wallet?.availableBalance ?? wallet?.balance ?? 0;

  useEffect(() => {
    void fetchWallet();
  }, [fetchWallet]);

  const validateAmount = (): boolean => {
    if (!wallet) {
      setError("Khong the tai thong tin vi. Vui long thu lai.");
      return false;
    }

    if (amountNumber <= 0) {
      setError("Vui long nhap so tien hop le.");
      return false;
    }

    if (amountNumber < 10_000) {
      setError("So tien rut toi thieu la 10,000 VND.");
      return false;
    }

    if (amountNumber > availableBalance) {
      setError("So tien rut khong duoc vuot qua so du kha dung.");
      return false;
    }

    return true;
  };

  const handleAmountChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setAmount(digitsOnly);
  };

  const handleSubmitWithdraw = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateAmount()) return;

    setLoading(true);

    try {
      const res = await createWithdrawRequest({
        amount: amountNumber,
        userNote: note.trim() || undefined,
      });

      setResult(res.data);
      await fetchWallet();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.apiMessage);
      } else {
        setError("Khong the ket noi API. Vui long thu lai.");
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
        Quay lai
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Rut tien</h1>
        <p className="text-slate-400 mt-1">Tao yeu cau rut tien tu vi noi bo ve tai khoan ngan hang.</p>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-6">
        <p className="text-sm text-slate-400">So du hien tai</p>
        {walletLoading ? (
          <div className="mt-2 h-9 w-48 rounded bg-slate-700 animate-pulse" />
        ) : (
          <>
            <p className="text-3xl font-bold text-white mt-2">{formatVnd(currentBalance)}</p>
            <p className="text-sm text-slate-400 mt-1">Kha dung: {formatVnd(availableBalance)}</p>
          </>
        )}
      </div>

      {!result ? (
        <form onSubmit={handleSubmitWithdraw} className="bg-slate-800 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
              So tien rut
            </label>
            <input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amountDisplay}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Nhap so tien"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-slate-300 mb-2">
              Ghi chu (khong bat buoc)
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Vi du: Rut tien chi tieu ca nhan"
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
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {loading ? "Dang gui yeu cau..." : "Gui yeu cau rut tien"}
          </button>
        </form>
      ) : (
        <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Da tao yeu cau rut tien</h2>
              <p className="text-sm text-slate-400">Yeu cau dang cho xu ly boi ke toan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow label="Ma yeu cau" value={result.withdrawCode} />
            <InfoRow label="Trang thai" value={result.status} />
            <InfoRow label="So tien" value={formatVnd(result.amount)} />
            <InfoRow label="Thoi gian tao" value={formatDateTime(result.createdAt)} />
            <InfoRow label="Ngan hang" value={result.creditBankName} />
            <InfoRow label="Tai khoan" value={`${result.creditAccountName} - ${result.creditAccount}`} />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
            >
              Ve vi
            </Link>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setAmount("");
                setNote("");
                setError(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
            >
              Tao yeu cau moi
            </button>
          </div>
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

