// =============================================================
// Admin - System Fund (Mock Bank) Page
// =============================================================

export default function SystemFundPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Quỹ hệ thống</h1>
        <p className="text-gray-400 mt-1">Quản lý ngân quỹ tổng (Mock Bank)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/20 rounded-2xl p-6">
          <p className="text-sm text-gray-400 mb-2">Tổng số dư quỹ</p>
          <p className="text-3xl font-bold text-white">---</p>
          <p className="text-xs text-gray-500 mt-2">Cập nhật khi kết nối API</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-sm text-gray-400 mb-2">Tài khoản ngân hàng</p>
          <p className="text-lg font-semibold text-white">---</p>
          <p className="text-xs text-gray-500 mt-2">---</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Lịch sử nạp quỹ</h2>
        <p className="text-gray-500 text-sm text-center py-8">Kết nối API để hiển thị lịch sử</p>
      </div>
    </div>
  );
}
