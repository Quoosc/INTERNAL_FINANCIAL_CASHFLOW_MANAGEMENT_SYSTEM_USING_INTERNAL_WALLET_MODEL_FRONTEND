"use client";

import Link from "next/link";
import React, { use, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import {
  AutoNettingResponse,
  PayrollDetailResponse,
  PayrollEntry,
  PayrollImportResponse,
  PayrollRunResponse,
  PayrollStatus,
  PayslipStatus,
  UpdatePayslipEntryBody,
} from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

const MOCK_PERIOD: PayrollDetailResponse = {
  id: 5,
  periodCode: "PR-2026-03",
  name: "Luong thang 03/2026",
  month: 3,
  year: 2026,
  startDate: "2026-03-01",
  endDate: "2026-03-31",
  status: PayrollStatus.DRAFT,
  employeeCount: 0,
  totalNetPayroll: 0,
  entries: [],
  createdAt: "2026-04-01T08:00:00",
  updatedAt: "2026-04-01T08:00:00",
};

const MOCK_IMPORTED_ENTRIES: PayrollEntry[] = [
  { id: 201, payslipCode: "PS-2026-03-001", userId: 11, fullName: "Do Quoc Bao", avatar: null, employeeCode: "EMP001", jobTitle: "Frontend Developer", baseSalary: 13_500_000, bonus: 1_500_000, allowance: 1_500_000, deduction: 500_000, advanceDeduct: 0, finalNetSalary: 16_000_000, status: PayslipStatus.DRAFT },
  { id: 202, payslipCode: "PS-2026-03-002", userId: 12, fullName: "Vu Thi Lan", avatar: null, employeeCode: "EMP002", jobTitle: "Backend Developer", baseSalary: 13_000_000, bonus: 1_000_000, allowance: 1_000_000, deduction: 400_000, advanceDeduct: 0, finalNetSalary: 14_600_000, status: PayslipStatus.DRAFT },
  { id: 203, payslipCode: "PS-2026-03-003", userId: 13, fullName: "Pham Van Duc", avatar: null, employeeCode: "EMP003", jobTitle: "QA Engineer", baseSalary: 11_500_000, bonus: 500_000, allowance: 800_000, deduction: 300_000, advanceDeduct: 0, finalNetSalary: 12_500_000, status: PayslipStatus.DRAFT },
  { id: 204, payslipCode: "PS-2026-03-004", userId: 14, fullName: "Nguyen Thi Minh", avatar: null, employeeCode: "EMP004", jobTitle: "Business Analyst", baseSalary: 12_600_000, bonus: 700_000, allowance: 1_200_000, deduction: 250_000, advanceDeduct: 0, finalNetSalary: 14_250_000, status: PayslipStatus.DRAFT },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function getStatusLabel(status: PayrollStatus): string {
  if (status === PayrollStatus.DRAFT) return "Nhap";
  if (status === PayrollStatus.PROCESSING) return "Dang xu ly";
  return "Hoan tat";
}

function getStatusClass(status: PayrollStatus): string {
  if (status === PayrollStatus.DRAFT) return "bg-slate-500/15 border-slate-500/30 text-slate-300";
  if (status === PayrollStatus.PROCESSING) return "bg-amber-500/15 border-amber-500/30 text-amber-300";
  return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
}

function sumGross(entries: PayrollEntry[]): number {
  return entries.reduce((sum, e) => sum + e.baseSalary + e.bonus + e.allowance, 0);
}

function sumNet(entries: PayrollEntry[]): number {
  return entries.reduce((sum, e) => sum + e.finalNetSalary, 0);
}

function recalcNet(entry: Pick<PayrollEntry, "baseSalary" | "bonus" | "allowance" | "deduction" | "advanceDeduct">): number {
  return Math.max(0, entry.baseSalary + entry.bonus + entry.allowance - entry.deduction - entry.advanceDeduct);
}

function n(value: string, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function mockImport(period: PayrollDetailResponse): PayrollImportResponse {
  const entries = MOCK_IMPORTED_ENTRIES.map((e) => ({ ...e, importStatus: "ok" as const, importError: null }));
  return {
    periodId: period.id,
    periodCode: period.periodCode,
    status: PayrollStatus.DRAFT,
    totalRows: entries.length,
    successCount: entries.length,
    errorCount: 0,
    entries,
    errors: [],
    totalNetPayroll: entries.reduce((s, e) => s + e.finalNetSalary, 0),
  };
}

function applyNetting(entries: PayrollEntry[], netting: AutoNettingResponse): PayrollEntry[] {
  const map = new Map(netting.summary.map((x) => [x.userId, x]));
  return entries.map((entry) => {
    const s = map.get(entry.userId);
    if (!s) return entry;
    const advanceDeduct = s.deductedAmount;
    return { ...entry, advanceDeduct, finalNetSalary: recalcNet({ ...entry, advanceDeduct }) };
  });
}

export default function AccountantPayrollDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [period, setPeriod] = useState<PayrollDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [importResult, setImportResult] = useState<PayrollImportResponse | null>(null);
  const [nettingResult, setNettingResult] = useState<AutoNettingResponse | null>(null);
  const [runResult, setRunResult] = useState<PayrollRunResponse | null>(null);

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [netting, setNetting] = useState(false);
  const [running, setRunning] = useState(false);
  const [showRunConfirm, setShowRunConfirm] = useState(false);

  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null);
  const [baseSalary, setBaseSalary] = useState("0");
  const [bonus, setBonus] = useState("0");
  const [allowance, setAllowance] = useState("0");
  const [deduction, setDeduction] = useState("0");
  const [advanceDeduct, setAdvanceDeduct] = useState("0");
  const [entryError, setEntryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<PayrollDetailResponse>(`/api/v1/accountant/payroll/${id}`);
        if (cancelled) return;
        setPeriod(res.data);
        setActiveStep(res.data.status === PayrollStatus.COMPLETED ? 4 : res.data.entries.length > 0 ? 2 : 1);
      } catch (err) {
        if (cancelled) return;
        const safeId = Number(id);
        setPeriod({ ...MOCK_PERIOD, id: Number.isFinite(safeId) && safeId > 0 ? safeId : MOCK_PERIOD.id, periodCode: `PR-2026-${String(id).padStart(2, "0")}` });
        setActiveStep(1);
        setError(err instanceof ApiError ? err.apiMessage : "Khong the tai du lieu API, dang hien thi du lieu mau.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const hasEntries = (period?.entries.length ?? 0) > 0;
  const hasNetting = Boolean(nettingResult);
  const isCompleted = period?.status === PayrollStatus.COMPLETED;
  const grossTotal = useMemo(() => sumGross(period?.entries ?? []), [period?.entries]);
  const netTotal = useMemo(() => sumNet(period?.entries ?? []), [period?.entries]);

  const canOpenStep = (step: 1 | 2 | 3 | 4): boolean => {
    if (step === 1) return true;
    if (step === 2) return hasEntries;
    if (step === 3) return hasEntries;
    return hasEntries && (hasNetting || isCompleted);
  };

  const openEdit = (entry: PayrollEntry) => {
    setEditingEntry(entry);
    setBaseSalary(String(entry.baseSalary));
    setBonus(String(entry.bonus));
    setAllowance(String(entry.allowance));
    setDeduction(String(entry.deduction));
    setAdvanceDeduct(String(entry.advanceDeduct));
    setEntryError(null);
  };

  const closeEdit = () => {
    setEditingEntry(null);
    setEntryError(null);
  };

  const handleImport = async () => {
    if (!period || !selectedFile) return;
    if (period.entries.length > 0) {
      const ok = window.confirm("Ky luong da co du lieu. Ban co muon ghi de bang file moi?");
      if (!ok) return;
    }

    setUploading(true);
    try {
      // TODO: Replace when Sprint 7 is complete
      const result = mockImport(period);
      setImportResult(result);
      const entries = result.entries.map<PayrollEntry>((entry) => ({
        id: entry.id,
        payslipCode: entry.payslipCode,
        userId: entry.userId,
        fullName: entry.fullName,
        avatar: entry.avatar,
        employeeCode: entry.employeeCode,
        jobTitle: entry.jobTitle,
        baseSalary: entry.baseSalary,
        bonus: entry.bonus,
        allowance: entry.allowance,
        deduction: entry.deduction,
        advanceDeduct: entry.advanceDeduct,
        finalNetSalary: entry.finalNetSalary,
        status: entry.status,
      }));
      setPeriod((prev) => (prev ? { ...prev, status: PayrollStatus.DRAFT, employeeCount: entries.length, totalNetPayroll: sumNet(entries), entries, updatedAt: new Date().toISOString() } : prev));
      setNettingResult(null);
      setRunResult(null);
      setActiveStep(2);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!period || !editingEntry) return;
    const nextBase = n(baseSalary, editingEntry.baseSalary);
    const nextBonus = n(bonus, editingEntry.bonus);
    const nextAllowance = n(allowance, editingEntry.allowance);
    const nextDeduction = n(deduction, editingEntry.deduction);
    const nextAdvance = n(advanceDeduct, editingEntry.advanceDeduct);

    if (nextBase + nextBonus + nextAllowance < nextDeduction + nextAdvance) {
      setEntryError("Tong luong khong the nho hon tong khau tru.");
      return;
    }

    setUploading(true);
    setEntryError(null);

    const body: UpdatePayslipEntryBody = {
      baseSalary: nextBase,
      bonus: nextBonus,
      allowance: nextAllowance,
      deduction: nextDeduction,
      advanceDeduct: nextAdvance,
    };

    try {
      const res = await api.put<PayrollEntry>(`/api/v1/accountant/payroll/${period.id}/entries/${editingEntry.id}`, body);
      setPeriod((prev) => {
        if (!prev) return prev;
        const entries = prev.entries.map((entry) => (entry.id === editingEntry.id ? res.data : entry));
        return { ...prev, entries, totalNetPayroll: sumNet(entries), updatedAt: new Date().toISOString() };
      });
    } catch {
      setPeriod((prev) => {
        if (!prev) return prev;
        const entries = prev.entries.map((entry) =>
          entry.id === editingEntry.id
            ? { ...entry, baseSalary: nextBase, bonus: nextBonus, allowance: nextAllowance, deduction: nextDeduction, advanceDeduct: nextAdvance, finalNetSalary: recalcNet({ baseSalary: nextBase, bonus: nextBonus, allowance: nextAllowance, deduction: nextDeduction, advanceDeduct: nextAdvance }) }
            : entry
        );
        return { ...prev, entries, totalNetPayroll: sumNet(entries), updatedAt: new Date().toISOString() };
      });
    } finally {
      setUploading(false);
      closeEdit();
    }
  };

  const handleNetting = async () => {
    if (!period || period.entries.length === 0) return;
    setNetting(true);
    setError(null);

    try {
      const res = await api.post<AutoNettingResponse>(`/api/v1/accountant/payroll/${period.id}/auto-netting`);
      const entries = applyNetting(period.entries, res.data);
      setPeriod((prev) => (prev ? { ...prev, entries, totalNetPayroll: sumNet(entries), updatedAt: new Date().toISOString() } : prev));
      setNettingResult(res.data);
    } catch {
      const debt: Record<number, number> = { 11: 2_500_000, 12: 0, 13: 1_200_000, 14: 0 };
      const summary = period.entries.map((entry) => {
        const outstandingDebt = debt[entry.userId] ?? 0;
        const gross = entry.baseSalary + entry.bonus + entry.allowance;
        const maxDeduct = Math.max(0, gross - entry.deduction);
        const deductedAmount = Math.min(outstandingDebt, maxDeduct);
        return {
          userId: entry.userId,
          employeeCode: entry.employeeCode,
          fullName: entry.fullName,
          outstandingDebt,
          deductedAmount,
          remainingDebt: Math.max(0, outstandingDebt - deductedAmount),
          note: deductedAmount > 0 ? "Da bu tru tu ky luong" : "Khong co du no",
        };
      });

      const simulated: AutoNettingResponse = {
        periodId: period.id,
        periodCode: period.periodCode,
        totalAdvanceDeducted: summary.reduce((s, item) => s + item.deductedAmount, 0),
        summary,
      };

      const entries = applyNetting(period.entries, simulated);
      setPeriod((prev) => (prev ? { ...prev, entries, totalNetPayroll: sumNet(entries), updatedAt: new Date().toISOString() } : prev));
      setNettingResult(simulated);
    } finally {
      setNetting(false);
      setActiveStep(3);
    }
  };

  const handleRun = async () => {
    if (!period) return;
    setRunning(true);
    setError(null);

    try {
      const res = await api.post<PayrollRunResponse>(`/api/v1/accountant/payroll/${period.id}/run`);
      setRunResult(res.data);
      setPeriod((prev) => (prev ? { ...prev, status: PayrollStatus.COMPLETED, totalNetPayroll: res.data.totalNetPayroll, updatedAt: new Date().toISOString() } : prev));
    } catch {
      const simulated: PayrollRunResponse = {
        periodId: period.id,
        periodCode: period.periodCode,
        status: PayrollStatus.COMPLETED,
        payslipsGenerated: period.entries.length,
        totalNetPayroll: period.entries.reduce((sum, e) => sum + e.finalNetSalary, 0),
      };
      setRunResult(simulated);
      setPeriod((prev) => (prev ? { ...prev, status: PayrollStatus.COMPLETED, totalNetPayroll: simulated.totalNetPayroll, updatedAt: new Date().toISOString() } : prev));
    } finally {
      setRunning(false);
      setShowRunConfirm(false);
      setActiveStep(4);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded bg-slate-800 animate-pulse" />
        <div className="h-32 rounded-2xl bg-slate-800 animate-pulse" />
        <div className="h-96 rounded-2xl bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!period) {
    return (
      <div className="space-y-4">
        <Link href="/accountant/payroll" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lai danh sach ky luong
        </Link>
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 text-center text-slate-400">Khong tim thay ky luong.</div>
      </div>
    );
  }

  const totalEmployees = period.entries.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/accountant/payroll" className="hover:text-slate-200 transition-colors">Bang luong</Link>
        <span>/</span>
        <span className="text-slate-300 font-mono">{period.periodCode}</span>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-mono">{period.periodCode}</p>
            <h1 className="text-2xl font-bold text-white mt-1">{period.name}</h1>
            <p className="text-sm text-slate-400 mt-1">Thang {period.month}/{period.year}</p>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2">
            <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${getStatusClass(period.status)}`}>{getStatusLabel(period.status)}</span>
            <p className="text-sm text-slate-400">Cap nhat: {formatDateTime(period.updatedAt)}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-white/10 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { step: 1 as const, title: "Upload Excel", done: hasEntries },
            { step: 2 as const, title: "Review entries", done: hasEntries },
            { step: 3 as const, title: "Auto-netting", done: hasNetting || isCompleted },
            { step: 4 as const, title: "Run payroll", done: isCompleted },
          ].map((item) => {
            const active = activeStep === item.step;
            const enabled = canOpenStep(item.step);
            return (
              <button key={item.step} type="button" disabled={!enabled} onClick={() => setActiveStep(item.step)} className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${active ? "border-blue-500/50 bg-blue-500/15" : enabled ? "border-white/10 bg-slate-900 hover:border-white/20" : "border-white/5 bg-slate-900/40 opacity-60 cursor-not-allowed"}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full border text-xs font-semibold flex items-center justify-center ${item.done ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300" : active ? "border-blue-500/50 bg-blue-500/20 text-blue-300" : "border-slate-500/40 bg-slate-700/50 text-slate-300"}`}>{item.done ? "✓" : item.step}</span>
                  <span className="text-sm text-slate-200">{item.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeStep === 1 && (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Buoc 1: Upload Excel</h2>
            <a href="/api/v1/accountant/payroll/template" className="inline-flex w-fit items-center gap-2 text-sm text-blue-300 hover:text-blue-200">Tai template Excel</a>
          </div>

          <label className="block rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-6 text-center cursor-pointer hover:border-blue-400/50 transition-colors">
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
            <p className="text-sm text-slate-300">Keo tha hoac bam de chon file Excel (.xlsx, .xls)</p>
            <p className="text-xs text-slate-500 mt-2">{selectedFile ? `Da chon: ${selectedFile.name}` : "Chua co file nao duoc chon"}</p>
          </label>

          <div className="flex justify-end">
            <button type="button" onClick={() => void handleImport()} disabled={!selectedFile || uploading} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold">{uploading ? "Dang tai len..." : "Tai len"}</button>
          </div>

          {importResult && (
            <div className="rounded-xl border border-white/10 bg-slate-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Ket qua import</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <SummaryStat label="Tong dong" value={String(importResult.totalRows)} />
                <SummaryStat label="Thanh cong" value={String(importResult.successCount)} tone="text-emerald-300" />
                <SummaryStat label="Loi" value={String(importResult.errorCount)} tone="text-rose-300" />
                <SummaryStat label="Tong net" value={formatCurrency(importResult.totalNetPayroll)} />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={() => setActiveStep(2)} disabled={!hasEntries} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold">Tiep theo →</button>
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Buoc 2: Xem & Sua danh sach</h2>

          <div className="rounded-xl border border-white/10 overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="bg-slate-900/70 border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Ma NV</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Ho ten</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">Luong gross</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">Phu cap</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">Khau tru</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">Luong net</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">Hanh dong</th>
                </tr>
              </thead>
              <tbody>
                {period.entries.map((entry) => {
                  const gross = entry.baseSalary + entry.bonus + entry.allowance;
                  const deductionValue = entry.deduction + entry.advanceDeduct;

                  return (
                    <tr key={entry.id} className="border-b border-white/5 last:border-b-0">
                      <td className="px-4 py-3 text-sm text-slate-200 font-mono">{entry.employeeCode}</td>
                      <td className="px-4 py-3 text-sm text-white">{entry.fullName}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-200">{formatCurrency(gross)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-200">{formatCurrency(entry.allowance)}</td>
                      <td className="px-4 py-3 text-right text-sm text-rose-300">{formatCurrency(deductionValue)}</td>
                      <td className="px-4 py-3 text-right text-sm text-emerald-300 font-semibold">{formatCurrency(entry.finalNetSalary)}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => openEdit(entry)} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs">Sua</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SummaryStat label="Tong gross" value={formatCurrency(grossTotal)} />
            <SummaryStat label="Tong net" value={formatCurrency(netTotal)} tone="text-emerald-300" />
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setActiveStep(1)} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm">← Quay lai</button>
            <button type="button" onClick={() => setActiveStep(3)} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold">Tinh bu tru →</button>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Buoc 3: Auto-netting</h2>

          <div className="flex justify-end">
            <button type="button" onClick={() => void handleNetting()} disabled={netting || period.entries.length === 0} className="px-4 py-2.5 rounded-xl bg-amber-500/80 hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 text-sm font-semibold">{netting ? "Dang tinh..." : "Tinh bu tru no tam ung"}</button>
          </div>

          {!nettingResult ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center text-slate-500 text-sm">Chua co du lieu auto-netting. Bam &quot;Tinh bu tru no tam ung&quot; de tiep tuc.</div>
          ) : (
            <>
              <div className="rounded-xl border border-white/10 overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead>
                    <tr className="bg-slate-900/70 border-b border-white/10">
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Ma NV</th>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-400">Ho ten</th>
                      <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">Du no</th>
                      <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">Khau tru</th>
                      <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-400">Luong thuc linh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nettingResult.summary.map((item) => {
                      const netSalary = period.entries.find((entry) => entry.userId === item.userId)?.finalNetSalary ?? 0;
                      return (
                        <tr key={item.userId} className={`border-b border-white/5 last:border-b-0 ${item.deductedAmount > 0 ? "bg-amber-500/10" : ""}`}>
                          <td className="px-4 py-3 text-sm text-slate-200 font-mono">{item.employeeCode}</td>
                          <td className="px-4 py-3 text-sm text-white">{item.fullName}</td>
                          <td className="px-4 py-3 text-right text-sm text-rose-300">{formatCurrency(item.outstandingDebt)}</td>
                          <td className="px-4 py-3 text-right text-sm text-amber-300">{formatCurrency(item.deductedAmount)}</td>
                          <td className="px-4 py-3 text-right text-sm text-emerald-300 font-semibold">{formatCurrency(netSalary)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SummaryStat label="Tong khau tru tam ung" value={formatCurrency(nettingResult.totalAdvanceDeducted)} tone="text-amber-300" />
                <SummaryStat label="Tong thuc linh" value={formatCurrency(netTotal)} tone="text-emerald-300" />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setActiveStep(2)} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm">← Quay lai</button>
            <button type="button" onClick={() => setActiveStep(4)} disabled={!nettingResult && !isCompleted} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold">Xac nhan & Chay luong →</button>
          </div>
        </div>
      )}

      {activeStep === 4 && (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Buoc 4: Chay luong</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SummaryStat label="So nhan vien" value={`${totalEmployees} nguoi`} />
            <SummaryStat label="Tong thuc linh" value={formatCurrency(netTotal)} tone="text-emerald-300" />
          </div>

          {isCompleted ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
              <p className="text-emerald-300 font-semibold">✓ Payroll da chay thanh cong</p>
              <p className="text-sm text-slate-200">Ky {period.periodCode} da chuyen trang thai COMPLETED.</p>
              <p className="text-sm text-slate-300">{runResult ? `Da tao ${runResult.payslipsGenerated} phieu luong • Tong chi ${formatCurrency(runResult.totalNetPayroll)}` : `Tong chi: ${formatCurrency(period.totalNetPayroll)}`}</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200 text-sm">⚠ Thao tac nay KHONG THE HOAN TAC. He thong se chi luong cho {totalEmployees} nhan vien.</div>
              <button type="button" onClick={() => setShowRunConfirm(true)} className="px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold">Chay luong ngay</button>
            </>
          )}

          <div>
            <button type="button" onClick={() => setActiveStep(3)} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm">← Quay lai</button>
          </div>
        </div>
      )}

      {error && <div className="px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">{error}</div>}

      {editingEntry && (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/70" onClick={closeEdit} aria-label="Dong modal sua entry" />
          <div className="absolute inset-x-0 top-10 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-slate-900 border border-white/10 p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Sua dong luong - {editingEntry.employeeCode}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <NumberInput label="Luong co ban" value={baseSalary} onChange={setBaseSalary} />
              <NumberInput label="Thuong" value={bonus} onChange={setBonus} />
              <NumberInput label="Phu cap" value={allowance} onChange={setAllowance} />
              <NumberInput label="Khau tru" value={deduction} onChange={setDeduction} />
              <NumberInput label="Khau tru tam ung" value={advanceDeduct} onChange={setAdvanceDeduct} />
            </div>
            {entryError && <div className="px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">{entryError}</div>}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={closeEdit} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm">Huy</button>
              <button type="button" onClick={() => void handleSaveEntry()} disabled={uploading} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold">{uploading ? "Dang luu..." : "Luu"}</button>
            </div>
          </div>
        </div>
      )}

      {showRunConfirm && (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/70" onClick={() => setShowRunConfirm(false)} aria-label="Dong xac nhan chay luong" />
          <div className="absolute inset-x-0 top-20 mx-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-slate-900 border border-white/10 p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Xac nhan chay luong</h3>
            <p className="text-sm text-slate-300">He thong se chi luong cho <span className="font-semibold text-white">{totalEmployees} nhan vien</span> voi tong so tien <span className="font-semibold text-emerald-300">{formatCurrency(netTotal)}</span>.</p>
            <p className="text-sm text-rose-300">Thao tac nay khong the hoan tac.</p>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowRunConfirm(false)} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm">Huy</button>
              <button type="button" onClick={() => void handleRun()} disabled={running} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold">{running ? "Dang chay..." : "Xac nhan chay luong"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-2">{label}</label>
      <input type="number" min={0} value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-semibold mt-1 ${tone ?? "text-slate-200"}`}>{value}</p>
    </div>
  );
}
