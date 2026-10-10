// =============================================================
// AI receipt scan — khớp với AiReceiptController (/api/v1/ai)
// =============================================================

export interface AiStatusResponse {
  enabled: boolean;
  provider: string | null;
  maxCallsPerDay: number;
  remainingToday: number;
}

/** Hạng mục có sẵn của phase, do AI chọn trong danh sách đóng */
export interface AiCategory {
  id: number;
  name: string;
}

export interface ReceiptLineItem {
  description: string | null;
  quantity: number | null;
  amount: number | null;
}

export interface ReceiptExtractionResponse {
  extractionId: number;
  cached: boolean;
  fileName: string | null;
  fields: {
    totalAmount: number | null;
    invoiceDate: string | null; // yyyy-MM-dd
    vendorName: string | null;
    vendorTaxCode: string | null;
    invoiceNumber: string | null;
    vatAmount: number | null;
    currency: string | null;
    expenseSummary: string | null;
    lineItems: ReceiptLineItem[];
  };
  suggestion: {
    title: string | null;
    descriptionDraft: string | null;
    category: AiCategory | null;
  };
  warnings: string[];
}

export interface CategorySuggestionResponse {
  category: AiCategory | null;
}
