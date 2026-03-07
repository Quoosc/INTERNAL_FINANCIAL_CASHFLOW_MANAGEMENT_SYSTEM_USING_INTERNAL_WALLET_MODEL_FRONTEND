// =============================================================
// Generic API Response - khớp với com.mkwang.backend.common.dto.ApiResponse<T>
// =============================================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string; // ISO 8601 LocalDateTime from Java
}

// =============================================================
// Base Entity Fields - khớp với com.mkwang.backend.common.base.BaseEntity
// =============================================================

export interface BaseEntity {
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
}

// =============================================================
// Pagination (chuẩn bị cho Spring Data Page<T>)
// =============================================================

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page (0-indexed)
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string; // e.g. "createdAt,desc"
}
