// =============================================================
// Transaction History Page - Server Component
// =============================================================

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Lịch sử giao dịch</h1>
        <p className="text-gray-400 mt-1">Tất cả giao dịch trong ví của bạn</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option value="">Tất cả loại</option>
          <option value="DEPOSIT">Nạp tiền</option>
          <option value="WITHDRAW">Rút tiền</option>
          <option value="REQUEST_PAYMENT">Thanh toán yêu cầu</option>
          <option value="PAYSLIP_PAYMENT">Nhận lương</option>
          <option value="SYSTEM_ADJUSTMENT">Điều chỉnh hệ thống</option>
        </select>
        <select className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option value="">Tất cả trạng thái</option>
          <option value="SUCCESS">Thành công</option>
          <option value="PENDING">Đang chờ</option>
          <option value="FAILED">Thất bại</option>
        </select>
      </div>

      {/* Transaction Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Mã GD</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Loại</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Số tiền</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Trạng thái</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="text-center text-gray-500 text-sm py-12">
                Kết nối API để hiển thị dữ liệu giao dịch
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
