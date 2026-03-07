import Link from "next/link";

// =============================================================
// Requests List Page - Server Component
// =============================================================

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Danh sách yêu cầu</h1>
          <p className="text-gray-400 mt-1">Quản lý các yêu cầu tạm ứng, thanh toán, hoàn ứng</p>
        </div>
        <Link href="/requests/new" className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          + Tạo yêu cầu mới
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["Tất cả", "Chờ Manager", "Chờ Admin", "Đã duyệt", "Đã chi", "Từ chối", "Đã hủy"].map((tab) => (
          <button key={tab} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-400 hover:text-white transition-all whitespace-nowrap">
            {tab}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Mã yêu cầu</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Loại</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Dự án</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Số tiền</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Trạng thái</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={6} className="text-center text-gray-500 text-sm py-12">Kết nối API để hiển thị dữ liệu</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
