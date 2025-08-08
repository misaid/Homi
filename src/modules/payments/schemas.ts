// zod schemas for payments module
import { z } from "zod";

export const PaymentStatus = z.enum(["due", "paid"]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const PaymentMethod = z.enum(["cash", "transfer", "other"]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const PaymentRow = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  due_date: z.string(),
  amount: z.number(),
  status: PaymentStatus,
  paid_at: z.string().datetime().nullable().optional(),
  method: PaymentMethod,
  note: z.string().nullable().optional(),
});
export type PaymentRow = z.infer<typeof PaymentRow>;

export const IdParam = z.object({ id: z.string().uuid() });

export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PageQuery = z.infer<typeof PaginationQuery>;

export const PaymentsListQuery = PaginationQuery.extend({
  status: PaymentStatus.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type PaymentsListQuery = z.infer<typeof PaymentsListQuery>;
