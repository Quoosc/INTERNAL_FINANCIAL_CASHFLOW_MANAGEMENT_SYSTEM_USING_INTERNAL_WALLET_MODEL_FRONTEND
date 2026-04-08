// =============================================================
// System Config API — khớp với SystemConfigController (/api/v1/system-configs)
// Permission: SYSTEM_CONFIG_MANAGE (Admin only)
// =============================================================

import { api } from "@/lib/api-client";
import type { SystemConfigResponse, SystemConfigRequest } from "@/types";

/** GET /api/v1/system-configs — List tất cả configs */
export async function getAllConfigs() {
  return api.get<SystemConfigResponse[]>("/api/v1/system-configs");
}

/** GET /api/v1/system-configs/{key} — Lấy 1 config */
export async function getConfig(key: string) {
  return api.get<SystemConfigResponse>(`/api/v1/system-configs/${key}`);
}

/** PUT /api/v1/system-configs/{key} — Cập nhật giá trị */
export async function updateConfig(key: string, data: SystemConfigRequest) {
  return api.put<string>(`/api/v1/system-configs/${key}`, data);
}

/** POST /api/v1/system-configs/{key} — Tạo mới / upsert */
export async function setConfig(key: string, data: SystemConfigRequest) {
  return api.post<string>(`/api/v1/system-configs/${key}`, data);
}

/** DELETE /api/v1/system-configs/{key}/cache — Evict cache 1 key */
export async function evictConfigCache(key: string) {
  return api.delete<void>(`/api/v1/system-configs/${key}/cache`);
}

/** DELETE /api/v1/system-configs/cache — Evict toàn bộ cache */
export async function evictAllConfigCache() {
  return api.delete<void>("/api/v1/system-configs/cache");
}
