// =============================================================
// [ACCOUNTANT] Ledger — sổ cái double-entry
// API: GET /api/v1/accountant/ledger
//      GET /api/v1/accountant/ledger/summary
// =============================================================

export default function AccountantLedgerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Sổ cái</h1>
        <p className="text-gray-400 mt-1">Toàn bộ giao dịch hệ thống — double-entry immutable</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm py-8">Đang phát triển — Sprint 7</p>
      </div>
    </div>
  );
}
