/**
 * Zod validation schemas — shared across all forms in the app.
 * Import via: import { withdrawSchema, depositSchema, newRequestSchema } from "@/lib/schemas";
 *
 * Usage:
 *   const result = withdrawSchema.safeParse({ amount: amountNumber, note });
 *   if (!result.success) {
 *     const errors = result.error.flatten().fieldErrors;
 *     setErrors({ amount: errors.amount?.[0], note: errors.note?.[0] });
 *   }
 */

import { z } from "zod";
import { RequestType } from "@/types";

// ─── Wallet ───────────────────────────────────────────────────

export const withdrawSchema = z.object({
  amount: z
    .number({ error: "Số tiền phải là số nguyên dương." })
    .int("Số tiền phải là số nguyên.")
    .min(10_000, "Số tiền rút tối thiểu là 10.000 ₫."),
  note: z.string().max(500, "Ghi chú không được vượt quá 500 ký tự.").optional(),
});

export type WithdrawFormData = z.infer<typeof withdrawSchema>;

export const depositSchema = z.object({
  amount: z
    .number({ error: "Số tiền phải là số nguyên dương." })
    .int("Số tiền phải là số nguyên.")
    .min(10_000, "Số tiền nạp tối thiểu là 10.000 ₫."),
});

export type DepositFormData = z.infer<typeof depositSchema>;

// ─── Requests (ADVANCE / EXPENSE / REIMBURSE) ─────────────────

export const newRequestSchema = z.object({
  type: z.enum([RequestType.ADVANCE, RequestType.EXPENSE, RequestType.REIMBURSE] as const, {
    error: "Vui lòng chọn loại yêu cầu.",
  }),
  amount: z
    .number({ error: "Số tiền phải là số nguyên dương." })
    .int("Số tiền phải là số nguyên.")
    .min(1_000, "Số tiền tối thiểu là 1.000 ₫."),
  description: z
    .string()
    .min(10, "Mô tả cần ít nhất 10 ký tự.")
    .max(1000, "Mô tả không được vượt quá 1.000 ký tự."),
  projectId: z.number({ error: "Vui lòng chọn dự án." }).int().positive("Vui lòng chọn dự án."),
  phaseId: z.number({ error: "Vui lòng chọn phase." }).int().positive("Vui lòng chọn phase."),
  categoryId: z.number().int().positive().optional(),
});

export type NewRequestFormData = z.infer<typeof newRequestSchema>;

// ─── Department topup (Manager → Flow 3) ─────────────────────

export const departmentTopupSchema = z.object({
  amount: z
    .number({ error: "Số tiền phải là số nguyên dương." })
    .int("Số tiền phải là số nguyên.")
    .min(1_000_000, "Số tiền xin cấp tối thiểu là 1.000.000 ₫."),
  description: z
    .string()
    .min(10, "Mô tả cần ít nhất 10 ký tự.")
    .max(1000, "Mô tả không được vượt quá 1.000 ký tự."),
});

export type DepartmentTopupFormData = z.infer<typeof departmentTopupSchema>;

// ─── Profile forms ────────────────────────────────────────────

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự.")
      .max(128, "Mật khẩu không được vượt quá 128 ký tự."),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const changePinSchema = z
  .object({
    currentPin: z.string().length(6, "PIN phải đúng 6 chữ số.").regex(/^\d+$/, "PIN chỉ gồm chữ số."),
    newPin: z.string().length(6, "PIN phải đúng 6 chữ số.").regex(/^\d+$/, "PIN chỉ gồm chữ số."),
    confirmPin: z.string().length(6, "PIN phải đúng 6 chữ số."),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "PIN xác nhận không khớp.",
    path: ["confirmPin"],
  });

export type ChangePinFormData = z.infer<typeof changePinSchema>;
