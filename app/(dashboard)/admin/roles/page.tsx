"use client";

import React from "react";
import { Permission, RoleName } from "@/types";

const ROLE_ORDER: RoleName[] = [
  RoleName.EMPLOYEE,
  RoleName.TEAM_LEADER,
  RoleName.MANAGER,
  RoleName.ACCOUNTANT,
  RoleName.CFO,
  RoleName.ADMIN,
];

const ROLE_LABEL: Record<RoleName, string> = {
  [RoleName.EMPLOYEE]: "Nhân viên",
  [RoleName.TEAM_LEADER]: "Trưởng nhóm",
  [RoleName.MANAGER]: "Trưởng phòng",
  [RoleName.ACCOUNTANT]: "Kế toán",
  [RoleName.CFO]: "Giám đốc tài chính (CFO)",
  [RoleName.ADMIN]: "Quản trị hệ thống",
};

const ROLE_DESCRIPTION: Record<RoleName, string> = {
  [RoleName.EMPLOYEE]: "Tạo yêu cầu chi tiêu cá nhân, theo dõi ví và phiếu lương.",
  [RoleName.TEAM_LEADER]: "Duyệt Flow 1 và quản lý dự án, nhóm được phân công.",
  [RoleName.MANAGER]: "Duyệt Flow 2, quản lý dự án và quỹ phòng ban.",
  [RoleName.ACCOUNTANT]: "Giải ngân, vận hành bảng lương và theo dõi sổ cái.",
  [RoleName.CFO]: "Duyệt Flow 3 và giám sát ngân sách cấp công ty.",
  [RoleName.ADMIN]: "Quản trị IAM, cấu hình hệ thống và nhật ký kiểm toán.",
};

const PERMISSION_GROUPS: Array<{
  groupName: string;
  permissions: Permission[];
}> = [
  {
    groupName: "IAM & Bảo mật",
    permissions: [
      Permission.USER_PROFILE_VIEW,
      Permission.USER_PROFILE_UPDATE,
      Permission.USER_PIN_UPDATE,
      Permission.USER_VIEW_LIST,
      Permission.USER_CREATE,
      Permission.USER_UPDATE,
      Permission.USER_LOCK,
      Permission.ROLE_MANAGE,
      Permission.NOTIFICATION_VIEW,
    ],
  },
  {
    groupName: "Ví & giao dịch",
    permissions: [
      Permission.WALLET_VIEW_SELF,
      Permission.WALLET_DEPOSIT,
      Permission.WALLET_WITHDRAW,
      Permission.WALLET_TRANSACTION_VIEW,
      Permission.TRANSACTION_APPROVE_WITHDRAW,
    ],
  },
  {
    groupName: "Yêu cầu & phê duyệt",
    permissions: [
      Permission.REQUEST_CREATE,
      Permission.REQUEST_VIEW_SELF,
      Permission.REQUEST_VIEW_DEPT,
      Permission.REQUEST_APPROVE_TEAM_LEADER,
      Permission.REQUEST_APPROVE_PROJECT_TOPUP,
      Permission.REQUEST_APPROVE_DEPT_TOPUP,
      Permission.REQUEST_REJECT,
      Permission.REQUEST_VIEW_ALL,
      Permission.REQUEST_VIEW_APPROVED,
      Permission.REQUEST_PAYOUT,
    ],
  },
  {
    groupName: "Dự án & phòng ban",
    permissions: [
      Permission.PROJECT_VIEW_ACTIVE,
      Permission.PROJECT_CREATE,
      Permission.PROJECT_UPDATE,
      Permission.PROJECT_PHASE_MANAGE,
      Permission.PROJECT_MEMBER_MANAGE,
      Permission.PROJECT_STATUS_MANAGE,
      Permission.PROJECT_VIEW_ALL,
      Permission.PROJECT_CATEGORY_MANAGE,
      Permission.PROJECT_BUDGET_ALLOCATE,
      Permission.PROJECT_ASSIGN_LEADER,
      Permission.DEPT_VIEW_DASHBOARD,
      Permission.DEPT_MANAGE,
      Permission.DEPT_BUDGET_ALLOCATE,
    ],
  },
  {
    groupName: "Kế toán & hệ thống",
    permissions: [
      Permission.PAYROLL_VIEW_SELF,
      Permission.PAYROLL_DOWNLOAD,
      Permission.PAYROLL_MANAGE,
      Permission.PAYROLL_EXECUTE,
      Permission.COMPANY_FUND_VIEW,
      Permission.COMPANY_FUND_TOPUP,
      Permission.SYSTEM_CONFIG_MANAGE,
      Permission.DASHBOARD_VIEW_GLOBAL,
      Permission.AUDIT_LOG_VIEW,
    ],
  },
];

const ROLE_PERMISSION_SET: Record<RoleName, Set<Permission>> = {
  [RoleName.EMPLOYEE]: new Set<Permission>([
    Permission.USER_PROFILE_VIEW,
    Permission.USER_PROFILE_UPDATE,
    Permission.USER_PIN_UPDATE,
    Permission.NOTIFICATION_VIEW,
    Permission.WALLET_VIEW_SELF,
    Permission.WALLET_DEPOSIT,
    Permission.WALLET_WITHDRAW,
    Permission.WALLET_TRANSACTION_VIEW,
    Permission.REQUEST_CREATE,
    Permission.REQUEST_VIEW_SELF,
    Permission.PAYROLL_VIEW_SELF,
    Permission.PAYROLL_DOWNLOAD,
    Permission.PROJECT_VIEW_ACTIVE,
  ]),
  [RoleName.TEAM_LEADER]: new Set<Permission>([
    Permission.USER_PROFILE_VIEW,
    Permission.USER_PROFILE_UPDATE,
    Permission.USER_PIN_UPDATE,
    Permission.NOTIFICATION_VIEW,
    Permission.WALLET_VIEW_SELF,
    Permission.WALLET_DEPOSIT,
    Permission.WALLET_WITHDRAW,
    Permission.WALLET_TRANSACTION_VIEW,
    Permission.REQUEST_VIEW_SELF,
    Permission.REQUEST_VIEW_DEPT,
    Permission.REQUEST_APPROVE_TEAM_LEADER,
    Permission.REQUEST_REJECT,
    Permission.REQUEST_VIEW_APPROVED,
    Permission.PROJECT_VIEW_ACTIVE,
    Permission.PROJECT_PHASE_MANAGE,
    Permission.PROJECT_MEMBER_MANAGE,
    Permission.PROJECT_CATEGORY_MANAGE,
    Permission.PROJECT_BUDGET_ALLOCATE,
    Permission.DEPT_VIEW_DASHBOARD,
    Permission.PAYROLL_VIEW_SELF,
    Permission.COMPANY_FUND_VIEW,
  ]),
  [RoleName.MANAGER]: new Set<Permission>([
    Permission.USER_PROFILE_VIEW,
    Permission.USER_PROFILE_UPDATE,
    Permission.USER_PIN_UPDATE,
    Permission.NOTIFICATION_VIEW,
    Permission.WALLET_VIEW_SELF,
    Permission.WALLET_DEPOSIT,
    Permission.WALLET_WITHDRAW,
    Permission.WALLET_TRANSACTION_VIEW,
    Permission.REQUEST_VIEW_SELF,
    Permission.REQUEST_VIEW_DEPT,
    Permission.REQUEST_APPROVE_PROJECT_TOPUP,
    Permission.REQUEST_REJECT,
    Permission.REQUEST_VIEW_APPROVED,
    Permission.PROJECT_VIEW_ACTIVE,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_VIEW_ALL,
    Permission.PROJECT_ASSIGN_LEADER,
    Permission.DEPT_VIEW_DASHBOARD,
    Permission.DEPT_BUDGET_ALLOCATE,
    Permission.PAYROLL_VIEW_SELF,
    Permission.COMPANY_FUND_VIEW,
  ]),
  [RoleName.ACCOUNTANT]: new Set<Permission>([
    Permission.USER_PROFILE_VIEW,
    Permission.USER_PROFILE_UPDATE,
    Permission.USER_PIN_UPDATE,
    Permission.NOTIFICATION_VIEW,
    Permission.WALLET_VIEW_SELF,
    Permission.WALLET_DEPOSIT,
    Permission.WALLET_WITHDRAW,
    Permission.WALLET_TRANSACTION_VIEW,
    Permission.TRANSACTION_APPROVE_WITHDRAW,
    Permission.REQUEST_VIEW_APPROVED,
    Permission.REQUEST_PAYOUT,
    Permission.PAYROLL_MANAGE,
    Permission.PAYROLL_EXECUTE,
    Permission.COMPANY_FUND_VIEW,
    Permission.COMPANY_FUND_TOPUP,
    Permission.DASHBOARD_VIEW_GLOBAL,
  ]),
  [RoleName.CFO]: new Set<Permission>([
    Permission.USER_PROFILE_VIEW,
    Permission.USER_PROFILE_UPDATE,
    Permission.USER_PIN_UPDATE,
    Permission.NOTIFICATION_VIEW,
    Permission.WALLET_VIEW_SELF,
    Permission.WALLET_TRANSACTION_VIEW,
    Permission.REQUEST_APPROVE_DEPT_TOPUP,
    Permission.REQUEST_REJECT,
    Permission.REQUEST_VIEW_ALL,
    Permission.REQUEST_VIEW_APPROVED,
    Permission.COMPANY_FUND_VIEW,
    Permission.COMPANY_FUND_TOPUP,
    Permission.DASHBOARD_VIEW_GLOBAL,
    Permission.AUDIT_LOG_VIEW,
  ]),
  [RoleName.ADMIN]: new Set<Permission>([
    Permission.USER_PROFILE_VIEW,
    Permission.USER_PROFILE_UPDATE,
    Permission.USER_PIN_UPDATE,
    Permission.NOTIFICATION_VIEW,
    Permission.WALLET_VIEW_SELF,
    Permission.WALLET_DEPOSIT,
    Permission.WALLET_WITHDRAW,
    Permission.WALLET_TRANSACTION_VIEW,
    Permission.USER_VIEW_LIST,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_LOCK,
    Permission.ROLE_MANAGE,
    Permission.PROJECT_VIEW_ACTIVE,
    Permission.DEPT_MANAGE,
    Permission.REQUEST_CREATE,
    Permission.REQUEST_VIEW_SELF,
    Permission.PAYROLL_VIEW_SELF,
    Permission.PAYROLL_DOWNLOAD,
    Permission.SYSTEM_CONFIG_MANAGE,
    Permission.AUDIT_LOG_VIEW,
  ]),
};

function allPermissions(): Permission[] {
  return Array.from(new Set(PERMISSION_GROUPS.flatMap((group) => group.permissions)));
}

function roleTone(role: RoleName): string {
  switch (role) {
    case RoleName.ADMIN:
      return "from-rose-500 to-pink-600";
    case RoleName.CFO:
      return "from-violet-500 to-indigo-600";
    case RoleName.ACCOUNTANT:
      return "from-amber-500 to-orange-600";
    case RoleName.MANAGER:
      return "from-blue-500 to-cyan-600";
    case RoleName.TEAM_LEADER:
      return "from-indigo-500 to-blue-600";
    default:
      return "from-slate-500 to-blue-600";
  }
}

export default function AdminRolesPage() {
  const permissions = allPermissions();
  const adminPermissionCount = ROLE_PERMISSION_SET[RoleName.ADMIN].size;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            RBAC policy
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Vai trò hệ thống</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
            Ma trận quyền được định nghĩa theo nghiệp vụ IFMS. Trang này giúp kiểm tra nhanh phạm vi truy cập của từng role trước khi vận hành.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Role hệ thống" value={String(ROLE_ORDER.length)} />
        <StatCard label="Nhóm quyền" value={String(PERMISSION_GROUPS.length)} />
        <StatCard label="Permission duy nhất" value={String(permissions.length)} />
        <StatCard label="Quyền Admin" value={String(adminPermissionCount)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {ROLE_ORDER.map((role) => {
          const count = ROLE_PERMISSION_SET[role].size;
          const coverage = Math.round((count / permissions.length) * 100);

          return (
            <article key={role} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className={`h-2 bg-linear-to-r ${roleTone(role)}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs font-semibold text-blue-600">{role}</p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">{ROLE_LABEL[role]}</h2>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {count} quyền
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{ROLE_DESCRIPTION[role]}</p>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Độ phủ permission</span>
                    <span>{coverage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full bg-linear-to-r ${roleTone(role)}`} style={{ width: `${coverage}%` }} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-blue-50/60 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Ma trận quyền theo nhóm chức năng</h2>
          <p className="mt-1 text-sm text-slate-500">Dấu tích thể hiện role đang được cấp permission tương ứng.</p>
        </div>

        <div className="space-y-5 p-5">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.groupName} className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-900">{group.groupName}</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  {group.permissions.length} permission
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-slate-200 bg-white">
                      <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Permission
                      </th>
                      {ROLE_ORDER.map((role) => (
                        <th key={role} className="px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {ROLE_LABEL[role]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.permissions.map((permission) => (
                      <tr key={permission} className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50/40">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{permission}</td>
                        {ROLE_ORDER.map((role) => {
                          const allowed = ROLE_PERMISSION_SET[role].has(permission);
                          return (
                            <td key={`${permission}-${role}`} className="px-3 py-3 text-center">
                              <span
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
                                  allowed
                                    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                                    : "border-slate-200 bg-slate-50 text-slate-300"
                                }`}
                              >
                                {allowed ? "✓" : "-"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 h-2 w-12 rounded-full bg-blue-600" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
