"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import { useToast } from "@/contexts/toast-context";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CurrencyInput } from "@/components/ui/currency-input";
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


function getStatusLabel(status: PayrollStatus): string {
  if (status === PayrollStatus.DRAFT) return "Nháp";
  if (status === PayrollStatus.PROCESSING) return "Đang xử lý";
  return "Hoàn tất";
}

function getStatusClass(status: PayrollStatus): string {
  if (status === PayrollStatus.DRAFT) return "bg-slate-100 border-slate-200 text-slate-600";
  if (status === PayrollStatus.PROCESSING) return "bg-amber-100 border-amber-200 text-amber-700";
  return "bg-emerald-100 border-emerald-200 text-emerald-700";
}

function sumNet(entries: PayrollEntry[]): number {
  return entries.reduce((sum, e) => sum + e.finalNetSalary, 0);
}

function recalcNet(entry: Pick<PayrollEntry, "baseSalary" | "bonus" | "allowance" | "deduction" | "advanceDeduct">): number {
  return Math.max(0, entry.baseSalary + entry.bonus + entry.allowance - entry.deduction - entry.advanceDeduct);
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
  const toast = useToast();

  const [period, setPeriod] = useState<PayrollDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [importResult, setImportResult] = useState<PayrollImportResponse | null>(null);
  const [nettingResult, setNettingResult] = useState<AutoNettingResponse | null>(null);
  const [runResult, setRunResult] = useState<PayrollRunResponse | null>(null);

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [netting, setNetting] = useState(false);
  const [running, setRunning] = useState(false);
  const [showRunConfirm, setShowRunConfirm] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: "", onConfirm: () => {} });

  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null);
  const [baseSalary, setBaseSalary] = useState<number | null>(0);
  const [bonus, setBonus] = useState<number | null>(0);
  const [allowance, setAllowance] = useState<number | null>(0);
  const [deduction, setDeduction] = useState<number | null>(0);
  const [advanceDeduct, setAdvanceDeduct] = useState<number | null>(0);
  const [entryError, setEntryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<PayrollDetailResponse>(`/api/v1/accountant/payroll/${id}`);
        if (cancelled) return;
        setPeriod(res.data);
        setActiveStep(res.data.status === PayrollStatus.COMPLETED ? 4 : res.data.entries.length > 0 ? 2 : 1);
      } catch (err) {
        if (cancelled) return;
        setPeriod(null);
        toast.error(err instanceof ApiError ? err.apiMessage : "Không thể tải dữ liệu kỳ lương.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [id, toast]);

  const hasEntries = (period?.entries.length ?? 0) > 0;
  const hasNetting = Boolean(nettingResult);
  const isCompleted = period?.status === PayrollStatus.COMPLETED;
  const netTotal = useMemo(() => sumNet(period?.entries ?? []), [period?.entries]);
  const totalEmployees = period?.entries.length ?? 0;

  const canOpenStep = (step: 1 | 2 | 3 | 4): boolean => {
    if (step === 1) return true;
    if (step === 2) return hasEntries;
    if (step === 3) return hasEntries;
    return hasEntries && (hasNetting || isCompleted);
  };

  const openEdit = (entry: PayrollEntry) => {
    setEditingEntry(entry);
    setBaseSalary(entry.baseSalary);
    setBonus(entry.bonus);
    setAllowance(entry.allowance);
    setDeduction(entry.deduction);
    setAdvanceDeduct(entry.advanceDeduct);
    setEntryError(null);
  };

  const closeEdit = () => {
    setEditingEntry(null);
    setEntryError(null);
  };

  const runImport = async (overwrite = false) => {
    if (!period || !selectedFile) return;
    setUploading(true);
    try {
      if (overwrite) {
        await api.post<string>(`/api/v1/accountant/payroll/${period.id}/confirm-overwrite`);
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await api.post<PayrollImportResponse>(
        `/api/v1/accountant/payroll/${period.id}/import`,
        formData,
        { headers: {} }  // let browser set Content-Type with boundary
      );
      const result = res.data;
      setImportResult(result);

      const entries: PayrollEntry[] = result.entries
        .filter((e) => e.importStatus === "ok" && e.id !== null)
        .map((e) => ({
          id: e.id as number,
          payslipCode: e.payslipCode ?? "",
          userId: e.userId as number,
          fullName: e.fullName,
          avatar: null,
          employeeCode: e.employeeCode,
          jobTitle: null,
          baseSalary: e.baseSalary,
          bonus: e.bonus,
          allowance: e.allowance,
          deduction: e.deduction,
          advanceDeduct: e.advanceDeduct,
          finalNetSalary: e.finalNetSalary,
          status: (e.status as PayslipStatus) ?? PayslipStatus.DRAFT,
        }));

      setPeriod((prev) =>
        prev
          ? { ...prev, status: PayrollStatus.DRAFT, employeeCount: entries.length, totalNetPayroll: sumNet(entries), entries, updatedAt: new Date().toISOString() }
          : prev
      );
      setNettingResult(null);
      setRunResult(null);
      setActiveStep(2);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Period already has entries — ask for overwrite confirmation
        setConfirmState({
          open: true,
          message: "Kỳ lương đã có dữ liệu. Bạn có muốn xóa và import lại từ file mới?",
          onConfirm: () => {
            setConfirmState((prev) => ({ ...prev, open: false }));
            void runImport(true);
          },
        });
      } else {
        toast.error(err instanceof ApiError ? err.apiMessage : "Import thất bại.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleImport = () => {
    if (!period || !selectedFile) return;
    void runImport(false);
  };

  const handleSaveEntry = async () => {
    if (!period || !editingEntry) return;
    const nextBase = baseSalary ?? editingEntry.baseSalary;
    const nextBonus = bonus ?? editingEntry.bonus;
    const nextAllowance = allowance ?? editingEntry.allowance;
    const nextDeduction = deduction ?? editingEntry.deduction;
    const nextAdvance = advanceDeduct ?? editingEntry.advanceDeduct;

    if (nextBase + nextBonus + nextAllowance < nextDeduction + nextAdvance) {
      setEntryError("Tổng lương không thể nhỏ hơn tổng khấu trừ.");
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
      const res = await api.put<PayrollEntry>(
        `/api/v1/accountant/payroll/${period.id}/entries/${editingEntry.id}`,
        body
      );
      setPeriod((prev) => {
        if (!prev) return prev;
        const entries = prev.entries.map((e) => (e.id === editingEntry.id ? res.data : e));
        return { ...prev, entries, totalNetPayroll: sumNet(entries), updatedAt: new Date().toISOString() };
      });
    } catch {
      // Optimistic update on error
      setPeriod((prev) => {
        if (!prev) return prev;
        const entries = prev.entries.map((e) =>
          e.id === editingEntry.id
            ? { ...e, baseSalary: nextBase, bonus: nextBonus, allowance: nextAllowance, deduction: nextDeduction, advanceDeduct: nextAdvance, finalNetSalary: recalcNet({ baseSalary: nextBase, bonus: nextBonus, allowance: nextAllowance, deduction: nextDeduction, advanceDeduct: nextAdvance }) }
            : e
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

    try {
      const res = await api.post<AutoNettingResponse>(`/api/v1/accountant/payroll/${period.id}/auto-netting`);
      const entries = applyNetting(period.entries, res.data);
      setPeriod((prev) => (prev ? { ...prev, entries, totalNetPayroll: sumNet(entries), updatedAt: new Date().toISOString() } : prev));
      setNettingResult(res.data);
      setActiveStep(3);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.apiMessage : "Auto-netting thất bại.");
    } finally {
      setNetting(false);
    }
  };

  const handleRun = async () => {
    if (!period) return;
    setRunning(true);

    try {
      const res = await api.post<PayrollRunResponse>(`/api/v1/accountant/payroll/${period.id}/run`);
      setRunResult(res.data);
      setPeriod((prev) =>
        prev ? { ...prev, status: PayrollStatus.COMPLETED, totalNetPayroll: res.data.totalNetPayroll, updatedAt: new Date().toISOString() } : prev
      );
      setActiveStep(4);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.apiMessage : "Chạy lương thất bại.");
    } finally {
      setRunning(false);
      setShowRunConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded bg-slate-200 animate-pulse" />
        <div className="h-32 rounded-2xl bg-white animate-pulse" />
        <div className="h-96 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (!period) {
    return (
      <div className="space-y-4">
        <Link href="/accountant/payroll" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách kỳ lương
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center text-slate-500">
          Không tìm thấy kỳ lương.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
              <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? "bg-emerald-300" : "bg-amber-300"}`} />
              Payroll runbook
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">{period.periodCode}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{period.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Quản lý import Excel, rà soát từng dòng lương, khấu trừ tạm ứng và xác nhận chạy lương.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Tổng thực lĩnh</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(netTotal)}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryStat label="Nhân viên" value={`${totalEmployees} người`} />
        <SummaryStat label="Trạng thái" value={getStatusLabel(period.status)} tone={isCompleted ? "text-emerald-700" : "text-amber-700"} />
        <SummaryStat label="Cập nhật gần nhất" value={formatDateTime(period.updatedAt)} />
      </section>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/accountant/payroll" className="hover:text-slate-900 transition-colors">Bảng lương</Link>
        <span>/</span>
        <span className="text-slate-600 font-mono">{period.periodCode}</span>
      </div>

      {/* Header */}
      <div className="hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-mono">{period.periodCode}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{period.name}</h1>
            <p className="text-sm text-slate-500 mt-1">Tháng {period.month}/{period.year}</p>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2">
            <span className={`inline-flex px-3 py-1.5 rounded-full border text-sm ${getStatusClass(period.status)}`}>
              {getStatusLabel(period.status)}
            </span>
            <p className="text-sm text-slate-500">Cập nhật: {formatDateTime(period.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Step navigator */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {([
            { step: 1 as const, title: "Upload Excel", done: hasEntries },
            { step: 2 as const, title: "Review entries", done: hasEntries },
            { step: 3 as const, title: "Auto-netting", done: hasNetting || isCompleted },
            { step: 4 as const, title: "Chạy lương", done: isCompleted },
          ] as const).map((item) => {
            const active = activeStep === item.step;
            const enabled = canOpenStep(item.step);
            return (
              <button
                key={item.step}
                type="button"
                disabled={!enabled}
                onClick={() => setActiveStep(item.step)}
                className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                  active
                    ? "border-blue-300 bg-blue-50 shadow-sm shadow-blue-500/10"
                    : enabled
                    ? "border-slate-200 bg-white hover:border-slate-300"
                    : "border-slate-200 bg-slate-50/80 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full border text-xs font-semibold flex items-center justify-center ${item.done ? "border-emerald-300 bg-emerald-50 text-emerald-700" : active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-500/40 bg-slate-100 text-slate-600"}`}>
                    {item.done ? "✓" : item.step}
                  </span>
                  <span className="text-sm text-slate-900">{item.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 1: Upload */}
      {activeStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Bước 1: Upload Excel</h2>
            <a
              href="/api/v1/accountant/payroll/template"
              download="payroll_template.xlsx"
              className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v13m0 0l-4-4m4 4l4-4M4 20h16" />
              </svg>
              Tải template Excel
            </a>
          </div>

          <label className="block rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 p-8 text-center cursor-pointer hover:border-blue-400/70 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-sm text-slate-600">Kéo thả hoặc bấm để chọn file Excel (.xlsx, .xls)</p>
            <p className="text-xs text-slate-500 mt-2">
              {selectedFile ? `Đã chọn: ${selectedFile.name}` : "Chưa có file nào được chọn"}
            </p>
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile || uploading}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
            >
              {uploading ? "Đang tải lên..." : "Tải lên"}
            </button>
          </div>

          {importResult && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Kết quả import</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <SummaryStat label="Tổng dòng" value={String(importResult.totalRows)} />
                <SummaryStat label="Thành công" value={String(importResult.successCount)} tone="text-emerald-700" />
                <SummaryStat label="Lỗi" value={String(importResult.errorCount)} tone={importResult.errorCount > 0 ? "text-rose-700" : undefined} />
                <SummaryStat label="Tổng net" value={formatCurrency(importResult.totalNetPayroll)} />
              </div>
              {importResult.errors.length > 0 && (
                <div className="space-y-1">
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-rose-700">
                      Dòng {err.row} — {err.field}: {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              disabled={!hasEntries}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
            >
              Tiếp theo →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review entries */}
      {activeStep === 2 && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Bước 2: Xem &amp; Sửa danh sách</h2>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="bg-blue-50/80 border-b border-slate-200">
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã NV</th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Họ tên</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Lương cơ bản</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Phụ cấp</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Khấu trừ</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Thực lĩnh</th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {period.entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50/60 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-mono">{entry.employeeCode}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{entry.fullName}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-900">{formatCurrency(entry.baseSalary)}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-900">{formatCurrency(entry.bonus + entry.allowance)}</td>
                    <td className="px-4 py-3 text-right text-sm text-rose-700">{formatCurrency(entry.deduction + entry.advanceDeduct)}</td>
                    <td className="px-4 py-3 text-right text-sm text-emerald-700 font-semibold">{formatCurrency(entry.finalNetSalary)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/accountant/payslips/${entry.id}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs"
                        >
                          Chi tiết
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(entry)}
                          disabled={isCompleted}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs"
                        >
                          Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SummaryStat label="Tổng thực lĩnh" value={formatCurrency(netTotal)} tone="text-emerald-700" />

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setActiveStep(1)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm">
              ← Quay lại
            </button>
            <button type="button" onClick={() => setActiveStep(3)} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold">
              Tính bù trừ →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Auto-netting */}
      {activeStep === 3 && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Bước 3: Auto-netting</h2>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleNetting()}
              disabled={netting || isCompleted || period.entries.length === 0}
              className="px-4 py-2.5 rounded-xl bg-amber-500/80 hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 text-sm font-semibold"
            >
              {netting ? "Đang tính..." : "Tính bù trừ nợ tạm ứng"}
            </button>
          </div>

          {!nettingResult ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center text-slate-500 text-sm">
              Chưa có dữ liệu auto-netting. Bấm &quot;Tính bù trừ nợ tạm ứng&quot; để tiếp tục.
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="bg-blue-50/80 border-b border-slate-200">
                      <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã NV</th>
                      <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Họ tên</th>
                      <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Dư nợ tạm ứng</th>
                      <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Khấu trừ</th>
                      <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Thực lĩnh</th>
                      <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nettingResult.summary.map((item) => {
                      const netSalary = period.entries.find((e) => e.userId === item.userId)?.finalNetSalary ?? 0;
                      return (
                        <tr
                          key={item.userId}
                          className={`border-b border-slate-100 last:border-b-0 hover:bg-blue-50/60 transition-colors ${item.deductedAmount > 0 ? "bg-amber-50" : ""}`}
                        >
                          <td className="px-4 py-3 text-sm text-slate-900 font-mono">{item.employeeCode}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{item.fullName}</td>
                          <td className="px-4 py-3 text-right text-sm text-rose-700">{formatCurrency(item.outstandingDebt)}</td>
                          <td className="px-4 py-3 text-right text-sm text-amber-700">{formatCurrency(item.deductedAmount)}</td>
                          <td className="px-4 py-3 text-right text-sm text-emerald-700 font-semibold">{formatCurrency(netSalary)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SummaryStat label="Tổng khấu trừ tạm ứng" value={formatCurrency(nettingResult.totalAdvanceDeducted)} tone="text-amber-700" />
                <SummaryStat label="Tổng thực lĩnh" value={formatCurrency(netTotal)} tone="text-emerald-700" />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setActiveStep(2)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm">
              ← Quay lại
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(4)}
              disabled={!nettingResult && !isCompleted}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
            >
              Xác nhận &amp; Chạy lương →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Run */}
      {activeStep === 4 && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Bước 4: Chạy lương</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SummaryStat label="Số nhân viên" value={`${totalEmployees} người`} />
            <SummaryStat label="Tổng thực lĩnh" value={formatCurrency(netTotal)} tone="text-emerald-700" />
          </div>

          {isCompleted ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              <p className="text-emerald-700 font-semibold">✓ Payroll đã chạy thành công</p>
              <p className="text-sm text-slate-900">Kỳ {period.periodCode} đã chuyển trạng thái COMPLETED.</p>
              <p className="text-sm text-slate-600">
                {runResult
                  ? `Đã tạo ${runResult.payslipsGenerated} phiếu lương · Tổng chi ${formatCurrency(runResult.totalNetPayroll)}`
                  : `Tổng chi: ${formatCurrency(period.totalNetPayroll)}`}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
                ⚠ Thao tác này KHÔNG THỂ HOÀN TÁC. Hệ thống sẽ chi lương cho {totalEmployees} nhân viên.
              </div>
              <button
                type="button"
                onClick={() => setShowRunConfirm(true)}
                className="px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold"
              >
                Chạy lương ngay
              </button>
            </>
          )}

          <button type="button" onClick={() => setActiveStep(3)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm">
            ← Quay lại
          </button>
        </div>
      )}

      {/* Edit entry modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/70" onClick={closeEdit} aria-label="Đóng" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto bg-white border-l border-slate-200 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Sửa dòng lương — {editingEntry.employeeCode}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-2">Lương cơ bản</label>
                <CurrencyInput value={baseSalary} onChange={setBaseSalary} />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2">Thưởng</label>
                <CurrencyInput value={bonus} onChange={setBonus} />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2">Phụ cấp</label>
                <CurrencyInput value={allowance} onChange={setAllowance} />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2">Khấu trừ</label>
                <CurrencyInput value={deduction} onChange={setDeduction} />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2">Khấu trừ tạm ứng</label>
                <CurrencyInput value={advanceDeduct} onChange={setAdvanceDeduct} />
              </div>
            </div>
            {entryError && (
              <div className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
                {entryError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={closeEdit} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm">
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEntry()}
                disabled={uploading}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {uploading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run confirm modal */}
      {showRunConfirm && (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/70" onClick={() => setShowRunConfirm(false)} aria-label="Đóng" />
          <div className="absolute inset-x-0 top-20 mx-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Xác nhận chạy lương</h3>
            <p className="text-sm text-slate-600">
              Hệ thống sẽ chi lương cho{" "}
              <span className="font-semibold text-slate-900">{totalEmployees} nhân viên</span> với tổng số tiền{" "}
              <span className="font-semibold text-emerald-700">{formatCurrency(netTotal)}</span>.
            </p>
            <p className="text-sm text-rose-700">Thao tác này không thể hoàn tác.</p>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowRunConfirm(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm">
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleRun()}
                disabled={running}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
              >
                {running ? "Đang chạy..." : "Xác nhận chạy lương"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-semibold mt-1 ${tone ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}
