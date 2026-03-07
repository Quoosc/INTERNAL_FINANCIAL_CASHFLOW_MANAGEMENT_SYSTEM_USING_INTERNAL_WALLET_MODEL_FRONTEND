// =============================================================
// Payroll Periods Page - Server Component
// =============================================================

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bảng lương</h1>
        <p className="text-gray-400 mt-1">Danh sách kỳ lương và phiếu lương cá nhân</p>
      </div>

      {/* Payroll Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Mã kỳ lương</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Tên</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Tháng/Năm</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Trạng thái</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Lương Net</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} className="text-center text-gray-500 text-sm py-12">Kết nối API để hiển thị kỳ lương</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
