// =============================================================
// Request Detail Page - Server Component
// =============================================================

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chi tiết yêu cầu #{id}</h1>
        <p className="text-gray-400 mt-1">Thông tin và lịch sử duyệt yêu cầu</p>
      </div>

      {/* Request Info */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Thông tin yêu cầu</h2>
        <p className="text-gray-500 text-sm text-center py-8">Kết nối API để hiển thị chi tiết yêu cầu #{id}</p>
      </div>

      {/* Approval History */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Lịch sử phê duyệt</h2>
        <p className="text-gray-500 text-sm text-center py-8">Kết nối API để hiển thị timeline phê duyệt</p>
      </div>

      {/* Attachments */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Chứng từ đính kèm</h2>
        <p className="text-gray-500 text-sm text-center py-8">Kết nối API để hiển thị chứng từ</p>
      </div>
    </div>
  );
}
