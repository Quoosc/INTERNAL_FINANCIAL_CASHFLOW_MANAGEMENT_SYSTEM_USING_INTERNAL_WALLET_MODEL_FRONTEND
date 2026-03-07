// =============================================================
// Admin - Department Management Page
// =============================================================

export default function AdminDepartmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý phòng ban</h1>
          <p className="text-gray-400 mt-1">Tạo phòng ban, phân bổ ngân sách</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          + Tạo phòng ban
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Mã PB</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Tên phòng ban</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Trưởng phòng</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Tổng ngân sách</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Còn lại</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} className="text-center text-gray-500 text-sm py-12">Kết nối API để hiển thị danh sách phòng ban</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
