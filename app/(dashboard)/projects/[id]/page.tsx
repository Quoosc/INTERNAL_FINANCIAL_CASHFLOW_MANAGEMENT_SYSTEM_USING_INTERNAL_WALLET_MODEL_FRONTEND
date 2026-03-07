// =============================================================
// Project Detail Page - Server Component
// =============================================================

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chi tiết dự án #{id}</h1>
        <p className="text-gray-400 mt-1">Thông tin, ngân sách và phase dự án</p>
      </div>

      {/* Project Info */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Tổng quan dự án</h2>
        <p className="text-gray-500 text-sm text-center py-8">Kết nối API để hiển thị thông tin dự án</p>
      </div>

      {/* Phases */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Danh sách Phase</h2>
        <p className="text-gray-500 text-sm text-center py-8">Kết nối API để hiển thị phases</p>
      </div>

      {/* Members */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Thành viên dự án</h2>
        <p className="text-gray-500 text-sm text-center py-8">Kết nối API để hiển thị thành viên</p>
      </div>
    </div>
  );
}
