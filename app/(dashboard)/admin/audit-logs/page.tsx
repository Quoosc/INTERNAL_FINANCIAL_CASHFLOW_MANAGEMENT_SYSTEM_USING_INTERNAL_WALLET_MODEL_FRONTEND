// =============================================================
// Admin - Audit Logs Page - Server Component
// =============================================================

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Nhật ký hệ thống</h1>
        <p className="text-gray-400 mt-1">Audit Trail - Ghi lại tất cả thao tác quan trọng</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option value="">Tất cả hành động</option>
          <option value="USER_CREATED">Tạo user</option>
          <option value="USER_LOCKED">Khóa user</option>
          <option value="ROLE_ASSIGNED">Gán vai trò</option>
          <option value="REQUEST_APPROVED">Duyệt yêu cầu</option>
          <option value="PAYROLL_EXECUTED">Chi lương</option>
          <option value="SYSTEM_CONFIG_CHANGED">Đổi cấu hình</option>
        </select>
        <input type="date" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Thời gian</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Người thực hiện</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Hành động</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Đối tượng</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} className="text-center text-gray-500 text-sm py-12">Kết nối API để hiển thị Audit Logs</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
