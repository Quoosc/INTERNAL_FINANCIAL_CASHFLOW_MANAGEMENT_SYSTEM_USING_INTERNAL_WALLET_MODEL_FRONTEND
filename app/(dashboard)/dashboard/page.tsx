"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { RoleName } from "@/types";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";
import { TeamLeaderDashboard } from "@/components/dashboard/team-leader-dashboard";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { AccountantDashboard } from "@/components/dashboard/accountant-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default function DashboardPage() {
  const { isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-slate-400 text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (hasRole(RoleName.ADMIN)) return <AdminDashboard />;
  if (hasRole(RoleName.ACCOUNTANT)) return <AccountantDashboard />;
  if (hasRole(RoleName.MANAGER)) return <ManagerDashboard />;
  if (hasRole(RoleName.TEAM_LEADER)) return <TeamLeaderDashboard />;

  return <EmployeeDashboard />;
}
