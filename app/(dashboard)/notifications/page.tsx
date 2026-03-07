// =============================================================
// Notifications Page - Server Component
// =============================================================

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Thông báo</h1>
          <p className="text-gray-400 mt-1">Biến động số dư, trạng thái yêu cầu, lương</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10">
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5">
        {/* Empty state */}
        <div className="text-center text-gray-500 text-sm py-12">
          Kết nối API để hiển thị thông báo
        </div>
      </div>
    </div>
  );
}
