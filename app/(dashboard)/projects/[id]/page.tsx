"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api-client";
import {
  PhaseStatus,
  ProjectPhasesResponse,
  ProjectPhaseResponse,
} from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getPhaseStatusClass(status: PhaseStatus): string {
  return status === PhaseStatus.ACTIVE
    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
    : "bg-slate-500/15 border-slate-500/30 text-slate-600";
}

function getPhaseStatusLabel(status: PhaseStatus): string {
  return status === PhaseStatus.ACTIVE ? "Đang hoạt động" : "Đã đóng";
}

export default function ProjectDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [data, setData] = useState<ProjectPhasesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<ProjectPhasesResponse>(
          `/api/v1/projects/${id}/phases`,
        );
        if (cancelled) return;
        setData(res.data);
      } catch (err) {
        if (cancelled) return;

        setData(null);
        if (err instanceof ApiError) {
          setError(err.apiMessage);
        } else {
          setError("Không thể tải chi tiết dự án.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const phases = useMemo<ProjectPhaseResponse[]>(
    () => data?.phases ?? [],
    [data?.phases],
  );

  const budgetStats = useMemo(() => {
    const totalBudget = phases.reduce(
      (sum, phase) => sum + phase.budgetLimit,
      0,
    );
    const spentAmount = phases.reduce(
      (sum, phase) => sum + phase.currentSpent,
      0,
    );
    const remainingBudget = Math.max(0, totalBudget - spentAmount);
    const spentPercent =
      totalBudget > 0
        ? Math.min(100, Math.round((spentAmount / totalBudget) * 100))
        : 0;

    return {
      totalBudget,
      spentAmount,
      remainingBudget,
      spentPercent,
    };
  }, [phases]);

  const projectStatusText = useMemo(() => {
    if (phases.some((phase) => phase.status === PhaseStatus.ACTIVE)) {
      return "Đang triển khai";
    }
    if (phases.length > 0) {
      return "Đã đóng";
    }
    return "Chưa có phase";
  }, [phases]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-40 rounded bg-white animate-pulse" />
        <div className="h-28 rounded-2xl bg-white animate-pulse" />
        <div className="h-64 rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push("/projects")}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Quay lại danh sách dự án
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
          Không tìm thấy dự án hoặc bạn không có quyền truy cập.
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/projects")}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Quay lại
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">Dự án #{data.projectId}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              {data.projectName}
            </h1>
          </div>

          <span className="inline-flex w-fit px-3 py-1.5 rounded-full border text-sm bg-blue-50 border-blue-200 text-blue-700">
            {projectStatusText}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Tổng quan ngân sách
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <BudgetCard
            title="Tổng ngân sách phase"
            value={budgetStats.totalBudget}
            tone="text-slate-900"
          />
          <BudgetCard
            title="Đã chi"
            value={budgetStats.spentAmount}
            tone="text-rose-700"
          />
          <BudgetCard
            title="Còn lại"
            value={budgetStats.remainingBudget}
            tone="text-emerald-700"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tỉ lệ đã chi</span>
            <span>{budgetStats.spentPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
            <div
              className="h-full bg-rose-500"
              style={{ width: `${budgetStats.spentPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Danh sách phase
          </h2>
        </div>

        {phases.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-500">
            Dự án chưa có phase.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-215">
              <thead>
                <tr className="bg-blue-50 border-b border-slate-200">
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Phase
                  </th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Thời gian
                  </th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ngân sách
                  </th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Đã chi
                  </th>
                  <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Còn lại
                  </th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {phases.map((phase) => {
                  const remaining = Math.max(
                    0,
                    phase.budgetLimit - phase.currentSpent,
                  );
                  return (
                    <tr
                      key={phase.id}
                      className="border-b border-slate-200 hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500">
                          {phase.phaseCode}
                        </p>
                        <p className="text-sm text-slate-900 font-medium mt-0.5">
                          {phase.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(phase.startDate)} -{" "}
                        {formatDate(phase.endDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-700">
                        {formatCurrency(phase.budgetLimit)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-rose-700">
                        {formatCurrency(phase.currentSpent)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-700">
                        {formatCurrency(remaining)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full border text-xs ${getPhaseStatusClass(phase.status)}`}
                        >
                          {getPhaseStatusLabel(phase.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function BudgetCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{title}</p>
      <p className={`text-lg font-bold mt-2 ${tone}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
