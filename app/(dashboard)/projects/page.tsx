// =============================================================
// Projects List Page - Server Component
// =============================================================

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Quản lý dự án</h1>
        <p className="text-gray-400 mt-1">Danh sách dự án và theo dõi ngân sách</p>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2">
        {["Tất cả", "Đang triển khai", "Lên kế hoạch", "Tạm dừng", "Đã đóng"].map((tab) => (
          <button key={tab} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-400 hover:text-white transition-all">
            {tab}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Kết nối API để hiển thị danh sách dự án</p>
      </div>
    </div>
  );
}
