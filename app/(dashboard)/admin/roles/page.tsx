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
  [RoleName.EMPLOYEE]:
    "Tạo yêu cầu chi tiêu cá nhân, theo dõi ví và phiếu lương.",
  [RoleName.TEAM_LEADER]: "Duyệt Flow 1 và quản lý dự án/nhóm được phân công.",
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
    Permission.USER_VIEW_LIST,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_LOCK,
    Permission.ROLE_MANAGE,
    Permission.PROJECT_VIEW_ALL,
    Permission.DEPT_MANAGE,
    Permission.SYSTEM_CONFIG_MANAGE,
    Permission.DASHBOARD_VIEW_GLOBAL,
    Permission.AUDIT_LOG_VIEW,
    Permission.COMPANY_FUND_VIEW,
  ]),
};

export default function AdminRolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vai trò hệ thống</h1>
        <p className="text-slate-500 mt-1">
          Vai trò được định nghĩa cố định theo nghiệp vụ hệ thống. Không hỗ trợ
          thêm, sửa hoặc xóa vai trò.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {ROLE_ORDER.map((role) => (
          <div
            key={role}
            className="bg-white border border-slate-200 rounded-2xl p-5"
          >
            <p className="text-xs text-slate-500 font-mono">{role}</p>
            <h2 className="text-lg font-semibold text-slate-900 mt-1">
              {ROLE_LABEL[role]}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              {ROLE_DESCRIPTION[role]}
            </p>
            <p className="text-xs text-slate-500 mt-3">
              Tổng quyền đang gán: {ROLE_PERMISSION_SET[role].size}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Ma trận quyền theo nhóm chức năng
        </h2>

        <div className="space-y-4">
          {PERMISSION_GROUPS.map((group) => (
            <div
              key={group.groupName}
              className="rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-200 bg-white/60">
                <h3 className="text-sm font-semibold text-slate-900">
                  {group.groupName}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-245">
                  <thead>
                    <tr className="border-b border-slate-200 bg-blue-50">
                      <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Permission
                      </th>
                      {ROLE_ORDER.map((role) => (
                        <th
                          key={role}
                          className="px-3 py-3 text-center text-xs uppercase tracking-wider text-slate-500"
                        >
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.permissions.map((permission) => (
                      <tr
                        key={permission}
                        className="border-b border-slate-200 last:border-b-0"
                      >
                        <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                          {permission}
                        </td>
                        {ROLE_ORDER.map((role) => {
                          const allowed =
                            ROLE_PERMISSION_SET[role].has(permission);
                          return (
                            <td
                              key={`${permission}-${role}`}
                              className="px-3 py-3 text-center"
                            >
                              <span
                                className={`inline-flex w-6 h-6 rounded-full items-center justify-center border text-xs ${
                                  allowed
                                    ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                                    : "bg-blue-100/40 border-slate-200 text-slate-500"
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
      </div>
    </div>
  );
}
