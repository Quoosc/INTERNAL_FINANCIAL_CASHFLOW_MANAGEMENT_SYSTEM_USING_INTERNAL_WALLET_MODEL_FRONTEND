// =============================================================
// Analytics API — GET /api/v1/dashboard/analytics/*
// =============================================================

import { api } from "@/lib/api-client";
import type { AdminAnalyticsResponse, CashFlowAnalyticsResponse } from "@/types";

export type PeriodKey = "ytd" | "last6m" | `fy${number}`;

/**
 * GET /api/v1/dashboard/analytics/cashflow
 * period: "ytd" | "last6m" | "fy{year}"
 * unit:   "raw" (default, full VND) | "million" (chia 1_000_000)
 */
export async function getCashFlowAnalytics(
  period: PeriodKey,
  unit: "raw" | "million" = "raw",
) {
  return api.get<CashFlowAnalyticsResponse>(
    `/api/v1/dashboard/analytics/cashflow?period=${period}&unit=${unit}`,
  );
}

/**
 * GET /api/v1/dashboard/admin/analytics
 * Admin only — dept spending MTD + top advance debtors system-wide
 */
export async function getAdminAnalytics() {
  return api.get<AdminAnalyticsResponse>("/api/v1/dashboard/admin/analytics");
}
