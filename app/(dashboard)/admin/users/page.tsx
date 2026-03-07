// =============================================================
// Admin - User Management Page
// =============================================================

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý nhân sự</h1>
          <p className="text-gray-400 mt-1">Danh sách nhân viên, cấp/khóa tài khoản</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          + Tạo tài khoản
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Mã NV</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Họ tên</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Email</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Vai trò</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Phòng ban</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={6} className="text-center text-gray-500 text-sm py-12">Kết nối API để hiển thị danh sách nhân viên</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
