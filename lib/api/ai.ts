// =============================================================
// AI receipt scan API — khớp với AiReceiptController (/api/v1/ai)
// =============================================================

import { api } from "@/lib/api-client";
import type {
  AiStatusResponse,
  CategorySuggestionResponse,
  ReceiptExtractionResponse,
} from "@/types";

/** GET /api/v1/ai/status — tính năng có bật không, còn bao nhiêu lượt hôm nay */
export async function getAiStatus() {
  return api.get<AiStatusResponse>("/api/v1/ai/status");
}

/** POST /api/v1/ai/receipts/extract — đọc 1 file chứng từ; có phaseId thì gợi ý luôn hạng mục */
export async function extractReceipt(file: File, phaseId?: number) {
  const formData = new FormData();
  formData.append("file", file);
  const query = phaseId ? `?phaseId=${phaseId}` : "";
  return api.post<ReceiptExtractionResponse>(`/api/v1/ai/receipts/extract${query}`, formData);
}

/** POST /api/v1/ai/receipts/{id}/category-suggestion — chọn hạng mục khi user chọn phase sau khi upload */
export async function suggestReceiptCategory(extractionId: number, phaseId: number) {
  return api.post<CategorySuggestionResponse>(
    `/api/v1/ai/receipts/${extractionId}/category-suggestion`,
    { phaseId }
  );
}
