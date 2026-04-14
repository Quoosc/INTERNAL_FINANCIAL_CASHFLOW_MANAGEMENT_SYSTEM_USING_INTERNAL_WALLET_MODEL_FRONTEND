# Mock Auth Rollback Guide

> Hướng dẫn khôi phục luồng đăng nhập thật khi backend đã sẵn sàng.
> Chế độ mock hiện tại chỉ phục vụ xem trước UI theo role mà không cần backend.

---

## Bối cảnh

Tạm thời vô hiệu hoá form đăng nhập thật và thay bằng 6 nút quick-login theo role
để duyệt toàn bộ giao diện mà không phụ thuộc backend. Cơ chế:

- `localStorage.mock_auth = "true"` — cờ đánh dấu phiên mock.
- `localStorage.access_token` + `refresh_token` — giả lập token (JWT 3-phần không ký).
- `localStorage.user_info` — `AuthUser` mock cho role được chọn.
- Cookie `access_token` — để middleware (nếu có sau này) cho qua.
- API client: khi thấy `mock_auth=true` và gặp 401, **không** redirect về `/login` (tránh loop do backend offline).
- Logout: khi `mock_auth=true`, **không** gọi `POST /auth/logout` — chỉ clear state local.

---

## Các file đã sửa cho chế độ mock

| File | Thay đổi |
|------|----------|
| [app/(auth)/login/page.tsx](../app/(auth)/login/page.tsx) | **Giữ cả 2 bản**: MOCK đang hoạt động (block `[MOCK:START]...[MOCK:END]`) + ORIGINAL đã comment (block `[ORIGINAL:START]...[ORIGINAL:END]`) |
| [lib/api-client.ts](../lib/api-client.ts) | Thêm nhánh bỏ qua auto-refresh/redirect khi `mock_auth=true` |
| [contexts/auth-context.tsx](../contexts/auth-context.tsx) | `logout()` bỏ qua API backend khi `mock_auth=true` |

---

## Cách rollback (khuyến nghị)

### Bước 1 — Toggle block trong `app/(auth)/login/page.tsx`

File có sẵn 2 block được đánh dấu marker:

```
// ─── [MOCK:START] ──────────────
...code mock...
// ─── [MOCK:END] ────────────────

// ─── [ORIGINAL:START] ──────────
// "use client";
// import React, { useState } from "react";
// ...code gốc đã comment...
// ─── [ORIGINAL:END] ────────────
```

**Cách làm nhanh nhất trong VS Code:**

1. Chọn toàn bộ block `[MOCK:START] ... [MOCK:END]` (gồm cả 2 dòng marker) → `Delete`.
2. Chọn toàn bộ block `[ORIGINAL:START] ... [ORIGINAL:END]` (không chọn 2 dòng marker) →
   `Ctrl+/` (hoặc `Cmd+/` trên Mac) để **bỏ comment** hàng loạt.
3. Xoá luôn 2 dòng marker `[ORIGINAL:START]` / `[ORIGINAL:END]` và banner header `╔═...═╗` ở đầu file.
4. Đảm bảo dòng đầu file là `"use client";` (yêu cầu của Next.js App Router).

### Bước 2 — Revert 2 file còn lại

Hai file này chỉ thêm nhánh điều kiện cho `mock_auth` — **có thể để nguyên nếu muốn**
vì nhánh chỉ chạy khi flag tồn tại. Nếu muốn dọn sạch:

- [lib/api-client.ts](../lib/api-client.ts) — xoá block `if (mockAuth) { throw new ApiError(...); }`
  trong hàm `apiClient`.
- [contexts/auth-context.tsx](../contexts/auth-context.tsx) — xoá nhánh `if (!isMock) ... else ...`
  trong hàm `logout`, giữ lại `await authLogout()` như bản gốc.

### Bước 3 — Xác minh

```bash
npm run lint
npm run build
```

### Bước 4 — Commit

```bash
git add -A
git commit -m "chore(auth): restore real login flow, remove mock UI preview"
```

### Bước 5 — Dọn dẹp (tuỳ chọn)

```bash
rm docs/MOCK_AUTH_ROLLBACK.md
```

---

## Checklist sau khi rollback

- [ ] Xoá key mock trong trình duyệt: DevTools → Application → Local Storage →
      xoá `mock_auth`, `access_token`, `refresh_token`, `user_info`.
- [ ] Xoá cookie `access_token` (Application → Cookies).
- [ ] Refresh trang `/login` — phải thấy form email/password thật.
- [ ] `npm run lint` — không có lỗi.
- [ ] Login thử với tài khoản seed của backend — redirect sang `/dashboard` thành công.
- [ ] Kiểm tra `GET /api/v1/wallet` và các API khác trả 200, không còn thấy
      log "Mock auth: backend unavailable" trong console.
- [ ] Logout — thấy request `POST /api/v1/auth/logout` được gửi tới backend.

---

## Tham chiếu nhanh

- `grep -rn "mock_auth\|MOCK:\|ORIGINAL:" .` — tìm mọi vị trí còn tham chiếu chế độ mock.
- Sau khi rollback hoàn tất, grep trên phải **rỗng** (trừ file `.md` này nếu còn giữ).

---

## Phương án B — Giữ 2 chế độ song song (dành cho dev)

Nếu muốn vẫn dùng được mock trong môi trường dev sau khi backend sẵn sàng:

1. **Giữ nguyên** patch trong `lib/api-client.ts` và `contexts/auth-context.tsx` — chúng
   chỉ kích hoạt khi `localStorage.mock_auth === "true"`, không ảnh hưởng flow thật.
2. Thay vì xoá block `[MOCK]`, extract thành route riêng (ví dụ `/login/mock`) chỉ
   mount khi `process.env.NODE_ENV !== "production"`.
3. Khôi phục `app/(auth)/login/page.tsx` theo các bước ở trên để `/login` trả về form thật.
