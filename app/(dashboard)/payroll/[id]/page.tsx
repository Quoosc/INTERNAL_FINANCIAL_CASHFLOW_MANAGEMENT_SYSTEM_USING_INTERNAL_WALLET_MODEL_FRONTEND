// =============================================================
// Payslip Detail Page - Server Component
// =============================================================

export default async function PayslipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chi tiết phiếu lương #{id}</h1>
        <p className="text-gray-400 mt-1">Bảng lương chi tiết</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Chi tiết lương</h2>
        <div className="space-y-3 text-sm">
          {[
            { label: "Lương cơ bản", field: "baseSalary" },
            { label: "Phụ cấp", field: "allowance" },
            { label: "Thưởng", field: "bonus" },
            { label: "Khấu trừ", field: "deduction" },
            { label: "Trừ tạm ứng (Auto-netting)", field: "advanceDeduct" },
          ].map((row) => (
            <div key={row.field} className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-400">{row.label}</span>
              <span className="text-white font-medium">---</span>
            </div>
          ))}
          <div className="flex justify-between py-3 border-t-2 border-blue-500/30">
            <span className="text-white font-bold">Lương Net thực nhận</span>
            <span className="text-blue-400 font-bold text-lg">---</span>
          </div>
        </div>
        <p className="text-gray-500 text-sm text-center mt-6">Kết nối API để hiển thị chi tiết phiếu lương #{id}</p>
      </div>
    </div>
  );
}
