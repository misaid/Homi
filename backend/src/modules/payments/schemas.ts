// src/modules/payments/schemas.ts
import { z } from "zod";

export const PaymentStatusSchema = z.enum(["due", "paid"]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentMethodSchema = z.enum(["cash", "transfer", "other"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  due_date: z.string(),
  amount: z.number(),
  status: PaymentStatusSchema,
  paid_at: z.string().nullable().optional(),
  method: PaymentMethodSchema,
  note: z.string().nullable().optional(),
});
export type Payment = z.infer<typeof PaymentSchema>;

export const ListPaymentsQuerySchema = z.object({
  status: PaymentStatusSchema.optional(),
  from: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  to: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
export type ListPaymentsQuery = z.infer<typeof ListPaymentsQuerySchema>;

export const PayParamsSchema = z.object({ id: z.string().uuid() });
export type PayParams = z.infer<typeof PayParamsSchema>;
